const User = require("../Models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { packageDailyLimits } = require("../Middleware/userRequestQuota");

exports.loginSuperuser = async (req, res) => {
  const { email, password } = req.body;
  const configuredEmail = process.env.SUPERUSER_EMAIL;
  const configuredPassword = process.env.SUPERUSER_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!configuredEmail || !configuredPassword || !jwtSecret) {
    return res.status(500).json({ message: "Superuser login is not configured on the server." });
  }
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res.status(400).json({ message: "Superuser email and password are required." });
  }

  const compareCredentials = (provided, configured) => {
    const providedDigest = crypto.createHmac("sha256", jwtSecret).update(provided).digest();
    const configuredDigest = crypto.createHmac("sha256", jwtSecret).update(configured).digest();
    return crypto.timingSafeEqual(providedDigest, configuredDigest);
  };

  const validEmail = compareCredentials(email.trim().toLowerCase(), configuredEmail.trim().toLowerCase());
  const validPassword = compareCredentials(password, configuredPassword);
  if (!validEmail || !validPassword) {
    return res.status(401).json({ message: "Invalid superuser email or password." });
  }

  const token = jwt.sign(
    { id: "superuser", role: "admin", email: configuredEmail, isSuperuser: true },
    jwtSecret,
    { expiresIn: "1h" },
  );
  return res.status(200).json({ message: "Superuser login successful.", token });
};

//Upgrade User
exports.upgradeUser = async (req, res) => {
  const { id } = req.params;

  if (!id){
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    //Find user and update role to admin
    const updatedUser = await User.findByIdAndUpdate(id, {role: 'admin'}, {new: true, runValidators: true}).select('-password');

    if(!updatedUser){
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: `User ${updatedUser.email} successfully upgraded to admin.` });

  } catch (error) {
    return res.status(500).json({ message: 'Failed to upgrade user' })
  }
}

//Downgrade User
 exports.downgradeUser = async (req, res) => {
    try {
      const {id} = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      //Check if they are already a regular user
      if (user.role === 'user') {
        return res.status(400).json({ message: "User is already downgraded to standard user status." });
      }

      //Update the role to 'user'
      user.role = 'user';
      await user.save();

      return res.status(200).json({
        message: `Successfully downgraded ${user.name} to a regular user.`,
        user: {
          id: user._id,
          name: user.name,
          role: user.role
        }
      });

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email role package isactive createdAt apiRequestCountDate apiRequestCountToday")
      .sort({ createdAt: -1 });
    const today = new Date().toISOString().slice(0, 10);
    const resetsAt = new Date(`${today}T00:00:00.000Z`);
    resetsAt.setUTCDate(resetsAt.getUTCDate() + 1);

    const usersWithQuota = users.map((user) => {
      const packageName = user.package || "free";
      const limit = packageDailyLimits[packageName];
      const used = user.apiRequestCountDate === today ? user.apiRequestCountToday || 0 : 0;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        package: packageName,
        isactive: user.isactive,
        createdAt: user.createdAt,
        requestUsage: {
          limit,
          used,
          remaining: limit === null ? null : Math.max(0, limit - used),
          resetsAt: resetsAt.toISOString(),
        },
      };
    });
    return res.status(200).json({ user: usersWithQuota });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load users.", error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, package: selectedPackage = "free" } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    if (!["free", "pro", "enterprise"].includes(selectedPackage)) {
      return res.status(400).json({ message: "Choose a valid package." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "A user with that email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: "user",
      package: selectedPackage,
      apiKey: crypto.randomBytes(24).toString("hex"),
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        package: user.package,
        isactive: user.isactive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create user.", error: error.message });
  }
};

exports.updateUserPackage = async (req, res) => {
  try {
    const { package: selectedPackage } = req.body;
    if (!["pro", "enterprise"].includes(selectedPackage)) {
      return res.status(400).json({ message: "Package must be Pro or Enterprise." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { package: selectedPackage } },
      { returnDocument: "after", runValidators: true },
    ).select("name email role package isactive");

    if (!user) {
      return res.status(404).json({ message: "User was not found." });
    }
    return res.status(200).json({ message: "User package updated.", user });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update user package.", error: error.message });
  }
};

exports.getAUser = async (req, res) => {
  try {
    // NOTE: this check is never true because the route requires :id
    const { id } = req.params;
    if (!id) {
      // BUG: an invalid ObjectId throws CastError → 500 instead of 400; deactivated users return "not found"
      return res.status(400).json({ message: "Invalid Access" });
    }
    const users = await User.findById(id);
    if (!users) {
      // BUG: not found should return 404, not 401
      return res.status(401).json({ message: "User does not Exist" });
    }
    // BUG: success should return 200, not 201
    return res.status(201).json(users);
  } catch (error) {
    // BUG: res.json(error) serializes an Error to {}, so the client gets no message
    return res.status(500).json(error);
  }
};

// Deactivate a user(Soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ message: "You cannot deactivate your own admin account." });
    }
    const deleteMe = await User.findByIdAndUpdate(
      id,
      { $set: { isactive: false } },
      { returnDocument: "after" },
    );

    if (!deleteMe) {
      return res.status(404).json({ message: "Cannot find the user to deactivate." });
    }
    return res.status(200).json({ message: "User deactivated.", userId: deleteMe._id });
  } catch (error) {
    return res.status(500).json({ message: "Unable to deactivate user.", error: error.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const {id} = req.params;
    if(!id) {
      return res.status(400).json({ message: "You need to enter user id" });
    }

    //find user and update isactive to false
    const deactivatedUser = await User.findByIdAndUpdate(id, {isactive: false}, {new: true, runValidators: true}).select('-password');
    return res.status(200).json({ message: `User ${deactivatedUser.email} successfully deactivated.` });
  } catch (error) {
    return res.status(500).json({ message: "Error deactivating user", error: error.message   });
  }
}

exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Invalid Access" });
    }
    // BUG: updateOne always returns an object, so this is never true; check result.matchedCount === 0 instead
    const result = await User.updateOne(
      { _id: id },
      { $set: { isactive: true } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Cannot activate user" });
    }
    return res.status(200).json({ message: "User activated." });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getUpgradeRequests = async (_req, res) => {
  try {
    const users = await User.find({ "upgradeRequests.status": "pending" }).select(
      "name email package upgradeRequests",
    );
    const requests = users.flatMap((user) =>
      user.upgradeRequests
        .filter((request) => request.status === "pending")
        .map((request) => ({
          userId: user._id,
          name: user.name,
          email: user.email,
          currentPackage: user.package,
          requestId: request._id,
          requestedPackage: request.requestedPackage,
          requestedAt: request.requestedAt,
        })),
    );
    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load upgrade requests.", error: error.message });
  }
};

exports.reviewUpgradeRequest = async (req, res) => {
  try {
    const { decision } = req.body;
    if (!["approved", "declined"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approved or declined." });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User account was not found." });
    }

    const upgradeRequest = user.upgradeRequests.id(req.params.requestId);
    if (!upgradeRequest || upgradeRequest.status !== "pending") {
      return res.status(404).json({ message: "Pending upgrade request was not found." });
    }

    upgradeRequest.status = decision;
    upgradeRequest.reviewedAt = new Date();
    if (decision === "approved") {
      user.package = upgradeRequest.requestedPackage;
    }
    await user.save();

    return res.status(200).json({ message: `Upgrade request ${decision}.` });
  } catch (error) {
    return res.status(500).json({ message: "Unable to review upgrade request.", error: error.message });
  }
};

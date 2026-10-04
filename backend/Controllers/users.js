const User = require("../Models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // TODO: no validation of email format or password length

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const apiKey = crypto.randomBytes(24).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      package: "free",
      apiKey,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        package: user.package,
        apiKey: user.apiKey,
        isactive: user.isactive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // BUG: missing fields should return 400, not 401
    if (!email || !password) {
      return res.status(401).json({ message: "All fields are required" });
    }

    // NOTE: .select("+password") has no effect because password isn't select:false in the schema
    const user = await User.findOne({ email }).select("+password");

    // SECURITY: different messages for "no user" vs "wrong password" reveal which emails are registered
    if (!user) {
      return res.status(401).json({ message: "User doesnt exist" });
    }
    if (!user.isactive) {
      return res.status(403).json({ message: "This account has been deactivated." });
    }
    const isvalidpassword = await bcrypt.compare(password, user.password);
    if (!isvalidpassword) {
      return res.status(401).json({ message: "Password is incorrect " });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    let loginLimit = {
      package: user.package || "free",
      remaining: null,
      limit: null,
      resetsAt: null,
    };

    if (!user.package || user.package === "free") {
      const today = new Date().toISOString().slice(0, 10);
      const loginAllowance = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [
            { loginCountDate: { $ne: today } },
            { loginCountToday: { $lt: 5 } },
          ],
        },
        [
          {
            $set: {
              loginCountToday: {
                $cond: [
                  { $eq: ["$loginCountDate", today] },
                  { $ifNull: ["$loginCountToday", 0] },
                  0,
                ],
              },
              loginCountDate: today,
            },
          },
          {
            $set: {
              loginCountToday: { $add: ["$loginCountToday", 1] },
            },
          },
        ],
        { returnDocument: "after", updatePipeline: true },
      );

      if (!loginAllowance) {
        return res.status(429).json({
          message:
            "Daily login limit reached for your Free package. Try again after midnight UTC.",
        });
      }

      const resetsAt = new Date(`${today}T00:00:00.000Z`);
      resetsAt.setUTCDate(resetsAt.getUTCDate() + 1);
      loginLimit = {
        package: "free",
        remaining: 5 - loginAllowance.loginCountToday,
        limit: 5,
        resetsAt: resetsAt.toISOString(),
      };
    }

    // BUG: successful login should return 200, not 201
    return res.status(201).json({ message: "Login successful", token, loginLimit });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role package phone address upgradeRequests loginCountDate loginCountToday",
    );
    if (!user) {
      return res.status(404).json({ message: "User account was not found." });
    }

    const today = new Date().toISOString().slice(0, 10);
    const isFree = !user.package || user.package === "free";
    const currentLogins = user.loginCountDate === today ? user.loginCountToday : 0;

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        package: user.package || "free",
        phone: user.phone,
        address: user.address,
        loginLimit: isFree
          ? { limit: 5, remaining: Math.max(0, 5 - currentLogins) }
          : null,
        upgradeRequests: user.upgradeRequests,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load profile.", error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = {};
    for (const field of ["name", "email", "phone", "address"]) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = typeof req.body[field] === "string" ? req.body[field].trim() : "";
      }
    }

    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }
    if (updates.email !== undefined) {
      if (!updates.email) {
        return res.status(400).json({ message: "Email cannot be empty." });
      }
      updates.email = updates.email.toLowerCase();
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(409).json({ message: "That email address is already in use." });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, {
      returnDocument: "after",
      runValidators: true,
    }).select("name email role package phone address upgradeRequests");

    if (!user) {
      return res.status(404).json({ message: "User account was not found." });
    }
    return res.status(200).json({ message: "Profile updated.", user });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update profile.", error: error.message });
  }
};

const requestPackageUpgrade = async (req, res) => {
  try {
    const requestedPackage = req.body.package;
    if (!["pro", "enterprise"].includes(requestedPackage)) {
      return res.status(400).json({ message: "Choose a valid package to request." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User account was not found." });
    }

    const packageRank = { free: 0, pro: 1, enterprise: 2 };
    if (packageRank[requestedPackage] <= packageRank[user.package || "free"]) {
      return res.status(400).json({ message: "Choose a package above your current plan." });
    }
    if (user.upgradeRequests.some((request) => request.status === "pending")) {
      return res.status(409).json({ message: "You already have a pending upgrade request." });
    }

    user.upgradeRequests.push({ requestedPackage });
    await user.save();

    return res.status(201).json({
      message: "Upgrade request sent for admin approval.",
      request: user.upgradeRequests[user.upgradeRequests.length - 1],
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to submit upgrade request.", error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  requestPackageUpgrade,
};

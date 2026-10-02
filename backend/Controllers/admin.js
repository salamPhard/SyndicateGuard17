const User = require("../Models/User");

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
    const users = await User.find({});
    // BUG: success should return 200, not 201
    return res.status(201).json({ user: users });
  } catch (error) {
    // BUG: res.json(error) serializes an Error to {}, so the client gets no message
    return res.status(500).json(error);
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
    if (!id) {
      return res.status(400).json({ message: "Invalid Access" });
    }
    const deleteMe = await User.findByIdAndUpdate(id, { isactive: false });

    if (!deleteMe) {
      return res
        .status(404)
        .json({ message: "Cannot find the user to delete" });
    }
    // BUG: 204 never sends a body, so this JSON is dropped; use 200 if you want to return a message
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    // BUG: errors should return 500, not 401
    res.status(401).json(error);
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

    if (!result) {
      return res.status(404).json({ message: "Cannot activate user" });
    }
    // BUG: 204 never sends a body, so this JSON is dropped; use 200 if you want to return a message
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

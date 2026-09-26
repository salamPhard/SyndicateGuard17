const User = require("../Models/User");

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

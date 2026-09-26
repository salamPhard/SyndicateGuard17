const User = require("../Models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // TODO: no validation of email format or password length

    // SECURITY: role comes from the request body, so anyone can register as admin; hard-code 'user' instead
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Name, email,role and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const apiKey = crypto.randomBytes(24).toString("hex");

    // BUG: won't find a deactivated user because of the pre-find hook, so create() fails with duplicate key → 500
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role,
      apiKey,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
    const isvalidpassword = await bcrypt.compare(password, user.password);
    if (!isvalidpassword) {
      return res.status(401).json({ message: "Password is incorrect " });
    }

    //JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    // BUG: successful login should return 200, not 201
    res.status(201).json({ message: "Login successful", token });
  } catch (error) {
    // BUG: server errors should return 500, not 401
    return res.status(401).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
};

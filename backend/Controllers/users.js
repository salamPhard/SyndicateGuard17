const User = require("../Models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const superUser = async () =>{
  try {
    // Check if any super user exist
    const superExist = await User.findOne({ role: 'superuser' })
    
    if(!superExist){
      const hashedPassword = await bcrypt.hash(process.env.SUPERUSER_PASSWORD, 10);
      const apiKey = crypto.randomBytes(24).toString("hex");

      const superuser = new User({
        name: 'Root Admin',
        email: process.env.SUPERUSER_EMAIL,
        password: hashedPassword,
        role: 'superuser',
        apiKey
      })

      await superuser.save();
      console.log('Superuser created')
    }
    else{
     console.log('Superuser already exist')
    }
  } catch (error) {
   console.log(error)
  }
}

const register = async (req, res) => {
  try {
    const { name, email, password} = req.body;
    
    if (!name || !email || !password ) {
      return res
        .status(400)
        .json({ message: "All fields are required" });
    }

    //Validate email format
    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailValidation.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const cleanEmail = email.toLowerCase().trim();

    //Validate password length
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const existingUser = await User.findOne({ email : cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const apiKey = crypto.randomBytes(24).toString("hex");

    
    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: "user", // Default role to 'user' if not provided
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

//Login for user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Checks if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

     const cleanEmail = email.toLowerCase().trim();

    //Checks if user exists
    const user = await User.findOne({ email : cleanEmail, isactive: true }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "User does not exist" });
    }
    //Checks if password is valid
    const isvalidpassword = await bcrypt.compare(password, user.password);
    if (!isvalidpassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    //JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  login,
  superUser,
};

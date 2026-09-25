const User = require('../Models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body; 

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const apiKey = crypto.randomBytes(24).toString('hex');

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            apiKey
        });

        return res.status(201).json({ message: 'User created successfully',    
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            apiKey: user.apiKey,
            isactive: user.isactive
        }

        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    } 

};

module.exports = { 
    register
 };


const User = require('../Models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body; 

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email,role and password are required' });
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
            role: role,
            apiKey
        });

        return res.status(201).json({ message: 'User created successfully',    
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            apiKey: user.apiKey,
            isactive: user.isactive
        }

        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    } 

};

const login = async (req, res) =>{
    try {
         const {email, password} = req.body;
        if(!email || !password){
        return res.status(401).json({ message: 'All fields are required' })
    }

        const user = await User.findOne({ email }).select("+password");
        if(!user){
            return res.status(401).json({ message: 'User doesnt exist' });
        }  
        const isvalidpassword = await bcrypt.compare(password, user.password);
        if(!isvalidpassword){
            return res.status(401).json({ message: 'Password is incorrect ' });
        }

        //JWT
        const token = jwt.sign({ id: user._id, role: user.role ,email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ message: 'Login successful', token })
    } catch (error) {
        return res.status(401).json({error: error.message})
    }
}

module.exports = { 
    register, login
 };


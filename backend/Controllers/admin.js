const User = require('../Models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        return res.status(201).json({ user: users })
    } catch (error) {
        return res.status(500).json(error);
    }
};

exports.getAUser = async (req, res) => {
    try {
        const {id}= req.params;
        if(!id){
        return res.status(400).json({ message: 'Invalid Access' });
    }
        const users = await User.findById(id);
        if(!users){
            return res.status(401).json({ message: 'User does not Exist' });
        }
        return res.status(201).json(users);
    } catch (error) {
        return res.status(500).json(error);
    }
};

// Deactivate a user(Soft delete)
exports.deleteUser = async(req, res) =>{
    try {
        const {id}= req.params;
        if(!id){
        return res.status(400).json({ message: 'Invalid Access' });
    }
        const deleteMe = await User.findByIdAndUpdate(id, { isactive: false });

        if(!deleteMe){
        return  res.status(404).json({ message: 'Cannot find the user to delete' })

        
    };
        res.status(204).json({
        status: 'success',
        data: null
    });

    } catch (error) {
        res.status(401).json(error)
    }

};

exports.activateUser = async(req, res) =>{
    try {
        const {id}= req.params;
        if(!id){
        return res.status(400).json({ message: 'Invalid Access' });
    }
       const result = await User.updateOne(
            { _id: id }, 
            { $set: { isactive: true } }
        );

        if(!result){
        return  res.status(404).json({ message: 'Cannot activate user' })

        
    };
        res.status(204).json({
        status: 'success',
        data: null
    });

    } catch (error) {
        res.status(500).json(error)
    }

};
const express = require('express');
const router = express.Router();
const {getAllUsers, getAUser, deleteUser, activateUser} = require('../Controllers/admin');
const {authRoles} = require('../Middleware/roles')
const {protect} = require('../Middleware/auth')

// This route is only accessable to the admin
router.get('/allClients', protect,authRoles('admin'), getAllUsers);
router.get('/allClient/:id', protect,authRoles('admin'), getAUser)
router.delete('/deleteClient/:id', protect,authRoles('admin'), deleteUser)
router.patch('/activateClient/:id', protect,authRoles('admin'), activateUser)


module.exports = router;
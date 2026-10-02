const express = require('express');
const router = express.Router();
const {getAllUsers, getAUser, deleteUser, activateUser, upgradeUser, downgradeUser, deactivateUser} = require('../Controllers/admin');
const {authRoles} = require('../Middleware/roles')
const {protect} = require('../Middleware/auth')

// This route is only accessable to the admin
router.get('/allClients', protect,authRoles('superuser','admin'), getAllUsers);
router.get('/allClient/:id', protect,authRoles('superuser','admin'), getAUser);
router.delete('/deleteClient/:id', protect,authRoles('superuser','admin'), deleteUser);
router.patch('/activateClient/:id', protect,authRoles('superuser','admin'), activateUser);
router.patch('/deactivateClient/:id', protect,authRoles('superuser','admin'), deactivateUser);

router.put('/upgrade-user/:id', protect,authRoles('superuser'), upgradeUser);
router.put('/downgrade-user/:id',protect,authRoles('superuser'), downgradeUser);


module.exports = router;
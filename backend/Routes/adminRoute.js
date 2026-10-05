const express = require('express');
const router = express.Router();
const {
  loginSuperuser,
  getAllUsers,
  createUser,
  updateUserPackage,
  getAUser,
  deleteUser,
  activateUser,
  getUpgradeRequests,
  reviewUpgradeRequest,
} = require('../Controllers/admin');
const {authRoles} = require('../Middleware/roles')
const {protect} = require('../Middleware/auth')

router.post('/login', loginSuperuser);

// Admin control-center endpoints require a verified admin-role JWT.
router.get('/allClients', protect,authRoles('admin', 'superuser'), getAllUsers);
router.post('/users', protect, authRoles('admin', 'superuser'), createUser);
router.patch('/users/:id/package', protect, authRoles('admin','superuser'), updateUserPackage);
router.get('/allClient/:id', protect,authRoles('admin','superuser'), getAUser)
router.delete('/deleteClient/:id', protect,authRoles('admin','superuser'), deleteUser)
router.patch('/activateClient/:id', protect,authRoles('admin','superuser'), activateUser)
router.get('/upgrade-requests', protect, authRoles('admin','superuser'), getUpgradeRequests);
router.patch('/upgrade-requests/:userId/:requestId', protect, authRoles('admin','superuser'), reviewUpgradeRequest);


module.exports = router;
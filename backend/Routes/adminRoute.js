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
router.get('/allClients', protect,authRoles('admin'), getAllUsers);
router.post('/users', protect, authRoles('admin'), createUser);
router.patch('/users/:id/package', protect, authRoles('admin'), updateUserPackage);
router.get('/allClient/:id', protect,authRoles('admin'), getAUser)
router.delete('/deleteClient/:id', protect,authRoles('admin'), deleteUser)
router.patch('/activateClient/:id', protect,authRoles('admin'), activateUser)
router.get('/upgrade-requests', protect, authRoles('admin'), getUpgradeRequests);
router.patch('/upgrade-requests/:userId/:requestId', protect, authRoles('admin'), reviewUpgradeRequest);


module.exports = router;
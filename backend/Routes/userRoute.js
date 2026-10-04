const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  requestPackageUpgrade,
} = require('../Controllers/users');
const { protect } = require('../Middleware/auth');
const { userRequestQuota } = require('../Middleware/userRequestQuota');

router.post('/register', register);
router.post('/login', login)
router.get('/me', protect, userRequestQuota, getProfile);
router.patch('/me', protect, userRequestQuota, updateProfile);
router.post('/me/upgrade-requests', protect, userRequestQuota, requestPackageUpgrade);

module.exports = router;
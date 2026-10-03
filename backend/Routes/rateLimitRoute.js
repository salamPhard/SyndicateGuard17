const express = require('express');
const router = express.Router();

const {
  createRateLimitPackage,
  getRateLimitPackages,
  getRateLimitPackageByName,
  updateRateLimitPackage,
  deleteRateLimitPackage,
} = require('../Controllers/rateLmitPackage');
const { protect } = require('../Middleware/auth');
const { authRoles } = require('../Middleware/roles');

const adminOnly = [protect, authRoles('admin')];

router.post('/', ...adminOnly, createRateLimitPackage);
router.get('/', ...adminOnly, getRateLimitPackages);
router.get('/:packageName', ...adminOnly, getRateLimitPackageByName);
router.patch('/:packageName', ...adminOnly, updateRateLimitPackage);
router.delete('/:packageName', ...adminOnly, deleteRateLimitPackage);

module.exports = router;

const express = require('express');
const router = express.Router();
const rateLimiter = require('../Middleware/rateLimiter');

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

//Test rate limit 
router.get('/test', protect, rateLimiter, (req, res) => {
    res.status(200).json({
        message: 'Request successful'
    });
});
router.get('/:packageName', ...adminOnly, getRateLimitPackageByName);
router.patch('/:packageName', ...adminOnly, updateRateLimitPackage);
router.delete('/:packageName', ...adminOnly, deleteRateLimitPackage);

module.exports = router;

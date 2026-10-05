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

const adminAndSuperuser = [protect, authRoles('admin', 'superuser')];



router.post('/', ...adminAndSuperuser, createRateLimitPackage);
router.get('/', ...adminAndSuperuser, getRateLimitPackages);

//Test rate limit 
router.get('/test', protect, rateLimiter, (req, res) => {
    res.status(200).json({
        message: 'Request successful'
    });
});
router.get('/:packageName', ...adminAndSuperuser, getRateLimitPackageByName);
router.patch('/:packageName', ...adminAndSuperuser, updateRateLimitPackage);
router.delete('/:packageName', ...adminAndSuperuser, deleteRateLimitPackage);

module.exports = router;

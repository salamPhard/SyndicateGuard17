const express = require('express');
const router = express.Router();

const {
  getUsageSummary,
  clearUsageSummary,
} = require('../Controllers/usage');
const { protect } = require('../Middleware/auth');
const { authRoles } = require('../Middleware/roles');

const adminOnly = [protect, authRoles('admin')];

router.get('/', ...adminOnly, getUsageSummary);
router.delete('/clear', ...adminOnly, clearUsageSummary);

module.exports = router;

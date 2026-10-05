const express = require('express');
const router = express.Router();

const {
  getUsageSummary,
  clearUsageSummary,
} = require('../Controllers/usage');
const { protect } = require('../Middleware/auth');
const { authRoles } = require('../Middleware/roles');

const adminAndSuperuser = [protect, authRoles('admin','superuser')];

router.get('/', ...adminAndSuperuser, getUsageSummary);
router.delete('/clear', ...adminAndSuperuser, clearUsageSummary);

module.exports = router;

const express = require('express');
const router = express.Router();

const rateLimitService = require('../Services/rateLimitService');
const { protect } = require('../Middleware/auth');
const { authRoles } = require('../Middleware/roles');
const rateLimiter = require('../Middleware/rateLimiter');

const adminOnly = [protect, authRoles('admin')];

const sendError = (res, error) => {
	if (error.code === 11000) {
		return res.status(409).json({ message: 'A rate limit package with this name already exists.' });
	}

	if (error.name === 'ValidationError' || error.name === 'CastError') {
		return res.status(400).json({ message: error.message });
	}

	if (error.message === 'At least one rate limit field must be provided.') {
		return res.status(400).json({ message: error.message });
	}

	const statusCode = error.statusCode || 500;
	return res.status(statusCode).json({
		message: statusCode === 500 ? 'An unexpected error occurred.' : error.message,
	});
};

//Test Endpoint to check if rate limiting is working

router.get('/test', protect, rateLimiter, (req, res) => {
    res.status(200).json({
        message: 'Request successful'
    });
});

router.post('/', ...adminOnly, async (req, res) => {
	try {
		const rateLimit = await rateLimitService.createRateLimit(req.body || {});
		return res.status(201).json(rateLimit);
	} catch (error) {
		return sendError(res, error);
	}
});

router.get('/', ...adminOnly, async (_req, res) => {
	try {
		const rateLimits = await rateLimitService.getRateLimits();
		return res.status(200).json(rateLimits);
	} catch (error) {
		return sendError(res, error);
	}
});

router.get('/:packageName', ...adminOnly, async (req, res) => {
	try {
		const rateLimit = await rateLimitService.getRateLimitByPackage(req.params.packageName);
		if (!rateLimit) {
			return res.status(404).json({ message: 'Rate limit package not found.' });
		}
		return res.status(200).json(rateLimit);
	} catch (error) {
		return sendError(res, error);
	}
});

router.patch('/:packageName', ...adminOnly, async (req, res) => {
	try {
		const rateLimit = await rateLimitService.updateRateLimit(
			req.params.packageName,
			req.body || {}
		);
		return res.status(200).json(rateLimit);
	} catch (error) {
		return sendError(res, error);
	}
});

router.delete('/:packageName', ...adminOnly, async (req, res) => {
	try {
		const rateLimit = await rateLimitService.deleteRateLimit(req.params.packageName);
		return res.status(200).json({
			message: 'Rate limit package deleted.',
			rateLimit,
		});
	} catch (error) {
		return sendError(res, error);
	}
});

module.exports = router;

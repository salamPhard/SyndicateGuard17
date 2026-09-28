const RateLimit = require('../Models/RateLimit');

const requestCounts = new Map();
let requestsSinceCleanup = 0;

const rateLimiter = async (req, res, next) => {
	try {
		const packageName = req.user?.package;
		const clientId = req.user?._id?.toString() || req.ip;

		if (!packageName || !clientId) {
			return res.status(401).json({ message: 'An authenticated user and package are required.' });
		}

		const packageConfig = await RateLimit.findOne({ package: packageName }).lean();

		if (!packageConfig) {
			return res.status(403).json({ message: 'No rate limit is configured for this package.' });
		}

		const now = Date.now();
		const key = `${packageName}:${clientId}`;
		let usage = requestCounts.get(key);

		if (!usage || now >= usage.resetAt) {
			usage = { count: 0, resetAt: now + packageConfig.window * 1000 };
		}

		const remaining = Math.max(packageConfig.limit - usage.count - 1, 0);
		res.set({
			'X-RateLimit-Limit': String(packageConfig.limit),
			'X-RateLimit-Remaining': String(remaining),
			'X-RateLimit-Reset': String(Math.ceil(usage.resetAt / 1000)),
		});

		if (usage.count >= packageConfig.limit) {
			const retryAfter = Math.max(1, Math.ceil((usage.resetAt - now) / 1000));
			res.set('Retry-After', String(retryAfter));
			return res.status(429).json({
				message: 'Too many requests. Please try again later.',
				retryAfter,
			});
		}

		usage.count += 1;
		requestCounts.set(key, usage);

		requestsSinceCleanup += 1;
		if (requestsSinceCleanup >= 1000) {
			for (const [storedKey, storedUsage] of requestCounts) {
				if (now >= storedUsage.resetAt) requestCounts.delete(storedKey);
			}
			requestsSinceCleanup = 0;
		}

		return next();
	} catch (error) {
		return next(error);
	}
};

module.exports = rateLimiter;

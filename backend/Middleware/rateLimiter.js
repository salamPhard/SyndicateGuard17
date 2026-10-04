const RateLimit = require('../Models/RateLimit');

// Stores the number of requests made by each client within the current rate-limit window.
const requestCounts = new Map();
let requestsSinceCleanup = 0;

const getUsageSnapshot = () => {
	const now = Date.now();

	return Array.from(requestCounts.entries())
		.filter(([, usage]) => usage.resetAt > now)
		.map(([key, usage]) => {
			const [packageName, ...rest] = key.split(':');
			return {
				key,
				packageName,
				clientId: rest.join(':'),
				count: usage.count,
				resetAt: usage.resetAt,
			};
		});
};

const rateLimiter = async (req, res, next) => {
	try {
		const packageName = req.user?.package;
		// Use the authenticated user's ID to track requests; fall back to the IP address when unavailable.
		const clientId = req.user?._id?.toString() || req.ip;

		if (!packageName || !clientId) {
			return res.status(401).json({ message: 'An authenticated user and package are required.' });
		}

		// Retrieve the rate-limit configuration assigned to the user's package.
		const packageConfig = await RateLimit.findOne({ package: packageName }).lean();

		if (!packageConfig) {
			return res.status(403).json({ message: 'No rate limit is configured for this package.' });
		}

		const now = Date.now();
		// Create a unique key so request counts are tracked separately for each user and package.
		const key = `${packageName}:${clientId}`;
		let usage = requestCounts.get(key);

		// Start a new rate-limit window when no usage exists or the current window has expired.
		if (!usage || now >= usage.resetAt) {
			usage = { count: 0, resetAt: now + packageConfig.window * 1000 };
		}

		// Calculate and expose the client's remaining requests and reset time through response headers.
		const remaining = Math.max(packageConfig.limit - usage.count - 1, 0);
		res.set({
			'X-RateLimit-Limit': String(packageConfig.limit),
			'X-RateLimit-Remaining': String(remaining),
			'X-RateLimit-Reset': String(Math.ceil(usage.resetAt / 1000)),
		});

		// Reject the request when the client has reached the configured request limit.
		if (usage.count >= packageConfig.limit) {
			const retryAfter = Math.max(1, Math.ceil((usage.resetAt - now) / 1000));
			res.set('Retry-After', String(retryAfter));
			return res.status(429).json({
				message: 'Too many requests. Please try again later.',
				retryAfter,
			});
		}

		// Count the current request after confirming that the client is within the allowed limit.
		usage.count += 1;
		requestCounts.set(key, usage);

		// Periodically remove expired entries from memory to prevent the request count map from growing indefinitely.
		requestsSinceCleanup += 1;
		if (requestsSinceCleanup >= 1000) {
			for (const [storedKey, storedUsage] of requestCounts) {
				if (now >= storedUsage.resetAt) requestCounts.delete(storedKey);
			}
			requestsSinceCleanup = 0;
		}

		// Allow the request to continue to the next middleware or route handler.
		return next();
	} catch (error) {
		return next(error);
	}
};

module.exports = rateLimiter;
module.exports.requestCounts = requestCounts;
module.exports.getUsageSnapshot = getUsageSnapshot;

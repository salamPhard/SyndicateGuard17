const RateLimit = require('../Models/RateLimit');

const writableFields = ['package', 'limit', 'window'];

const pickWritableFields = (values) =>
	writableFields.reduce((picked, field) => {
		if (values[field] !== undefined) picked[field] = values[field];
		return picked;
	}, {});

const createRateLimit = async (values) => {
	const rateLimit = new RateLimit(pickWritableFields(values));
	return rateLimit.save();
};

const getRateLimits = async () =>
	RateLimit.find().sort({ package: 1 });

const getRateLimitByPackage = async (packageName) =>
	RateLimit.findOne({ package: packageName });

const updateRateLimit = async (packageName, values) => {
	const updates = pickWritableFields(values);
	if (Object.keys(updates).length === 0) {
		throw new Error('At least one rate limit field must be provided.');
	}

	const rateLimit = await RateLimit.findOneAndUpdate(
		{ package: packageName },
		{ $set: updates },
		{ new: true, runValidators: true }
	);

	if (!rateLimit) {
		const error = new Error('Rate limit package not found.');
		error.statusCode = 404;
		throw error;
	}

	return rateLimit;
};

const deleteRateLimit = async (packageName) => {
	const rateLimit = await RateLimit.findOneAndDelete({ package: packageName });

	if (!rateLimit) {
		const error = new Error('Rate limit package not found.');
		error.statusCode = 404;
		throw error;
	}

	return rateLimit;
};

module.exports = {
	createRateLimit,
	getRateLimits,
	getRateLimitByPackage,
	updateRateLimit,
	deleteRateLimit,
};

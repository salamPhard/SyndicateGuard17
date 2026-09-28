const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema(
	{
		package: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		limit: {
			type: Number,
			required: true,
			min: 1,
			validate: {
				validator: Number.isInteger,
				message: '{VALUE} is not an integer value',
			},
		},
		window: {
			type: Number,
			required: true,
			min: 1,
			validate: {
				validator: Number.isInteger,
				message: '{VALUE} is not an integer value',
			},
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('RateLimit', rateLimitSchema);

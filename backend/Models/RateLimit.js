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
            validator: {
                validate: Number.isInteger,
                message: '{VALUE} is not an integer value'
            },
            description: 'Maximum number of requests allowed',
		},
		window: {
			type: Number,
			required: true,
			min: 1,
            validate: {
                validate: Number.isInteger,
                message: '{VALUE} is not an integer value'
            },
			description: 'Time window in seconds',
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('RateLimit', rateLimitSchema);

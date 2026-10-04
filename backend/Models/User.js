const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    apiKey: {
      type: String,
      required: true,
      unique: true,
    },

    role: {
      type: String,
      enum: ["admin", "user", 'superuser'],
      default: 'user'
    },

    package: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
},

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    upgradeRequests: [
      {
        requestedPackage: {
          type: String,
          enum: ['pro', 'enterprise'],
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'declined'],
          default: 'pending',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        reviewedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    loginCountDate: {
      type: String,
      default: null,
    },

    loginCountToday: {
      type: Number,
      default: 0,
    },

    apiRequestCountDate: {
      type: String,
      default: null,
    },

    apiRequestCountToday: {
      type: Number,
      default: 0,
    },

    isactive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  },
);


module.exports = mongoose.model("User", userSchema);
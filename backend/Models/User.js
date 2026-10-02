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
      select :false
      // BUG: password has no select:false, so the bcrypt hash is returned in every response
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

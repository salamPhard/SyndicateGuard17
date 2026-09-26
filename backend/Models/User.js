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
      // BUG: password has no select:false, so the bcrypt hash is returned in every response
    },

    apiKey: {
      type: String,
      required: true,
      unique: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["admin", "user"],
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

// BUG: this hook hides deactivated users from ALL find queries (admin can't see them, re-registration crashes on duplicate email)
userSchema.pre(/^find/, async function () {
  this.find({ isactive: true });
});

module.exports = mongoose.model("User", userSchema);

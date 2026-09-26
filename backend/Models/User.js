const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  apiKey: {
    type: String,
    required: true,
    unique: true
  },

  role: {
        type: String,
        required: true,
        enum: ['admin', 'user']
    },

  isactive: {
    type: Boolean,
    default: true
  },
},

{
  timestamps: true
},
);

userSchema.pre(/^find/, async function () {
    this.find({ isactive: true });
});

module.exports = mongoose.model('User', userSchema);
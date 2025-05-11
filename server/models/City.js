const mongoose = require('mongoose');

/**
 * مدل شهر
 * این مدل برای ذخیره اطلاعات شهرها استفاده می‌شود
 */
const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  airport: {
    name: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    isInternational: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('City', CitySchema); 
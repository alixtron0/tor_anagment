const mongoose = require('mongoose');

/**
 * مدل شرکت هواپیمایی
 * این مدل برای ذخیره اطلاعات شرکت‌های هواپیمایی مانند ایران ایر، ماهان و... استفاده می‌شود
 */
const AirlineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  logo: {
    type: String,
    trim: true
  },
  aircraftModel: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
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

module.exports = mongoose.model('airline', AirlineSchema); 
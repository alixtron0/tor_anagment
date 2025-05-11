const mongoose = require('mongoose');

/**
 * مدل مسیر پرواز
 * این مدل برای ذخیره مسیرهای پرواز مانند تهران به اصفهان استفاده می‌شود
 */
const RouteSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  originAirport: {
    name: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      trim: true
    }
  },
  destinationAirport: {
    name: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      trim: true
    }
  },
  distance: {
    type: Number,
    default: 0
  },
  flightTime: {
    type: Number,  // مدت زمان پرواز به دقیقه
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
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

// ایجاد ایندکس ترکیبی برای جلوگیری از تکرار مسیرهای یکسان
RouteSchema.index({ origin: 1, destination: 1 }, { unique: true });

module.exports = mongoose.model('Route', RouteSchema); 
const mongoose = require('mongoose');

/**
 * مدل هواپیما
 * این مدل برای ذخیره اطلاعات انواع هواپیما مانند بوئینگ 737، ایرباس A320 و... استفاده می‌شود
 */
const AircraftSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  airline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'airline',
    required: true
  },
  capacity: {
    economy: {
      type: Number,
      default: 0
    },
    business: {
      type: Number,
      default: 0
    },
    firstClass: {
      type: Number,
      default: 0
    }
  },
  maxRange: {
    type: Number,
    default: 0 // برد پرواز به کیلومتر
  },
  cruiseSpeed: {
    type: Number,
    default: 0 // سرعت به کیلومتر بر ساعت
  },
  description: {
    type: String,
    trim: true
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

// ایجاد ایندکس ترکیبی برای جستجوی راحت‌تر
AircraftSchema.index({ model: 1, airline: 1 });

module.exports = mongoose.model('aircraft', AircraftSchema); 
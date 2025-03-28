const mongoose = require('mongoose');

/**
 * مدل هتل
 * این مدل برای ذخیره اطلاعات هتل‌ها استفاده می‌شود
 */
const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  mainImage: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    fax: {
      type: String,
      trim: true
    }
  },
  facilities: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  checkInTime: {
    type: String,
    default: '14:00'
  },
  checkOutTime: {
    type: String,
    default: '12:00'
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

module.exports = mongoose.model('Hotel', HotelSchema); 
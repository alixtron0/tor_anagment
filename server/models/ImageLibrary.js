const mongoose = require('mongoose');

/**
 * مدل کتابخانه تصاویر
 * این مدل برای ذخیره اطلاعات تصاویر آپلود شده در کتابخانه استفاده می‌شود
 */
const ImageLibrarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  serverPath: {
    type: String,
    trim: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number
  },
  mimetype: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'general',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ImageLibrary', ImageLibrarySchema); 
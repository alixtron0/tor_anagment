const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  type: {
    type: String,
    enum: ['self', 'admin'],
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 1
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adults: {
    type: Number,
    required: true,
    min: 1
  },
  children: {
    type: Number,
    default: 0
  },
  infants: {
    type: Number,
    default: 0
  },
  room: {
    type: String,
    enum: ['single', 'double', 'triple', 'quadruple', 'quintuple'],
    required: true
  },
  services: [{
    type: String
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  // قیمت‌های فروش
  sellingPrices: {
    adult: {
      type: Number,
      default: 0
    },
    child: {
      type: Number,
      default: 0
    },
    infant: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fullName: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled'],
    default: 'confirmed'
  },
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reservation', ReservationSchema); 
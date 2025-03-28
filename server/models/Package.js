const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allAccess: {
    type: Boolean,
    default: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  transportation: {
    departure: {
      type: String,
      enum: ['zamini', 'havaii'],
      required: true
    },
    return: {
      type: String,
      enum: ['zamini', 'havaii'],
      required: true
    }
  },
  basePrice: {
    type: Number,
    required: true,
    default: 0
  },
  infantPrice: {
    type: Number,
    required: true,
    default: 0
  },
  servicesFee: {
    type: Number,
    required: true,
    default: 0
  },
  capacity: {
    type: Number,
    required: true,
    default: 0
  },
  image: {
    type: String
  },
  createdBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fullName: {
      type: String
    }
  },
  hotels: [
    {
      hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
      },
      stayDuration: {
        type: Number,
        required: true,
        min: 1
      },
      firstMeal: {
        sobhane: { type: Boolean, default: false },
        nahar: { type: Boolean, default: false },
        sham: { type: Boolean, default: false }
      },
      lastMeal: {
        sobhane: { type: Boolean, default: false },
        nahar: { type: Boolean, default: false },
        sham: { type: Boolean, default: false }
      }
    }
  ],
  services: [{
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    calculateInPackage: { type: Boolean, default: true },
    selectable: { type: Boolean, default: true }
  }],
  rooms: {
    single: {
      price: { type: Number, default: 0 },
      forSale: { type: Boolean, default: true }
    },
    double: {
      price: { type: Number, default: 0 },
      forSale: { type: Boolean, default: true }
    },
    triple: {
      price: { type: Number, default: 0 },
      forSale: { type: Boolean, default: true }
    },
    quadruple: {
      price: { type: Number, default: 0 },
      forSale: { type: Boolean, default: true }
    },
    quintuple: {
      price: { type: Number, default: 0 },
      forSale: { type: Boolean, default: true }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Package', PackageSchema); 
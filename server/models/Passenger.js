const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema({
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  englishFirstName: {
    type: String,
    required: true,
    trim: true
  },
  englishLastName: {
    type: String,
    required: true,
    trim: true
  },
  nationalId: {
    type: String,
    required: true,
    trim: true
  },
  passportNumber: {
    type: String,
    required: true,
    trim: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  passportExpiryDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  ageCategory: {
    type: String,
    enum: ['adult', 'child', 'infant'],
    required: true
  },
  notes: {
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

module.exports = mongoose.model('Passenger', PassengerSchema); 
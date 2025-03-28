const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'double', 'triple', 'quadruple', 'quintuple', 'family', 'vip', 'shared'],
    default: 'double'
  },
  bedType: {
    type: String,
    enum: ['single', 'double', 'twin', 'queen', 'king'],
    default: 'double'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 2
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  extraBed: {
    type: Boolean,
    default: false
  },
  isShared: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', RoomSchema); 
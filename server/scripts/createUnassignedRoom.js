const mongoose = require('mongoose');
const Room = require('../models/Room');
require('dotenv').config({ path: '../../.env' });

async function createUnassignedRoom() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // بررسی وجود اتاق unassigned
    const existingRoom = await Room.findOne({ type: 'unassigned' });
    if (existingRoom) {
      console.log('Unassigned room already exists:', existingRoom._id);
      process.exit(0);
    }
    
    // ایجاد اتاق جدید
    const unassignedRoom = new Room({
      type: 'unassigned',
      capacity: 9999,
      currentOccupancy: 0,
      status: 'available',
      notes: 'اتاق مجازی برای مسافران بدون اتاق',
      reservation: '000000000000000000000000',
      bedType: 'none'
    });
    
    const savedRoom = await unassignedRoom.save();
    console.log('Unassigned room created with ID:', savedRoom._id);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createUnassignedRoom(); 
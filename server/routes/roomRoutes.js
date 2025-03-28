const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const Passenger = require('../models/Passenger');
const mongoose = require('mongoose');

/**
 * @route   GET /api/rooms/reservation/:reservationId
 * @desc    دریافت تمام اتاق‌های یک رزرو
 * @access  عمومی
 */
router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'شناسه رزرو نامعتبر است' });
    }
    
    const rooms = await Room.find({ reservation: reservationId })
      .sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error('خطا در دریافت اتاق‌ها:', error);
    res.status(500).json({ message: 'خطا در دریافت اتاق‌ها', error: error.message });
  }
});

/**
 * @route   GET /api/rooms/:id
 * @desc    دریافت یک اتاق با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    
    res.json(room);
  } catch (err) {
    console.error('خطا در دریافت اتاق:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت اتاق: ${err.message}` });
  }
});

/**
 * @route   POST /api/rooms
 * @desc    ایجاد اتاق جدید برای یک رزرو
 * @access  عمومی
 */
router.post('/', async (req, res) => {
  try {
    // بررسی وجود رزرو
    const reservationId = req.body.reservation;
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'شناسه رزرو نامعتبر است' });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }

    // ایجاد اتاق جدید با فیلدهای ساده‌شده
    const newRoom = new Room({
      type: req.body.type,
      capacity: req.body.capacity,
      reservation: reservationId,
      notes: req.body.notes || ''
    });

    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error('خطا در ایجاد اتاق:', error);
    res.status(500).json({ message: 'خطا در ایجاد اتاق', error: error.message });
  }
});

/**
 * @route   PUT /api/rooms/:id
 * @desc    به‌روزرسانی اتاق
 * @access  عمومی
 */
router.put('/:id', [
  check('type', 'نوع اتاق الزامی است').optional().isIn(['single', 'double', 'triple', 'quadruple', 'quintuple', 'family', 'vip', 'shared']),
  check('capacity', 'ظرفیت اتاق الزامی است').optional().isInt({ min: 1, max: 6 }),
  check('status', 'وضعیت اتاق معتبر نیست').optional().isIn(['available', 'occupied', 'reserved'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // بررسی وجود اتاق
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    
    // به‌روزرسانی فیلدها - فقط فیلدهای ضروری
    const { 
      type, 
      capacity, 
      notes, 
      status,
      currentOccupancy 
    } = req.body;
    
    if (type) room.type = type;
    if (capacity !== undefined) room.capacity = capacity;
    if (notes !== undefined) room.notes = notes;
    if (status) room.status = status;
    if (currentOccupancy !== undefined) room.currentOccupancy = currentOccupancy;
    
    const updatedRoom = await room.save();
    
    res.json({
      message: 'اتاق با موفقیت به‌روزرسانی شد',
      room: updatedRoom
    });
  } catch (err) {
    console.error('خطا در به‌روزرسانی اتاق:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در به‌روزرسانی اتاق: ${err.message}` });
  }
});

/**
 * @route   DELETE /api/rooms/:id
 * @desc    حذف یک اتاق
 * @access  عمومی
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    
    // بررسی آیا اتاق دارای مسافر است
    if (room.currentOccupancy > 0 || room.status === 'occupied') {
      return res.status(400).json({ message: 'اتاق دارای مسافر را نمی‌توان حذف کرد' });
    }
    
    // حذف مسافران مرتبط با اتاق (احتیاطی)
    await Passenger.deleteMany({ room: req.params.id });
    
    // حذف اتاق
    await Room.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'اتاق با موفقیت حذف شد' });
  } catch (error) {
    console.error('خطا در حذف اتاق:', error);
    res.status(500).json({ message: 'خطا در حذف اتاق', error: error.message });
  }
});

/**
 * @route   GET /api/rooms/stats/:reservationId
 * @desc    آمار رزرو و اتاق‌ها
 * @access  عمومی
 */
router.get('/stats/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'شناسه رزرو نامعتبر است' });
    }

    // دریافت رزرو
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }

    // دریافت همه اتاق‌های رزرو
    const rooms = await Room.find({ reservation: reservationId });
    
    // دریافت همه مسافران رزرو
    const passengers = await Passenger.find({ reservation: reservationId });
    
    // محاسبه آمار
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalAdults = passengers.filter(p => calculateAgeCategory(p.birthDate) === 'adult').length;
    const totalChildren = passengers.filter(p => calculateAgeCategory(p.birthDate) === 'child').length;
    const totalInfants = passengers.filter(p => calculateAgeCategory(p.birthDate) === 'infant').length;
    const totalPassengers = passengers.length;
    
    // محاسبه تعداد مورد نیاز از هر دسته سنی
    const adultsNeeded = Math.max(0, reservation.adults - totalAdults);
    const childrenNeeded = Math.max(0, reservation.children - totalChildren);
    const infantsNeeded = Math.max(0, reservation.infants - totalInfants);
    
    // آیا رزرو تکمیل شده است؟
    const isComplete = adultsNeeded === 0 && childrenNeeded === 0 && infantsNeeded === 0;

    res.json({
      totalRooms: rooms.length,
      totalCapacity,
      totalPassengers,
      totalAdults,
      totalChildren,
      totalInfants,
      adultsNeeded,
      childrenNeeded,
      infantsNeeded,
      isComplete
    });
  } catch (error) {
    console.error('خطا در دریافت آمار رزرو:', error);
    res.status(500).json({ message: 'خطا در دریافت آمار رزرو', error: error.message });
  }
});

// تابع محاسبه دسته سنی
function calculateAgeCategory(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  
  // تصحیح سن بر اساس ماه و روز تولد
  if (
    today.getMonth() < birth.getMonth() || 
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  
  if (age < 2) return 'infant'; // نوزاد
  if (age < 12) return 'child'; // کودک
  return 'adult'; // بزرگسال
}

module.exports = router; 
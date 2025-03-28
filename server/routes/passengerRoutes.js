const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Passenger = require('../models/Passenger');
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const mongoose = require('mongoose');
const moment = require('moment');

/**
 * @route   GET /api/passengers/room/:roomId
 * @desc    دریافت تمام مسافران یک اتاق
 * @access  عمومی
 */
router.get('/room/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    
    // بررسی وجود اتاق
    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    
    const passengers = await Passenger.find({ room: roomId })
      .sort({ createdAt: -1 });
    
    res.json(passengers);
  } catch (err) {
    console.error('خطا در دریافت مسافران:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت مسافران: ${err.message}` });
  }
});

/**
 * @route   GET /api/passengers/reservation/:reservationId
 * @desc    دریافت تمام مسافران یک رزرو
 * @access  عمومی
 */
router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    
    // بررسی وجود رزرو
    const reservationExists = await Reservation.findById(reservationId);
    if (!reservationExists) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    
    const passengers = await Passenger.find({ reservation: reservationId })
      .sort({ createdAt: -1 });
    
    res.json(passengers);
  } catch (err) {
    console.error('خطا در دریافت مسافران:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت مسافران: ${err.message}` });
  }
});

/**
 * @route   GET /api/passengers/:id
 * @desc    دریافت یک مسافر با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const passenger = await Passenger.findById(req.params.id);
    
    if (!passenger) {
      return res.status(404).json({ message: 'مسافر مورد نظر یافت نشد' });
    }
    
    res.json(passenger);
  } catch (err) {
    console.error('خطا در دریافت مسافر:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'مسافر مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت مسافر: ${err.message}` });
  }
});

/**
 * @route   POST /api/passengers
 * @desc    ایجاد مسافر جدید برای یک اتاق
 * @access  عمومی
 */
router.post('/', [
  check('reservation', 'شناسه رزرو الزامی است').notEmpty(),
  check('room', 'شناسه اتاق الزامی است').notEmpty(),
  check('firstName', 'نام الزامی است').notEmpty(),
  check('lastName', 'نام خانوادگی الزامی است').notEmpty(),
  check('englishFirstName', 'نام انگلیسی الزامی است').notEmpty(),
  check('englishLastName', 'نام خانوادگی انگلیسی الزامی است').notEmpty(),
  check('nationalId', 'شماره ملی الزامی است').notEmpty(),
  check('passportNumber', 'شماره پاسپورت الزامی است').notEmpty(),
  check('birthDate', 'تاریخ تولد الزامی است').notEmpty(),
  check('passportExpiryDate', 'تاریخ انقضای پاسپورت الزامی است').notEmpty(),
  check('gender', 'جنسیت الزامی است').isIn(['male', 'female'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      reservation, 
      room, 
      firstName, 
      lastName,
      englishFirstName,
      englishLastName,
      nationalId,
      passportNumber,
      birthDate,
      passportExpiryDate,
      gender,
      notes = ''
    } = req.body;
    
    // بررسی وجود رزرو
    const reservationExists = await Reservation.findById(reservation);
    if (!reservationExists) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    
    // بررسی وجود اتاق
    const roomData = await Room.findById(room);
    if (!roomData) {
      return res.status(404).json({ message: 'اتاق مورد نظر یافت نشد' });
    }
    
    // بررسی ظرفیت اتاق
    if (roomData.currentOccupancy >= roomData.capacity) {
      return res.status(400).json({ message: 'ظرفیت اتاق تکمیل است' });
    }
    
    // بررسی تاریخ انقضای پاسپورت (حداقل 6 ماه اعتبار)
    const expiryDate = moment(passportExpiryDate);
    const sixMonthsFromNow = moment().add(6, 'months');
    
    if (expiryDate.isBefore(sixMonthsFromNow)) {
      return res.status(400).json({ 
        message: 'تاریخ انقضای پاسپورت باید حداقل 6 ماه از تاریخ امروز اعتبار داشته باشد' 
      });
    }
    
    // تعیین گروه سنی
    const birthMoment = moment(birthDate);
    const now = moment();
    const ageInYears = now.diff(birthMoment, 'years');
    const ageInMonths = now.diff(birthMoment, 'months');
    
    let ageCategory;
    if (ageInYears < 2) {
      ageCategory = 'infant';
    } else if (ageInYears < 12) {
      ageCategory = 'child';
    } else {
      ageCategory = 'adult';
    }
    
    // بررسی تعداد مسافران بر اساس گروه سنی
    const allPassengers = await Passenger.find({ reservation });
    const adultCount = allPassengers.filter(p => calculateAgeCategory(p.birthDate) === 'adult').length;
    const childCount = allPassengers.filter(p => calculateAgeCategory(p.birthDate) === 'child').length;
    const infantCount = allPassengers.filter(p => calculateAgeCategory(p.birthDate) === 'infant').length;
    
    // بررسی تطابق با تعداد در رزرو
    if (ageCategory === 'adult' && adultCount >= reservationExists.adults) {
      return res.status(400).json({ 
        message: `تعداد بزرگسالان (${adultCount}) به حداکثر مجاز (${reservationExists.adults}) رسیده است` 
      });
    }
    
    if (ageCategory === 'child' && childCount >= reservationExists.children) {
      return res.status(400).json({ 
        message: `تعداد کودکان (${childCount}) به حداکثر مجاز (${reservationExists.children}) رسیده است` 
      });
    }
    
    if (ageCategory === 'infant' && infantCount >= reservationExists.infants) {
      return res.status(400).json({ 
        message: `تعداد نوزادان (${infantCount}) به حداکثر مجاز (${reservationExists.infants}) رسیده است` 
      });
    }
    
    // بررسی اعتبار پاسپورت (حداقل 6 ماه)
    if (passportNumber && passportExpiryDate) {
      const today = new Date();
      const expiryDate = new Date(passportExpiryDate);
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(today.getMonth() + 6);
      
      if (expiryDate < sixMonthsLater) {
        return res.status(400).json({ 
          message: 'تاریخ انقضای پاسپورت باید حداقل 6 ماه از تاریخ امروز بیشتر باشد' 
        });
      }
    }
    
    // ایجاد مسافر جدید
    const newPassenger = new Passenger({
      reservation,
      room,
      firstName,
      lastName,
      englishFirstName,
      englishLastName,
      nationalId,
      passportNumber,
      birthDate,
      passportExpiryDate,
      gender,
      ageCategory,
      notes
    });
    
    const passenger = await newPassenger.save();
    
    // به‌روزرسانی تعداد اشغال اتاق
    roomData.currentOccupancy += 1;
    if (roomData.currentOccupancy === roomData.capacity) {
      roomData.status = 'occupied';
    } else {
      roomData.status = 'reserved';
    }
    await roomData.save();
    
    res.status(201).json({
      message: 'مسافر با موفقیت ایجاد شد',
      passenger
    });
  } catch (err) {
    console.error('خطا در ایجاد مسافر:', err);
    res.status(500).json({ message: `خطای سرور در ایجاد مسافر: ${err.message}` });
  }
});

/**
 * @route   PUT /api/passengers/:id
 * @desc    به‌روزرسانی یک مسافر
 * @access  عمومی
 */
router.put('/:id', [
  check('firstName', 'نام الزامی است').optional().notEmpty(),
  check('lastName', 'نام خانوادگی الزامی است').optional().notEmpty(),
  check('englishFirstName', 'نام انگلیسی الزامی است').optional().notEmpty(),
  check('englishLastName', 'نام خانوادگی انگلیسی الزامی است').optional().notEmpty(),
  check('nationalId', 'شماره ملی الزامی است').optional().notEmpty(),
  check('passportNumber', 'شماره پاسپورت الزامی است').optional().notEmpty(),
  check('birthDate', 'تاریخ تولد الزامی است').optional().notEmpty(),
  check('passportExpiryDate', 'تاریخ انقضای پاسپورت الزامی است').optional().notEmpty(),
  check('gender', 'جنسیت الزامی است').optional().isIn(['male', 'female'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // بررسی وجود مسافر
    const passenger = await Passenger.findById(req.params.id);
    if (!passenger) {
      return res.status(404).json({ message: 'مسافر مورد نظر یافت نشد' });
    }
    
    // اگر اتاق تغییر کرده، ظرفیت‌ها را به‌روزرسانی کنیم
    let oldRoomId = passenger.room;
    const { room: newRoomId } = req.body;
    
    if (newRoomId && newRoomId !== oldRoomId.toString()) {
      // اتاق قدیمی را بررسی می‌کنیم
      const oldRoom = await Room.findById(oldRoomId);
      if (oldRoom) {
        oldRoom.currentOccupancy -= 1;
        if (oldRoom.currentOccupancy === 0) {
          oldRoom.status = 'available';
        } else {
          oldRoom.status = 'reserved';
        }
        await oldRoom.save();
      }
      
      // اتاق جدید را بررسی می‌کنیم
      const newRoom = await Room.findById(newRoomId);
      if (!newRoom) {
        return res.status(404).json({ message: 'اتاق جدید مورد نظر یافت نشد' });
      }
      
      // بررسی ظرفیت اتاق جدید
      if (newRoom.currentOccupancy >= newRoom.capacity) {
        return res.status(400).json({ message: 'ظرفیت اتاق جدید تکمیل است' });
      }
      
      newRoom.currentOccupancy += 1;
      if (newRoom.currentOccupancy === newRoom.capacity) {
        newRoom.status = 'occupied';
      } else {
        newRoom.status = 'reserved';
      }
      await newRoom.save();
      
      // به‌روزرسانی اتاق مسافر
      passenger.room = newRoomId;
    }
    
    // بررسی و به‌روزرسانی سایر فیلدها
    const { 
      firstName, 
      lastName,
      englishFirstName,
      englishLastName,
      nationalId,
      passportNumber,
      birthDate,
      passportExpiryDate,
      gender,
      notes
    } = req.body;
    
    if (firstName) passenger.firstName = firstName;
    if (lastName) passenger.lastName = lastName;
    if (englishFirstName) passenger.englishFirstName = englishFirstName;
    if (englishLastName) passenger.englishLastName = englishLastName;
    if (nationalId) passenger.nationalId = nationalId;
    if (passportNumber) passenger.passportNumber = passportNumber;
    
    // به‌روزرسانی تاریخ تولد و گروه سنی
    if (birthDate) {
      passenger.birthDate = birthDate;
      
      // تعیین گروه سنی
      const birthMoment = moment(birthDate);
      const now = moment();
      const ageInYears = now.diff(birthMoment, 'years');
      
      if (ageInYears < 2) {
        passenger.ageCategory = 'infant';
      } else if (ageInYears < 12) {
        passenger.ageCategory = 'child';
      } else {
        passenger.ageCategory = 'adult';
      }
    }
    
    // بررسی تاریخ انقضای پاسپورت
    if (passportExpiryDate) {
      const expiryDate = moment(passportExpiryDate);
      const sixMonthsFromNow = moment().add(6, 'months');
      
      if (expiryDate.isBefore(sixMonthsFromNow)) {
        return res.status(400).json({ 
          message: 'تاریخ انقضای پاسپورت باید حداقل 6 ماه از تاریخ امروز اعتبار داشته باشد' 
        });
      }
      
      passenger.passportExpiryDate = passportExpiryDate;
    }
    
    if (gender) passenger.gender = gender;
    if (notes !== undefined) passenger.notes = notes;
    
    const updatedPassenger = await passenger.save();
    
    res.json({
      message: 'مسافر با موفقیت به‌روزرسانی شد',
      passenger: updatedPassenger
    });
  } catch (err) {
    console.error('خطا در به‌روزرسانی مسافر:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'مسافر مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در به‌روزرسانی مسافر: ${err.message}` });
  }
});

/**
 * @route   DELETE /api/passengers/:id
 * @desc    حذف یک مسافر
 * @access  عمومی
 */
router.delete('/:id', async (req, res) => {
  try {
    const passenger = await Passenger.findById(req.params.id);
    
    if (!passenger) {
      return res.status(404).json({ message: 'مسافر مورد نظر یافت نشد' });
    }
    
    // به‌روزرسانی ظرفیت اتاق
    const room = await Room.findById(passenger.room);
    if (room) {
      room.currentOccupancy -= 1;
      if (room.currentOccupancy === 0) {
        room.status = 'available';
      } else {
        room.status = 'reserved';
      }
      await room.save();
    }
    
    await Passenger.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'مسافر با موفقیت حذف شد' });
  } catch (err) {
    console.error('خطا در حذف مسافر:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'مسافر مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در حذف مسافر: ${err.message}` });
  }
});

/**
 * @route   GET /api/passengers/stats/reservation/:reservationId
 * @desc    دریافت آمار مسافران یک رزرو
 * @access  عمومی
 */
router.get('/stats/reservation/:reservationId', async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    
    // بررسی وجود رزرو
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    
    // شمارش تعداد مسافران
    const totalPassengers = await Passenger.countDocuments({ reservation: reservationId });
    
    // شمارش بر اساس رده سنی
    const adults = await Passenger.countDocuments({ reservation: reservationId, ageCategory: 'adult' });
    const children = await Passenger.countDocuments({ reservation: reservationId, ageCategory: 'child' });
    const infants = await Passenger.countDocuments({ reservation: reservationId, ageCategory: 'infant' });
    
    // شمارش بر اساس جنسیت
    const males = await Passenger.countDocuments({ reservation: reservationId, gender: 'male' });
    const females = await Passenger.countDocuments({ reservation: reservationId, gender: 'female' });
    
    // محاسبه تعداد مسافران مورد نیاز از هر رده سنی
    // تعداد کل مسافران را بررسی می‌کنیم، نه تعداد هر گروه سنی
    const adultsNeeded = Math.max(0, reservation.count - totalPassengers);
    const childrenNeeded = 0; // بدون محدودیت
    const infantsNeeded = 0; // بدون محدودیت
    
    // بررسی کامل بودن رزرو
    const isComplete = totalPassengers >= reservation.count;
    
    res.json({
      totalCapacity: reservation.count,
      totalPassengers,
      remainingCapacity: reservation.count - totalPassengers,
      byAgeCategory: {
        adults,
        children,
        infants
      },
      byGender: {
        males,
        females
      },
      adultsNeeded,
      childrenNeeded,
      infantsNeeded,
      isComplete,
      totalAdults: adults,
      totalChildren: children,
      totalInfants: infants
    });
  } catch (err) {
    console.error('خطا در دریافت آمار مسافران:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت آمار مسافران: ${err.message}` });
  }
});

/**
 * @route   PUT /api/passengers/submit-final/:reservationId
 * @desc    ثبت نهایی رزرو و تولید کد رزرو
 * @access  عمومی
 */
router.put('/submit-final/:reservationId', async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    
    // بررسی وجود رزرو
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    
    // شمارش تعداد مسافران
    const totalPassengers = await Passenger.countDocuments({ reservation: reservationId });
    
    // بررسی آیا تعداد مسافران با ظرفیت رزرو برابر است
    if (totalPassengers < reservation.count) {
      return res.status(400).json({ 
        message: `تعداد مسافران (${totalPassengers}) کمتر از ظرفیت رزرو (${reservation.count}) است` 
      });
    }
    
    // تولید کد رزرو تصادفی
    const randomCode = generateReservationCode();
    
    // به‌روزرسانی وضعیت رزرو
    reservation.status = 'confirmed';
    reservation.code = randomCode;
    const updatedReservation = await reservation.save();
    
    res.json({
      message: 'رزرو با موفقیت ثبت نهایی شد',
      reservationCode: randomCode,
      reservation: updatedReservation
    });
  } catch (err) {
    console.error('خطا در ثبت نهایی رزرو:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در ثبت نهایی رزرو: ${err.message}` });
  }
});

// تابع تولید کد رزرو تصادفی
function generateReservationCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون حروف و اعدادی که ممکن اشتباه خوانده شوند
  let code = '';
  
  // سه حرف + 4 عدد
  for (let i = 0; i < 3; i++) {
    code += characters.charAt(Math.floor(Math.random() * 26)); // فقط حروف
  }
  
  code += '_';
  
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
}

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
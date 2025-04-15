const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Passenger = require('../models/Passenger');
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const mongoose = require('mongoose');
const moment = require('moment');
const ExcelJS = require('exceljs');
const path = require('path');
const Package = require('../models/Package');

/**
 * @route   GET /api/passengers/all
 * @desc    دریافت لیست تمام مسافران با اطلاعات بسته و رزرو
 * @access  عمومی
 */
router.get('/all', async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const page = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // ساخت شرط جستجو
    let searchCondition = {};
    if (searchQuery) {
      searchCondition = {
        $or: [
          { firstName: { $regex: searchQuery, $options: 'i' } },
          { lastName: { $regex: searchQuery, $options: 'i' } },
          { englishFirstName: { $regex: searchQuery, $options: 'i' } },
          { englishLastName: { $regex: searchQuery, $options: 'i' } },
          { nationalId: { $regex: searchQuery, $options: 'i' } },
          { passportNumber: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }
    
    // محاسبه تعداد کل نتایج برای صفحه‌بندی
    const totalPassengers = await Passenger.countDocuments(searchCondition);
    
    // دریافت داده‌ها با populate کردن رزرو و پکیج
    const passengers = await Passenger.find(searchCondition)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({
        path: 'reservation',
        select: 'adults children infants room totalPrice status code',
        populate: {
          path: 'package',
          select: 'name startDate endDate route',
          populate: {
            path: 'route',
            select: 'originCity destinationCity name'
          }
        }
      })
      .populate({
        path: 'room',
        select: 'roomNumber capacity'
      });
    
    res.json({
      passengers,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalPassengers / pageSize),
        totalItems: totalPassengers
      }
    });
  } catch (err) {
    console.error('خطا در دریافت لیست مسافران:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت لیست مسافران: ${err.message}` });
  }
});

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

/**
 * @route   GET /api/passengers/package/:packageId/excel
 * @desc    دانلود گزارش اکسل مسافران یک پکیج با exceljs
 * @access  عمومی (یا خصوصی بر اساس نیاز)
 */
router.get('/package/:packageId/excel', async (req, res) => {
  try {
    const packageId = req.params.packageId;
    const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'bime.xlsx');

    // 1. یافتن تمام رزروهای فعال (تایید شده) پکیج
    const reservations = await Reservation.find({
      package: packageId,
      status: 'confirmed'
    }).select('_id');

    if (!reservations || reservations.length === 0) {
      return res.status(404).json({ message: 'هیچ رزرو تایید شده‌ای برای این پکیج یافت نشد' });
    }
    const reservationIds = reservations.map(r => r._id);

    // 2. یافتن تمام مسافران این رزروها
    const passengers = await Passenger.find({
      reservation: { $in: reservationIds }
    })
    .select('firstName lastName englishFirstName englishLastName nationalId birthDate passportExpiryDate')
    .lean();

    if (!passengers || passengers.length === 0) {
      return res.status(404).json({ message: 'هیچ مسافری برای رزروهای این پکیج یافت نشد' });
    }

    // 3. آماده سازی داده ها به صورت آرایه ای از آرایه ها (برای درج سلول به سلول)
    const excelDataRows = passengers.map(p => {
      const birthDate = moment(p.birthDate);
      const age = moment().diff(birthDate, 'years');
      const isOver80 = age > 80;
      // **ترتیب باید با ستون‌های A تا H در قالب یکی باشد**
      return [
        p.firstName,
        p.lastName,
        p.englishFirstName,
        p.englishLastName,
        p.nationalId,
        birthDate.isValid() ? birthDate.format('YYYY/MM/DD') : 'نامعتبر',
        p.passportExpiryDate ? (moment(p.passportExpiryDate).isValid() ? moment(p.passportExpiryDate).format('YYYY/MM/DD') : 'نامعتبر') : 'ندارد',
        isOver80 ? 'بله' : 'خیر'
      ];
    });

    // 4. خواندن قالب و اضافه کردن داده‌ها با exceljs
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(templatePath);
    } catch (readError) {
        console.error("خطا در خواندن فایل قالب اکسل:", readError);
        return res.status(500).json({ message: 'خطا در خواندن فایل قالب اکسل' });
    }

    const worksheet = workbook.getWorksheet(1); // دریافت اولین شیت

    if (!worksheet) {
      console.error('شیت اول در فایل قالب یافت نشد.');
      return res.status(500).json({ message: 'شیت مورد نظر در قالب اکسل یافت نشد' });
    }

    // شروع درج داده از ردیف 5
    let startRow = 5;
    excelDataRows.forEach((rowData, rowIndex) => {
        const currentRow = worksheet.getRow(startRow + rowIndex);
        rowData.forEach((cellValue, colIndex) => {
            // colIndex از 0 شروع می‌شود، شماره ستون در اکسل از 1
            currentRow.getCell(colIndex + 1).value = cellValue;
        });
        // اطمینان از اینکه ردیف commit می‌شود (گاهی برای حفظ استایل لازم است)
        currentRow.commit();
    });

    // تنظیم خودکار عرض ستون‌ها بر اساس محتوا
    worksheet.columns.forEach((column, i) => {
      let maxLength = 0;
      // i از 0 شروع می‌شود، شماره ستون در اکسل از 1
      const colNumber = i + 1;
      column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        // فقط سلول‌های مربوط به هدر (ردیف 4) و داده‌ها (ردیف 5 به بعد) را بررسی کن
        if (rowNumber >= 4) { 
          const cellLength = cell.value ? String(cell.value).length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        }
      });
      // کمی فضای اضافی برای padding
      column.width = maxLength < 10 ? 10 : maxLength + 2; 
    });

    // تنظیم هدرها برای دانلود فایل
    const fileName = `package_${packageId}_passengers.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`); // استفاده از encodeURIComponent
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // 5. ارسال فایل اکسل با exceljs
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (writeError) {
        console.error("خطا در نوشتن بافر اکسل:", writeError);
        res.status(500).json({ message: 'خطا در تولید فایل اکسل' });
    }

  } catch (err) {
    console.error('خطا در ایجاد گزارش اکسل پکیج:', err);
    res.status(500).json({ message: `خطای سرور در ایجاد گزارش اکسل: ${err.message}` });
  }
});

/**
 * @route   GET /api/passengers/reservation/:reservationId/excel
 * @desc    دانلود گزارش اکسل مسافران یک رزرو با exceljs
 * @access  عمومی (یا خصوصی بر اساس نیاز)
 */
router.get('/reservation/:reservationId/excel', async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'bime.xlsx');

    // 1. یافتن تمام مسافران رزرو
    const passengers = await Passenger.find({ reservation: reservationId })
      .select('firstName lastName englishFirstName englishLastName nationalId birthDate passportExpiryDate')
      .lean();

    if (!passengers || passengers.length === 0) {
      return res.status(404).json({ message: 'هیچ مسافری برای این رزرو یافت نشد' });
    }

    // 2. آماده سازی داده ها به صورت آرایه ای از آرایه ها
    const excelDataRows = passengers.map(p => {
      const birthDate = moment(p.birthDate);
      const age = moment().diff(birthDate, 'years');
      const isOver80 = age > 80;
      // **ترتیب باید با ستون‌های A تا H در قالب یکی باشد**
      return [
        p.firstName,
        p.lastName,
        p.englishFirstName,
        p.englishLastName,
        p.nationalId,
        birthDate.isValid() ? birthDate.format('YYYY/MM/DD') : 'نامعتبر',
        p.passportExpiryDate ? (moment(p.passportExpiryDate).isValid() ? moment(p.passportExpiryDate).format('YYYY/MM/DD') : 'نامعتبر') : 'ندارد',
        isOver80 ? 'بله' : 'خیر'
      ];
    });

    // 3. خواندن قالب و اضافه کردن داده‌ها با exceljs
    const workbook = new ExcelJS.Workbook();
     try {
        await workbook.xlsx.readFile(templatePath);
    } catch (readError) {
        console.error("خطا در خواندن فایل قالب اکسل:", readError);
        return res.status(500).json({ message: 'خطا در خواندن فایل قالب اکسل' });
    }
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
        console.error('شیت اول در فایل قالب یافت نشد.');
        return res.status(500).json({ message: 'شیت مورد نظر در قالب اکسل یافت نشد' });
    }

    // شروع درج داده از ردیف 5
    let startRow = 5;
    excelDataRows.forEach((rowData, rowIndex) => {
        const currentRow = worksheet.getRow(startRow + rowIndex);
        rowData.forEach((cellValue, colIndex) => {
            currentRow.getCell(colIndex + 1).value = cellValue;
        });
        currentRow.commit();
    });

    // تنظیم خودکار عرض ستون‌ها بر اساس محتوا
    worksheet.columns.forEach((column, i) => {
      let maxLength = 0;
      const colNumber = i + 1;
      column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber >= 4) {
          const cellLength = cell.value ? String(cell.value).length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // تنظیم هدرها برای دانلود فایل
    const fileName = `reservation_${reservationId}_passengers.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // 4. ارسال فایل اکسل با exceljs
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (writeError) {
        console.error("خطا در نوشتن بافر اکسل:", writeError);
        res.status(500).json({ message: 'خطا در تولید فایل اکسل' });
    }

  } catch (err) {
    console.error('خطا در ایجاد گزارش اکسل رزرو:', err);
    res.status(500).json({ message: `خطای سرور در ایجاد گزارش اکسل: ${err.message}` });
  }
});

// Helper function to format date (consider using a library like moment-jalaali)
function formatExcelDate(dateString) {
    if (!dateString) return '';
    try {
        // Assuming dateString is in ISO format or parseable by Date
        const date = new Date(dateString);
        // Excel stores dates as numbers, but for simplicity, we format as YYYY-MM-DD
        // Adjust formatting as needed (e.g., to Persian date)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
        // For Persian Date (requires a library like moment-jalaali):
        // return moment(dateString).locale('fa').format('jYYYY/jMM/jDD');
    } catch (e) {
        console.error("Error formatting date for Excel:", e);
        return dateString; // Return original on error
    }
}

// --- Route to get Ticket Excel for all passengers in a Package ---
router.get('/package/:packageId/ticket-excel', auth, async (req, res) => {
    try {
        const packageId = req.params.packageId;

        // 1. Find all reservations for the package (excluding canceled)
        const reservations = await Reservation.find({ package: packageId, status: { $ne: 'canceled' } }).select('_id');
        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: 'هیچ رزرو فعالی برای این پکیج یافت نشد.' });
        }
        const reservationIds = reservations.map(r => r._id);

        // 2. Find all passengers for these reservations
        const passengers = await Passenger.find({ reservation: { $in: reservationIds } })
                                        .sort({ lastName: 1, firstName: 1 }); // Optional sort

        if (!passengers || passengers.length === 0) {
            return res.status(404).json({ message: 'هیچ مسافری برای رزروهای این پکیج یافت نشد.' });
        }

        // 3. Load the Excel template
        const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'ticket.xlsx');
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.readFile(templatePath);
        } catch (readError) {
             console.error("Error reading Excel template:", readError);
             return res.status(500).json({ message: 'خطا در خواندن فایل قالب اکسل.' });
        }
        
        const worksheet = workbook.getWorksheet(1); // Assuming data is in the first sheet
        if (!worksheet) {
             return res.status(500).json({ message: 'شیت مورد نظر در قالب اکسل یافت نشد.' });
        }

        // 4. Define starting row (assuming row 5 is header)
        let currentRow = 6;

        // 5. Populate data
        passengers.forEach(passenger => {
            worksheet.getCell(`A${currentRow}`).value = passenger.englishFirstName || '';
            worksheet.getCell(`B${currentRow}`).value = passenger.englishLastName || '';
            worksheet.getCell(`C${currentRow}`).value = passenger.passportNumber || ''; // Check exact field name
            worksheet.getCell(`D${currentRow}`).value = formatExcelDate(passenger.birthDate); // Check exact field name
            worksheet.getCell(`E${currentRow}`).value = formatExcelDate(passenger.passportExpiryDate); // Check exact field name
            // Add other columns if needed based on template
            currentRow++;
        });

        // --- Add Auto Column Width --- 
        const columnIndices = [0, 1, 2, 3, 4]; // Indices for columns A to E
        columnIndices.forEach(colIndex => {
            let maxLength = 0;
            const column = worksheet.getColumn(colIndex + 1);
            // Iterate cells from header row (5) downwards
            column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                if (rowNumber >= 5) { 
                    const cellValue = cell.value;
                    const cellLength = cellValue ? String(cellValue).length : 0;
                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                }
            });
            // Set column width with padding (e.g., min width 10)
            column.width = Math.max(10, maxLength + 3); 
        });
        // --- End Auto Column Width ---

        // 6. Set response headers for Excel download
        const packageInfo = await Package.findById(packageId).select('name');
        const fileName = `package_${packageInfo?.name || packageId}_tickets.xlsx`;
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(fileName)}"`
        );

        // 7. Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end(); // End the response

    } catch (error) {
        console.error('Error generating package ticket excel:', error);
        res.status(500).json({ message: 'خطا در تولید فایل اکسل بلیط پکیج.' });
    }
});

// --- Route to get Ticket Excel for all passengers in a Reservation ---
router.get('/reservation/:reservationId/ticket-excel', auth, async (req, res) => {
    try {
        const reservationId = req.params.reservationId;

        // 1. Find the reservation
        const reservation = await Reservation.findById(reservationId).populate('package', 'name'); // Populate package name for filename
        if (!reservation) {
            return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد.' });
        }

        // 2. Find all passengers for this reservation
        const passengers = await Passenger.find({ reservation: reservationId })
                                        .sort({ lastName: 1, firstName: 1 }); // Optional sort

        if (!passengers || passengers.length === 0) {
            return res.status(404).json({ message: 'هیچ مسافری برای این رزرو یافت نشد.' });
        }

        // 3. Load the Excel template
        const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'ticket.xlsx');
        const workbook = new ExcelJS.Workbook();
         try {
            await workbook.xlsx.readFile(templatePath);
        } catch (readError) {
             console.error("Error reading Excel template:", readError);
             return res.status(500).json({ message: 'خطا در خواندن فایل قالب اکسل.' });
        }
        const worksheet = workbook.getWorksheet(1); // Assuming data is in the first sheet
         if (!worksheet) {
             return res.status(500).json({ message: 'شیت مورد نظر در قالب اکسل یافت نشد.' });
        }

        // 4. Define starting row (assuming row 5 is header)
        let currentRow = 6;

        // 5. Populate data
        passengers.forEach(passenger => {
            worksheet.getCell(`A${currentRow}`).value = passenger.englishFirstName || '';
            worksheet.getCell(`B${currentRow}`).value = passenger.englishLastName || '';
            worksheet.getCell(`C${currentRow}`).value = passenger.passportNumber || ''; // Check exact field name
            worksheet.getCell(`D${currentRow}`).value = formatExcelDate(passenger.birthDate); // Check exact field name
            worksheet.getCell(`E${currentRow}`).value = formatExcelDate(passenger.passportExpiryDate); // Check exact field name
             // Add other columns if needed based on template
            currentRow++;
        });

        // --- Add Auto Column Width --- 
        const columnIndices = [0, 1, 2, 3, 4]; // Indices for columns A to E
        columnIndices.forEach(colIndex => {
            let maxLength = 0;
            const column = worksheet.getColumn(colIndex + 1);
            // Iterate cells from header row (5) downwards
            column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                if (rowNumber >= 5) { 
                    const cellValue = cell.value;
                    const cellLength = cellValue ? String(cellValue).length : 0;
                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                }
            });
            // Set column width with padding (e.g., min width 10)
            column.width = Math.max(10, maxLength + 3); 
        });
        // --- End Auto Column Width ---

        // 6. Set response headers for Excel download
        const packageName = reservation.package?.name || 'package';
        const fileName = `reservation_${reservation.code || reservationId}_${packageName}_tickets.xlsx`;
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(fileName)}"`
        );

        // 7. Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end(); // End the response

    } catch (error) {
        console.error('Error generating reservation ticket excel:', error);
        res.status(500).json({ message: 'خطا در تولید فایل اکسل بلیط رزرو.' });
    }
});

/**
 * @route   POST /api/passengers/export-excel
 * @desc    صدور اطلاعات مسافران به فرمت اکسل
 * @access  عمومی
 */
router.post('/export-excel', async (req, res) => {
  try {
    const { searchQuery, sortBy = 'createdAt', sortOrder = 'desc' } = req.body;
    
    // ساخت شرط جستجو
    let searchCondition = {};
    if (searchQuery) {
      searchCondition = {
        $or: [
          { firstName: { $regex: searchQuery, $options: 'i' } },
          { lastName: { $regex: searchQuery, $options: 'i' } },
          { englishFirstName: { $regex: searchQuery, $options: 'i' } },
          { englishLastName: { $regex: searchQuery, $options: 'i' } },
          { nationalId: { $regex: searchQuery, $options: 'i' } },
          { passportNumber: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }
    
    // دریافت همه مسافران که با شرط جستجو مطابقت دارند (بدون محدودیت صفحه‌بندی)
    const passengers = await Passenger.find(searchCondition)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .populate({
        path: 'reservation',
        select: 'adults children infants room totalPrice status code',
        populate: {
          path: 'package',
          select: 'name startDate endDate route',
          populate: {
            path: 'route',
            select: 'originCity destinationCity name'
          }
        }
      })
      .populate({
        path: 'room',
        select: 'roomNumber capacity'
      });
    
    // ایجاد فایل اکسل
    const workbook = new ExcelJS.Workbook();
    
    // تنظیم ویژگی‌های فایل
    workbook.creator = 'Tour Management System';
    workbook.lastModifiedBy = 'Tour Management System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // افزودن شیت مسافران
    const passengersSheet = workbook.addWorksheet('مسافران', {
      properties: { tabColor: { argb: '4167B2' }, rtl: true } // فعال‌سازی راست به چپ
    });
    
    // تنظیم ستون‌های صفحه مسافران
    passengersSheet.columns = [
      { header: 'ردیف', key: 'rowNumber', width: 8 },
      { header: 'نام', key: 'firstName', width: 15 },
      { header: 'نام خانوادگی', key: 'lastName', width: 18 },
      { header: 'نام انگلیسی', key: 'englishFirstName', width: 15 },
      { header: 'نام خانوادگی انگلیسی', key: 'englishLastName', width: 18 },
      { header: 'کد ملی', key: 'nationalId', width: 15 },
      { header: 'شماره پاسپورت', key: 'passportNumber', width: 15 },
      { header: 'جنسیت', key: 'gender', width: 10 },
      { header: 'بسته سفر', key: 'packageName', width: 20 },
      { header: 'کد رزرو', key: 'reservationCode', width: 15 },
      { header: 'وضعیت رزرو', key: 'reservationStatus', width: 12 },
      { header: 'تاریخ شروع سفر', key: 'startDate', width: 15 },
      { header: 'تاریخ پایان سفر', key: 'endDate', width: 15 },
      { header: 'یادداشت', key: 'notes', width: 25 }
    ];
    
    // استایل هدر مسافران
    passengersSheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    passengersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4167B2' } };
    passengersSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
    
    // افزودن داده‌های مسافران
    passengers.forEach((passenger, index) => {
      // تاریخ‌های فارسی
      const startDate = passenger.reservation?.package?.startDate 
        ? formatPersianDate(passenger.reservation.package.startDate) 
        : 'نامشخص';
      
      const endDate = passenger.reservation?.package?.endDate 
        ? formatPersianDate(passenger.reservation.package.endDate) 
        : 'نامشخص';
      
      // وضعیت رزرو به فارسی
      let reservationStatus = 'نامشخص';
      if (passenger.reservation) {
        switch (passenger.reservation.status) {
          case 'confirmed': reservationStatus = 'تایید شده'; break;
          case 'pending': reservationStatus = 'در انتظار تایید'; break;
          case 'canceled': reservationStatus = 'لغو شده'; break;
        }
      }

      // جنسیت به فارسی
      const gender = passenger.gender === 'male' ? 'مرد' : 'زن';
      
      passengersSheet.addRow({
        rowNumber: index + 1,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        englishFirstName: passenger.englishFirstName,
        englishLastName: passenger.englishLastName,
        nationalId: passenger.nationalId,
        passportNumber: passenger.passportNumber,
        gender: gender,
        packageName: passenger.reservation?.package?.name || 'نامشخص',
        reservationCode: passenger.reservation?.code || 'نامشخص',
        reservationStatus: reservationStatus,
        startDate: startDate,
        endDate: endDate,
        notes: passenger.notes || ''
      });
    });
    
    // اضافه کردن عنوان برای شیت مسافران (به عنوان سطر ثابت)
    passengersSheet.spliceRows(1, 0, []); // افزودن یک ردیف خالی در ابتدا
    
    // مرج سلول‌ها برای عنوان
    passengersSheet.mergeCells('A1:N1');
    const titleCell = passengersSheet.getCell('A1');
    titleCell.value = 'اطلاعات مسافران سیستم'; 
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3949AB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
    passengersSheet.getRow(1).height = 30; // ارتفاع ردیف عنوان
    
    // تنظیم استایل برای همه سلول‌های مسافران
    passengersSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) { // به جز هدر و عنوان
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', rtl: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // تنظیم فونت
          cell.font = { name: 'Tahoma', size: 11 };
        });
        
        // خطوط متناوب
        if (rowNumber % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F2F6FC' }
            };
          });
        }
      }
    });
    
    // تنظیم فریز پنل برای ستون‌های هدر
    passengersSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3', zoomScale: 100 }
    ];
    
    // تنظیم اندازه صفحه برای چاپ
    passengersSheet.pageSetup.paperSize = 9; // A4
    passengersSheet.pageSetup.orientation = 'landscape';
    passengersSheet.pageSetup.fitToPage = true;
    
    // گرفتن بافر فایل اکسل
    const buffer = await workbook.xlsx.writeBuffer();
    
    // تنظیم هدرهای CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-auth-token,Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    // تنظیم هدرهای پاسخ برای دانلود
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=passenger-list-${Date.now()}.xlsx`);
    res.setHeader('Content-Length', buffer.length);
    
    // ارسال بافر
    res.send(buffer);
    
  } catch (err) {
    console.error('خطا در صادرکردن اطلاعات مسافران به اکسل:', err);
    res.status(500).json({ message: 'خطا در ایجاد فایل اکسل' });
  }
});

// تبدیل تاریخ میلادی به شمسی برای فایل اکسل
function formatPersianDate(dateString) {
  const date = new Date(dateString);
  
  // استفاده از API داخلی Intl برای فرمت تاریخ فارسی
  return new Intl.DateTimeFormat('fa-IR').format(date);
}

module.exports = router; 
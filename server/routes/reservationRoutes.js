const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Reservation = require('../models/Reservation');
const Package = require('../models/Package');
const User = require('../models/User');
const mongoose = require('mongoose');
const Passenger = require('../models/Passenger');
const Room = require('../models/Room');

/**
 * @route   GET /api/reservations
 * @desc    دریافت تمام رزروها
 * @access  خصوصی
 */
router.get('/', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate({
        path: 'package',
        select: 'name startDate endDate basePrice',
        model: 'Package'
      })
      .populate({
        path: 'admin',
        select: 'fullName role',
        model: 'User'
      })
      .populate({
        path: 'createdBy.user',
        select: 'fullName role',
        model: 'User'
      })
      .sort({ createdAt: -1 });
    
    res.json(reservations);
  } catch (err) {
    console.error('خطا در دریافت رزروها:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت رزروها: ${err.message}` });
  }
});

/**
 * @route   GET /api/reservations/my-reservations
 * @desc    دریافت رزروهای کاربر جاری
 * @access  خصوصی
 */
router.get('/my-reservations', auth, async (req, res) => {
  try {
    // دریافت شناسه کاربر از توکن
    const userId = req.user.id;
    console.log('User ID from token:', userId);
    
    // بررسی ساختارهای مختلف برای فیلتر کردن رزروها
    const createdByFilter = { $or: [
      { 'createdBy.user': userId },
      { 'createdBy.user._id': userId }
    ]};
    
    console.log('Searching with filter:', JSON.stringify(createdByFilter));
    
    // جستجوی رزروهای کاربر با lean() برای افزایش کارایی
    const reservations = await Reservation.find(createdByFilter)
      .lean()
      .select('_id type count adults children infants room services totalPrice status createdAt package createdBy')
      .sort({ createdAt: -1 });
    
    console.log('Found reservations before populate:', reservations.length);
    
    // جمع آوری شناسه‌های پکیج‌ها
    const packageIds = reservations.map(r => r.package);
    
    // جستجوی پکیج‌ها به صورت جداگانه
    const packages = await Package.find({ _id: { $in: packageIds } })
      .lean()
      .select('_id name title description startDate endDate route capacity airline hotel status price')
      .populate('route');
    
    // ایجاد map از پکیج‌ها بر اساس ID
    const packageMap = {};
    packages.forEach(pkg => {
      packageMap[pkg._id.toString()] = pkg;
    });
    
    // تلفیق اطلاعات پکیج با رزروها
    const enrichedReservations = reservations.map(reservation => {
      const packageId = reservation.package.toString();
      const pkgData = packageMap[packageId] || { _id: reservation.package };
      
      // اضافه کردن فیلد title برای سازگاری با کلاینت
      if (pkgData.name && !pkgData.title) {
        pkgData.title = pkgData.name;
      }
      
      return {
        ...reservation,
        package: pkgData
      };
    });
    
    console.log('Enriched reservations count:', enrichedReservations.length);
    
    // بررسی پکیج اولین رزرو اگر وجود داشته باشد
    if (enrichedReservations.length > 0) {
      console.log('First reservation package data:', JSON.stringify(enrichedReservations[0].package, null, 2));
    }
    
    res.json(enrichedReservations);
  } catch (err) {
    console.error('خطا در دریافت رزروهای شخصی:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت رزروهای شخصی: ${err.message}` });
  }
});

/**
 * @route   GET /api/reservations/:id
 * @desc    دریافت یک رزرو با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate({
        path: 'package',
        select: 'name startDate endDate basePrice',
        model: 'Package'
      })
      .populate({
        path: 'admin',
        select: 'fullName role',
        model: 'User'
      })
      .populate({
        path: 'createdBy.user',
        select: 'fullName role',
        model: 'User'
      });
    
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    
    res.json(reservation);
  } catch (err) {
    console.error('خطا در دریافت رزرو:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت رزرو: ${err.message}` });
  }
});

/**
 * @route   GET /api/reservations/package/:packageId
 * @desc    دریافت رزروهای یک پکیج
 * @access  خصوصی
 */
router.get('/package/:packageId', auth, async (req, res) => {
  try {
    const packageId = req.params.packageId;
    
    // بررسی وجود پکیج
    const packageExists = await Package.findById(packageId);
    if (!packageExists) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    
    const reservations = await Reservation.find({ package: packageId })
      .populate({
        path: 'admin',
        select: 'fullName role',
        model: 'User'
      })
      .populate({
        path: 'createdBy.user',
        select: 'fullName role',
        model: 'User'
      })
      .sort({ createdAt: -1 });
    
    res.json(reservations);
  } catch (err) {
    console.error('خطا در دریافت رزروهای پکیج:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت رزروهای پکیج: ${err.message}` });
  }
});

/**
 * @route   POST /api/reservations/package/:packageId
 * @desc    ایجاد رزرو جدید برای یک پکیج
 * @access  عمومی
 */
router.post('/package/:packageId', [
  check('type', 'نوع رزرو الزامی است').isIn(['self', 'admin']),
  check('count', 'تعداد رزرو الزامی است').isInt({ min: 1 }),
  check('adults', 'تعداد بزرگسال الزامی است').isInt({ min: 1 }),
  check('room', 'نوع اتاق الزامی است').isIn(['single', 'double', 'triple', 'quadruple', 'quintuple']),
  check('userId', 'شناسه کاربر الزامی است').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // دریافت شناسه کاربر از بدنه درخواست
    const userId = req.body.userId;
    
    console.log('User ID from request body:', userId);
    
    // جستجوی کاربر در دیتابیس
    const userDocument = await User.findById(userId);
    if (!userDocument) {
      return res.status(404).json({ message: 'کاربر مورد نظر یافت نشد' });
    }
    
    const userFullName = userDocument.fullName;
    console.log('User Full Name from DB:', userFullName);
    
    const packageId = req.params.packageId;
    
    // بررسی وجود پکیج
    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    
    // بررسی ظرفیت پکیج
    const existingReservationsCount = await Reservation.aggregate([
      { $match: { package: new mongoose.Types.ObjectId(packageId), status: { $ne: 'canceled' } } },
      { $group: { _id: null, totalCount: { $sum: '$count' } } }
    ]);
    
    const currentCount = existingReservationsCount.length > 0 ? existingReservationsCount[0].totalCount : 0;
    const remainingCapacity = packageData.capacity - currentCount;
    
    if (req.body.count > remainingCapacity) {
      return res.status(400).json({ 
        message: `ظرفیت کافی برای رزرو وجود ندارد. ظرفیت باقیمانده: ${remainingCapacity} نفر` 
      });
    }
    
    // اگر نوع رزرو برای ادمین است، بررسی وجود ادمین
    if (req.body.type === 'admin' && req.body.admin) {
      const adminExists = await User.findById(req.body.admin);
      if (!adminExists) {
        return res.status(404).json({ message: 'ادمین مورد نظر یافت نشد' });
      }
      
      // بررسی نقش ادمین
      if (adminExists.role !== 'admin' && adminExists.role !== 'admin+') {
        return res.status(400).json({ message: 'کاربر انتخاب شده ادمین نیست' });
      }
    }
    
    const {
      type,
      count,
      admin,
      adults,
      children = 0,
      infants = 0,
      room,
      services = [],
      totalPrice
    } = req.body;
    
    // ایجاد رزرو جدید
    const newReservation = new Reservation({
      package: packageId,
      type,
      count,
      admin: type === 'admin' ? admin : null,
      adults,
      children,
      infants,
      room,
      services,
      totalPrice,
      createdBy: {
        user: userId,
        fullName: userFullName
      },
      status: 'pending'
    });
    
    const reservation = await newReservation.save();
    
    res.status(201).json({
      message: 'رزرو با موفقیت ایجاد شد',
      reservation
    });
  } catch (err) {
    console.error('خطا در ایجاد رزرو:', err);
    res.status(500).json({ message: `خطای سرور در ایجاد رزرو: ${err.message}` });
  }
});

/**
 * @route   PATCH /api/reservations/:id/status
 * @desc    تغییر وضعیت رزرو
 * @access  خصوصی
 */
router.patch('/:id/status', [
  auth,
  check('status', 'وضعیت معتبر نیست').isIn(['pending', 'confirmed', 'canceled'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    
    // بررسی وجود رزرو
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    
    // بررسی آیا وضعیت تغییر کرده است
    if (reservation.status === status) {
      return res.status(400).json({ message: 'وضعیت رزرو قبلاً تنظیم شده است' });
    }
    
    // در صورت لغو رزرو، آزاد کردن ظرفیت
    const oldStatus = reservation.status;
    reservation.status = status;
    
    await reservation.save();
    
    res.json({
      message: 'وضعیت رزرو با موفقیت به‌روزرسانی شد',
      id: reservation._id,
      status: reservation.status
    });
  } catch (err) {
    console.error('خطا در تغییر وضعیت رزرو:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در تغییر وضعیت رزرو: ${err.message}` });
  }
});

/**
 * @route   DELETE /api/reservations/:id
 * @desc    حذف یک رزرو
 * @access  خصوصی
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    
    await Reservation.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'رزرو با موفقیت حذف شد' });
  } catch (err) {
    console.error('خطا در حذف رزرو:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در حذف رزرو: ${err.message}` });
  }
});

/**
 * @route   PUT /api/reservations/:id/finalize
 * @desc    ثبت نهایی رزرو
 * @access  خصوصی
 */
router.put('/:id/finalize', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { code, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'شناسه رزرو نامعتبر است' });
    }

    // بررسی وجود رزرو
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }

    // بررسی کامل بودن مسافران
    const totalPassengers = await Passenger.countDocuments({ reservation: id });
    
    // مقایسه با تعداد مورد نیاز
    if (totalPassengers < reservation.count) {
      return res.status(400).json({ 
        message: `تعداد مسافران (${totalPassengers}) کمتر از ظرفیت رزرو (${reservation.count}) است` 
      });
    }

    // آپدیت رزرو
    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      { 
        code,
        status: status || 'confirmed',
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.json(updatedReservation);
  } catch (error) {
    console.error('خطا در ثبت نهایی رزرو:', error);
    res.status(500).json({ message: 'خطا در ثبت نهایی رزرو', error: error.message });
  }
});

// محاسبه سن بر اساس تاریخ تولد
function calculateAge(birthDate) {
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
  
  return age;
}

/**
 * @route   GET /api/reservations/:id/details
 * @desc    دریافت جزئیات کامل یک رزرو
 * @access  خصوصی
 */
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'شناسه رزرو نامعتبر است' });
    }

    // دریافت رزرو با رابطه‌های آن
    const reservation = await Reservation.findById(id)
      .populate('package')
      .populate({
        path: 'user',
        select: 'firstName lastName email phone'
      })
      .populate({
        path: 'admin',
        select: 'firstName lastName email'
      });

    if (!reservation) {
      return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
    }

    // دریافت اتاق‌ها
    const rooms = await Room.find({ reservation: id });

    // دریافت مسافران
    const passengers = await Passenger.find({ reservation: id });

    // محاسبه آمار
    const adultCount = passengers.filter(p => calculateAge(p.birthDate) >= 12).length;
    const childCount = passengers.filter(p => {
      const age = calculateAge(p.birthDate);
      return age >= 2 && age < 12;
    }).length;
    const infantCount = passengers.filter(p => calculateAge(p.birthDate) < 2).length;
    const totalPassengers = passengers.length;

    // آماده سازی پاسخ
    const response = {
      reservation,
      rooms,
      passengers,
      stats: {
        totalRooms: rooms.length,
        totalPassengers,
        adultsCount: adultCount,
        childrenCount: childCount,
        infantsCount: infantCount,
        adultsNeeded: Math.max(0, reservation.count - totalPassengers),
        childrenNeeded: 0,
        infantsNeeded: 0,
        isComplete: totalPassengers >= reservation.count
      }
    };

    res.json(response);
  } catch (error) {
    console.error('خطا در دریافت جزئیات رزرو:', error);
    res.status(500).json({ message: 'خطا در دریافت جزئیات رزرو', error: error.message });
  }
});

/**
 * @route   GET /api/reservations/debug/my-reservations
 * @desc    دیباگ رزروهای کاربر جاری
 * @access  خصوصی
 */
router.get('/debug/my-reservations', auth, async (req, res) => {
  try {
    // دریافت شناسه کاربر از توکن
    const userId = req.user.id;
    console.log('Debug - User ID from token:', userId);
    
    // جستجوی رزروهای کاربر
    const reservations = await Reservation.find({ 'createdBy.user': userId }).lean();
    console.log('Debug - Raw reservations found:', reservations.length);
    
    // بررسی ID پکیج‌های رزروها
    const packageIds = reservations.map(r => r.package);
    console.log('Debug - Package IDs:', packageIds);
    
    // جستجوی پکیج‌ها
    const packages = await Package.find({ 
      _id: { $in: packageIds } 
    }).lean();
    console.log('Debug - Found packages:', packages.length);
    
    // لاگ ساختار پکیج‌ها
    console.log('Debug - Package data:', JSON.stringify(packages, null, 2));
    
    // ایجاد یک map از پکیج‌ها بر اساس ID
    const packageMap = {};
    packages.forEach(pkg => {
      packageMap[pkg._id.toString()] = pkg;
    });
    
    // اضافه کردن اطلاعات پکیج به رزروها
    const enrichedReservations = reservations.map(reservation => {
      const packageId = reservation.package.toString();
      return {
        ...reservation,
        packageData: packageMap[packageId] || null
      };
    });
    
    res.json({
      userId,
      reservationsCount: reservations.length,
      packagesCount: packages.length,
      reservations: enrichedReservations
    });
  } catch (err) {
    console.error('Debug - Error:', err.message);
    res.status(500).json({ message: `خطا در دیباگ: ${err.message}` });
  }
});

module.exports = router; 
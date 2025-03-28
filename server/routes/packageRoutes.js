const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Route = require('../models/Route');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @route   GET /api/packages
 * @desc    دریافت تمام پکیج‌ها
 * @access  خصوصی
 */
router.get('/', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    // دریافت پکیج‌ها با مدیریت خطا
    const packages = await Package.find()
      .populate({
        path: 'route',
        select: 'origin destination',
        model: 'Route'
      })
      .populate({
        path: 'hotels.hotel',
        select: 'name city country',
        model: 'Hotel'
      })
      .populate({
        path: 'createdBy.user',
        select: 'fullName role',
        model: 'User'
      })
      .sort({ createdAt: -1 });
    
    res.json(packages);
  } catch (err) {
    console.error('خطا در دریافت پکیج‌ها:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت پکیج‌ها: ${err.message}` });
  }
});

/**
 * @route   GET /api/packages/:id
 * @desc    دریافت یک پکیج با شناسه
 * @access  خصوصی
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    const package = await Package.findById(req.params.id)
      .populate({
        path: 'route',
        select: 'origin destination',
        model: 'Route'
      })
      .populate({
        path: 'hotels.hotel',
        select: 'name city country',
        model: 'Hotel'
      })
      .populate({
        path: 'createdBy.user',
        select: 'fullName role',
        model: 'User'
      });
    
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    
    res.json(package);
  } catch (err) {
    console.error('خطا در دریافت پکیج:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت پکیج: ${err.message}` });
  }
});

// تنظیمات multer برای آپلود تصویر
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/packages';
    // ایجاد دایرکتوری اگر وجود نداشته باشد
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('فقط فایل‌های تصویری (JPG، PNG) مجاز هستند'));
  }
});

// مسیر آپلود تصویر
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'لطفاً یک تصویر انتخاب کنید'
      });
    }

    res.json({
      status: 'success',
      path: req.file.path
    });
  } catch (error) {
    console.error('خطا در آپلود تصویر:', error);
    res.status(500).json({
      status: 'error',
      message: 'خطا در آپلود تصویر'
    });
  }
});

/**
 * @route   POST /api/packages
 * @desc    ایجاد پکیج جدید
 * @access  خصوصی
 */
router.post('/', [
  auth,
  check('name', 'وارد کردن نام پکیج الزامی است').not().isEmpty(),
  check('route', 'انتخاب مسیر الزامی است').not().isEmpty(),
  check('startDate', 'تاریخ شروع الزامی است').not().isEmpty(),
  check('endDate', 'تاریخ پایان الزامی است').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    const {
      name,
      isPublic,
      allAccess,
      route,
      startDate,
      endDate,
      transportation,
      basePrice,
      infantPrice,
      servicesFee,
      capacity,
      hotels,
      services,
      rooms,
      image,
      isActive
    } = req.body;

    // بررسی وجود مسیر
    const routeExists = await Route.findById(route);
    if (!routeExists) {
      return res.status(404).json({ message: 'مسیر انتخابی یافت نشد' });
    }

    // بررسی وجود هتل‌ها
    if (hotels && hotels.length > 0) {
      for (const hotelItem of hotels) {
        const hotelExists = await Hotel.findById(hotelItem.hotel);
        if (!hotelExists) {
          return res.status(404).json({ message: `هتل با شناسه ${hotelItem.hotel} یافت نشد` });
        }
      }
    }

    // ایجاد پکیج جدید
    const newPackage = new Package({
      name,
      isPublic: isPublic !== undefined ? isPublic : true,
      allAccess: allAccess !== undefined ? allAccess : true,
      route,
      startDate,
      endDate,
      transportation,
      basePrice: basePrice || 0,
      infantPrice: infantPrice || 0,
      servicesFee: servicesFee || 0,
      capacity: capacity || 0,
      hotels: hotels || [],
      services: services || [],
      rooms,
      image,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: {
        user: req.user._id,
        fullName: req.user.fullName
      }
    });

    const savedPackage = await newPackage.save();
    
    res.status(201).json({
      message: 'پکیج با موفقیت ایجاد شد',
      package: savedPackage
    });
  } catch (err) {
    console.error('خطا در ایجاد پکیج:', err);
    res.status(500).json({ message: `خطای سرور در ایجاد پکیج: ${err.message}` });
  }
});

/**
 * @route   PUT /api/packages/:id
 * @desc    به‌روزرسانی پکیج
 * @access  خصوصی
 */
router.put('/:id', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    const {
      name,
      isPublic,
      allAccess,
      route,
      startDate,
      endDate,
      transportation,
      basePrice,
      infantPrice,
      servicesFee,
      capacity,
      hotels,
      services,
      rooms,
      image,
      isActive
    } = req.body;

    // بررسی وجود پکیج
    let package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }

    // بررسی وجود مسیر
    if (route) {
      const routeExists = await Route.findById(route);
      if (!routeExists) {
        return res.status(404).json({ message: 'مسیر انتخابی یافت نشد' });
      }
    }

    // بررسی وجود هتل‌ها
    if (hotels && hotels.length > 0) {
      for (const hotelItem of hotels) {
        const hotelExists = await Hotel.findById(hotelItem.hotel);
        if (!hotelExists) {
          return res.status(404).json({ message: `هتل با شناسه ${hotelItem.hotel} یافت نشد` });
        }
      }
    }

    // به‌روزرسانی فیلدها
    const packageFields = {
      name: name || package.name,
      isPublic: isPublic !== undefined ? isPublic : package.isPublic,
      allAccess: allAccess !== undefined ? allAccess : package.allAccess,
      route: route || package.route,
      startDate: startDate || package.startDate,
      endDate: endDate || package.endDate,
      transportation: transportation || package.transportation,
      basePrice: basePrice !== undefined ? basePrice : package.basePrice,
      infantPrice: infantPrice !== undefined ? infantPrice : package.infantPrice,
      servicesFee: servicesFee !== undefined ? servicesFee : package.servicesFee,
      capacity: capacity !== undefined ? capacity : package.capacity,
      hotels: hotels || package.hotels,
      services: services || package.services,
      rooms: rooms || package.rooms,
      image: image || package.image,
      isActive: isActive !== undefined ? isActive : package.isActive
    };

    // به‌روزرسانی پکیج
    package = await Package.findByIdAndUpdate(
      req.params.id,
      { $set: packageFields },
      { new: true }
    );

    res.json({
      message: 'پکیج با موفقیت به‌روزرسانی شد',
      package
    });
  } catch (err) {
    console.error('خطا در به‌روزرسانی پکیج:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در به‌روزرسانی پکیج: ${err.message}` });
  }
});

/**
 * @route   DELETE /api/packages/:id
 * @desc    حذف پکیج
 * @access  خصوصی
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package) {
      console.error('مدل Package یافت نشد');
      return res.status(500).json({ message: 'خطای سرور: مدل Package یافت نشد' });
    }

    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }

    await Package.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'پکیج با موفقیت حذف شد' });
  } catch (err) {
    console.error('خطا در حذف پکیج:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در حذف پکیج: ${err.message}` });
  }
});

/**
 * @route   PATCH /api/packages/:id/toggle-status
 * @desc    تغییر وضعیت فعال/غیرفعال پکیج
 * @access  خصوصی
 */
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package) {
      console.error('مدل Package یافت نشد');
      return res.status(500).json({ message: 'خطای سرور: مدل Package یافت نشد' });
    }

    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ message: 'وضعیت فعال بودن باید مشخص شود' });
    }
    
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }

    package.isActive = isActive;
    await package.save();
    
    res.json({ 
      message: `پکیج با موفقیت ${isActive ? 'فعال' : 'غیرفعال'} شد`,
      id: package._id, 
      isActive: package.isActive 
    });
  } catch (err) {
    console.error('خطا در تغییر وضعیت پکیج:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در تغییر وضعیت پکیج: ${err.message}` });
  }
});

module.exports = router; 
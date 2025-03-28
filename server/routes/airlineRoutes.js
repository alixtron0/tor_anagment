const express = require('express');
const router = express.Router();
const Airline = require('../models/Airline');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تنظیمات آپلود فایل
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/airlines';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `airline-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// فیلتر فایل‌های مجاز
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|svg/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('فرمت فایل قابل قبول نیست. فقط JPEG، PNG و SVG مجاز است.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // حداکثر 5 مگابایت
});

/**
 * @route   GET /api/airlines
 * @desc    دریافت همه شرکت‌های هواپیمایی
 * @access  عمومی
 */
router.get('/', async (req, res) => {
  try {
    const airlines = await Airline.find({}).sort({ name: 1 });
    res.json(airlines);
  } catch (err) {
    console.error('Error fetching airlines:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/airlines/:id
 * @desc    دریافت یک شرکت هواپیمایی با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const airline = await Airline.findById(req.params.id);
    
    if (!airline) {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }

    res.json(airline);
  } catch (err) {
    console.error('Error fetching airline:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   POST /api/airlines
 * @desc    ایجاد شرکت هواپیمایی جدید
 * @access  خصوصی (ادمین)
 */
router.post('/', [
  auth,
  upload.single('logo'),
  [
    check('name', 'نام شرکت هواپیمایی الزامی است').not().isEmpty(),
    check('code', 'کد شرکت هواپیمایی الزامی است').not().isEmpty(),
    check('country', 'کشور شرکت هواپیمایی الزامی است').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // بررسی دسترسی کاربر
  if (!['admin', 'admin+', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'دسترسی غیر مجاز' });
  }

  const { name, code, country, website, description } = req.body;
  const contactInfo = {
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || ''
  };

  try {
    // بررسی تکراری بودن نام یا کد شرکت هواپیمایی
    let airline = await Airline.findOne({ $or: [{ name }, { code }] });
    if (airline) {
      return res.status(400).json({ message: 'این نام یا کد شرکت هواپیمایی قبلاً ثبت شده است' });
    }

    // ایجاد شرکت هواپیمایی جدید
    const newAirline = new Airline({
      name,
      code,
      country,
      logo: req.file ? `/uploads/airlines/${req.file.filename}` : '',
      website,
      contactInfo,
      description,
      createdBy: req.user.id
    });

    airline = await newAirline.save();

    res.json({
      message: 'شرکت هواپیمایی جدید با موفقیت ایجاد شد',
      airline
    });
  } catch (err) {
    console.error('Error creating airline:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   PUT /api/airlines/:id
 * @desc    به‌روزرسانی شرکت هواپیمایی
 * @access  خصوصی (ادمین)
 */
router.put('/:id', [
  auth,
  upload.single('logo'),
  [
    check('name', 'نام شرکت هواپیمایی الزامی است').not().isEmpty(),
    check('code', 'کد شرکت هواپیمایی الزامی است').not().isEmpty(),
    check('country', 'کشور شرکت هواپیمایی الزامی است').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // بررسی دسترسی کاربر
  if (!['admin', 'admin+', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'دسترسی غیر مجاز' });
  }

  const { name, code, country, website, description, isActive } = req.body;
  const contactInfo = {
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || ''
  };

  try {
    let airline = await Airline.findById(req.params.id);
    
    if (!airline) {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }

    // بررسی تکراری بودن نام یا کد شرکت هواپیمایی
    if (name !== airline.name || code !== airline.code) {
      const existingAirline = await Airline.findOne({
        $and: [
          { _id: { $ne: req.params.id } },
          { $or: [{ name }, { code }] }
        ]
      });
      
      if (existingAirline) {
        return res.status(400).json({ message: 'این نام یا کد شرکت هواپیمایی قبلاً ثبت شده است' });
      }
    }

    // بررسی وجود لوگوی قبلی و حذف آن در صورت آپلود فایل جدید
    if (req.file && airline.logo) {
      const oldLogoPath = path.join(__dirname, '..', airline.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // به‌روزرسانی فیلدهای شرکت هواپیمایی
    airline.name = name;
    airline.code = code;
    airline.country = country;
    if (req.file) {
      airline.logo = `/uploads/airlines/${req.file.filename}`;
    }
    airline.website = website;
    airline.contactInfo = contactInfo;
    airline.description = description;
    airline.isActive = isActive !== undefined ? isActive : airline.isActive;
    airline.updatedAt = Date.now();

    const updatedAirline = await airline.save();

    res.json({
      message: 'شرکت هواپیمایی با موفقیت به‌روزرسانی شد',
      airline: updatedAirline
    });
  } catch (err) {
    console.error('Error updating airline:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   DELETE /api/airlines/:id
 * @desc    حذف شرکت هواپیمایی
 * @access  خصوصی (ادمین+)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // بررسی دسترسی کاربر
    if (!['admin+', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }

    const airline = await Airline.findById(req.params.id);
    
    if (!airline) {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }

    // حذف لوگوی شرکت هواپیمایی از سرور
    if (airline.logo) {
      const logoPath = path.join(__dirname, '..', airline.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await Airline.findByIdAndDelete(req.params.id);

    res.json({ message: 'شرکت هواپیمایی با موفقیت حذف شد' });
  } catch (err) {
    console.error('Error deleting airline:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/airlines/search/:term
 * @desc    جستجوی شرکت هواپیمایی
 * @access  عمومی
 */
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const regex = new RegExp(searchTerm, 'i');

    const airlines = await Airline.find({
      $or: [
        { name: regex },
        { code: regex },
        { country: regex }
      ]
    }).sort({ name: 1 });

    res.json(airlines);
  } catch (err) {
    console.error('Error searching airlines:', err);
    res.status(500).send('خطا در سرور');
  }
});

module.exports = router; 
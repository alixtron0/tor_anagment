const express = require('express');
const router = express.Router();
const Aircraft = require('../models/Aircraft');
const Airline = require('../models/Airline');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تنظیمات آپلود فایل
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/aircrafts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `aircraft-${Date.now()}${path.extname(file.originalname)}`);
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
 * @route   GET /api/aircrafts
 * @desc    دریافت همه هواپیماها
 * @access  عمومی
 */
router.get('/', async (req, res) => {
  try {
    const aircrafts = await Aircraft.find({}).populate('airline', 'name code logo').sort({ model: 1 });
    res.json(aircrafts);
  } catch (err) {
    console.error('Error fetching aircrafts:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/aircrafts/airline/:airlineId
 * @desc    دریافت هواپیماهای یک شرکت هواپیمایی خاص
 * @access  عمومی
 */
router.get('/airline/:airlineId', async (req, res) => {
  try {
    const aircrafts = await Aircraft.find({ airline: req.params.airlineId })
      .populate('airline', 'name code logo')
      .sort({ model: 1 });
    
    res.json(aircrafts);
  } catch (err) {
    console.error('Error fetching airline aircrafts:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/aircrafts/:id
 * @desc    دریافت یک هواپیما با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const aircraft = await Aircraft.findById(req.params.id).populate('airline', 'name code logo');
    
    if (!aircraft) {
      return res.status(404).json({ message: 'هواپیما یافت نشد' });
    }

    res.json(aircraft);
  } catch (err) {
    console.error('Error fetching aircraft:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'هواپیما یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   POST /api/aircrafts
 * @desc    ایجاد هواپیمای جدید
 * @access  خصوصی (ادمین)
 */
router.post('/', [
  auth,
  upload.single('image'),
  [
    check('model', 'مدل هواپیما الزامی است').not().isEmpty(),
    check('manufacturer', 'سازنده هواپیما الزامی است').not().isEmpty(),
    check('airline', 'شرکت هواپیمایی الزامی است').not().isEmpty()
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

  const { 
    model, 
    manufacturer, 
    airline, 
    economyCapacity, 
    businessCapacity, 
    firstClassCapacity,
    maxRange,
    cruiseSpeed,
    description 
  } = req.body;

  try {
    // بررسی وجود شرکت هواپیمایی
    const airlineExists = await Airline.findById(airline);
    if (!airlineExists) {
      return res.status(404).json({ message: 'شرکت هواپیمایی انتخاب شده وجود ندارد' });
    }

    // بررسی تکراری بودن مدل هواپیما برای این شرکت
    const existingAircraft = await Aircraft.findOne({ model, airline });
    if (existingAircraft) {
      return res.status(400).json({ message: 'این مدل هواپیما برای این شرکت هواپیمایی قبلاً ثبت شده است' });
    }

    // ایجاد هواپیمای جدید
    const newAircraft = new Aircraft({
      model,
      manufacturer,
      airline,
      image: req.file ? `/uploads/aircrafts/${req.file.filename}` : '',
      capacity: {
        economy: economyCapacity || 0,
        business: businessCapacity || 0,
        firstClass: firstClassCapacity || 0
      },
      maxRange: maxRange || 0,
      cruiseSpeed: cruiseSpeed || 0,
      description,
      createdBy: req.user.id
    });

    const aircraft = await newAircraft.save();

    // پاپیولیت کردن اطلاعات شرکت هواپیمایی برای پاسخ API
    const populatedAircraft = await Aircraft.findById(aircraft._id).populate('airline', 'name code logo');

    res.json({
      message: 'هواپیمای جدید با موفقیت ایجاد شد',
      aircraft: populatedAircraft
    });
  } catch (err) {
    console.error('Error creating aircraft:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   PUT /api/aircrafts/:id
 * @desc    به‌روزرسانی هواپیما
 * @access  خصوصی (ادمین)
 */
router.put('/:id', [
  auth,
  upload.single('image'),
  [
    check('model', 'مدل هواپیما الزامی است').not().isEmpty(),
    check('manufacturer', 'سازنده هواپیما الزامی است').not().isEmpty(),
    check('airline', 'شرکت هواپیمایی الزامی است').not().isEmpty()
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

  const { 
    model, 
    manufacturer, 
    airline, 
    economyCapacity, 
    businessCapacity, 
    firstClassCapacity,
    maxRange,
    cruiseSpeed,
    description,
    isActive
  } = req.body;

  try {
    // بررسی وجود هواپیما
    let aircraft = await Aircraft.findById(req.params.id);
    if (!aircraft) {
      return res.status(404).json({ message: 'هواپیما یافت نشد' });
    }

    // بررسی وجود شرکت هواپیمایی
    const airlineExists = await Airline.findById(airline);
    if (!airlineExists) {
      return res.status(404).json({ message: 'شرکت هواپیمایی انتخاب شده وجود ندارد' });
    }

    // بررسی تکراری بودن مدل هواپیما برای این شرکت
    if (model !== aircraft.model || airline !== aircraft.airline.toString()) {
      const existingAircraft = await Aircraft.findOne({
        _id: { $ne: req.params.id },
        model,
        airline
      });
      
      if (existingAircraft) {
        return res.status(400).json({ message: 'این مدل هواپیما برای این شرکت هواپیمایی قبلاً ثبت شده است' });
      }
    }

    // بررسی وجود تصویر قبلی و حذف آن در صورت آپلود فایل جدید
    if (req.file && aircraft.image) {
      const oldImagePath = path.join(__dirname, '..', aircraft.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // به‌روزرسانی فیلدهای هواپیما
    aircraft.model = model;
    aircraft.manufacturer = manufacturer;
    aircraft.airline = airline;
    if (req.file) {
      aircraft.image = `/uploads/aircrafts/${req.file.filename}`;
    }
    aircraft.capacity = {
      economy: economyCapacity || aircraft.capacity.economy,
      business: businessCapacity || aircraft.capacity.business,
      firstClass: firstClassCapacity || aircraft.capacity.firstClass
    };
    aircraft.maxRange = maxRange || aircraft.maxRange;
    aircraft.cruiseSpeed = cruiseSpeed || aircraft.cruiseSpeed;
    aircraft.description = description !== undefined ? description : aircraft.description;
    aircraft.isActive = isActive !== undefined ? isActive : aircraft.isActive;
    aircraft.updatedAt = Date.now();

    const updatedAircraft = await aircraft.save();

    // پاپیولیت کردن اطلاعات شرکت هواپیمایی برای پاسخ API
    const populatedAircraft = await Aircraft.findById(updatedAircraft._id).populate('airline', 'name code logo');

    res.json({
      message: 'هواپیما با موفقیت به‌روزرسانی شد',
      aircraft: populatedAircraft
    });
  } catch (err) {
    console.error('Error updating aircraft:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'هواپیما یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   DELETE /api/aircrafts/:id
 * @desc    حذف هواپیما
 * @access  خصوصی (ادمین+)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // بررسی دسترسی کاربر
    if (!['admin+', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }

    const aircraft = await Aircraft.findById(req.params.id);
    
    if (!aircraft) {
      return res.status(404).json({ message: 'هواپیما یافت نشد' });
    }

    // حذف تصویر هواپیما از سرور
    if (aircraft.image) {
      const imagePath = path.join(__dirname, '..', aircraft.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Aircraft.findByIdAndDelete(req.params.id);

    res.json({ message: 'هواپیما با موفقیت حذف شد' });
  } catch (err) {
    console.error('Error deleting aircraft:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'هواپیما یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/aircrafts/search/:term
 * @desc    جستجوی هواپیما
 * @access  عمومی
 */
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const regex = new RegExp(searchTerm, 'i');

    const aircrafts = await Aircraft.find({
      $or: [
        { model: regex },
        { manufacturer: regex }
      ]
    }).populate('airline', 'name code logo').sort({ model: 1 });

    res.json(aircrafts);
  } catch (err) {
    console.error('Error searching aircrafts:', err);
    res.status(500).send('خطا در سرور');
  }
});

module.exports = router; 
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
    const uploadDir = path.join(__dirname, '../uploads/airlines');
    console.log('Upload directory:', path.resolve(uploadDir)); // لاگ مسیر آپلود
    if (!fs.existsSync(uploadDir)) {
      console.log('Directory does not exist, creating:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const fileName = `airline-${Date.now()}${path.extname(file.originalname)}`;
    console.log('Generated filename:', fileName); // لاگ نام فایل
    cb(null, fileName);
  }
});

// فیلتر فایل‌های مجاز
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|svg/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  console.log('File upload attempt:', { 
    originalname: file.originalname,
    mimetype: file.mimetype,
    extname: path.extname(file.originalname).toLowerCase(),
    isValid: mimetype && extname
  }); // لاگ اطلاعات فایل

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
    check('name', 'نام شرکت هواپیمایی الزامی است').not().isEmpty()
  ]
], async (req, res) => {
  console.log('POST airline request:', { 
    body: req.body,
    file: req.file ? { 
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype 
    } : 'No file uploaded'
  }); // لاگ اطلاعات درخواست
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // بررسی دسترسی کاربر
  if (!['admin', 'admin+', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'دسترسی غیر مجاز' });
  }

  const { name, aircraftModel, description } = req.body;

  try {
    // بررسی تکراری بودن نام شرکت هواپیمایی
    let airline = await Airline.findOne({ name });
    if (airline) {
      return res.status(400).json({ message: 'این نام شرکت هواپیمایی قبلاً ثبت شده است' });
    }

    // ایجاد شرکت هواپیمایی جدید
    const newAirline = new Airline({
      name,
      logo: req.file ? `/uploads/airlines/${req.file.filename}` : '',
      aircraftModel: aircraftModel || '',
      description: description || '',
      createdBy: req.user.id
    });

    airline = await newAirline.save();
    console.log('Airline created successfully:', airline); // لاگ نتیجه ایجاد

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
    check('name', 'نام شرکت هواپیمایی الزامی است').not().isEmpty()
  ]
], async (req, res) => {
  console.log('PUT airline request:', { 
    id: req.params.id,
    body: req.body,
    file: req.file ? { 
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype 
    } : 'No file uploaded'
  }); // لاگ اطلاعات درخواست
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // بررسی دسترسی کاربر
  if (!['admin', 'admin+', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'دسترسی غیر مجاز' });
  }

  const { name, aircraftModel, description, isActive } = req.body;

  try {
    let airline = await Airline.findById(req.params.id);
    
    if (!airline) {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }

    // بررسی تکراری بودن نام شرکت هواپیمایی
    if (name !== airline.name) {
      const existingAirline = await Airline.findOne({
        $and: [
          { _id: { $ne: req.params.id } },
          { name }
        ]
      });
      
      if (existingAirline) {
        return res.status(400).json({ message: 'این نام شرکت هواپیمایی قبلاً ثبت شده است' });
      }
    }

    // بررسی وجود لوگوی قبلی و حذف آن در صورت آپلود فایل جدید
    if (req.file && airline.logo) {
      const oldLogoPath = path.join(__dirname, '..', airline.logo);
      console.log('Attempting to delete old logo:', oldLogoPath); // لاگ مسیر حذف فایل قدیمی
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
        console.log('Old logo deleted successfully');
      } else {
        console.log('Old logo file not found');
      }
    }

    // به‌روزرسانی فیلدهای شرکت هواپیمایی
    airline.name = name;
    if (req.file) {
      airline.logo = `/uploads/airlines/${req.file.filename}`;
    }
    airline.aircraftModel = aircraftModel || airline.aircraftModel;
    airline.description = description || airline.description;
    airline.isActive = isActive !== undefined ? isActive : airline.isActive;
    airline.updatedAt = Date.now();

    const updatedAirline = await airline.save();
    console.log('Airline updated successfully:', updatedAirline); // لاگ نتیجه بروزرسانی

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

    // حذف فایل لوگو
    if (airline.logo) {
      const logoPath = path.join(__dirname, '..', airline.logo);
      console.log('Attempting to delete logo on airline delete:', logoPath); // لاگ مسیر حذف فایل
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
        console.log('Logo deleted successfully');
      } else {
        console.log('Logo file not found');
      }
    }

    await airline.deleteOne();
    console.log('Airline deleted successfully', req.params.id);

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
        { aircraftModel: regex }
      ]
    }).sort({ name: 1 });

    res.json(airlines);
  } catch (err) {
    console.error('Error searching airlines:', err);
    res.status(500).send('خطا در سرور');
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تنظیمات آپلود فایل
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/hotels';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `hotel-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// فیلتر فایل‌های مجاز
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('فرمت فایل قابل قبول نیست. فقط JPEG، PNG و WEBP مجاز است.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // حداکثر 5 مگابایت
});

/**
 * @route   GET /api/hotels
 * @desc    دریافت همه هتل‌ها
 * @access  عمومی
 */
router.get('/', async (req, res) => {
  try {
    const hotels = await Hotel.find({}).sort({ name: 1 });
    res.json(hotels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطای سرور');
  }
});

/**
 * @route   GET /api/hotels/:id
 * @desc    دریافت یک هتل با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: 'هتل یافت نشد' });
    }
    
    res.json(hotel);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'هتل یافت نشد' });
    }
    res.status(500).send('خطای سرور');
  }
});

/**
 * @route   POST /api/hotels
 * @desc    ایجاد هتل جدید
 * @access  خصوصی (فقط ادمین)
 */
router.post(
  '/',
  [
    auth,
    upload.single('mainImage'),
    [
      check('name', 'نام هتل الزامی است').not().isEmpty(),
      check('stars', 'تعداد ستاره‌های هتل الزامی است').isNumeric(),
      check('city', 'شهر هتل الزامی است').not().isEmpty(),
      check('country', 'کشور هتل الزامی است').not().isEmpty(),
      check('address', 'آدرس هتل الزامی است').not().isEmpty(),
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        name,
        stars,
        city,
        country,
        address,
        website,
        phone,
        email,
        fax,
        facilities,
        description,
        checkInTime,
        checkOutTime
      } = req.body;

      // ایجاد هتل جدید
      const newHotel = new Hotel({
        name,
        stars: parseInt(stars),
        city,
        country,
        address,
        website: website || '',
        contactInfo: {
          phone: phone || '',
          email: email || '',
          fax: fax || ''
        },
        facilities: facilities ? facilities.split(',').map(facility => facility.trim()) : [],
        description: description || '',
        checkInTime: checkInTime || '14:00',
        checkOutTime: checkOutTime || '12:00',
        createdBy: req.user.id
      });

      // اگر تصویر آپلود شده باشد
      if (req.file) {
        newHotel.mainImage = `/uploads/hotels/${req.file.filename}`;
      }

      const hotel = await newHotel.save();
      res.json(hotel);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('خطای سرور');
    }
  }
);

/**
 * @route   PUT /api/hotels/:id
 * @desc    به‌روزرسانی هتل
 * @access  خصوصی (فقط ادمین)
 */
router.put(
  '/:id',
  [
    auth,
    upload.single('mainImage'),
    [
      check('name', 'نام هتل الزامی است').not().isEmpty(),
      check('stars', 'تعداد ستاره‌های هتل الزامی است').isNumeric(),
      check('city', 'شهر هتل الزامی است').not().isEmpty(),
      check('country', 'کشور هتل الزامی است').not().isEmpty(),
      check('address', 'آدرس هتل الزامی است').not().isEmpty(),
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let hotel = await Hotel.findById(req.params.id);
      
      if (!hotel) {
        return res.status(404).json({ message: 'هتل یافت نشد' });
      }

      const {
        name,
        stars,
        city,
        country,
        address,
        website,
        phone,
        email,
        fax,
        facilities,
        description,
        checkInTime,
        checkOutTime
      } = req.body;

      // به‌روزرسانی فیلدها
      hotel.name = name;
      hotel.stars = parseInt(stars);
      hotel.city = city;
      hotel.country = country;
      hotel.address = address;
      hotel.website = website || '';
      hotel.contactInfo = {
        phone: phone || '',
        email: email || '',
        fax: fax || ''
      };
      hotel.facilities = facilities ? facilities.split(',').map(facility => facility.trim()) : [];
      hotel.description = description || '';
      hotel.checkInTime = checkInTime || '14:00';
      hotel.checkOutTime = checkOutTime || '12:00';
      hotel.updatedAt = Date.now();

      // اگر تصویر جدید آپلود شده باشد
      if (req.file) {
        // حذف تصویر قبلی اگر وجود داشته باشد
        if (hotel.mainImage) {
          const oldImagePath = path.join(__dirname, '..', hotel.mainImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        hotel.mainImage = `/uploads/hotels/${req.file.filename}`;
      }

      await hotel.save();
      res.json(hotel);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'هتل یافت نشد' });
      }
      res.status(500).send('خطای سرور');
    }
  }
);

/**
 * @route   DELETE /api/hotels/:id
 * @desc    حذف هتل
 * @access  خصوصی (فقط ادمین)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: 'هتل یافت نشد' });
    }

    // حذف تصویر هتل اگر وجود داشته باشد
    if (hotel.mainImage) {
      const imagePath = path.join(__dirname, '..', hotel.mainImage);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('خطا در حذف فایل تصویر:', error);
        // ادامه عملیات حتی در صورت خطا در حذف تصویر
      }
    }

    await Hotel.deleteOne({ _id: req.params.id });
    res.json({ message: 'هتل با موفقیت حذف شد' });
  } catch (err) {
    console.error('خطا در حذف هتل:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'هتل یافت نشد' });
    }
    res.status(500).json({ message: 'خطا در حذف هتل. لطفا دوباره تلاش کنید.' });
  }
});

/**
 * @route   PATCH /api/hotels/:id/status
 * @desc    تغییر وضعیت فعال/غیرفعال هتل
 * @access  خصوصی (فقط ادمین)
 */
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: 'هتل یافت نشد' });
    }

    hotel.isActive = !hotel.isActive;
    await hotel.save();
    
    res.json({ id: hotel._id, isActive: hotel.isActive });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'هتل یافت نشد' });
    }
    res.status(500).send('خطای سرور');
  }
});

module.exports = router; 
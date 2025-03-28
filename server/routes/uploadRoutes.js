const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// تنظیمات آپلود فایل
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/packages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `package-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// فیلتر فایل‌های مجاز - بدون محدودیت سایز
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('فرمت فایل قابل قبول نیست. فقط JPEG، PNG، WEBP و GIF مجاز است.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  // بدون محدودیت سایز
});

/**
 * @route   POST /api/upload
 * @desc    آپلود تصویر
 * @access  خصوصی
 */
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'فایلی آپلود نشده است' });
    }

    // ارسال مسیر فایل آپلود شده
    res.json({
      success: true,
      path: `/uploads/packages/${req.file.filename}`,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ message: 'خطا در آپلود فایل', error: err.message });
  }
});

module.exports = router; 
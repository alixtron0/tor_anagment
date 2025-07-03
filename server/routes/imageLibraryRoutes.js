const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const ImageLibrary = require('../models/ImageLibrary');

// تنظیمات آپلود فایل
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/library');
    console.log('Image Library upload directory:', uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `image-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// فیلتر فایل‌های مجاز
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
  limits: { fileSize: 10 * 1024 * 1024 } // محدودیت 10 مگابایت
});

/**
 * @route   POST /api/image-library
 * @desc    آپلود تصویر به کتابخانه
 * @access  خصوصی
 */
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'فایلی آپلود نشده است' });
    }

    const { name, category, tags } = req.body;

    // ایجاد رکورد جدید در کتابخانه تصاویر
    const newImage = new ImageLibrary({
      name: name || req.file.originalname,
      path: `/uploads/library/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      category: category || 'general',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      createdBy: req.user.id
    });

    await newImage.save();

    res.json({
      success: true,
      image: newImage
    });
  } catch (err) {
    console.error('Error uploading image to library:', err);
    res.status(500).json({ message: 'خطا در آپلود تصویر', error: err.message });
  }
});

/**
 * @route   GET /api/image-library
 * @desc    دریافت لیست تصاویر کتابخانه
 * @access  خصوصی
 */
router.get('/', auth, async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    // اعمال فیلتر دسته‌بندی
    if (category && category !== 'all') {
      query.category = category;
    }

    // اعمال فیلتر جستجو
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const images = await ImageLibrary.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName');

    res.json(images);
  } catch (err) {
    console.error('Error fetching image library:', err);
    res.status(500).json({ message: 'خطا در دریافت لیست تصاویر', error: err.message });
  }
});

/**
 * @route   GET /api/image-library/:id
 * @desc    دریافت اطلاعات یک تصویر
 * @access  خصوصی
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const image = await ImageLibrary.findById(req.params.id)
      .populate('createdBy', 'fullName');
    
    if (!image) {
      return res.status(404).json({ message: 'تصویر مورد نظر یافت نشد' });
    }

    res.json(image);
  } catch (err) {
    console.error('Error fetching image details:', err);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات تصویر', error: err.message });
  }
});

/**
 * @route   DELETE /api/image-library/:id
 * @desc    حذف تصویر از کتابخانه
 * @access  خصوصی
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const image = await ImageLibrary.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'تصویر مورد نظر یافت نشد' });
    }

    // حذف فایل از سرور
    const filePath = path.join(__dirname, '../..', image.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // حذف رکورد از دیتابیس
    await image.remove();

    res.json({ message: 'تصویر با موفقیت حذف شد' });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ message: 'خطا در حذف تصویر', error: err.message });
  }
});

/**
 * @route   PUT /api/image-library/:id
 * @desc    ویرایش اطلاعات تصویر
 * @access  خصوصی
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, tags } = req.body;
    
    const image = await ImageLibrary.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'تصویر مورد نظر یافت نشد' });
    }

    // بروزرسانی اطلاعات
    if (name) image.name = name;
    if (category) image.category = category;
    if (tags) image.tags = tags.split(',').map(tag => tag.trim());

    await image.save();

    res.json({
      success: true,
      image
    });
  } catch (err) {
    console.error('Error updating image details:', err);
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات تصویر', error: err.message });
  }
});

module.exports = router; 
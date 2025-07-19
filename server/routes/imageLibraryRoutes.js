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
    // ذخیره در هر دو مسیر سرور و فرانت
    const serverUploadDir = path.join(__dirname, '../uploads/library');
    const frontUploadDir = path.join(__dirname, '../../uploads/library');
    
    console.log('Server Image Library upload directory:', serverUploadDir);
    console.log('Front Image Library upload directory:', frontUploadDir);
    
    // اطمینان از وجود هر دو مسیر
    if (!fs.existsSync(serverUploadDir)) {
      fs.mkdirSync(serverUploadDir, { recursive: true });
    }
    
    if (!fs.existsSync(frontUploadDir)) {
      fs.mkdirSync(frontUploadDir, { recursive: true });
    }
    
    // ابتدا در مسیر سرور ذخیره می‌کنیم
    cb(null, serverUploadDir);
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
    
    // کپی فایل به مسیر فرانت
    const serverFilePath = req.file.path;
    const frontFilePath = path.join(__dirname, '../../uploads/library', req.file.filename);
    
    // کپی فایل از مسیر سرور به مسیر فرانت
    try {
      fs.copyFileSync(serverFilePath, frontFilePath);
      console.log(`File copied from ${serverFilePath} to ${frontFilePath}`);
    } catch (copyError) {
      console.error('Error copying file to front path:', copyError);
      // ادامه می‌دهیم حتی اگر کپی با خطا مواجه شود
    }

    // ایجاد رکورد جدید در کتابخانه تصاویر
    const newImage = new ImageLibrary({
      name: name || req.file.originalname,
      path: `/uploads/library/${req.file.filename}`,
      serverPath: `/server/uploads/library/${req.file.filename}`, // مسیر سرور را نیز ذخیره می‌کنیم
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      category: category || 'general',
      tags: tags ? JSON.parse(tags) : [],
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
    const serverFilePath = path.join(__dirname, '..', image.path);
    const frontFilePath = path.join(__dirname, '../..', image.path);
    
    // حذف از مسیر سرور
    if (fs.existsSync(serverFilePath)) {
      fs.unlinkSync(serverFilePath);
      console.log(`Deleted file from server path: ${serverFilePath}`);
    }
    
    // حذف از مسیر فرانت
    if (fs.existsSync(frontFilePath)) {
      fs.unlinkSync(frontFilePath);
      console.log(`Deleted file from front path: ${frontFilePath}`);
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
    if (tags) image.tags = Array.isArray(tags) ? tags : JSON.parse(tags);

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
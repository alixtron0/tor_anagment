const express = require('express');
const router = express.Router();
const City = require('../models/City');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

/**
 * @route   GET /api/cities
 * @desc    دریافت همه شهرها
 * @access  عمومی
 */
router.get('/', async (req, res) => {
  try {
    const cities = await City.find({}).sort({ name: 1 });
    res.json(cities);
  } catch (err) {
    console.error('Error fetching cities:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/cities/:id
 * @desc    دریافت یک شهر با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    
    if (!city) {
      return res.status(404).json({ message: 'شهر یافت نشد' });
    }

    res.json(city);
  } catch (err) {
    console.error('Error fetching city:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'شهر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   POST /api/cities
 * @desc    ایجاد شهر جدید
 * @access  خصوصی (ادمین)
 */
router.post('/', [
  auth,
  [
    check('name', 'نام شهر الزامی است').not().isEmpty()
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

  const { name, description } = req.body;

  try {
    // بررسی تکراری بودن شهر
    const existingCity = await City.findOne({ name });
    if (existingCity) {
      return res.status(400).json({ message: 'این شهر قبلاً ثبت شده است' });
    }

    // ایجاد شهر جدید
    const newCity = new City({
      name,
      description,
      createdBy: req.user.id
    });

    const city = await newCity.save();

    res.json({
      message: 'شهر جدید با موفقیت ایجاد شد',
      city
    });
  } catch (err) {
    console.error('Error creating city:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   PUT /api/cities/:id
 * @desc    به‌روزرسانی شهر
 * @access  خصوصی (ادمین)
 */
router.put('/:id', [
  auth,
  [
    check('name', 'نام شهر الزامی است').not().isEmpty()
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

  const { name, description, isActive } = req.body;

  try {
    let city = await City.findById(req.params.id);
    
    if (!city) {
      return res.status(404).json({ message: 'شهر یافت نشد' });
    }

    // بررسی تکراری بودن نام جدید (اگر تغییر کرده باشد)
    if (name !== city.name) {
      const existingCity = await City.findOne({ name });
      if (existingCity && existingCity._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'این نام شهر قبلاً ثبت شده است' });
      }
    }

    // به‌روزرسانی فیلدهای شهر
    city.name = name;
    city.description = description !== undefined ? description : city.description;
    city.isActive = isActive !== undefined ? isActive : city.isActive;
    city.updatedAt = Date.now();

    const updatedCity = await city.save();

    res.json({
      message: 'شهر با موفقیت به‌روزرسانی شد',
      city: updatedCity
    });
  } catch (err) {
    console.error('Error updating city:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'شهر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   DELETE /api/cities/:id
 * @desc    حذف شهر
 * @access  خصوصی (ادمین)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // بررسی دسترسی کاربر
    if (!['admin+', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }

    const city = await City.findById(req.params.id);
    
    if (!city) {
      return res.status(404).json({ message: 'شهر یافت نشد' });
    }

    await City.findByIdAndDelete(req.params.id);

    res.json({ message: 'شهر با موفقیت حذف شد' });
  } catch (err) {
    console.error('Error deleting city:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'شهر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/cities/search/:term
 * @desc    جستجوی شهر بر اساس نام
 * @access  عمومی
 */
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const regex = new RegExp(searchTerm, 'i');

    const cities = await City.find({ name: regex }).sort({ name: 1 });

    res.json(cities);
  } catch (err) {
    console.error('Error searching cities:', err);
    res.status(500).send('خطا در سرور');
  }
});

module.exports = router; 
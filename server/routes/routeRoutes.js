const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

/**
 * @route   GET /api/routes
 * @desc    دریافت همه مسیرها
 * @access  عمومی
 */
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find({}).sort({ updatedAt: -1 });
    res.json(routes);
  } catch (err) {
    console.error('Error fetching routes:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/routes/:id
 * @desc    دریافت یک مسیر با شناسه
 * @access  عمومی
 */
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }

    res.json(route);
  } catch (err) {
    console.error('Error fetching route:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   POST /api/routes
 * @desc    ایجاد مسیر جدید
 * @access  خصوصی (ادمین)
 */
router.post('/', [
  auth,
  [
    check('origin', 'مبدا الزامی است').not().isEmpty(),
    check('destination', 'مقصد الزامی است').not().isEmpty()
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

  const { origin, destination, description } = req.body;

  try {
    // بررسی تکراری بودن مسیر
    const existingRoute = await Route.findOne({ origin, destination });
    if (existingRoute) {
      return res.status(400).json({ message: 'این مسیر قبلاً ثبت شده است' });
    }

    // ایجاد مسیر جدید
    const newRoute = new Route({
      origin,
      destination,
      description,
      createdBy: req.user.id
    });

    const route = await newRoute.save();

    res.json({
      message: 'مسیر جدید با موفقیت ایجاد شد',
      route
    });
  } catch (err) {
    console.error('Error creating route:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   PUT /api/routes/:id
 * @desc    به‌روزرسانی مسیر
 * @access  خصوصی (ادمین)
 */
router.put('/:id', [
  auth,
  [
    check('origin', 'مبدا الزامی است').not().isEmpty(),
    check('destination', 'مقصد الزامی است').not().isEmpty()
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

  const { origin, destination, description, isActive } = req.body;

  try {
    let route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }

    // بررسی تکراری بودن مسیر جدید (اگر تغییر کرده باشد)
    if (origin !== route.origin || destination !== route.destination) {
      const existingRoute = await Route.findOne({ origin, destination });
      if (existingRoute && existingRoute._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'این مسیر قبلاً ثبت شده است' });
      }
    }

    // به‌روزرسانی فیلدهای مسیر
    route.origin = origin;
    route.destination = destination;
    route.description = description !== undefined ? description : route.description;
    route.isActive = isActive !== undefined ? isActive : route.isActive;
    route.updatedAt = Date.now();

    const updatedRoute = await route.save();

    res.json({
      message: 'مسیر با موفقیت به‌روزرسانی شد',
      route: updatedRoute
    });
  } catch (err) {
    console.error('Error updating route:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   DELETE /api/routes/:id
 * @desc    حذف مسیر
 * @access  خصوصی (ادمین)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // بررسی دسترسی کاربر
    if (!['admin+', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }

    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }

    await Route.findByIdAndDelete(req.params.id);

    res.json({ message: 'مسیر با موفقیت حذف شد' });
  } catch (err) {
    console.error('Error deleting route:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/routes/search/:term
 * @desc    جستجوی مسیر بر اساس مبدا یا مقصد
 * @access  عمومی
 */
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const regex = new RegExp(searchTerm, 'i');

    const routes = await Route.find({
      $or: [
        { origin: regex },
        { destination: regex }
      ]
    }).sort({ updatedAt: -1 });

    res.json(routes);
  } catch (err) {
    console.error('Error searching routes:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   POST /api/routes/find-or-create
 * @desc    پیدا کردن مسیر یا ایجاد آن (اگر وجود نداشته باشد)
 * @access  خصوصی (همه کاربران)
 */
router.post('/find-or-create', [
  auth,
  [
    check('origin', 'مبدا الزامی است').not().isEmpty(),
    check('destination', 'مقصد الزامی است').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { origin, destination } = req.body;

  try {
    // بررسی وجود مسیر
    let route = await Route.findOne({ 
      origin, 
      destination,
      isActive: true 
    });

    // اگر مسیر یافت شد، آن را برگردان
    if (route) {
      return res.json(route);
    }

    // بررسی دسترسی برای ایجاد مسیر جدید
    if (!['admin', 'admin+', 'super-admin', 'agent'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'دسترسی غیر مجاز. شما اجازه ایجاد مسیر جدید را ندارید' 
      });
    }

    // ایجاد مسیر جدید
    const newRoute = new Route({
      origin,
      destination,
      description: `مسیر ${origin} به ${destination}`,
      createdBy: req.user.id
    });

    route = await newRoute.save();

    res.json(route);
  } catch (err) {
    console.error('Error in find or create route:', err);
    res.status(500).send('خطا در سرور');
  }
});

module.exports = router; 
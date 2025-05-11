const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const City = require('../models/City');
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
    check('origin', 'مبدا مسیر الزامی است').not().isEmpty(),
    check('destination', 'مقصد مسیر الزامی است').not().isEmpty()
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
    origin, 
    destination, 
    description, 
    originAirport, 
    destinationAirport,
    distance,
    flightTime
  } = req.body;

  if (origin === destination) {
    return res.status(400).json({ message: 'مبدا و مقصد نمی‌توانند یکسان باشند' });
  }

  try {
    // بررسی تکراری بودن مسیر
    const existingRoute = await Route.findOne({ origin, destination });
    if (existingRoute) {
      return res.status(400).json({ message: 'این مسیر قبلاً ثبت شده است' });
    }

    // جستجوی اطلاعات فرودگاه‌ها از مدل City اگر ارائه نشده باشند
    let originAirportInfo = originAirport || {};
    let destinationAirportInfo = destinationAirport || {};

    // اگر اطلاعات فرودگاه مبدا ارائه نشده باشد
    if (!originAirportInfo.name || !originAirportInfo.code) {
      const originCity = await City.findOne({ name: origin });
      if (originCity && originCity.airport && originCity.airport.name) {
        originAirportInfo = {
          name: originCity.airport.name,
          code: originCity.airport.code
        };
      }
    }

    // اگر اطلاعات فرودگاه مقصد ارائه نشده باشد
    if (!destinationAirportInfo.name || !destinationAirportInfo.code) {
      const destinationCity = await City.findOne({ name: destination });
      if (destinationCity && destinationCity.airport && destinationCity.airport.name) {
        destinationAirportInfo = {
          name: destinationCity.airport.name,
          code: destinationCity.airport.code
        };
      }
    }

    // ایجاد مسیر جدید
    const newRoute = new Route({
      origin,
      destination,
      description,
      originAirport: originAirportInfo,
      destinationAirport: destinationAirportInfo,
      distance: distance || 0,
      flightTime: flightTime || 0,
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
 * @desc    به‌روزرسانی یک مسیر
 * @access  خصوصی (ادمین)
 */
router.put('/:id', [
  auth,
  [
    check('origin', 'مبدا مسیر الزامی است').not().isEmpty(),
    check('destination', 'مقصد مسیر الزامی است').not().isEmpty()
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
    origin, 
    destination, 
    description, 
    isActive, 
    originAirport, 
    destinationAirport,
    distance,
    flightTime
  } = req.body;

  if (origin === destination) {
    return res.status(400).json({ message: 'مبدا و مقصد نمی‌توانند یکسان باشند' });
  }

  try {
    // بررسی وجود مسیر
    let route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }

    // بررسی تکراری بودن اگر مبدا یا مقصد تغییر کرده باشد
    if (origin !== route.origin || destination !== route.destination) {
      const existingRoute = await Route.findOne({ origin, destination });
      if (existingRoute && existingRoute._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'این مسیر قبلاً ثبت شده است' });
      }
    }

    // جستجوی اطلاعات فرودگاه‌ها از مدل City اگر مبدا یا مقصد تغییر کرده باشد
    let originAirportInfo = originAirport || route.originAirport || {};
    let destinationAirportInfo = destinationAirport || route.destinationAirport || {};

    // اگر مبدا تغییر کرده و اطلاعات فرودگاه ارائه نشده
    if (origin !== route.origin && (!originAirport || !originAirport.name)) {
      const originCity = await City.findOne({ name: origin });
      if (originCity && originCity.airport && originCity.airport.name) {
        originAirportInfo = {
          name: originCity.airport.name,
          code: originCity.airport.code
        };
      }
    }

    // اگر مقصد تغییر کرده و اطلاعات فرودگاه ارائه نشده
    if (destination !== route.destination && (!destinationAirport || !destinationAirport.name)) {
      const destinationCity = await City.findOne({ name: destination });
      if (destinationCity && destinationCity.airport && destinationCity.airport.name) {
        destinationAirportInfo = {
          name: destinationCity.airport.name,
          code: destinationCity.airport.code
        };
      }
    }

    // به‌روزرسانی مسیر
    route.origin = origin;
    route.destination = destination;
    route.description = description;
    if (isActive !== undefined) route.isActive = isActive;
    
    // به‌روزرسانی اطلاعات فرودگاه‌ها
    route.originAirport = originAirportInfo;
    route.destinationAirport = destinationAirportInfo;
    
    // به‌روزرسانی اطلاعات اضافی
    if (distance !== undefined) route.distance = distance;
    if (flightTime !== undefined) route.flightTime = flightTime;
    
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
 * @route   GET /api/routes/airports/info/:origin/:destination
 * @desc    دریافت اطلاعات فرودگاه‌های مبدا و مقصد
 * @access  عمومی
 */
router.get('/airports/info/:origin/:destination', async (req, res) => {
  try {
    const { origin, destination } = req.params;
    
    // ابتدا جستجو در مدل Route
    const route = await Route.findOne({ 
      origin, 
      destination,
      isActive: true
    });
    
    if (route && route.originAirport && route.originAirport.name && 
        route.destinationAirport && route.destinationAirport.name) {
      // اگر اطلاعات در مسیر وجود داشت، آن را برگردان
      return res.json({
        originAirport: route.originAirport,
        destinationAirport: route.destinationAirport
      });
    }
    
    // اگر اطلاعات در مسیر نبود، جستجو در مدل City
    const [originCity, destinationCity] = await Promise.all([
      City.findOne({ name: origin, isActive: true }),
      City.findOne({ name: destination, isActive: true })
    ]);
    
    const response = {
      originAirport: {
        name: originCity && originCity.airport ? originCity.airport.name : '',
        code: originCity && originCity.airport ? originCity.airport.code : ''
      },
      destinationAirport: {
        name: destinationCity && destinationCity.airport ? destinationCity.airport.name : '',
        code: destinationCity && destinationCity.airport ? destinationCity.airport.code : ''
      }
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching airport info:', err);
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

    // جستجوی اطلاعات فرودگاه‌ها از مدل City
    const [originCity, destinationCity] = await Promise.all([
      City.findOne({ name: origin, isActive: true }),
      City.findOne({ name: destination, isActive: true })
    ]);

    // ایجاد مسیر جدید
    const newRoute = new Route({
      origin,
      destination,
      description: `مسیر ${origin} به ${destination}`,
      originAirport: originCity && originCity.airport ? {
        name: originCity.airport.name,
        code: originCity.airport.code
      } : {},
      destinationAirport: destinationCity && destinationCity.airport ? {
        name: destinationCity.airport.name,
        code: destinationCity.airport.code
      } : {},
      createdBy: req.user.id
    });

    route = await newRoute.save();

    res.json(route);
  } catch (err) {
    console.error('Error in find or create route:', err);
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   GET /api/routes/ticket-airports/:routeId
 * @desc    دریافت اطلاعات فرودگاه‌ها برای بلیط
 * @access  عمومی
 */
router.get('/ticket-airports/:routeId', async (req, res) => {
  try {
    const routeId = req.params.routeId;
    
    // یافتن مسیر با شناسه
    const route = await Route.findById(routeId);
    
    if (!route) {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }
    
    // ساخت پاسخ با فیلدهای مورد نیاز برای استفاده در PDF بلیط
    const response = {
      fromair: route.originAirport && route.originAirport.name 
              ? route.originAirport.name 
              : '',
      toair: route.destinationAirport && route.destinationAirport.name 
              ? route.destinationAirport.name 
              : '',
      fromAirportCode: route.originAirport && route.originAirport.code 
              ? route.originAirport.code 
              : '',
      toAirportCode: route.destinationAirport && route.destinationAirport.code 
              ? route.destinationAirport.code 
              : '',
      origin: route.origin,
      destination: route.destination
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching ticket airport info:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'مسیر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

/**
 * @route   POST /api/routes/update-airports
 * @desc    به‌روزرسانی اطلاعات فرودگاه‌ها برای همه مسیرها
 * @access  خصوصی (ادمین+)
 */
router.post('/update-airports', auth, async (req, res) => {
  try {
    // بررسی دسترسی کاربر
    if (!['admin+', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }
    
    // دریافت همه شهرها با اطلاعات فرودگاه
    const cities = await City.find({ isActive: true }).select('name airport');
    
    // ایجاد یک نقشه از نام شهر به اطلاعات فرودگاه
    const cityAirportMap = {};
    cities.forEach(city => {
      if (city.airport && city.airport.name) {
        cityAirportMap[city.name] = {
          name: city.airport.name,
          code: city.airport.code || ''
        };
      }
    });
    
    // دریافت همه مسیرها
    const routes = await Route.find({});
    let updatedCount = 0;
    
    // به‌روزرسانی هر مسیر
    for (const route of routes) {
      let updated = false;
      
      // به‌روزرسانی اطلاعات فرودگاه مبدا
      if (cityAirportMap[route.origin] && 
          (!route.originAirport || !route.originAirport.name)) {
        route.originAirport = cityAirportMap[route.origin];
        updated = true;
      }
      
      // به‌روزرسانی اطلاعات فرودگاه مقصد
      if (cityAirportMap[route.destination] && 
          (!route.destinationAirport || !route.destinationAirport.name)) {
        route.destinationAirport = cityAirportMap[route.destination];
        updated = true;
      }
      
      // ذخیره تغییرات
      if (updated) {
        await route.save();
        updatedCount++;
      }
    }
    
    res.json({ 
      message: `اطلاعات فرودگاه‌ها با موفقیت به‌روزرسانی شد. ${updatedCount} مسیر به‌روزرسانی شد.`,
      updatedCount
    });
  } catch (err) {
    console.error('Error updating airports info:', err);
    res.status(500).send('خطا در سرور');
  }
});

module.exports = router; 
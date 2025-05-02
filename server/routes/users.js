const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// @route   POST /api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', [
  check('fullName', 'نام و نام خانوادگی الزامی است').not().isEmpty(),
  check('phoneNumber', 'شماره موبایل باید در قالب صحیح وارد شود').matches(/^09\d{9}$/),
  check('password', 'رمز عبور باید حداقل 6 کاراکتر باشد').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, phoneNumber, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ phoneNumber });
    if (user) {
      return res.status(400).json({ message: 'این شماره موبایل قبلاً ثبت شده است' });
    }

    user = new User({
      fullName,
      phoneNumber,
      password, // رمز عبور به صورت متن ساده ذخیره می‌شود
      role: 'user'
    });

    await user.save();

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, fullName: user.fullName, phone: user.phoneNumber, role: user.role } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور');
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  check('phoneNumber', 'شماره موبایل باید در قالب صحیح وارد شود').matches(/^09\d{9}$/),
  check('password', 'رمز عبور الزامی است').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phoneNumber, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'اطلاعات وارد شده صحیح نیست' });
    }

    // برای دیباگ کردن
    console.log('Login attempt:', {
      phoneNumber, 
      passwordInput: password,
      passwordInDb: user.password
    });

    // Check password - مقایسه مستقیم رمز عبور
    if (password !== user.password) {
      return res.status(400).json({ message: 'اطلاعات وارد شده صحیح نیست' });
    }

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // استفاده از کلید JWT ثابت
    const JWT_SECRET = process.env.JWT_SECRET || 'travel_manager_super_secret_key_123456';

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, fullName: user.fullName, phone: user.phoneNumber, role: user.role } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور');
  }
});

// @route   GET /api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور');
  }
});

// @route   GET /api/users/admins
// @desc    Get all admins
// @access  Private (Super Admin only)
router.get('/admins', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }

    // Get all admins including super admin
    const admins = await User.find({ 
      role: { $in: ['admin', 'admin+', 'super-admin'] } 
    });

    // برای نمایش اطلاعات با فرمت مناسب فرانت‌اند
    const formattedAdmins = [];
    for (const admin of admins) {
      const adminData = {
        _id: admin._id,
        fullName: admin.fullName,
        phone: admin.phoneNumber || admin.phone,
        role: admin.role,
        password: admin.password, // رمز عبور واقعی نمایش داده می‌شود
        createdAt: admin.createdAt
      };
      
      formattedAdmins.push(adminData);
    }

    res.json(formattedAdmins);
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).send('خطا در سرور');
  }
});

// @route   POST /api/users/create-admin
// @desc    Create a new admin
// @access  Private (Super Admin only)
router.post('/create-admin', [
  auth,
  [
    check('fullName', 'نام و نام خانوادگی الزامی است').not().isEmpty(),
    check('phoneNumber', 'شماره موبایل باید در قالب صحیح وارد شود').matches(/^09\d{9}$/),
    check('password', 'رمز عبور باید حداقل 6 کاراکتر باشد').isLength({ min: 6 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if user is super admin
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ message: 'دسترسی غیر مجاز' });
  }

  const { fullName, phoneNumber, password, role } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ phoneNumber });
    if (user) {
      return res.status(400).json({ message: 'این شماره موبایل قبلاً ثبت شده است' });
    }

    // Ensure the role is valid (admin or admin+)
    const safeRole = ['admin', 'admin+'].includes(role) ? role : 'admin';

    user = new User({
      fullName,
      phoneNumber,
      password, // رمز عبور به صورت متن ساده ذخیره می‌شود
      role: safeRole
    });

    await user.save();

    res.json({ 
      message: 'ادمین جدید با موفقیت ایجاد شد',
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        phone: user.phoneNumber,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور');
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (Super Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }

    // Find the user to delete
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Prevent deleting super-admin
    if (user.role === 'super-admin') {
      return res.status(403).json({ message: 'حذف سوپر ادمین امکان‌پذیر نیست' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'کاربر با موفقیت حذف شد' });
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private (Super Admin only)
router.put('/:id', [
  auth,
  [
    check('fullName', 'نام و نام خانوادگی الزامی است').not().isEmpty(),
    check('phoneNumber', 'شماره موبایل باید در قالب صحیح وارد شود').matches(/^09\d{9}$/)
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if user is super admin
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ message: 'دسترسی غیر مجاز' });
  }

  const { fullName, phoneNumber, password, role } = req.body;

  try {
    // Find the user to update
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Prevent super-admin role change
    if (user.role === 'super-admin' && role !== 'super-admin') {
      return res.status(403).json({ message: 'تغییر نقش سوپر ادمین امکان‌پذیر نیست' });
    }

    // Check if the new phone number is already in use by another user
    if (phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'این شماره موبایل قبلاً ثبت شده است' });
      }
    }

    // Update user fields
    user.fullName = fullName;
    user.phoneNumber = phoneNumber;
    if (role) user.role = role;

    // Only update password if provided
    if (password) {
      user.password = password; // رمز عبور به صورت متن ساده ذخیره می‌شود
    }

    await user.save();

    res.json({ 
      message: 'کاربر با موفقیت به‌روزرسانی شد',
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        phoneNumber: user.phoneNumber,
        role: user.role 
      }
    });
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    res.status(500).send('خطا در سرور');
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Super Admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'دسترسی غیر مجاز' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    // Check if error is due to invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    res.status(500).send('خطا در سرور');
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // بررسی وجود هر دو فیلد
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'لطفاً رمز عبور فعلی و رمز عبور جدید را وارد کنید' 
      });
    }
    
    // بررسی طول رمز عبور جدید
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'رمز عبور جدید باید حداقل 6 کاراکتر باشد' 
      });
    }
    
    // یافتن کاربر
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    // بررسی رمز عبور فعلی
    if (currentPassword !== user.password) {
      return res.status(400).json({ message: 'رمز عبور فعلی اشتباه است' });
    }
    
    // بروزرسانی رمز عبور
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'رمز عبور با موفقیت تغییر یافت' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'خطا در سرور', error: err.message });
  }
});

module.exports = router; 
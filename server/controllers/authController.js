const User = require('../models/User');
const jwt = require('jsonwebtoken');

// تعریف یک کلید JWT پیش‌فرض اگر در متغیرهای محیطی تنظیم نشده باشد
const JWT_SECRET = process.env.JWT_SECRET || 'travel_manager_super_secret_key_123456';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '5 days';

// ایجاد توکن JWT
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY
  });
};

// ورود کاربر
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    // بررسی وجود هر دو فیلد
    if (!phoneNumber || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'لطفاً شماره تلفن و رمز عبور را وارد کنید'
      });
    }
    
    // یافتن کاربر با شماره تلفن
    const user = await User.findOne({ phoneNumber });
    
    // برای تست مشکل، اطلاعات خطا را چاپ می‌کنیم
    console.log('Login attempt:', { phoneNumber, userFound: !!user });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'شماره تلفن یا رمز عبور اشتباه است'
      });
    }
    
    // مقایسه مستقیم رمز عبور
    console.log('Passwords:', { inputPassword: password, userPassword: user.password });
    const isPasswordValid = (password === user.password);
    console.log('Password check result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'شماره تلفن یا رمز عبور اشتباه است'
      });
    }
    
    // اگر کاربر غیرفعال باشد
    if (user.isActive === false) {  // فقط اگر صراحتاً false باشد
      return res.status(401).json({
        status: 'error',
        message: 'حساب کاربری شما غیرفعال شده است. با پشتیبانی تماس بگیرید'
      });
    }
    
    // بروزرسانی زمان آخرین ورود
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // ارسال پاسخ با توکن و اطلاعات کاربر
    const token = generateToken(user._id);
    
    // ایجاد یک کپی از کاربر بدون رمز عبور
    const userObj = user.toObject();
    delete userObj.password;
    
    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'خطایی در سرور رخ داده است',
      error: error.message
    });
  }
};

// ایجاد سوپر ادمین
exports.createSuperAdmin = async (req, res) => {
  try {
    const { fullName, phoneNumber, password } = req.body;
    
    // بررسی وجود کاربر با نقش سوپر ادمین
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({
        status: 'error',
        message: 'یک سوپر ادمین قبلاً ایجاد شده است'
      });
    }
    
    // ایجاد کاربر سوپر ادمین جدید
    const superAdmin = await User.create({
      fullName,
      phoneNumber,
      password, // رمز بدون هش ذخیره می‌شود
      role: 'super-admin'
    });
    
    // ایجاد یک کپی از کاربر بدون رمز عبور
    const userObj = superAdmin.toObject();
    delete userObj.password;
    
    res.status(201).json({
      status: 'success',
      message: 'سوپر ادمین با موفقیت ایجاد شد',
      data: {
        user: userObj
      }
    });
  } catch (error) {
    console.error('Create super admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'خطایی در سرور رخ داده است',
      error: error.message
    });
  }
}; 
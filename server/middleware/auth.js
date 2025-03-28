const jwt = require('jsonwebtoken');
const User = require('../models/User');

// فراهم کردن کلید JWT پیش‌فرض اگر در متغیرهای محیطی تنظیم نشده باشد
const JWT_SECRET = process.env.JWT_SECRET || 'travel_manager_super_secret_key_123456';

// میدلور بررسی احراز هویت کاربر
exports.protect = async (req, res, next) => {
  try {
    let protectToken;
    
    // بررسی وجود توکن در هدر
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      protectToken = req.headers.authorization.split(' ')[1];
    }
    
    if (!protectToken) {
      return res.status(401).json({
        status: 'error',
        message: 'شما وارد سیستم نشده‌اید. لطفاً ابتدا وارد شوید'
      });
    }
    
    // تأیید توکن
    const decoded = jwt.verify(protectToken, JWT_SECRET);
    
    // بررسی وجود کاربر
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'کاربر متعلق به این توکن دیگر وجود ندارد'
      });
    }
    
    // بررسی فعال بودن کاربر
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'حساب کاربری شما غیرفعال شده است. با پشتیبانی تماس بگیرید'
      });
    }
    
    // ذخیره کاربر در درخواست برای استفاده در روت‌ها
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'احراز هویت ناموفق',
      error: error.message
    });
  }
};

// میدلور بررسی دسترسی براساس نقش
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'شما اجازه دسترسی به این بخش را ندارید'
      });
    }
    next();
  };
};

// اصلی middleware احراز هویت
module.exports = async function(req, res, next) {
  // Get token from header
  const authToken = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!authToken) {
    return res.status(401).json({ message: 'توکن احراز هویت وجود ندارد، دسترسی رد شد' });
  }

  // Verify token
  try {
    // از کلید JWT پیش‌فرض استفاده می‌کنیم
    const decoded = jwt.verify(authToken, JWT_SECRET);
    
    console.log('Decoded token:', decoded);
    
    // فرمت توکن در authController به صورت { id } است
    if (decoded.id) {
      // دریافت اطلاعات کاربر از پایگاه داده
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'کاربر متعلق به این توکن وجود ندارد' });
      }
      
      console.log('User from DB:', user);
      
      // ذخیره اطلاعات کاربر در req.user
      req.user = user;
      next();
    } else if (decoded.user) {
      // استفاده از فرمت قدیمی در صورت وجود
      req.user = decoded.user;
      next();
    } else {
      return res.status(401).json({ message: 'فرمت توکن نامعتبر است' });
    }
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'توکن نامعتبر است' });
  }
}; 
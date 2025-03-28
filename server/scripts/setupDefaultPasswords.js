/**
 * اسکریپت تنظیم رمزهای پیش‌فرض برای ادمین‌های موجود
 * این اسکریپت در زمان راه‌اندازی سرور اجرا می‌شود
 */

const User = require('../models/User');

// رمزهای پیش‌فرض برای ادمین‌های موجود
const defaultPasswords = {
  'admin': 'admin123456',
  'admin+': 'adminplus123456',
  'super-admin': 'superadmin123456'
};

// تنظیم رمزهای پیش‌فرض برای ادمین‌های موجود
const setupDefaultPasswords = async () => {
  try {
    console.log('تنظیم رمزهای پیش‌فرض برای ادمین‌های موجود...');
    
    // دریافت تمام ادمین‌ها
    const admins = await User.find({ 
      role: { $in: ['admin', 'admin+', 'super-admin'] } 
    });
    
    // تنظیم رمز پیش‌فرض برای هر ادمین
    for (const admin of admins) {
      const defaultPassword = defaultPasswords[admin.role] || 'password123456';
      
      // به‌روزرسانی کاربر با رمز عبور پیش‌فرض
      await User.findByIdAndUpdate(admin._id, {
        $set: {
          password: defaultPassword
        }
      });
      
      console.log(`رمز پیش‌فرض برای ادمین ${admin.fullName} تنظیم شد.`);
    }
    
    console.log('تنظیم رمزهای پیش‌فرض با موفقیت انجام شد.');
  } catch (error) {
    console.error('خطا در تنظیم رمزهای پیش‌فرض:', error);
  }
};

module.exports = setupDefaultPasswords; 
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
  try {
    // اتصال به پایگاه داده
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Connected...');
    
    // لیست کردن همه کاربران
    const users = await User.find({}).lean();
    
    console.log('تعداد کاربران یافت شده:', users.length);
    
    // نمایش اطلاعات هر کاربر
    users.forEach((user, index) => {
      console.log(`کاربر ${index + 1}:`);
      console.log('- همه فیلدها:', Object.keys(user));
      console.log('- همه اطلاعات:', JSON.stringify(user, null, 2));
      console.log('-------------------------');
    });
    
    // بستن اتصال پایگاه داده
    await mongoose.connection.close();
    console.log('اتصال به پایگاه داده بسته شد.');
    
  } catch (error) {
    console.error('خطا:', error);
  }
}

// اجرای تابع
checkUsers(); 
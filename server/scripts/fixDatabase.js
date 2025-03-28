/**
 * این اسکریپت برای اصلاح مشکل تکراری بودن شاخص phone در پایگاه داده استفاده می‌شود
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// بارگذاری متغیرهای محیطی از فایل .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// اتصال به پایگاه داده
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to Database...');
  
  try {
    // حذف شاخص phone از کالکشن users
    await mongoose.connection.db.collection('users').dropIndex('phone_1');
    console.log('Successfully dropped phone index');
  } catch (err) {
    console.error('Error dropping index:', err.message);
  }
  
  // بستن اتصال به پایگاه داده
  await mongoose.disconnect();
  console.log('Database connection closed');
})
.catch(err => {
  console.error('Error connecting to Database:', err.message);
  process.exit(1);
}); 
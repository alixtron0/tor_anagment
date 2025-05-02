import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// تنظیم هدرهای احراز هویت
const setAuthToken = (token: string) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

// دریافت آمار پکیج‌ها
export const getPackageStats = async () => {
  try {
    // بررسی وجود توکن در localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('توکن احراز هویت یافت نشد');
    }
    
    // تنظیم توکن برای درخواست
    setAuthToken(token);
    
    // ارسال درخواست به API
    const response = await axios.get(`${API_URL}/packages/stats/summary`);
    return response.data;
  } catch (error) {
    console.error('خطا در دریافت آمار پکیج‌ها:', error);
    throw error;
  }
};

// دریافت همه پکیج‌ها
export const getAllPackages = async () => {
  try {
    // بررسی وجود توکن در localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('توکن احراز هویت یافت نشد');
    }
    
    // تنظیم توکن برای درخواست
    setAuthToken(token);
    
    // ارسال درخواست به API
    const response = await axios.get(`${API_URL}/packages`);
    return response.data;
  } catch (error) {
    console.error('خطا در دریافت پکیج‌ها:', error);
    throw error;
  }
}; 
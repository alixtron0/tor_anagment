// تنظیمات API برای ارتباط با بک‌اند

// تابع برای تشخیص هوشمند آدرس سرور
export const getApiBaseUrl = () => {
  // اگر متغیر محیطی تنظیم شده باشد، از آن استفاده می‌کنیم
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // در محیط مرورگر، از همان دامنه‌ای که فرانت‌اند روی آن اجرا می‌شود استفاده می‌کنیم
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // اگر در حال اجرا روی 185.94.99.35 هستیم، از پورت 5000 استفاده می‌کنیم
    if (hostname === '185.94.99.35' || hostname === '127.0.0.1') {
      return 'http://185.94.99.35:5000/api';
    }
    // در غیر این صورت، از همان دامنه با پورت 5000 استفاده می‌کنیم
    return `${protocol}//${hostname}:5000/api`;
  }

  // در محیط سرور (SSR)، از 185.94.99.35 استفاده می‌کنیم
  return 'http://185.94.99.35:5000/api';
};

// آدرس پایه API
export const API_BASE_URL = getApiBaseUrl();

// تنظیم هدرهای احراز هویت
export const getAuthHeader = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token ? { 'x-auth-token': token } : {};
  }
  return {};
};

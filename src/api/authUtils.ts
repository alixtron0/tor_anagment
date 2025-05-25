/**
 * تابع کمکی برای دریافت هدرهای احراز هویت
 * این تابع توکن را از localStorage دریافت کرده و هدرهای مناسب برای ارسال به API را برمی‌گرداند
 */
export const getAuthHeader = () => {
  // دریافت توکن از localStorage
  const token = localStorage.getItem('token');
  
  // اگر توکن وجود داشت، هدر Authorization را برمی‌گرداند
  if (token) {
    return {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      'Authorization': `Bearer ${token}`
    };
  }
  
  // اگر توکن وجود نداشت، فقط هدر Content-Type را برمی‌گرداند
  return {
    'Content-Type': 'application/json'
  };
}; 
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// دریافت آدرس API از متغیرهای محیطی یا استفاده از مقدار پیش‌فرض
const API_URL = process.env.API_URL || 'http://185.94.99.35:5000';

/**
 * GET /api/passengers
 * دریافت تمام مسافران با جزئیات کامل
 */
export async function GET(req: NextRequest) {
  try {
    // گرفتن پارامترها از URL
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // ساخت URL برای درخواست به API بک‌اند
    const backendUrl = `${API_URL}/api/passengers/all?page=${page}&pageSize=${pageSize}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    // ارسال درخواست به سرور بک‌اند
    const response = await axios.get(backendUrl);
    
    // برگرداندن پاسخ به کلاینت
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching passengers:', error.message);
    
    // پاسخ خطا به کلاینت
    return NextResponse.json(
      { message: error.response?.data?.message || 'خطا در دریافت اطلاعات مسافران' },
      { status: error.response?.status || 500 }
    );
  }
} 
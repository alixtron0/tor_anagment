import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body
    
    // دریافت توکن از هدر
    const token = request.headers.get('x-auth-token')
    
    if (!token) {
      return NextResponse.json(
        { message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      )
    }
    
    // ارسال درخواست به سرور اصلی
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/change-password`,
      { currentPassword, newPassword },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      }
    )
    
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error changing password:', error)
    
    return NextResponse.json(
      { 
        message: error.response?.data?.message || 'خطا در تغییر رمز عبور',
        error: error.message 
      },
      { status: error.response?.status || 500 }
    )
  }
} 
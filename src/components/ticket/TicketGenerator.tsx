'use client'
import React, { useRef, useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import moment from 'jalali-moment'
import axios from 'axios'
import { FaPlane, FaCalendarAlt, FaUser, FaIdCard, FaTicketAlt, FaMapMarkerAlt, FaHotel } from 'react-icons/fa'

interface Passenger {
  _id: string
  firstName: string
  lastName: string
  nationalId: string
  birthDate: string
  gender: 'male' | 'female'
  passportNumber?: string
  nationality?: string
  contact?: {
    phone: string
    email: string
  }
}

interface PackageData {
  _id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  route: any
  capacity: number
  airline?: string
  hotel?: string | { name: string }
  price: number
}

interface ReservationData {
  _id: string
  type: 'self' | 'admin'
  count: number
  status: 'pending' | 'confirmed' | 'canceled'
  totalPrice: number
  code?: string
  createdAt: string
  package: PackageData
  passengers?: Passenger[]
}

interface TicketGeneratorProps {
  reservation: ReservationData
  passengers: Passenger[]
  onGenerateTicket: (passengerId: string) => void
}

// Add type declaration
declare module 'qrcode'

const TicketGenerator: React.FC<TicketGeneratorProps> = ({ reservation, passengers, onGenerateTicket }) => {
  const ticketContainerRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [completePackageData, setCompletePackageData] = useState<any>(null)
  const [isLoadingPackage, setIsLoadingPackage] = useState(false)
  const [hotelData, setHotelData] = useState<any>(null);
  const [isLoadingHotel, setIsLoadingHotel] = useState(false);

  // فراخوانی API برای دریافت اطلاعات کامل پکیج
  useEffect(() => {
    const fetchCompletePackageData = async () => {
      if (!reservation?.package?._id) return;
      
      try {
        setIsLoadingPackage(true);
        const token = localStorage.getItem('token');
        console.log("Fetching complete package data for ID:", reservation.package._id);
        
        const response = await axios.get(`http://185.94.99.35:5000/api/packages/${reservation.package._id}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        console.log("Complete package data received:", response.data);
        setCompletePackageData(response.data);
      } catch (error) {
        console.error('Error fetching complete package data:', error);
      } finally {
        setIsLoadingPackage(false);
      }
    };
    
    fetchCompletePackageData();
  }, [reservation]);

  // فراخوانی API برای دریافت اطلاعات کامل هتل
  useEffect(() => {
    const fetchHotelData = async () => {
      // اگر داده‌های کامل پکیج دریافت شد اما هنوز هتل مشخص نیست
      if (completePackageData) {
        // امکان داشتن هتل به صورت رشته (ID) یا آرایه‌ای از هتل‌ها
        let hotelId = null;
        
        // بررسی حالت‌های مختلف ذخیره‌سازی هتل
        if (typeof completePackageData.hotel === 'string') {
          hotelId = completePackageData.hotel;
          console.log("Found hotel ID from package.hotel:", hotelId);
        } else if (completePackageData.hotels && completePackageData.hotels.length > 0) {
          // اگر آرایه hotels داریم، اولین هتل را بررسی می‌کنیم
          const firstHotel = completePackageData.hotels[0];
          if (typeof firstHotel === 'string') {
            hotelId = firstHotel;
            console.log("Found hotel ID from package.hotels[0] (string):", hotelId);
          } else if (firstHotel && firstHotel._id) {
            hotelId = firstHotel._id;
            console.log("Found hotel ID from package.hotels[0]._id:", hotelId);
          }
        }
        
        // خروجی صریح برای دیباگ
        console.log("Hotel ID to fetch:", hotelId);
        
        if (hotelId) {
          try {
            setIsLoadingHotel(true);
            console.log("Starting hotel fetch for ID:", hotelId);
            
            const token = localStorage.getItem('token');
            if (!token) {
              console.error('No token found for API request');
              setIsLoadingHotel(false);
              return;
            }

            // اضافه کردن درخواست مستقیم به API
            try {
              // استفاده از API هتل با ID مشخص
              const response = await axios.get(`http://185.94.99.35:5000/api/hotels/${hotelId}`, {
                headers: {
                  'x-auth-token': token
                },
                timeout: 10000 // افزایش timeout
              });
              
              console.log("★★★ Hotel data SUCCESSFULLY received:", response.data);
              
              if (response.data && response.data.name) {
                console.log("Hotel name found:", response.data.name);
                setHotelData({
                  _id: hotelId,
                  name: response.data.name,
                  city: response.data.city || "",
                  // سایر داده‌های هتل
                });
              } else {
                console.error("Hotel data received but no name property found:", response.data);
              }
            } catch (error: any) {
              console.error("★★★ Hotel fetch FAILED:", error.message || "Unknown error");
              
              // تلاش مجدد با مسیر API جایگزین
              try {
                console.log("Trying alternative API endpoint...");
                const altResponse = await axios.get(`http://185.94.99.35:5000/api/hotels`, {
                  headers: {
                    'x-auth-token': token
                  }
                });
                
                // جستجوی هتل مورد نظر در لیست همه هتل‌ها
                const foundHotel = altResponse.data.find((h: any) => h._id === hotelId);
                
                if (foundHotel) {
                  console.log("★★★ Hotel found in full list:", foundHotel);
                  setHotelData(foundHotel);
                } else {
                  console.error("Hotel not found in full list");
                }
              } catch (altError) {
                console.error("Alternative API fetch also failed");
              }
            }
          } finally {
            setIsLoadingHotel(false);
          }
        } else {
          console.log("No valid hotel ID found to fetch");
        }
      }
    };
    
    fetchHotelData();
  }, [completePackageData]);

  const formatDate = (dateString: string) => {
    try {
      return moment(dateString, 'YYYY/MM/DD').locale('fa').format('jYYYY/jMM/jDD')
    } catch (error) {
      return dateString
    }
  }

  const getRouteName = (route: any) => {
    // ابتدا از داده‌های کامل استفاده کنید اگر در دسترس باشد
    const routeData = completePackageData?.route || route;
    
    console.log('Route data detailed:', JSON.stringify(routeData));
    if (!routeData) return 'نامشخص';
    if (typeof routeData === 'string') return routeData;
    
    // روش ساده‌تر مشابه page.tsx
    if (routeData.origin && routeData.destination) {
      return `${routeData.origin} به ${routeData.destination}`;
    }
    
    if (routeData.name) return routeData.name;
    
    // بررسی دسترسی به _id
    if (routeData._id) {
      if (typeof routeData._id === 'string') return `مسیر: ${routeData._id}`;
      if (routeData._id.toString) return `مسیر: ${routeData._id.toString()}`;
    }
    
    // تلاش برای دسترسی به فیلدهای دیگر
    const possibleFields = ['from', 'to', 'start', 'end', 'title', 'description'];
    for (const field of possibleFields) {
      if (routeData[field]) return `${field}: ${routeData[field]}`;
    }
    
    return 'نامشخص';
  }

  const getHotelName = (hotel: any) => {
    // ابتدا ثبت اطلاعات هتل برای دیباگ
    console.log("getHotelName called with:", JSON.stringify(hotel).substring(0, 100));
    console.log("Current hotelData state:", JSON.stringify(hotelData).substring(0, 100));
    
    // ابتدا بررسی می‌کنیم آیا داده‌های هتل را جداگانه دریافت کرده‌ایم
    if (hotelData) {
      console.log('Using fetched hotel data:', JSON.stringify(hotelData));
      if (hotelData.name) {
        console.log("★★★ Returning actual hotel name:", hotelData.name);
        return hotelData.name;
      }
      if (hotelData.title) return hotelData.title;
      return 'هتل';
    }
    
    // اگر هتل یک آبجکت باشد با پراپرتی name
    if (hotel && typeof hotel === 'object' && hotel.name) {
      console.log("★★★ Hotel has name property:", hotel.name);
      return hotel.name;
    }

    // اگر هتل یک رشته است (ID)، نمایش بهتر
    if (hotel && typeof hotel === 'string') {
      // هنگام بارگذاری
      if (isLoadingHotel) {
        console.log("Hotel is loading, showing loading message");
        return 'در حال بارگذاری اطلاعات هتل...';
      }
      
      const hotelString = `${hotel}`;
      // برش ID برای نمایش بهتر
      console.log("Hotel is string (ID):", hotelString);
      return `هتل با شناسه: ${hotelString.substring(0, 8)}...`;
    }
    
    // ابتدا از داده‌های کامل استفاده کنید اگر در دسترس باشد
    // بررسی آرایه hotels در داده‌های پکیج
    if (completePackageData?.hotels && completePackageData.hotels.length > 0) {
      console.log('Found hotels array:', JSON.stringify(completePackageData.hotels).substring(0, 100));
      
      // استفاده از اولین هتل در آرایه
      const firstHotel = completePackageData.hotels[0];
      
      // اگر آبجکت کامل هتل دریافت شده باشد
      if (typeof firstHotel === 'object' && firstHotel !== null) {
        if (firstHotel.name) {
          console.log("★★★ Using name from hotels array:", firstHotel.name);
          return firstHotel.name;
        }
        if (firstHotel.title) return firstHotel.title;
      }
      
      // اگر فقط ID هتل ذخیره شده باشد
      if (typeof firstHotel === 'string') {
        // اگر در حال بارگذاری هستیم
        if (isLoadingHotel) return 'در حال بارگذاری اطلاعات هتل...';
        return `هتل: ${firstHotel.substring(0, 8)}...`;
      }
    }
    
    return 'نامشخص';
  }

  // افزودن تابع جدید برای دریافت اطلاعات عمومی پکیج
  const getPackageInfo = () => {
    // استفاده از داده‌های کامل در صورت وجود
    const packageData = completePackageData || reservation.package;
    console.log('Using package data:', JSON.stringify(packageData));
    
    return {
      title: packageData.title || packageData.name || 'پکیج تور',
      airline: packageData.airline || 'هواپیمایی تورسان',
      hotelInfo: getHotelName(packageData.hotel || packageData.hotels),
      routeInfo: getRouteName(packageData.route),
      price: packageData.price ? packageData.price.toLocaleString('fa-IR') + ' تومان' : 'نامشخص'
    };
  }

  const generateQRCodeAsync = async (text: string, passenger: Passenger) => {
    try {
      // استفاده از گزینه‌های بیشتر برای QR کد بهتر
      const options = {
        errorCorrectionLevel: 'H' as const,
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      };
      
      const qrData = `
        نام: ${passenger.firstName} ${passenger.lastName}
        کد ملی: ${passenger.nationalId}
        شماره رزرو: ${reservation._id}
        تاریخ پرواز: ${formatDate(reservation.package.startDate)}
      `;
      
      return await QRCode.toDataURL(qrData, options);
    } catch (err) {
      console.error('خطا در تولید QR کد:', err);
      return '';
    }
  }

  const generateTicketHTML = (passenger: Passenger, i: number, qrCodeUrl: string, randomTicketNumber: string) => {
    // دریافت اطلاعات پکیج
    const packageInfo = getPackageInfo();
    
    return `
      <div id="ticket-${i}" style="width: 190mm; height: 140mm; position: relative; font-family: 'IRANSans', Arial, sans-serif; direction: rtl;">
        <!-- کل بلیط در یک کادر با حاشیه گرد -->
        <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1); height: 100%; border: 1px solid #e0e0e0;">
          <!-- هدر بلیط -->
          <div style="background: linear-gradient(135deg, #4338CA, #3B82F6); color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #8B5CF6;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">بلیط پرواز هواپیمایی تورسان</span>
              <span style="font-size: 14px; opacity: 0.9;">${packageInfo.airline}</span>
            </div>
            <div style="text-align: left;">
              <!-- استفاده از یک دیو با استایل به جای تصویر -->
              <div style="background-color: white; color: #3B82F6; border-radius: 8px; padding: 5px 15px; font-weight: bold; font-size: 18px;">هواپیمایی تورسان</div>
            </div>
          </div>
          
          <!-- محتوای اصلی بلیط - دو ستون -->
          <div style="display: flex; height: calc(100% - 81px);">
            <!-- ستون راست - اطلاعات مسافر -->
            <div style="flex: 3; padding: 15px; border-left: 2px dashed #e0e0e0; position: relative; display: flex; flex-direction: column;">
              <!-- چاشنی‌های گرافیکی برای زیبایی بیشتر -->
              <div style="position: absolute; top: -10px; left: -10px; width: 20px; height: 20px; background-color: white; border-radius: 50%; border: 2px solid #e0e0e0;"></div>
              <div style="position: absolute; bottom: -10px; left: -10px; width: 20px; height: 20px; background-color: white; border-radius: 50%; border: 2px solid #e0e0e0;"></div>

              <!-- بخش اطلاعات مسافر -->
              <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px 0; color: #3B82F6; font-size: 18px; border-bottom: 2px solid #EEF2FF; padding-bottom: 8px;">اطلاعات مسافر</h2>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">نام و نام خانوادگی:</div>
                  <div style="flex: 1; color: #1F2937;">${passenger.firstName} ${passenger.lastName}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">کد ملی:</div>
                  <div style="flex: 1; color: #1F2937;">${passenger.nationalId}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">تاریخ تولد:</div>
                  <div style="flex: 1; color: #1F2937;">${formatDate(passenger.birthDate)}</div>
                </div>
              </div>
              
              <!-- بخش اطلاعات پرواز -->
              <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px 0; color: #3B82F6; font-size: 18px; border-bottom: 2px solid #EEF2FF; padding-bottom: 8px;">اطلاعات پرواز</h2>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">عنوان تور:</div>
                  <div style="flex: 1; color: #1F2937;">${packageInfo.title}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">مسیر:</div>
                  <div style="flex: 1; color: #1F2937; font-weight: bold;">${packageInfo.routeInfo}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">تاریخ رفت:</div>
                  <div style="flex: 1; color: #1F2937;">${formatDate(reservation.package.startDate)}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">تاریخ برگشت:</div>
                  <div style="flex: 1; color: #1F2937;">${formatDate(reservation.package.endDate)}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">هتل:</div>
                  <div style="flex: 1; color: #1F2937;">${packageInfo.hotelInfo}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 12px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">قیمت:</div>
                  <div style="flex: 1; color: #1F2937;">${packageInfo.price}</div>
                </div>
              </div>

              <!-- بخش اطلاعات رزرو -->
              <div style="margin-top: auto;">
                <div style="display: flex; margin-bottom: 6px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">شماره بلیط:</div>
                  <div style="flex: 1; color: #1F2937; letter-spacing: 1px; font-family: monospace; font-size: 16px;">${randomTicketNumber}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 6px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">کد رزرو:</div>
                  <div style="flex: 1; color: #1F2937; letter-spacing: 1px; font-family: monospace; font-size: 16px;">${reservation.code || reservation._id.substring(0, 8)}</div>
                </div>
                
                <div style="display: flex; margin-bottom: 6px;">
                  <div style="width: 120px; font-weight: bold; color: #4B5563;">وضعیت رزرو:</div>
                  <div style="flex: 1; padding: 2px 8px; display: inline-block; border-radius: 4px; color: white; background-color: ${
                    reservation.status === 'confirmed' ? '#10B981' : 
                    reservation.status === 'pending' ? '#F59E0B' : '#EF4444'
                  }; font-size: 12px; width: fit-content;">
                    ${reservation.status === 'confirmed' ? 'تایید شده' : 
                      reservation.status === 'pending' ? 'در انتظار تایید' : 'لغو شده'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <!-- ستون چپ - بارکد و اطلاعات تکمیلی -->
            <div style="flex: 2; background-color: #F8FAFC; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
              <!-- QR کد -->
              <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
                <img src="${qrCodeUrl}" style="width: 150px; height: 150px; margin-bottom: 10px;">
                <div style="font-size: 14px; color: #6B7280; max-width: 180px; text-align: center; margin-top: 10px;">
                  برای اسکن این کد می‌توانید از دوربین تلفن همراه خود استفاده کنید
                </div>
              </div>
              
              <!-- اطلاعات تکمیلی -->
              <div style="text-align: center; margin-top: auto;">
                <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 12px; color: #6B7280; max-width: 200px;">
                  لطفاً دو ساعت قبل از پرواز در فرودگاه حضور داشته باشید
                </div>
                
                <div style="margin-top: 15px;">
                  <!-- استفاده از دیو با متن به جای تصویر -->
                  <div style="font-weight: bold; color: #3B82F6; padding: 5px 0;">هواپیمایی تورسان</div>
                  <div style="margin-top: 5px; font-size: 12px; color: #666;">www.toursan.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // مدیریت بهتر تعداد زیاد مسافران
  const generateAllTicketsInOnePDF = async () => {
    if (!ticketContainerRef.current) return
    
    try {
      setIsGenerating(true);
      // ایجاد نمونه جدید از jsPDF با اندازه A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // تعیین حداکثر تعداد مسافران در هر بار پردازش
      const batchSize = 10;
      const totalPassengers = passengers.length;
      
      for (let batchStart = 0; batchStart < totalPassengers; batchStart += batchSize) {
        // محاسبه پایان این دسته (یا آخرین مسافر)
        const batchEnd = Math.min(batchStart + batchSize, totalPassengers);
        
        // پردازش این دسته از مسافران
        for (let i = batchStart; i < batchEnd; i++) {
          const passenger = passengers[i]
          
          // تولید QR کد برای هر مسافر
          const qrCodeUrl = await generateQRCodeAsync(reservation._id, passenger)
          
          // ایجاد مقدار تصادفی برای شماره بلیط
          const randomTicketNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
          
          // HTML بلیط
          const ticketHTML = generateTicketHTML(passenger, i, qrCodeUrl, randomTicketNumber);
          
          // افزودن HTML بلیط به صفحه
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = ticketHTML;
          document.body.appendChild(tempDiv);
          
          // تبدیل HTML به canvas
          const tempTicket = document.getElementById(`ticket-${i}`);
          if (tempTicket) { // بررسی null بودن
            const canvas = await html2canvas(tempTicket);
            const imgData = canvas.toDataURL('image/png');
            
            // اضافه کردن به PDF
            if (i > 0) {
              pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 10, 10, 190, 140);
            
            // حذف المان موقت
            document.body.removeChild(tempDiv);
          }
          
          // به کاربر اجازه می‌دهیم پیشرفت را ببیند
          if ((i + 1) % 5 === 0 || i === totalPassengers - 1) {
            console.log(`Processing tickets: ${i + 1}/${totalPassengers}`);
          }
        }
        
        // اجازه رندر به مرورگر بین دسته‌های مسافران
        if (batchEnd < totalPassengers) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // ذخیره PDF با نام مناسب
      pdf.save(`tickets_${reservation._id}.pdf`)
      
      // نمایش پیام موفقیت
      alert('بلیط‌ها با موفقیت ایجاد شدند!')
    } catch (error) {
      console.error('خطا در تولید PDF:', error)
      alert('خطا در تولید بلیط‌ها. لطفاً مجدداً تلاش کنید.')
    } finally {
      setIsGenerating(false);
    }
  }

  const generateSingleTicket = async (passengerIndex: number) => {
    try {
      const passenger = passengers[passengerIndex];
      onGenerateTicket(passenger._id);
    } catch (error) {
      console.error('خطا در آماده‌سازی تولید بلیط:', error);
      alert('خطا در عملیات تولید بلیط. لطفاً مجدداً تلاش کنید.');
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {isLoadingPackage ? (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="mr-2 text-indigo-600">در حال بارگذاری اطلاعات پکیج...</span>
        </div>
      ) : (
        <>
          
          
          {/* لیست مسافران برای دریافت تکی بلیط‌ها */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">دریافت بلیط هر مسافر به صورت جداگانه</h3>
            <div className="space-y-3">
              {passengers.map((passenger, index) => (
                <div key={passenger._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <span className="font-medium">{passenger.firstName} {passenger.lastName}</span>
                    <span className="text-gray-500 text-sm mr-3">({passenger.nationalId})</span>
                  </div>
                  <button
                    onClick={() => generateSingleTicket(index)}
                    disabled={isGenerating || isLoadingPackage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm disabled:opacity-50"
                  >
                    دریافت بلیط
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* این div فقط برای ارجاع است و به کاربر نمایش داده نمی‌شود */}
      <div ref={ticketContainerRef} className="hidden"></div>
    </div>
  )
}

export default TicketGenerator 
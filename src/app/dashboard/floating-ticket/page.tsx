'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaPlus, 
  FaTrash, 
  FaDownload, 
  FaPlane, 
  FaUser, 
  FaIdCard,
  FaPassport,
  FaFileDownload,
  FaCalendarAlt,
  FaSpinner,
  FaRoute,
  FaUsers,
  FaFileExcel,
  FaUpload
} from 'react-icons/fa'
import axios from 'axios'
import { toast as reactToastify } from 'react-toastify'
import { Toaster } from 'react-hot-toast'
import PersianDatePicker from '@/components/PersianDatePicker'
import PriceInput from '@/components/PriceInput'
import { v4 as uuidv4 } from 'uuid'
import { UseFormRegister } from 'react-hook-form'
import moment from 'moment'

// تعریف انواع داده
interface Passenger {
  id: string;
  englishFirstName: string;
  englishLastName: string;
  documentType: 'nationalId' | 'passport';
  documentNumber: string;
  nationality?: string;
  customNationality?: boolean;
  age?: string;
  birthDate?: string;
  ageInputMethod?: 'direct' | 'birthdate';
}

interface Airline {
  _id: string;
  name: string;
  englishName: string;
  logo?: string;
  aircraftModel?: string;
}

interface Aircraft {
  _id: string;
  model: string;
  manufacturer: string;
}

interface Route {
  _id: string;
  origin: string;
  destination: string;
  estimatedDuration: number;
}

interface FlightInfo {
  routeId?: string;
  origin: string;
  destination: string;
  date: string;
  time?: string;
  flightNumber?: string;
  airline?: string;
  originCityId?: string;
  destinationCityId?: string;
  price?: string;
  tax?: string;
  total?: string;
  aircraft?: string;
}

// ساخت یک تابع شبیه‌ساز register برای کامپوننت PriceInput
const mockRegister: UseFormRegister<any> = (name) => {
  return {
    name,
    onChange: () => Promise.resolve(),
    onBlur: () => Promise.resolve(),
    ref: () => {},
  };
};

export default function FloatingTicket() {
  // استیت‌ها
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [flightInfo, setFlightInfo] = useState<FlightInfo>({
    origin: '',
    destination: '',
    date: '',
    time: '',
    flightNumber: '',
    price: '',
    tax: '',
    total: '',
    aircraft: ''
  })
  const [airlines, setAirlines] = useState<Airline[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [nationalities] = useState<string[]>([
    'Iranian', 'Afghan', 'Iraqi', 'Turkish', 'Pakistani', 'Arabic', 'Other'
  ])
  // افزودن استیت‌های جدید
  const [sourceType, setSourceType] = useState<'route' | 'city'>('route')
  const [cities, setCities] = useState<{_id: string; name: string}[]>([])
  const [originCity, setOriginCity] = useState<{_id: string; name: string} | null>(null)
  const [destinationCity, setDestinationCity] = useState<{_id: string; name: string} | null>(null)
  // استیت‌های جدید برای مدیریت وضعیت صادر و وارد کردن
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // دریافت لیست شرکت‌های هواپیمایی، هواپیماها و مسیرها
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const [airlinesRes, routesRes, citiesRes] = await Promise.all([
          axios.get('http://185.94.99.35:5000/api/airlines', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://185.94.99.35:5000/api/floating-ticket/routes', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://185.94.99.35:5000/api/floating-ticket/cities', {
            headers: { 'x-auth-token': token }
          })
        ])
        
        setAirlines(airlinesRes.data)
        setRoutes(routesRes.data)
        setCities(citiesRes.data)
      } catch (err: any) {
        console.error('خطا در دریافت اطلاعات:', err)
        reactToastify.error('خطا در دریافت اطلاعات')
      }
    }
    
    fetchData()
  }, [])

  // اضافه کردن مسافر جدید
  const addPassenger = () => {
    const newPassenger: Passenger = {
      id: Date.now().toString(),
      englishFirstName: '',
      englishLastName: '',
      documentType: 'passport',
      documentNumber: '',
      nationality: 'Iranian',
      customNationality: false,
      age: '',
      birthDate: '',
      ageInputMethod: 'direct'
    }
    
    setPassengers([...passengers, newPassenger])
  }

  // اضافه کردن چندین مسافر به صورت یکجا
  const addMultiplePassengers = () => {
    const count = passengerCount > 0 ? passengerCount : 1;
    const newPassengers: Passenger[] = [];
    
    for (let i = 0; i < count; i++) {
      newPassengers.push({
        id: `${Date.now()}-${i}`,
        englishFirstName: '',
        englishLastName: '',
        documentType: 'passport',
        documentNumber: '',
        nationality: 'Iranian',
        customNationality: false,
        age: '',
        birthDate: '',
        ageInputMethod: 'direct'
      });
    }
    
    setPassengers([...passengers, ...newPassengers]);
  }

  // حذف مسافر
  const removePassenger = (id: string) => {
    setPassengers(passengers.filter(p => p.id !== id))
  }

  // به‌روزرسانی اطلاعات مسافر
  const updatePassenger = (id: string, field: keyof Passenger, value: any) => {
    setPassengers(
      passengers.map(p => {
        if (p.id === id) {
          // اگر فیلد birthDate تغییر کرده، سن را محاسبه کن
          if (field === 'birthDate' && value) {
            try {
              const birthDate = moment(value, 'YYYY/MM/DD');
              const now = moment();
              const age = now.diff(birthDate, 'years').toString();
              return { ...p, [field]: value, age, ageInputMethod: 'birthdate' };
            } catch (error) {
              console.error('خطا در محاسبه سن:', error);
              return { ...p, [field]: value };
            }
          }
          // اگر فیلد age تغییر کرده و مستقیماً وارد شده
          else if (field === 'age') {
            return { ...p, [field]: value, ageInputMethod: 'direct' };
          }
          
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // به‌روزرسانی اطلاعات پرواز
  const updateFlightInfo = (field: keyof FlightInfo, value: string) => {
    setFlightInfo({ ...flightInfo, [field]: value })
  }

  // تغییر مسیر انتخاب شده
  const handleRouteChange = (routeId: string) => {
    const route = routes.find(r => r._id === routeId);
    if (route) {
      setSelectedRoute(route);
      setFlightInfo({
        ...flightInfo,
        routeId: route._id,
        origin: route.origin,
        destination: route.destination
      });
    } else {
      setSelectedRoute(null);
    }
  };

  // مدیریت تغییر شهر مبدا
  const handleOriginCityChange = (cityId: string) => {
    const city = cities.find(c => c._id === cityId);
    if (city) {
      setOriginCity(city);
      setFlightInfo({
        ...flightInfo,
        originCityId: city._id,
        origin: city.name
      });
    } else {
      setOriginCity(null);
      setFlightInfo({
        ...flightInfo,
        originCityId: undefined,
        origin: ''
      });
    }
  };

  // مدیریت تغییر شهر مقصد
  const handleDestinationCityChange = (cityId: string) => {
    const city = cities.find(c => c._id === cityId);
    if (city) {
      setDestinationCity(city);
      setFlightInfo({
        ...flightInfo,
        destinationCityId: city._id,
        destination: city.name
      });
    } else {
      setDestinationCity(null);
      setFlightInfo({
        ...flightInfo,
        destinationCityId: undefined,
        destination: ''
      });
    }
  };

  // صادر کردن اطلاعات مسافران به صورت فایل اکسل
  const handleExportExcel = async () => {
    // اعتبارسنجی داده‌ها
    if (passengers.length === 0) {
      return reactToastify.error('حداقل یک مسافر اضافه کنید')
    }

    try {
      setIsExporting(true);
      const token = localStorage.getItem('token')
      if (!token) {
        setIsExporting(false);
        return reactToastify.error('لطفا ابتدا وارد شوید');
      }

      reactToastify.info('در حال آماده‌سازی فایل اکسل...', { autoClose: 2000 });

      // ارسال درخواست به بک‌اند
      const response = await axios.post(
        'http://185.94.99.35:5000/api/floating-ticket/export-passengers',
        {
          passengers,
          flightInfo,
          airline: selectedAirline,
          sourceType
        },
        {
          headers: {
            'x-auth-token': token
          },
          responseType: 'blob'  // برای دریافت داده به صورت بلاب
        }
      );

      // ایجاد آبجکت بلاب و لینک دانلود
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `passengers-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      reactToastify.success('فایل اکسل با موفقیت دانلود شد');
    } catch (err: any) {
      console.error('خطا در صادر کردن اطلاعات به اکسل:', err);
      reactToastify.error('خطا در صادر کردن اطلاعات به اکسل');
    } finally {
      setIsExporting(false);
    }
  };

  // وارد کردن اطلاعات مسافران از فایل اکسل
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    // بررسی پسوند فایل
    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx') {
      reactToastify.error('لطفاً فقط فایل Excel با پسوند .xlsx آپلود کنید');
      event.target.value = '';
      return;
    }

    // بررسی حجم فایل (حداکثر 5 مگابایت)
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 5) {
      reactToastify.error('حجم فایل باید کمتر از 5 مگابایت باشد');
      event.target.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const token = localStorage.getItem('token')
      if (!token) {
        setIsImporting(false);
        event.target.value = '';
        return reactToastify.error('لطفا ابتدا وارد شوید');
      }

      reactToastify.info('در حال پردازش فایل اکسل...', { autoClose: 2000 });

      const formData = new FormData();
      formData.append('file', file);

      // ارسال درخواست به بک‌اند
      const response = await axios.post(
        'http://185.94.99.35:5000/api/floating-ticket/import-passengers',
        formData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data?.passengers?.length > 0) {
        // به‌روزرسانی لیست مسافران
        setPassengers(response.data.passengers);
        reactToastify.success(`${response.data.passengers.length} مسافر با موفقیت بارگذاری شد`);

        // اگر اطلاعات پرواز هم وجود داشت، آن را هم به‌روز می‌کنیم
        if (response.data.flightInfo) {
          setFlightInfo(prev => ({
            ...prev,
            ...response.data.flightInfo
          }));
        }
      } else {
        reactToastify.warning('هیچ مسافری در فایل یافت نشد');
      }
    } catch (err: any) {
      console.error('خطا در وارد کردن اطلاعات از اکسل:', err);
      
      if (err.response && err.response.data?.message) {
        reactToastify.error(err.response.data.message);
      } else {
        reactToastify.error('خطا در وارد کردن اطلاعات از اکسل');
      }
    } finally {
      setIsImporting(false);
      // پاک کردن مقدار ورودی فایل برای امکان انتخاب مجدد همان فایل
      event.target.value = '';
    }
  };

  // تولید و دانلود بلیط
  const generateAndDownloadTicket = async () => {
    // اعتبارسنجی داده‌ها
    if (passengers.length === 0) {
      return reactToastify.error('حداقل یک مسافر اضافه کنید')
    }
    
    const invalidPassenger = passengers.find(p => 
      !p.englishFirstName.trim() || 
      !p.englishLastName.trim() || 
      !p.documentNumber.trim()
    )
    
    if (invalidPassenger) {
      return reactToastify.error('لطفاً اطلاعات همه مسافران را کامل کنید')
    }
    
    // بررسی انتخاب مسیر یا وارد کردن مبدا و مقصد
    if (
      (sourceType === 'route' && !selectedRoute) || 
      (sourceType === 'city' && (!originCity || !destinationCity)) || 
      !flightInfo.date.trim()
    ) {
      return reactToastify.error('لطفاً مسیر و تاریخ پرواز را مشخص کنید')
    }
    
    try {
      setIsGenerating(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setIsGenerating(false);
        return reactToastify.error('لطفا ابتدا وارد شوید');
      }

      // لاگ کردن داده‌های ارسالی برای دیباگ
      console.log("====== SENDING DATA TO SERVER ======");
      console.log("airline:", selectedAirline);
      console.log("airline.aircraftModel:", selectedAirline?.aircraftModel);
      console.log("flightInfo.aircraft:", flightInfo.aircraft);
      console.log("======================================");

      // ارسال درخواست به بک‌اند
      const response = await axios.post(
        'http://185.94.99.35:5000/api/floating-ticket/generate',
        {
          passengers,
          flightInfo,
          route: selectedRoute,
          airline: selectedAirline,
          sourceType
        },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      // بررسی پاسخ سرور
      if (response.data && response.data.downloadUrl) {
        // استفاده از URL دانلود مستقیم
        const downloadUrl = `http://185.94.99.35:5000${response.data.downloadUrl}`;
        
        // ایجاد لینک دانلود و کلیک روی آن
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('target', '_blank');
        
        // اگر نمی‌خواهید صفحه‌ی جدید باز شود، از دستور زیر استفاده کنید
        // link.setAttribute('download', 'ticket.pdf');
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        reactToastify.success('PDF بلیط با موفقیت تولید شد');
      } else {
        throw new Error('پاسخ سرور حاوی آدرس دانلود نیست');
      }
    } catch (err: any) {
      console.error('خطا در تولید یا دانلود بلیط PDF:', err);
      
      if (err.response && err.response.data?.message) {
        reactToastify.error(err.response.data.message);
      } else {
        reactToastify.error('خطا در ارتباط با سرور یا تولید بلیط');
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            بلیط شناور
          </h1>
        </div>
        
        {/* بخش اطلاعات پرواز */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FaPlane className="text-indigo-600" />
            اطلاعات پرواز
          </h2>
          
          {/* تب انتخاب نوع مسیر */}
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => {
                setSourceType('route');
                if (sourceType !== 'route') {
                  // بازنشانی انتخاب‌های شهر
                  setOriginCity(null);
                  setDestinationCity(null);
                  setFlightInfo(prev => ({
                    ...prev,
                    origin: '',
                    destination: '',
                    originCityId: undefined,
                    destinationCityId: undefined
                  }));
                }
              }}
              className={`px-4 py-2 rounded-md transition-colors ${
                sourceType === 'route'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-transparent text-gray-700 hover:bg-gray-200'
              }`}
            >
              مسیرهای آماده
            </button>
            <button
              onClick={() => {
                setSourceType('city');
                if (sourceType !== 'city') {
                  // بازنشانی انتخاب مسیر
                  setSelectedRoute(null);
                  setFlightInfo(prev => ({
                    ...prev,
                    routeId: undefined,
                    origin: '',
                    destination: ''
                  }));
                }
              }}
              className={`px-4 py-2 rounded-md transition-colors ${
                sourceType === 'city'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-transparent text-gray-700 hover:bg-gray-200'
              }`}
            >
              انتخاب شهر
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sourceType === 'route' ? (
              <div className="lg:col-span-2">
                <label className="block text-gray-700 mb-2">انتخاب مسیر</label>
                <div className="flex flex-col space-y-2">
                  <select
                    value={selectedRoute?._id || ''}
                    onChange={(e) => handleRouteChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">انتخاب مسیر پروازی</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.origin} به {route.destination}
                      </option>
                    ))}
                  </select>
                  {selectedRoute && (
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <FaRoute />
                        <span className="font-semibold">مسیر انتخاب شده:</span>
                        <span>{selectedRoute.origin} به {selectedRoute.destination}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-gray-700 mb-2">شهر مبدأ</label>
                  <select
                    value={originCity?._id || ''}
                    onChange={(e) => handleOriginCityChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">انتخاب شهر مبدأ</option>
                    {cities.map(city => (
                      <option key={city._id} value={city._id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">شهر مقصد</label>
                  <select
                    value={destinationCity?._id || ''}
                    onChange={(e) => handleDestinationCityChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">انتخاب شهر مقصد</option>
                    {cities.map(city => (
                      <option key={city._id} value={city._id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-gray-700 mb-2">تاریخ پرواز</label>
              <PersianDatePicker
                value={flightInfo.date}
                onChange={(date) => updateFlightInfo('date', date)}
                placeholder="انتخاب تاریخ پرواز"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">ساعت پرواز (اختیاری)</label>
              <input
                type="time"
                value={flightInfo.time || ''}
                onChange={(e) => updateFlightInfo('time', e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">شماره پرواز (اختیاری)</label>
              <input
                type="text"
                value={flightInfo.flightNumber || ''}
                onChange={(e) => updateFlightInfo('flightNumber', e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: W5112"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">شرکت هواپیمایی (اختیاری)</label>
              <select
                value={selectedAirline?._id || ''}
                onChange={(e) => {
                  const airlineId = e.target.value;
                  if (!airlineId) {
                    setSelectedAirline(null);
                    updateFlightInfo('airline', '');
                    updateFlightInfo('aircraft', '');
                    return;
                  }
                  
                  // یافتن ایرلاین انتخاب شده
                  const airline = airlines.find(a => a._id === airlineId);
                  if (airline) {
                    setSelectedAirline(airline);
                    updateFlightInfo('airline', airline.englishName || airline.name);
                    
                    // استفاده از مدل هواپیمای ذخیره شده در ایرلاین
                    if (airline.aircraftModel) {
                      console.log(`Using airline.aircraftModel: ${airline.aircraftModel}`);
                      updateFlightInfo('aircraft', airline.aircraftModel);
                    } else {
                      console.log("No aircraftModel found in airline");
                      updateFlightInfo('aircraft', airline.englishName ? `${airline.englishName} Aircraft` : '');
                    }
                    
                    // دریافت اطلاعات کامل ایرلاین از API
                    const fetchAirlineDetails = async (id: string) => {
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          reactToastify.error('لطفا ابتدا وارد شوید');
                          return null;
                        }
                        
                        const response = await axios.get(`http://185.94.99.35:5000/api/airlines/${id}`, {
                          headers: { 'x-auth-token': token }
                        });
                        
                        return response.data;
                      } catch (error) {
                        console.error('خطا در دریافت اطلاعات کامل شرکت هواپیمایی:', error);
                        return null;
                      }
                    };
                    
                    // دریافت اطلاعات کامل و به‌روزرسانی
                    fetchAirlineDetails(airlineId).then(detailedAirline => {
                      if (detailedAirline) {
                        console.log("Received detailed airline info:", detailedAirline);
                        
                        // به‌روزرسانی state با اطلاعات کامل
                        setSelectedAirline(detailedAirline);
                        
                        // اگر aircraftModel در اطلاعات دقیق وجود دارد، از آن استفاده کنیم
                        if (detailedAirline.aircraftModel) {
                          console.log(`Using detailed airline.aircraftModel: ${detailedAirline.aircraftModel}`);
                          updateFlightInfo('aircraft', detailedAirline.aircraftModel);
                        }
                      }
                    });
                  }
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">انتخاب شرکت هواپیمایی</option>
                {airlines.map(airline => (
                  <option key={airline._id} value={airline._id}>
                    {airline.name} ({airline.englishName || ''})
                    {airline.aircraftModel ? ` - ${airline.aircraftModel}` : ''}
                  </option>
                ))}
              </select>
              {selectedAirline && (
                <div className="mt-2 text-xs">
                  {selectedAirline.aircraftModel ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      مدل هواپیما: {selectedAirline.aircraftModel}
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      مدل هواپیما مشخص نشده است
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <PriceInput
                label="قیمت بلیط"
                name="price"
                value={parseInt(flightInfo.price || '0')}
                onChange={(value) => updateFlightInfo('price', value.toString())}
                placeholder="مثال: 5,000,000"
              />
            </div>
            
            <div className="mb-4">
              <PriceInput
                label="مالیات و عوارض"
                name="tax"
                value={parseInt(flightInfo.tax || '0')}
                onChange={(value) => updateFlightInfo('tax', value.toString())}
                placeholder="مثال: 500,000"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">جمع کل (تومان)</label>
              <div className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-3 font-bold text-indigo-700 flex items-center justify-between">
                <span>
                  {(flightInfo.price || flightInfo.tax) ? 
                    (parseInt(flightInfo.price || '0') + parseInt(flightInfo.tax || '0')).toLocaleString('fa-IR') 
                    : 'مجموع قیمت و مالیات'}
                </span>
                {(flightInfo.price || flightInfo.tax) && 
                  <span className="text-xs bg-indigo-100 px-2 py-1 rounded-md text-indigo-600">محاسبه خودکار</span>
                }
              </div>
            </div>
            
          </div>
        </div>
        
        {/* بخش مسافران */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaUser className="text-indigo-600" />
              اطلاعات مسافران
            </h2>
            
            <div className="flex gap-2 items-center">
              {passengers.length === 0 ? (
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <label className="text-gray-700 font-medium flex items-center gap-2">
                    <FaUsers className="text-indigo-500" />
                    <span>تعداد مسافران:</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                    className="w-16 bg-white border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  />
                  
                  <button
                    onClick={addMultiplePassengers}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    <FaPlus />
                    افزودن
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* دکمه صادر کردن اکسل */}
                  <button
                    onClick={handleExportExcel}
                    disabled={isExporting || isGenerating || passengers.length === 0}
                    className={`flex items-center justify-center gap-3 px-8 py-5 rounded-full text-xl font-semibold transition-colors shadow-xl ${
                      isExporting || isGenerating || passengers.length === 0
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 transform hover:scale-105'
                    }`}
                  >
                    {isExporting ? (
                      <FaSpinner className="animate-spin text-2xl" />
                    ) : (
                      <FaFileExcel className="text-2xl" />
                    )}
                    <span>{isExporting ? 'در حال صادر کردن...' : 'صادر کردن به اکسل'}</span>
                  </button>
                  
                  {/* دکمه وارد کردن اکسل */}
                  <label
                    className={`flex items-center justify-center gap-3 px-8 py-5 rounded-full text-xl font-semibold transition-all duration-300 shadow-xl ${
                      isImporting || isGenerating
                        ? 'bg-gray-400 text-white cursor-wait' 
                        : 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transform hover:scale-105'
                    }`}
                  >
                    {isImporting ? (
                      <FaSpinner className="animate-spin text-2xl" />
                    ) : (
                      <FaUpload className="text-2xl" />
                    )}
                    <span>{isImporting ? 'در حال وارد کردن...' : 'بارگذاری از اکسل'}</span>
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleImportExcel}
                      disabled={isImporting || isGenerating}
                      className="hidden"
                    />
                  </label>
                  
                  {/* دکمه افزودن مسافر */}
                  <button
                    onClick={addPassenger}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    <FaPlus />
                    <span className="hidden sm:inline">افزودن مسافر</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {passengers.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">لطفاً تعداد مسافران را مشخص کنید و دکمه افزودن را کلیک کنید.</p>
            </div>
          ) : (
            <AnimatePresence>
              {passengers.map((passenger, index) => (
                <motion.div
                  key={passenger.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-xl p-5 mb-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">مسافر {index + 1}</h3>
                    <button
                      onClick={() => removePassenger(passenger.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2">نام انگلیسی</label>
                      <input
                        type="text"
                        value={passenger.englishFirstName}
                        onChange={(e) => updatePassenger(passenger.id, 'englishFirstName', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="نام انگلیسی"
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">نام خانوادگی انگلیسی</label>
                      <input
                        type="text"
                        value={passenger.englishLastName}
                        onChange={(e) => updatePassenger(passenger.id, 'englishLastName', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="نام خانوادگی انگلیسی"
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">نوع سند</label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={passenger.documentType === 'passport'}
                            onChange={() => updatePassenger(passenger.id, 'documentType', 'passport')}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="mr-2 flex items-center gap-1">
                            <FaPassport className="text-indigo-500" />
                            پاسپورت
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={passenger.documentType === 'nationalId'}
                            onChange={() => updatePassenger(passenger.id, 'documentType', 'nationalId')}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="mr-2 flex items-center gap-1">
                            <FaIdCard className="text-indigo-500" />
                            کد ملی
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">
                        {passenger.documentType === 'passport' ? 'شماره پاسپورت' : 'کد ملی'}
                      </label>
                      <input
                        type="text"
                        value={passenger.documentNumber}
                        onChange={(e) => updatePassenger(passenger.id, 'documentNumber', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={passenger.documentType === 'passport' ? 'شماره پاسپورت' : 'کد ملی'}
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">ملیت</label>
                      {!passenger.customNationality ? (
                        <select
                          value={passenger.nationality || 'Iranian'}
                          onChange={(e) => {
                            if (e.target.value === 'Other') {
                              const updatedPassengers = passengers.map(p => {
                                if (p.id === passenger.id) {
                                  return { 
                                    ...p, 
                                    customNationality: true, 
                                    nationality: '' 
                                  };
                                }
                                return p;
                              });
                              setPassengers(updatedPassengers);
                            } else {
                              updatePassenger(passenger.id, 'nationality', e.target.value);
                            }
                          }}
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          dir="ltr"
                        >
                          {nationalities.map(nat => (
                            <option key={nat} value={nat === 'Other' ? 'سایر...' : nat}>
                              {nat === 'Other' ? 'سایر...' : nat}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex flex-row-reverse">
                          <input
                            type="text"
                            value={passenger.nationality || ''}
                            onChange={(e) => updatePassenger(passenger.id, 'nationality', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-r-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="ملیت را وارد کنید..."
                            dir="ltr"
                          />
                          <button 
                            onClick={() => {
                              const updatedPassengers = passengers.map(p => {
                                if (p.id === passenger.id) {
                                  return { 
                                    ...p, 
                                    customNationality: false, 
                                    nationality: 'Iranian' 
                                  };
                                }
                                return p;
                              });
                              setPassengers(updatedPassengers);
                            }}
                            className="bg-gray-200 px-3 rounded-l-lg text-gray-700 hover:bg-gray-300"
                            title="بازگشت به حالت انتخابی"
                          >
                            ↩
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">سن مسافر</label>
                      <div className="flex">
                        <div className={`flex-1 ${passenger.ageInputMethod === 'direct' ? 'opacity-100' : 'opacity-50'}`}>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={passenger.age || ''}
                            onChange={(e) => {
                              updatePassenger(passenger.id, 'age', e.target.value);
                              if (passenger.ageInputMethod !== 'direct') {
                                updatePassenger(passenger.id, 'ageInputMethod', 'direct');
                                updatePassenger(passenger.id, 'birthDate', '');
                              }
                            }}
                            onClick={() => {
                              // تغییر به حالت ورود مستقیم سن هنگام کلیک
                              if (passenger.ageInputMethod !== 'direct') {
                                updatePassenger(passenger.id, 'ageInputMethod', 'direct');
                              }
                            }}
                            className="w-full bg-gray-50 border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="سن مسافر"
                          />
                        </div>
                        <div className="flex border border-gray-300 border-r-0 rounded-r-lg bg-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              // تغییر بین حالت‌های ورود سن
                              const newMethod = passenger.ageInputMethod === 'direct' ? 'birthdate' : 'direct';
                              updatePassenger(passenger.id, 'ageInputMethod', newMethod);
                            }}
                            className="px-3 text-gray-500 hover:text-indigo-600 transition-colors"
                            title={passenger.ageInputMethod === 'direct' ? 'انتخاب تاریخ تولد' : 'ورود مستقیم سن'}
                          >
                            <FaCalendarAlt />
                          </button>
                        </div>
                      </div>
                      
                      {/* تاریخ تولد - نمایش در صورت انتخاب حالت محاسبه از تاریخ تولد */}
                      {passenger.ageInputMethod === 'birthdate' && (
                        <div className="mt-2">
                          <label className="block text-gray-700 mb-2 text-xs">تاریخ تولد</label>
                          <PersianDatePicker
                            value={passenger.birthDate}
                            onChange={(date) => updatePassenger(passenger.id, 'birthDate', date)}
                            placeholder="انتخاب تاریخ تولد"
                            className="text-sm"
                          />
                          {passenger.age && (
                            <div className="mt-1 text-xs text-indigo-600 bg-indigo-50 p-1 rounded border border-indigo-100">
                              سن محاسبه شده: <span className="font-bold">{passenger.age} سال</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* دکمه تولید و دانلود */}
        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          {/* دکمه‌های صادر کردن و وارد کردن */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting || isGenerating || passengers.length === 0}
            className={`flex items-center justify-center gap-3 px-8 py-5 rounded-full text-xl font-semibold transition-colors shadow-xl ${
              isExporting || isGenerating || passengers.length === 0
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 transform hover:scale-105'
            }`}
          >
            {isExporting ? (
              <FaSpinner className="animate-spin text-2xl" />
            ) : (
              <FaFileExcel className="text-2xl" />
            )}
            <span>{isExporting ? 'در حال صادر کردن...' : 'صادر کردن به اکسل'}</span>
          </button>
          
          <label
            className={`flex items-center justify-center gap-3 px-8 py-5 rounded-full text-xl font-semibold transition-all duration-300 shadow-xl ${
              isImporting || isGenerating
                ? 'bg-gray-400 text-white cursor-wait' 
                : 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transform hover:scale-105'
            }`}
          >
            {isImporting ? (
              <FaSpinner className="animate-spin text-2xl" />
            ) : (
              <FaUpload className="text-2xl" />
            )}
            <span>{isImporting ? 'در حال وارد کردن...' : 'بارگذاری از اکسل'}</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleImportExcel}
              disabled={isImporting || isGenerating}
              className="hidden"
            />
          </label>
          
          {/* دکمه تولید و دانلود PDF */}
          <button
            onClick={generateAndDownloadTicket}
            disabled={isGenerating || passengers.length === 0}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg ${ 
              isGenerating || passengers.length === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>در حال تولید PDF...</span>
              </>
            ) : (
              <>
                <FaFileDownload />
                <span>تولید و دانلود بلیط PDF</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
} 
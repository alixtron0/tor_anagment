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
  passportExpiry?: string;
  nationality?: string;
  customNationality?: boolean;
  age?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
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

// ساخت یک تابع  شب یه‌ساز register برای کامپوننت PriceInput
const mockRegister: UseFormRegister<any> = (name) => {
  return {
    name,
    onChange: () => Promise.resolve(),
    onBlur: () => Promise.resolve(),
    ref: () => {},
  };
};

// کامپوننت انتخابگر زمان ۲۴ ساعته
const TimeSelector = ({ 
  value, 
  onChange,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => {
  // تنظیم ساعت و دقیقه از مقدار ورودی
  const [hour, setHour] = useState<string>('');
  const [minute, setMinute] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // به‌روزرسانی مقادیر ساعت و دقیقه هنگام تغییر value
  useEffect(() => {
    if (!isTyping && value) {
      const [h, m] = value.split(':');
      setHour(h || '');
      setMinute(m || '');
    }
  }, [value, isTyping]);

  // ساخت گزینه‌های ساعت (۰۰ تا ۲۳)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hourValue = i.toString().padStart(2, '0');
    return (
      <option key={`hour-${hourValue}`} value={hourValue}>
        {hourValue}
      </option>
    );
  });

  // ساخت گزینه‌های دقیقه (۰۰ تا ۵۹)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    const minuteValue = i.toString().padStart(2, '0');
    return (
      <option key={`minute-${minuteValue}`} value={minuteValue}>
        {minuteValue}
      </option>
    );
  });

  // به‌روزرسانی مقدار زمان هنگام تغییر ساعت یا دقیقه
  const handleChange = (type: 'hour' | 'minute', val: string) => {
    if (type === 'hour') {
      setHour(val);
      const newTime = val && minute ? `${val}:${minute}` : val ? `${val}:00` : minute ? `00:${minute}` : '';
      onChange(newTime);
    } else {
      setMinute(val);
      const newTime = hour && val ? `${hour}:${val}` : hour ? `${hour}:00` : val ? `00:${val}` : '';
      onChange(newTime);
    }
  };

  // مدیریت تایپ مستقیم زمان در فیلد ورودی
  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(true);
    const input = e.target.value;
    
    // اگر فقط عدد و : وارد شده باشد
    if (/^[0-9:]*$/.test(input)) {
      if (input.includes(':')) {
        const [h, m] = input.split(':');
        // بررسی محدوده معتبر ساعت و دقیقه
        if ((h === '' || (parseInt(h) >= 0 && parseInt(h) <= 23)) && 
            (m === '' || (parseInt(m) >= 0 && parseInt(m) <= 59))) {
          onChange(input);
          
          if (h) setHour(h.length === 1 ? '0' + h : h);
          if (m) setMinute(m.length === 1 ? '0' + m : m);
        }
      } else if (input.length <= 2) {
        // اگر فقط ساعت وارد شده
        if (input === '' || (parseInt(input) >= 0 && parseInt(input) <= 23)) {
          setHour(input);
          onChange(input ? `${input}:${minute || '00'}` : `${minute ? '00:' + minute : ''}`);
        }
      }
    }
    
    // پس از 1 ثانیه، وضعیت تایپ را غیرفعال کن
    setTimeout(() => setIsTyping(false), 1000);
  };

  return (
    <div className={`inline-flex items-center gap-1 p-1 px-2 bg-gray-50 border border-gray-300 rounded-lg ${className}`}>
      <div className="flex items-center justify-center px-2 py-1 bg-indigo-50 rounded-md border border-indigo-100 text-indigo-600 text-xs ml-1">
        24h
      </div>

      {/* ورودی مستقیم زمان */}
      <input 
        type="text"
        value={value}
        onChange={handleDirectInput}
        placeholder="00:00"
        className="w-16 bg-transparent border-0 focus:ring-0 text-center appearance-none cursor-text text-lg font-medium"
        maxLength={5}
      />

      <div className="flex items-center justify-center text-gray-300 mx-1">|</div>

      {/* دقیقه (سمت چپ در فارسی) */}
      <div className="relative w-full flex-grow">
        <select
          value={minute}
          onChange={(e) => handleChange('minute', e.target.value)}
          className="w-full bg-transparent border-0 focus:ring-0 text-center appearance-none cursor-pointer text-lg p-2 font-medium"
          aria-label="دقیقه"
        >
          <option value="" className="text-gray-400">دقیقه</option>
          {minuteOptions}
        </select>
        <span className="text-xs text-gray-500 absolute bottom-0 right-0">دقیقه</span>
      </div>
      <span className="text-xl font-bold text-indigo-600 mx-1 pt-1">:</span>
      {/* ساعت (سمت راست در فارسی) */}
      <div className="relative w-full flex-grow">
        <select
          value={hour}
          onChange={(e) => handleChange('hour', e.target.value)}
          className="w-full bg-transparent border-0 focus:ring-0 text-center appearance-none cursor-pointer text-lg p-2 font-medium"
          aria-label="ساعت"
        >
          <option value="" className="text-gray-400">ساعت</option>
          {hourOptions}
        </select>
        <span className="text-xs text-gray-500 absolute bottom-0 right-0">ساعت</span>
      </div>
    </div>
  );
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
    // محاسبه تاریخ تولد پیش‌فرض (30 سال قبل)
    const defaultBirthDate = moment().subtract(30, 'years').format('YYYY/MM/DD');
    // محاسبه تاریخ انقضای پاسپورت پیش‌فرض (5 سال بعد)
    const defaultPassportExpiry = moment().add(5, 'years').format('YYYY/MM/DD');
    const ageYears = 30;
    
    const newPassenger: Passenger = {
      id: Date.now().toString(),
      englishFirstName: '',
      englishLastName: '',
      documentType: 'passport',
      documentNumber: '',
      passportExpiry: defaultPassportExpiry,
      nationality: 'Iranian',
      customNationality: false,
      birthDate: defaultBirthDate,
      age: `${ageYears} (بزرگسال)`,
      gender: 'male'
    }
    
    setPassengers([...passengers, newPassenger])
  }

  // اضافه کردن چندین مسافر به صورت یکجا
  const addMultiplePassengers = () => {
    const count = passengerCount > 0 ? passengerCount : 1;
    const newPassengers: Passenger[] = [];
    
    // محاسبه تاریخ تولد پیش‌فرض (30 سال قبل)
    const defaultBirthDate = moment().subtract(30, 'years').format('YYYY/MM/DD');
    // محاسبه تاریخ انقضای پاسپورت پیش‌فرض (5 سال بعد)
    const defaultPassportExpiry = moment().add(5, 'years').format('YYYY/MM/DD');
    const ageYears = 30;
    
    for (let i = 0; i < count; i++) {
      newPassengers.push({
        id: `${Date.now()}-${i}`,
        englishFirstName: '',
        englishLastName: '',
        documentType: 'passport',
        documentNumber: '',
        passportExpiry: defaultPassportExpiry,
        nationality: 'Iranian',
        customNationality: false,
        birthDate: defaultBirthDate,
        age: `${ageYears} (بزرگسال)`,
        gender: 'male'
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
              const ageYears = now.diff(birthDate, 'years');
              
              // تعیین دسته سنی
              let ageCategory = '';
              if (ageYears >= 12) {
                ageCategory = 'بزرگسال';
              } else if (ageYears >= 2) {
                ageCategory = 'کودک';
              } else {
                ageCategory = 'نوزاد';
              }
              
              return { 
                ...p, 
                [field]: value, 
                age: `${ageYears} (${ageCategory})` 
              };
            } catch (error) {
              console.error('خطا در محاسبه سن:', error);
              return { ...p, [field]: value };
            }
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
  const handleExportExcel = async (exportType: string = 'system') => {
    // اعتبارسنجی داده‌ها
    if (passengers.length === 0) {
      return reactToastify.error('حداقل یک مسافر اضافه کنید')
    }
    
    // بررسی انتخاب شرکت هواپیمایی
    if (!selectedAirline) {
      return reactToastify.error('لطفاً شرکت هواپیمایی را انتخاب کنید')
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
          sourceType,
          exportType // ارسال نوع خروجی اکسل (system یا airline)
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
      link.setAttribute('download', `passengers-${exportType}-${Date.now()}.xlsx`);
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
    
    // بررسی انتخاب شرکت هواپیمایی
    if (!selectedAirline) {
      return reactToastify.error('لطفاً شرکت هواپیمایی را انتخاب کنید')
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

  // بررسی وجود بلیط ذخیره شده برای ویرایش
  useEffect(() => {
    const checkEditTicket = () => {
      try {
        const savedTicket = localStorage.getItem('edit_floating_ticket');
        if (!savedTicket) return;
        
        const ticketData = JSON.parse(savedTicket);
        
        // بررسی اینکه داده قدیمی نباشد (اگر بیشتر از 10 دقیقه گذشته باشد، نادیده بگیر)
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 دقیقه به میلی‌ثانیه
        
        if (now - ticketData.timestamp > maxAge) {
          // داده قدیمی است، آن را حذف کن
          localStorage.removeItem('edit_floating_ticket');
          return;
        }
        
        // داده معتبر است، بلیط را بارگذاری کن
        const ticket = ticketData.data;
        
        // تنظیم نوع منبع (route یا city)
        if (ticket.sourceType === 'route' && ticket.flightInfo.routeId) {
          setSourceType('route');
          
          // یافتن مسیر در لیست مسیرها
          const route = routes.find(r => r._id === ticket.flightInfo.routeId);
          if (route) {
            setSelectedRoute(route);
          }
        } else if (ticket.sourceType === 'city') {
          setSourceType('city');
          
          // یافتن شهرهای مبدا و مقصد
          if (ticket.flightInfo.originCityId) {
            const originCity = cities.find(c => c._id === ticket.flightInfo.originCityId);
            if (originCity) {
              setOriginCity(originCity);
            }
          }
          
          if (ticket.flightInfo.destinationCityId) {
            const destCity = cities.find(c => c._id === ticket.flightInfo.destinationCityId);
            if (destCity) {
              setDestinationCity(destCity);
            }
          }
        }
        
        // تنظیم اطلاعات پرواز
        setFlightInfo({
          ...ticket.flightInfo,
          // اطمینان از اینکه فیلدهای مهم تعریف شده‌اند
          origin: ticket.flightInfo.origin || '',
          destination: ticket.flightInfo.destination || '',
          date: ticket.flightInfo.date || '',
          time: ticket.flightInfo.time || '',
          flightNumber: ticket.flightInfo.flightNumber || '',
        });
        
        // تنظیم ایرلاین
        if (ticket.airline && ticket.airline._id) {
          const airline = airlines.find(a => a._id === ticket.airline._id);
          if (airline) {
            setSelectedAirline(airline);
          }
        }
        
        // تنظیم مسافران
        if (Array.isArray(ticket.passengers) && ticket.passengers.length > 0) {
          setPassengers(ticket.passengers);
        }
        
        // حذف اطلاعات بلیط از localStorage
        localStorage.removeItem('edit_floating_ticket');
        
        // نمایش پیام موفقیت
        reactToastify.success('اطلاعات بلیط برای ویرایش بارگذاری شد');
      } catch (err) {
        console.error('Error loading edit ticket data:', err);
        // در صورت خطا، اطلاعات را حذف کن
        localStorage.removeItem('edit_floating_ticket');
      }
    };
    
    // فقط زمانی که لیست‌های مورد نیاز بارگذاری شده‌اند، بررسی کن
    if (airlines.length > 0 && routes.length > 0 && cities.length > 0) {
      checkEditTicket();
    }
  }, [airlines, routes, cities]);

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
              <TimeSelector
                value={flightInfo.time || ''}
                onChange={(value) => updateFlightInfo('time', value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">فرمت ۲۴ ساعته</p>
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
              <label className="block text-gray-700 mb-2 flex items-center">
                شرکت هواپیمایی
                <span className="text-red-500 mr-1">*</span>
              </label>
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
                      updateFlightInfo('aircraft', airline.aircraftModel);
                    } else {
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
                        // به‌روزرسانی state با اطلاعات کامل
                        setSelectedAirline(detailedAirline);
                        
                        // اگر aircraftModel در اطلاعات دقیق وجود دارد، از آن استفاده کنیم
                        if (detailedAirline.aircraftModel) {
                          updateFlightInfo('aircraft', detailedAirline.aircraftModel);
                        }
                      }
                    });
                  }
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">انتخاب شرکت هواپیمایی</option>
                {airlines.map(airline => (
                  <option key={airline._id} value={airline._id}>
                    {airline.name}
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
                <div className="bg-white p-3 rounded-xl shadow-md">
                  <h3 className="text-lg font-bold mb-3 text-center">ابزارها</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleExportExcel('system')}
                      disabled={isExporting || isGenerating || passengers.length === 0}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isExporting || isGenerating || passengers.length === 0
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isExporting ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaFileExcel />
                      )}
                      <span>{isExporting ? 'در حال صادر کردن...' : 'صادر کردن اکسل'}</span>
                    </button>
                    
                    <label
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isImporting || isGenerating
                          ? 'bg-gray-400 text-white cursor-wait' 
                          : 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
                      }`}
                    >
                      {isImporting ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaUpload />
                      )}
                      <span>{isImporting ? 'در حال بارگذاری...' : 'بارگذاری اکسل'}</span>
                      <input
                        type="file"
                        accept=".xlsx"
                        onChange={handleImportExcel}
                        disabled={isImporting || isGenerating}
                        className="hidden"
                      />
                    </label>
                    
                    <button
                      onClick={addPassenger}
                      className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                      <FaPlus />
                      <span className="hidden sm:inline">افزودن مسافر</span>
                    </button>
                  </div>
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
                      <label className="block text-gray-700 mb-2">جنسیت</label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={passenger.gender === 'male'}
                            onChange={() => updatePassenger(passenger.id, 'gender', 'male')}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="mr-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                            </svg>
                            مرد
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={passenger.gender === 'female'}
                            onChange={() => updatePassenger(passenger.id, 'gender', 'female')}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span className="mr-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                            </svg>
                            زن
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
                        onChange={(e) => {
                          const value = e.target.value;
                          // اگر نوع سند کد ملی است، فقط اعداد را بپذیر و حداکثر ۱۰ رقم
                          if (passenger.documentType === 'nationalId') {
                            // فقط اعداد را قبول کن و حداکثر ۱۰ رقم
                            if (/^\d{0,10}$/.test(value)) {
                              updatePassenger(passenger.id, 'documentNumber', value);
                            }
                          } else {
                            // برای پاسپورت محدودیتی نداریم
                            updatePassenger(passenger.id, 'documentNumber', value);
                          }
                        }}
                        className={`w-full bg-gray-50 border ${
                          passenger.documentType === 'nationalId' && 
                          passenger.documentNumber.length > 0 && 
                          passenger.documentNumber.length !== 10
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-indigo-500'
                        } rounded-lg p-3 focus:outline-none focus:ring-2`}
                        placeholder={passenger.documentType === 'passport' ? 'شماره پاسپورت' : 'کد ملی (۱۰ رقم)'}
                        dir="ltr"
                        maxLength={passenger.documentType === 'nationalId' ? 10 : undefined}
                      />
                      {passenger.documentType === 'nationalId' && 
                       passenger.documentNumber.length > 0 && 
                       passenger.documentNumber.length !== 10 && (
                        <p className="mt-1 text-xs text-red-500">
                          کد ملی باید دقیقاً ۱۰ رقم باشد. {10 - passenger.documentNumber.length} رقم دیگر وارد کنید.
                        </p>
                      )}
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
                      <label className="block text-gray-700 mb-2">تاریخ تولد</label>
                      <PersianDatePicker
                        value={passenger.birthDate || ''}
                        onChange={(date) => updatePassenger(passenger.id, 'birthDate', date)}
                        placeholder="انتخاب تاریخ تولد"
                        className="w-full"
                      />
                      {passenger.age && (
                        <div className="mt-1 text-xs text-indigo-600 bg-indigo-50 p-1 rounded border border-indigo-100 flex flex-wrap items-center gap-2">
                          <span>سن محاسبه شده: <span className="font-bold">{passenger.age.split('(')[0]}</span></span>
                          {passenger.age.includes('بزرگسال') && (
                            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">بزرگسال</span>
                          )}
                          {passenger.age.includes('کودک') && (
                            <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs">کودک</span>
                          )}
                          {passenger.age.includes('نوزاد') && (
                            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs">نوزاد</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* فیلد تاریخ انقضای پاسپورت - فقط زمانی نمایش داده می‌شود که نوع سند پاسپورت باشد */}
                    {passenger.documentType === 'passport' && (
                      <div>
                        <label className="block text-gray-700 mb-2">تاریخ انقضای پاسپورت</label>
                        <PersianDatePicker
                          value={passenger.passportExpiry || ''}
                          onChange={(date) => updatePassenger(passenger.id, 'passportExpiry', date)}
                          placeholder="انتخاب تاریخ انقضا"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* به جای دو بخش جداگانه دکمه‌های پایین صفحه، آنها را در یک باکس واحد با طراحی بهتر قرار می‌دهیم */}
        <div className="mt-10 flex justify-center">
          <div className="bg-white p-5 rounded-xl shadow-lg w-full max-w-4xl">
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800 border-b pb-3">ابزارهای مدیریت بلیط</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* بخش اول: صادر کردن و بارگذاری اکسل */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">مدیریت فایل اکسل</h3>
                
                <div className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-gray-600">صادر کردن به اکسل:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportExcel('system')}
                        disabled={isExporting || isGenerating || passengers.length === 0}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          isExporting || isGenerating || passengers.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isExporting ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaFileExcel />
                        )}
                        <span>{isExporting ? 'در حال صادر کردن...' : 'فرمت سیستمی'}</span>
                      </button>
                      
                      <button
                        onClick={() => handleExportExcel('airline')}
                        disabled={isExporting || isGenerating || passengers.length === 0}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          isExporting || isGenerating || passengers.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isExporting ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaPlane className="mr-1" />
                        )}
                        <span>{isExporting ? 'در حال صادر کردن...' : 'فرمت خطوط هوایی'}</span>
                      </button>
                    </div>
                  </div>
                  
                 
                </div>
              </div>
              
              {/* بخش دوم: تولید بلیط PDF */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">تولید بلیط</h3>
                
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-gray-600">دانلود بلیط PDF:</span>
                  <button
                    onClick={generateAndDownloadTicket}
                    disabled={isGenerating || passengers.length === 0}
                    className={`w-full h-full py-4 rounded-md flex items-center justify-center gap-2 text-base font-semibold transition-colors ${ 
                      isGenerating || passengers.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>در حال تولید PDF...</span>
                      </>
                    ) : (
                      <>
                        <FaFileDownload className="text-lg" />
                        <span>تولید و دانلود بلیط PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 
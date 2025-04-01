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
  FaSpinner
} from 'react-icons/fa'
import axios from 'axios'
import { toast as reactToastify } from 'react-toastify'
import { Toaster } from 'react-hot-toast'
import PersianDatePicker from '@/components/PersianDatePicker'
import { v4 as uuidv4 } from 'uuid'

// تعریف انواع داده
interface Passenger {
  id: string;
  englishFirstName: string;
  englishLastName: string;
  documentType: 'nationalId' | 'passport';
  documentNumber: string;
  nationality?: string;
}

interface Airline {
  _id: string;
  name: string;
  englishName: string;
  logo?: string;
}

interface Aircraft {
  _id: string;
  model: string;
  manufacturer: string;
}

interface FlightInfo {
  origin: string;
  destination: string;
  date: string;
  time?: string;
  flightNumber?: string;
  airline?: string;
}

export default function FloatingTicket() {
  // استیت‌ها
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [flightInfo, setFlightInfo] = useState<FlightInfo>({
    origin: '',
    destination: '',
    date: '',
    time: '',
    flightNumber: ''
  })
  const [airlines, setAirlines] = useState<Airline[]>([])
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null)
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // دریافت لیست شرکت‌های هواپیمایی و هواپیماها
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const [airlinesRes, aircraftRes] = await Promise.all([
          axios.get('http://localhost:5000/api/floating-ticket/airlines', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://localhost:5000/api/floating-ticket/aircraft', {
            headers: { 'x-auth-token': token }
          })
        ])
        
        setAirlines(airlinesRes.data)
        setAircraft(aircraftRes.data)
      } catch (err: any) {
        console.error('خطا در دریافت اطلاعات:', err)
        reactToastify.error('خطا در دریافت اطلاعات هواپیمایی')
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
      documentNumber: ''
    }
    
    setPassengers([...passengers, newPassenger])
  }

  // حذف مسافر
  const removePassenger = (id: string) => {
    setPassengers(passengers.filter(p => p.id !== id))
  }

  // به‌روزرسانی اطلاعات مسافر
  const updatePassenger = (id: string, field: keyof Passenger, value: any) => {
    setPassengers(
      passengers.map(p => p.id === id ? { ...p, [field]: value } : p)
    )
  }

  // به‌روزرسانی اطلاعات پرواز
  const updateFlightInfo = (field: keyof FlightInfo, value: string) => {
    setFlightInfo({ ...flightInfo, [field]: value })
  }

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
    
    if (!flightInfo.origin.trim() || !flightInfo.destination.trim() || !flightInfo.date.trim()) {
      return reactToastify.error('لطفاً اطلاعات پرواز را کامل کنید')
    }
    
    try {
      setIsGenerating(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setIsGenerating(false);
        return reactToastify.error('لطفا ابتدا وارد شوید');
      }

      // ارسال درخواست به بک‌اند
      const response = await axios.post(
        'http://localhost:5000/api/floating-ticket/generate',
        {
          passengers, // ارسال کل لیست مسافران (بک‌اند فعلا فقط اولی را استفاده می‌کند)
          flightInfo,
          airline: selectedAirline, // ارسال اطلاعات ایرلاین انتخابی
          aircraft: selectedAircraft // ارسال اطلاعات هواپیما انتخابی
        },
        {
          headers: {
            'x-auth-token': token
          },
          responseType: 'blob' // مهم: دریافت پاسخ به صورت blob
        }
      );

      // ایجاد لینک دانلود برای Blob دریافتی
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // استخراج نام فایل از هدر یا تولید نام پیش‌فرض
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `ticket-${Date.now()}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch.length === 2)
          fileName = decodeURIComponent(fileNameMatch[1]);
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // پاکسازی لینک
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      reactToastify.success('PDF بلیط با موفقیت دانلود شد');

    } catch (err: any) {
      console.error('خطا در تولید یا دانلود بلیط PDF:', err);
      // نمایش پیام خطای سرور اگر وجود داشت
      if (err.response && err.response.data instanceof Blob) {
         try {
            const errorBlob = await err.response.data.text();
            const errorJson = JSON.parse(errorBlob);
            reactToastify.error(errorJson.message || 'خطا در تولید PDF در سرور');
         } catch(parseError) {
             reactToastify.error('خطای ناشناخته در دریافت پاسخ خطا از سرور');
         }
      } else if (err.response && err.response.data?.message) {
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">مبدأ</label>
              <input
                type="text"
                value={flightInfo.origin}
                onChange={(e) => updateFlightInfo('origin', e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: تهران (IKA)"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">مقصد</label>
              <input
                type="text"
                value={flightInfo.destination}
                onChange={(e) => updateFlightInfo('destination', e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: استانبول (IST)"
              />
            </div>
            
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
                    return;
                  }
                  
                  const airline = airlines.find(a => a._id === airlineId);
                  if (airline) {
                    setSelectedAirline(airline);
                    updateFlightInfo('airline', airline.englishName);
                  }
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">انتخاب شرکت هواپیمایی</option>
                {airlines.map(airline => (
                  <option key={airline._id} value={airline._id}>
                    {airline.name} ({airline.englishName})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">مدل هواپیما (اختیاری)</label>
              <select
                value={selectedAircraft?._id || ''}
                onChange={(e) => {
                  const aircraftId = e.target.value;
                  if (!aircraftId) {
                    setSelectedAircraft(null);
                    return;
                  }
                  
                  const selectedAircraft = aircraft.find(a => a._id === aircraftId);
                  if (selectedAircraft) {
                    setSelectedAircraft(selectedAircraft);
                  }
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">انتخاب مدل هواپیما</option>
                {aircraft.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.manufacturer} {a.model}
                  </option>
                ))}
              </select>
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
            
            <button
              onClick={addPassenger}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <FaPlus />
              افزودن مسافر
            </button>
          </div>
          
          {passengers.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">لطفاً با کلیک بر روی دکمه «افزودن مسافر»، مسافران خود را اضافه کنید.</p>
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
                      <label className="block text-gray-700 mb-2">ملیت (اختیاری)</label>
                      <input
                        type="text"
                        value={passenger.nationality || ''}
                        onChange={(e) => updatePassenger(passenger.id, 'nationality', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="مثال: Iranian"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* دکمه تولید و دانلود */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={generateAndDownloadTicket}
            disabled={isGenerating || passengers.length === 0}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg ${ 
              isGenerating
                ? 'bg-gray-400 text-white cursor-wait'
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
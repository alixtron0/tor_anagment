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
  FaUsers
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
  customNationality?: boolean;
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
}

export default function FloatingTicket() {
  // استیت‌ها
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [flightInfo, setFlightInfo] = useState<FlightInfo>({
    origin: '',
    destination: '',
    date: '',
    time: '',
    flightNumber: ''
  })
  const [airlines, setAirlines] = useState<Airline[]>([])
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null)
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [nationalities] = useState<string[]>([
    'Iranian', 'Afghan', 'Iraqi', 'Turkish', 'Pakistani', 'Arabic', 'Other'
  ])
  
  // دریافت لیست شرکت‌های هواپیمایی، هواپیماها و مسیرها
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const [airlinesRes, aircraftRes, routesRes] = await Promise.all([
          axios.get('http://185.94.99.35:5000/api/floating-ticket/airlines', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://185.94.99.35:5000/api/floating-ticket/aircraft', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://185.94.99.35:5000/api/floating-ticket/routes', {
            headers: { 'x-auth-token': token }
          })
        ])
        
        setAirlines(airlinesRes.data)
        setAircraft(aircraftRes.data)
        setRoutes(routesRes.data)
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
      customNationality: false
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
        customNationality: false
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
      passengers.map(p => p.id === id ? { ...p, [field]: value } : p)
    )
  }

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
    if ((!selectedRoute && (!flightInfo.origin.trim() || !flightInfo.destination.trim())) || !flightInfo.date.trim()) {
      return reactToastify.error('لطفاً مسیر و تاریخ پرواز را مشخص کنید')
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
        'http://185.94.99.35:5000/api/floating-ticket/generate',
        {
          passengers,
          flightInfo,
          airline: selectedAirline,
          aircraft: selectedAircraft,
          route: selectedRoute
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            
            <div className="flex gap-2 items-center">
              {passengers.length === 0 && (
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
              )}
              
              {passengers.length > 0 && (
                <button
                  onClick={addPassenger}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <FaPlus />
                  افزودن مسافر
                </button>
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
                            <option key={nat} value={nat === 'Other' ? 'Other' : nat}>
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
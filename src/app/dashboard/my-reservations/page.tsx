'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaArrowRight, 
  FaCalendarAlt, 
  FaHotel, 
  FaMapMarkerAlt, 
  FaPlane, 
  FaUserFriends, 
  FaCheck,
  FaTimes,
  FaClock,
  FaPrint,
  FaUsers,
  FaEye
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import moment from 'jalali-moment'

interface Reservation {
  _id: string;
  type: 'self' | 'admin';
  package: {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    route: any;
    capacity: number;
    airline: string;
    hotel: string;
    status: 'active' | 'inactive';
    price: number;
  };
  count: number;
  adults: number;
  children: number;
  infants: number;
  room: string;
  services: string[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'canceled';
  createdAt: string;
  admin?: {
    _id: string;
    fullName: string;
    role: string;
  };
  createdBy: {
    user: {
      _id: string;
      fullName: string;
      role: string;
    };
    fullName: string;
  }
}

export default function MyReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // بارگذاری رزروهای کاربر جاری
  const fetchMyReservations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth')
        return
      }
      
      console.log('Fetching my reservations, token:', token.substring(0, 10) + '...')
      
      // بررسی اطلاعات کاربر
      const userJson = localStorage.getItem('user')
      if (userJson) {
        const userData = JSON.parse(userJson)
        console.log('User data:', userData)
      }
      
      const response = await axios.get(`http://185.94.99.35:5000/api/reservations/my-reservations`, {
        headers: {
          'x-auth-token': token
        }
      })
      
      console.log('My reservations API response:', response.data)
      setReservations(response.data)
    } catch (error: any) {
      console.error('خطا در بارگذاری رزروها:', error)
      
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        toast.error(`خطا در بارگذاری لیست رزروها: ${error.response.data?.message || error.response.statusText}`)
      } else if (error.request) {
        console.error('Error request:', error.request)
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      } else {
        toast.error(`خطا در بارگذاری لیست رزروها: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyReservations()
  }, [])

  // بررسی و لاگ ساختار داده‌ها برای عیب‌یابی
  useEffect(() => {
    if (reservations.length > 0) {
      console.log('Reservations loaded successfully:', reservations.length)
      console.log('First reservation package structure:', reservations[0].package)
    } else if (!loading) {
      console.log('No reservations found or reservations array is empty')
    }
  }, [reservations, loading])

  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    try {
      return moment(dateString, 'YYYY/MM/DD').locale('fa').format('jYYYY/jMM/jDD')
    } catch (error) {
      return dateString
    }
  }

  // محاسبه تعداد روزهای پکیج
  const calculateDuration = (startDate: string, endDate: string) => {
    try {
      const start = moment(startDate, 'YYYY/MM/DD')
      const end = moment(endDate, 'YYYY/MM/DD')
      return end.diff(start, 'days') + 1
    } catch (error) {
      return 0
    }
  }

  // نمایش نام مسیر
  const getRouteName = (route: any) => {
    console.log('Route data:', route);
    
    if (!route) return 'نامشخص';
    
    // اگر route یک رشته باشد
    if (typeof route === 'string') return route;
    
    // اگر route یک آبجکت با origin و destination باشد
    if (route.origin && route.destination) {
      return `${route.origin} به ${route.destination}`;
    }
    
    // اگر route یک آبجکت با name باشد
    if (route.name) {
      return route.name;
    }
    
    // اگر route._id وجود داشته باشد (یعنی فقط populate شده اما اطلاعات کامل نیست)
    if (route._id) {
      return `مسیر ${route._id}`;
    }
    
    return 'نامشخص';
  }

  // مشاهده جزئیات رزرو
  const viewReservationDetails = (packageId: string, reservationId: string) => {
    router.push(`/dashboard/package-management/${packageId}/reservation/${reservationId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="mr-4 text-indigo-600 font-medium">در حال بارگذاری...</span>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-10"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          رزروهای من
        </h1>
        <p className="text-gray-500 mt-2">مدیریت رزروهای شخصی شما</p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
              <FaUserFriends className="text-3xl text-indigo-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">هیچ رزروی یافت نشد</h2>
          <p className="text-gray-500 mb-8">شما هنوز هیچ رزروی ایجاد نکرده‌اید.</p>
          <button
            onClick={() => router.push('/dashboard/package-management')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
          >
            مشاهده پکیج‌های سفر
          </button>
        </div>
      ) : (
        <div className="space-y-6 max-w-6xl mx-auto">
          {reservations.map((reservation) => {
            // بررسی و لاگ ساختار داده
            console.log('Rendering reservation:', reservation._id, 'package:', reservation.package);
            
            // بررسی وجود و صحت ساختار package
            if (!reservation.package || typeof reservation.package !== 'object' || Object.keys(reservation.package).length === 0) {
              console.error('No package data for reservation:', reservation._id, reservation.package);
              return null;
            }
            
            if (!reservation.package.title) {
              console.error('No package title for reservation:', reservation._id, reservation.package);
              return null;
            }
            
            return (
              <motion.div
                key={reservation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {reservation.package.title}
                      </h3>
                      <span className={`mr-4 px-3 py-1 rounded-full text-xs font-medium ${
                        reservation.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : reservation.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {reservation.status === 'confirmed' 
                          ? 'تایید شده' 
                          : reservation.status === 'pending' 
                            ? 'در انتظار تایید'
                            : 'لغو شده'
                        }
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-600 text-sm mb-3">
                      <div className="flex items-center">
                        <FaCalendarAlt className="ml-1 text-indigo-500" />
                        <span>تاریخ: {formatDate(reservation.package.startDate)} تا {formatDate(reservation.package.endDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaHotel className="ml-1 text-indigo-500" />
                        <span>هتل: {typeof reservation.package.hotel === 'string' ? reservation.package.hotel : reservation.package.hotel?.name || 'نامشخص'}</span>
                      </div>
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="ml-1 text-indigo-500" />
                        <span>مسیر: {getRouteName(reservation.package.route)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-600 text-sm">
                      <div className="flex items-center">
                        <FaUsers className="ml-1 text-indigo-500" />
                        <span>
                          تعداد مسافران: {reservation.count} نفر 
                          ({reservation.adults} بزرگسال
                          {reservation.children > 0 ? `، ${reservation.children} کودک` : ''}
                          {reservation.infants > 0 ? `، ${reservation.infants} نوزاد` : ''})
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendarAlt className="ml-1 text-indigo-500" />
                        <span>تاریخ ثبت: {moment(reservation.createdAt).locale('fa').format('jYYYY/jMM/jDD')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-bold text-indigo-600 mb-2">
                      {new Intl.NumberFormat('fa-IR').format(reservation.totalPrice)} تومان
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => viewReservationDetails(reservation.package._id, reservation._id)}
                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
                      >
                        <FaEye />
                        <span>مشاهده جزئیات</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
} 
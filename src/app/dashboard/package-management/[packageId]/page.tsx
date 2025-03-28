'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaArrowRight, 
  FaCalendarAlt, 
  FaHotel, 
  FaMapMarkerAlt, 
  FaPlane, 
  FaBus, 
  FaUserFriends, 
  FaPlus,
  FaMoneyBillWave,
  FaChild,
  FaBaby,
  FaUserAlt,
  FaCheck,
  FaTimes,
  FaClock,
  FaPrint,
  FaUsers
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import { Package } from '@/components/types'
import moment from 'jalali-moment'
import ReservationModal from './ReservationModal'

interface Reservation {
  _id: string;
  type: 'self' | 'admin';
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

export default function PackageDetails() {
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [remainingCapacity, setRemainingCapacity] = useState(0)
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const params = useParams()
  const router = useRouter()
  const packageId = params.packageId as string

  // تابع هدایت به صفحه مدیریت مسافران
  const goToPassengerManagement = (reservationId: string) => {
    router.push(`/dashboard/package-management/${params.packageId}/reservation/${reservationId}`);
  };

  // دریافت اطلاعات کاربر
  useEffect(() => {
    const userJson = localStorage.getItem('user')
    if (userJson) {
      try {
        const userData = JSON.parse(userJson)
        setUserRole(userData.role)
        // بررسی _id یا id در userData
        setUserId(userData._id || userData.id)
        console.log('User data from localStorage:', userData)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // بارگذاری اطلاعات پکیج
  const fetchPackageDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`http://localhost:5000/api/packages/${packageId}`, {
        headers: {
          'x-auth-token': token
        }
      })
      
      setPackageData(response.data)
    } catch (error: any) {
      console.error('خطا در بارگذاری اطلاعات پکیج:', error)
      toast.error('خطا در بارگذاری اطلاعات پکیج')
    } finally {
      setLoading(false)
    }
  }

  // بارگذاری رزروهای پکیج
  const fetchReservations = async () => {
    try {
      setLoadingReservations(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`http://localhost:5000/api/reservations/package/${packageId}`, {
        headers: {
          'x-auth-token': token
        }
      })
      
      // لاگ کردن اطلاعات کاربر و رزروها برای بررسی مشکل
      console.log('User ID:', userId)
      console.log('User Role:', userRole)
      console.log('All Reservations:', response.data)
      
      // اگر نقش کاربر همکار است، فقط رزروهای خودش را نمایش بده
      let filteredReservations = response.data
      if (userRole === 'admin+') {
        // بررسی ساختار داده برای فیلتر کردن صحیح
        filteredReservations = response.data.filter((reservation: Reservation) => {
          console.log('Checking reservation:', reservation._id)
          console.log('Reservation createdBy:', reservation.createdBy)
          
          // بررسی ساختار مختلف احتمالی برای رزروهای همکار
          // دریافت شناسه کاربر ایجادکننده رزرو از مسیرهای مختلف
          const reservationUserId = reservation.createdBy?.user?._id || 
                                   (reservation.createdBy as any)?._id || 
                                   (reservation.createdBy as any)?.userId || 
                                   (reservation as any).userId
          
          console.log('Comparing:', reservationUserId, 'with:', userId)
          return reservationUserId === userId
        })
      }
      
      console.log('Filtered Reservations:', filteredReservations)
      
      setReservations(filteredReservations)
      
      // محاسبه ظرفیت باقی‌مانده
      if (packageData) {
        const totalReserved = response.data
          .filter((res: Reservation) => res.status !== 'canceled')
          .reduce((sum: number, res: Reservation) => sum + res.count, 0)
        
        setRemainingCapacity(packageData.capacity - totalReserved)
      }
    } catch (error: any) {
      console.error('خطا در بارگذاری رزروها:', error)
      toast.error('خطا در بارگذاری لیست رزروها')
    } finally {
      setLoadingReservations(false)
    }
  }

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails()
    }
  }, [packageId])

  useEffect(() => {
    if (packageId && packageData) {
      fetchReservations()
    }
  }, [packageId, packageData, userId, userRole])

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
    if (!route) return 'نامشخص'
    if (typeof route === 'string') return route
    return route.origin && route.destination ? `${route.origin} به ${route.destination}` : 'نامشخص'
  }

  // تغییر وضعیت رزرو
  const handleStatusChange = async (reservationId: string, newStatus: 'confirmed' | 'canceled') => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.patch(
        `http://localhost:5000/api/reservations/${reservationId}/status`,
        { status: newStatus },
        {
          headers: {
            'x-auth-token': token
          }
        }
      )
      
      toast.success(`وضعیت رزرو با موفقیت ${newStatus === 'confirmed' ? 'تایید' : 'لغو'} شد`)
      
      // به‌روزرسانی لیست رزروها
      fetchReservations()
    } catch (error: any) {
      console.error('خطا در تغییر وضعیت رزرو:', error)
      
      if (error.response) {
        toast.error(`خطا: ${error.response.data.message || error.response.statusText}`)
      } else {
        toast.error('خطا در ارتباط با سرور')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="mr-4 text-indigo-600 font-medium">در حال بارگذاری...</span>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-red-100 text-red-600 p-6 rounded-lg mb-4">
          <h1 className="text-2xl font-bold mb-2">پکیج یافت نشد</h1>
          <p>پکیج مورد نظر شما در سیستم یافت نشد.</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/package-management')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaArrowRight />
          <span>بازگشت به لیست پکیج‌ها</span>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* دکمه بازگشت */}
        <button 
          onClick={() => router.push('/dashboard/package-management')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <FaArrowRight />
          <span>بازگشت به لیست پکیج‌ها</span>
        </button>

        {/* دکمه‌های بالای صفحه */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">جزئیات پکیج</h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/package-management/${packageId}/print`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPrint />
              <span>چاپ لیست رزروها</span>
            </button>
            
            <button
              onClick={() => setIsReservationModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPlus />
              <span>افزودن رزرو جدید</span>
            </button>
          </div>
        </div>

        {/* هدر صفحه */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border-b-4 border-indigo-500">
          {/* تصویر هدر */}
          <div className="relative h-64 bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden">
            {packageData.image ? (
              <img 
                src={`http://localhost:5000${packageData.image}`} 
                alt={packageData.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaMapMarkerAlt className="text-white text-6xl opacity-30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            
            {/* عنوان پکیج */}
            <div className="absolute bottom-0 right-0 p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{packageData.name}</h1>
              <div className="flex items-center">
                <FaMapMarkerAlt className="ml-2" />
                <span className="text-lg">{getRouteName(packageData.route)}</span>
              </div>
            </div>

            {/* وضعیت پکیج */}
            <div className="absolute top-6 left-6">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                packageData.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {packageData.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
          </div>

          {/* نوار اطلاعات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
            <div className="bg-white p-4 flex flex-col items-center justify-center text-center">
              <FaCalendarAlt className="text-indigo-500 mb-2 text-xl" />
              <div className="text-gray-500 text-sm mb-1">تاریخ سفر</div>
              <div className="font-bold">{formatDate(packageData.startDate)} تا {formatDate(packageData.endDate)}</div>
            </div>
            
            <div className="bg-white p-4 flex flex-col items-center justify-center text-center">
              <FaHotel className="text-indigo-500 mb-2 text-xl" />
              <div className="text-gray-500 text-sm mb-1">هتل‌ها</div>
              <div className="font-bold">{packageData.hotels?.length || 0} هتل</div>
            </div>
            
            <div className="bg-white p-4 flex flex-col items-center justify-center text-center">
              {packageData.transportation?.departure === 'havaii' ? (
                <FaPlane className="text-indigo-500 mb-2 text-xl" />
              ) : (
                <FaBus className="text-indigo-500 mb-2 text-xl" />
              )}
              <div className="text-gray-500 text-sm mb-1">نوع حمل و نقل</div>
              <div className="font-bold">
                {packageData.transportation?.departure === 'havaii' ? 'هوایی' : 'زمینی'}
              </div>
            </div>
            
            <div className="bg-white p-4 flex flex-col items-center justify-center text-center">
              <FaUserFriends className="text-indigo-500 mb-2 text-xl" />
              <div className="text-gray-500 text-sm mb-1">ظرفیت</div>
              <div className="font-bold">{packageData.capacity} نفر</div>
            </div>
          </div>
        </div>

        {/* محتوای اصلی */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* اطلاعات اصلی پکیج */}
          <div className="lg:col-span-2 space-y-6">
            {/* بخش قیمت‌ها */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-indigo-50 p-4 border-r-4 border-indigo-500">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FaMoneyBillWave className="ml-2 text-indigo-500" />
                  قیمت‌های پکیج
                </h2>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaUserAlt className="text-indigo-500 ml-2" />
                    <span>قیمت پایه بزرگسال:</span>
                  </div>
                  <div className="font-bold">{packageData.basePrice?.toLocaleString('fa-IR')} تومان</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaChild className="text-indigo-500 ml-2" />
                    <span>قیمت کودک:</span>
                  </div>
                  <div className="font-bold">{(packageData.basePrice * 0.7)?.toLocaleString('fa-IR')} تومان</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaBaby className="text-indigo-500 ml-2" />
                    <span>قیمت نوزاد:</span>
                  </div>
                  <div className="font-bold">{packageData.infantPrice?.toLocaleString('fa-IR')} تومان</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaMoneyBillWave className="text-indigo-500 ml-2" />
                    <span>هزینه خدمات:</span>
                  </div>
                  <div className="font-bold">{packageData.servicesFee?.toLocaleString('fa-IR')} تومان</div>
                </div>
              </div>
            </div>
            
            {/* بخش انواع اتاق */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-indigo-50 p-4 border-r-4 border-indigo-500">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FaHotel className="ml-2 text-indigo-500" />
                  انواع اتاق
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageData.rooms?.single.forSale && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>اتاق یک تخته:</span>
                      <div className="font-bold">{packageData.rooms.single.price?.toLocaleString('fa-IR')} تومان</div>
                    </div>
                  )}
                  
                  {packageData.rooms?.double.forSale && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>اتاق دو تخته:</span>
                      <div className="font-bold">{packageData.rooms.double.price?.toLocaleString('fa-IR')} تومان</div>
                    </div>
                  )}
                  
                  {packageData.rooms?.triple.forSale && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>اتاق سه تخته:</span>
                      <div className="font-bold">{packageData.rooms.triple.price?.toLocaleString('fa-IR')} تومان</div>
                    </div>
                  )}
                  
                  {packageData.rooms?.quadruple.forSale && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>اتاق چهار تخته:</span>
                      <div className="font-bold">{packageData.rooms.quadruple.price?.toLocaleString('fa-IR')} تومان</div>
                    </div>
                  )}
                  
                  {packageData.rooms?.quintuple.forSale && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>اتاق پنج تخته:</span>
                      <div className="font-bold">{packageData.rooms.quintuple.price?.toLocaleString('fa-IR')} تومان</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* بخش خدمات اضافی */}
            {packageData.services && packageData.services.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-indigo-50 p-4 border-r-4 border-indigo-500">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <FaMoneyBillWave className="ml-2 text-indigo-500" />
                    خدمات اضافی
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageData.services.map((service: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>{service.name}:</span>
                        <div className="font-bold">{service.price?.toLocaleString('fa-IR')} تومان</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* لیست رزروها */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-indigo-50 p-4 border-r-4 border-indigo-500 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FaUserFriends className="ml-2 text-indigo-500" />
                  رزروهای پکیج
                </h2>
                <button
                  onClick={() => setIsReservationModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center text-sm"
                >
                  <FaPlus className="ml-1" />
                  افزودن رزرو
                </button>
              </div>
              
              <div className="p-6">
                {loadingReservations ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
                    <span className="text-indigo-600">در حال بارگذاری رزروها...</span>
                  </div>
                ) : reservations.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaUserFriends className="text-indigo-400 text-xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-1">هیچ رزروی ثبت نشده است</h3>
                    <p className="text-gray-500 mb-4">می‌توانید اولین رزرو را با کلیک بر روی دکمه افزودن رزرو ثبت کنید.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع رزرو</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ کل</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رزرو کننده</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ ثبت</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservations.map((reservation) => (
                          <tr 
                            key={reservation._id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => goToPassengerManagement(reservation._id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  reservation.type === 'self' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {reservation.type === 'self' ? 'شخصی' : 'ادمین'}
                                </span>
                                {reservation.type === 'admin' && reservation.admin && (
                                  <span className="mr-2 text-gray-700">{reservation.admin.fullName}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {reservation.count} نفر
                              <div className="text-xs text-gray-500 mt-1">
                                {reservation.adults} بزرگسال،
                                {reservation.children > 0 && ` ${reservation.children} کودک،`}
                                {reservation.infants > 0 && ` ${reservation.infants} نوزاد`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reservation.totalPrice.toLocaleString('fa-IR')} تومان
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {reservation.status === 'pending' ? 'در انتظار تایید' :
                                  reservation.status === 'confirmed' ? 'تایید شده' : 'لغو شده'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {reservation.createdBy?.fullName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(reservation.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(reservation._id, 'confirmed')
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-2"
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(reservation._id, 'canceled')
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTimes />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مودال رزرو */}
      <AnimatePresence>
        {isReservationModalOpen && packageData && (
          <ReservationModal 
            isOpen={isReservationModalOpen}
            onClose={() => setIsReservationModalOpen(false)}
            packageData={packageData}
            onSuccess={() => {
              console.log('Reservation added successfully, refreshing reservations...')
              // تضمین به روزرسانی با استفاده از استراتژی تأخیر کوتاه
              setLoadingReservations(true)
              setTimeout(() => {
                fetchReservations()
              }, 500)
              setIsReservationModalOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
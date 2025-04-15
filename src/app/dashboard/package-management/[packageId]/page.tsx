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
  FaUsers,
  FaCog,
  FaFileExcel
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
  };
  // فیلدهای مربوط به تعداد مسافران واقعی
  actualAdults?: number;
  actualChildren?: number;
  actualInfants?: number;
  actualCount?: number;
}

export default function PackageDetails() {
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [remainingCapacity, setRemainingCapacity] = useState(0)
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [isDownloadingPackageExcel, setIsDownloadingPackageExcel] = useState(false)
  const [isDownloadingTicketExcel, setIsDownloadingTicketExcel] = useState(false)
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
      
      const response = await axios.get(`http://185.94.99.35:5000/api/packages/${packageId}`, {
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
      
      const response = await axios.get(`http://185.94.99.35:5000/api/reservations/package/${packageId}`, {
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

      // دریافت تعداد مسافران برای هر رزرو
      const reservationsWithPassengerCounts = await Promise.all(
        filteredReservations.map(async (reservation: Reservation) => {
          try {
            // دریافت مسافران مرتبط با این رزرو
            const passengersResponse = await axios.get(`http://185.94.99.35:5000/api/passengers/reservation/${reservation._id}`, {
              headers: {
                'x-auth-token': token
              }
            });

            // محاسبه تعداد مسافران بر اساس دسته‌بندی سنی
            const passengers = passengersResponse.data;
            const adultCount = passengers.filter((p: any) => p.ageCategory === 'adult').length;
            const childCount = passengers.filter((p: any) => p.ageCategory === 'child').length;
            const infantCount = passengers.filter((p: any) => p.ageCategory === 'infant').length;

            // اضافه کردن تعداد مسافران واقعی به آبجکت رزرو
            return {
              ...reservation,
              actualAdults: adultCount,
              actualChildren: childCount,
              actualInfants: infantCount,
              actualCount: adultCount + childCount + infantCount
            };
          } catch (error) {
            console.error(`خطا در دریافت مسافران رزرو ${reservation._id}:`, error);
            // در صورت خطا، همان رزرو بدون اطلاعات مسافران را برگردان
            return {
              ...reservation,
              actualAdults: 0,
              actualChildren: 0,
              actualInfants: 0,
              actualCount: 0
            };
          }
        })
      );
      
      setReservations(reservationsWithPassengerCounts)
      
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
        `http://185.94.99.35:5000/api/reservations/${reservationId}/status`,
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

  // تابع دانلود اکسل مسافران پکیج
  const handleDownloadPackageExcel = async () => {
    if (!packageId) return;
    setIsDownloadingPackageExcel(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://185.94.99.35:5000/api/passengers/package/${packageId}/excel`,
        {
          responseType: 'blob', // مهم: دریافت پاسخ به صورت blob
          headers: {
            'x-auth-token': token,
          },
        }
      );

      // ایجاد لینک دانلود
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `package_${packageData?.name || packageId}_passengers.xlsx`;
      link.setAttribute('download', fileName); // نام فایل دانلودی
      document.body.appendChild(link);
      link.click();

      // پاکسازی لینک
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('فایل اکسل با موفقیت دانلود شد');

    } catch (error: any) {
      console.error('خطا در دانلود اکسل پکیج:', error);
      if (error.response && error.response.status === 404) {
        toast.warn('هیچ مسافری برای دانلود در این پکیج یافت نشد.');
      } else {
        toast.error('خطا در دانلود فایل اکسل');
      }
    } finally {
      setIsDownloadingPackageExcel(false);
    }
  };

  // تابع دانلود اکسل بلیط مسافران پکیج (بر اساس قالب ticket.xlsx)
  const handleDownloadPackageTicketExcel = async () => {
    if (!packageId) return;
    setIsDownloadingTicketExcel(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://185.94.99.35:5000/api/passengers/package/${packageId}/ticket-excel`, // <-- New API endpoint
        {
          responseType: 'blob', // Important: expect blob response
          headers: {
            'x-auth-token': token,
          },
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from content-disposition header if available, otherwise use default
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `package_${packageData?.name || packageId}_tickets.xlsx`; // Default filename
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*=?(UTF-8''|)?"?([^;"]+)"?/i);
        if (fileNameMatch && fileNameMatch[2]) {
          fileName = decodeURIComponent(fileNameMatch[2]);
        }
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('فایل اکسل بلیط‌ها با موفقیت دانلود شد');

    } catch (error: any) {
      console.error('خطا در دانلود اکسل بلیط پکیج:', error);
      if (error.response) {
           if (error.response.status === 404) {
               toast.warn('هیچ مسافری برای دانلود بلیط اکسل در این پکیج یافت نشد.');
           } else {
                // Try to read error message from blob response if backend sends JSON error as blob
                try {
                    const errorData = JSON.parse(await (error.response.data as Blob).text());
                    toast.error(errorData.message || 'خطا در دانلود فایل اکسل بلیط‌ها');
                } catch (parseError) {
                    toast.error('خطا در دانلود فایل اکسل بلیط‌ها');
                }
           }
      } else {
           toast.error('خطا در ارتباط با سرور هنگام دانلود اکسل بلیط‌ها');
      }
    } finally {
      setIsDownloadingTicketExcel(false);
    }
  };

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6">
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
              onClick={handleDownloadPackageExcel}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md ${
                isDownloadingPackageExcel
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              disabled={isDownloadingPackageExcel}
            >
              {isDownloadingPackageExcel ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <FaFileExcel />
              )}
              <span>{isDownloadingPackageExcel ? 'در حال آماده سازی...' : 'دانلود اکسل مسافران'}</span>
            </button>
            
            <button
              onClick={handleDownloadPackageTicketExcel}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md ${
                isDownloadingTicketExcel
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-purple-600 text-white hover:bg-purple-700' // Different color
              }`}
              disabled={isDownloadingTicketExcel}
            >
              {isDownloadingTicketExcel ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <FaFileExcel className="text-purple-100"/> // Maybe different icon or color
              )}
              <span>{isDownloadingTicketExcel ? 'در حال آماده سازی...' : 'دانلود اکسل بلیط'}</span>
            </button>
            
            <button
              onClick={() => setIsReservationModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                remainingCapacity > 0 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              disabled={remainingCapacity <= 0}
            >
              <FaPlus />
              <span>افزودن رزرو جدید</span>
            </button>
          </div>
        </div>

        {/* تصویر هدر */}
        <div className="mt-8 mb-12 relative overflow-hidden rounded-2xl h-80">
          {packageData.image ? (
            <img 
              src={`http://185.94.99.35:5000${packageData.image}`} 
              alt={packageData.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <FaMapMarkerAlt className="text-white text-6xl opacity-20" />
            </div>
          )}
        </div>

        {/* کارت‌های اطلاعاتی */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="text-indigo-500 mb-3">
              <FaUserFriends className="text-2xl" />
            </div>
            <div className="text-gray-500 text-sm mb-2">ظرفیت</div>
            <div className="text-2xl font-bold text-gray-900">{packageData.capacity}</div>
            <div className={`text-sm mt-1 ${remainingCapacity > 10 ? 'text-green-600' : remainingCapacity > 0 ? 'text-orange-500' : 'text-red-600'}`}>
              {remainingCapacity} نفر باقی‌مانده
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="text-indigo-500 mb-3">
              <FaHotel className="text-2xl" />
            </div>
            <div className="text-gray-500 text-sm mb-2">هتل‌ها</div>
            <div className="text-2xl font-bold text-gray-900">
              {packageData.hotels?.length || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {packageData.hotels && packageData.hotels.length > 0 ? 'هتل' : 'بدون هتل'}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="text-indigo-500 mb-3 flex gap-2">
              {packageData.transportation?.departure === 'havaii' ? (
                <FaPlane className="text-2xl" />
              ) : (
                <FaBus className="text-2xl" />
              )}
            </div>
            <div className="text-gray-500 text-sm mb-2">حمل و نقل رفت</div>
            <div className="text-xl font-bold text-gray-900">
              {packageData.transportation?.departure === 'havaii' ? 'هوایی' : 'زمینی'}
            </div>
            {packageData.transportation?.departureAirline && (
              <div className="text-sm text-gray-500 mt-1">
                {packageData.transportation.departureAirline && 
                typeof packageData.transportation.departureAirline === 'string' 
                ? packageData.transportation.departureAirline 
                : packageData.transportation.departureAirline && 
                  typeof packageData.transportation.departureAirline === 'object' && 
                  'name' in packageData.transportation.departureAirline 
                  ? (packageData.transportation.departureAirline as any).name 
                  : 'شرکت هواپیمایی'}
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="text-indigo-500 mb-3 flex gap-2">
              {packageData.transportation?.return === 'havaii' ? (
                <FaPlane className="text-2xl" />
              ) : (
                <FaBus className="text-2xl" />
              )}
            </div>
            <div className="text-gray-500 text-sm mb-2">حمل و نقل برگشت</div>
            <div className="text-xl font-bold text-gray-900">
              {packageData.transportation?.return === 'havaii' ? 'هوایی' : 'زمینی'}
            </div>
            {packageData.transportation?.returnAirline && (
              <div className="text-sm text-gray-500 mt-1">
                {packageData.transportation.returnAirline && 
                typeof packageData.transportation.returnAirline === 'string' 
                ? packageData.transportation.returnAirline 
                : packageData.transportation.returnAirline && 
                  typeof packageData.transportation.returnAirline === 'object' && 
                  'name' in packageData.transportation.returnAirline 
                  ? (packageData.transportation.returnAirline as any).name 
                  : 'شرکت هواپیمایی'}
              </div>
            )}
          </div>
        </div>

        {/* بخش رزروها - منتقل شده به بالای صفحه */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="ml-2">رزروهای پکیج</span>
              <span className="text-gray-500 text-base font-normal">{reservations.length} رزرو</span>
            </h2>
            
            <div className="flex items-center gap-4">
              <div className={`text-sm px-3 py-1.5 rounded-full ${
                remainingCapacity > 10 ? 'bg-green-50 text-green-700' : 
                remainingCapacity > 0 ? 'bg-orange-50 text-orange-700' : 
                'bg-red-50 text-red-700'
              }`}>
                <span className="font-medium">{remainingCapacity}</span> نفر ظرفیت باقی‌مانده
              </div>
              
              <button
                onClick={() => setIsReservationModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  remainingCapacity > 0 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={remainingCapacity <= 0}
              >
                <FaPlus className="text-sm" />
                <span>افزودن رزرو</span>
              </button>
            </div>
          </div>
          
          {loadingReservations ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
              <span className="text-indigo-600">در حال بارگذاری رزروها...</span>
            </div>
          ) : reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FaUserFriends className="text-gray-300 text-xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">هیچ رزروی ثبت نشده است</h3>
              <p className="text-gray-500 mb-6 text-sm">می‌توانید اولین رزرو را با کلیک بر روی دکمه افزودن رزرو ثبت کنید</p>
              <button
                onClick={() => setIsReservationModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  remainingCapacity > 0 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={remainingCapacity <= 0}
              >
                <FaPlus className="text-sm" />
                <span>افزودن رزرو</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع رزرو</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ کل</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رزرو کننده</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ ثبت</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {reservations.map((reservation) => (
                    <tr 
                      key={reservation._id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => goToPassengerManagement(reservation._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            reservation.type === 'self' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {reservation.type === 'self' ? (
                              <>
                                <FaUserAlt className="ml-1 text-xs" />
                                شخصی
                              </>
                            ) : (
                              <>
                                <FaUserFriends className="ml-1 text-xs" />
                                ادمین
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {reservation.count} نفر
                          </span>
                          {((reservation.actualAdults ?? 0) + (reservation.actualChildren ?? 0) + (reservation.actualInfants ?? 0)) > 0 && (
                            <div className="flex mt-1 gap-1">
                              {(reservation.actualAdults ?? 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                  <FaUserAlt className="ml-0.5 text-[8px]" />
                                  {reservation.actualAdults}
                                </span>
                              )}
                              {(reservation.actualChildren ?? 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                  <FaChild className="ml-0.5 text-[8px]" />
                                  {reservation.actualChildren}
                                </span>
                              )}
                              {(reservation.actualInfants ?? 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                  <FaBaby className="ml-0.5 text-[8px]" />
                                  {reservation.actualInfants}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {reservation.totalPrice.toLocaleString('fa-IR')} تومان
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          reservation.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                          reservation.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                            reservation.status === 'pending' ? 'bg-yellow-500' :
                            reservation.status === 'confirmed' ? 'bg-green-500' :
                            'bg-red-500'
                          }`}></span>
                          {reservation.status === 'pending' ? 'در انتظار تایید' :
                            reservation.status === 'confirmed' ? 'تایید شده' : 'لغو شده'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center ml-2 text-gray-700 font-medium">
                            {reservation.createdBy?.fullName?.charAt(0) || '؟'}
                          </div>
                          <span className="text-gray-900 text-sm">{reservation.createdBy?.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(reservation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(reservation._id, 'confirmed')
                            }}
                            className={`p-1.5 rounded-full transition-all ${
                              reservation.status === 'confirmed' 
                                ? 'bg-green-50 text-green-600 cursor-default' 
                                : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                            }`}
                            disabled={reservation.status === 'confirmed'}
                            title="تایید رزرو"
                          >
                            <FaCheck className="text-sm" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(reservation._id, 'canceled')
                            }}
                            className={`p-1.5 rounded-full transition-all ${
                              reservation.status === 'canceled' 
                                ? 'bg-red-50 text-red-600 cursor-default' 
                                : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                            }`}
                            disabled={reservation.status === 'canceled'}
                            title="لغو رزرو"
                          >
                            <FaTimes className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* محتوای اصلی */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* اطلاعات اصلی پکیج */}
          <div className="lg:col-span-2 space-y-6">
            {/* بخش قیمت‌ها */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-l from-indigo-500 to-indigo-600 p-4 text-white">
                <h2 className="text-xl font-bold flex items-center">
                  <FaMoneyBillWave className="ml-2" />
                  قیمت‌های پکیج
                </h2>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center ml-3">
                      <FaUserAlt className="text-indigo-600" />
                    </div>
                    <span className="font-medium text-gray-700">قیمت پایه بزرگسال</span>
                  </div>
                  <div className="font-bold text-lg text-gray-900">{packageData.basePrice?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                      <FaChild className="text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">قیمت کودک</span>
                  </div>
                  <div className="font-bold text-lg text-gray-900">{(packageData.basePrice * 0.7)?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center ml-3">
                      <FaBaby className="text-pink-600" />
                    </div>
                    <span className="font-medium text-gray-700">قیمت نوزاد</span>
                  </div>
                  <div className="font-bold text-lg text-gray-900">{packageData.infantPrice?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center ml-3">
                      <FaMoneyBillWave className="text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">هزینه خدمات</span>
                  </div>
                  <div className="font-bold text-lg text-gray-900">{packageData.servicesFee?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                </div>
              </div>
            </div>
            
            {/* بخش انواع اتاق */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-l from-blue-500 to-blue-600 p-4 text-white">
                <h2 className="text-xl font-bold flex items-center">
                  <FaHotel className="ml-2" />
                  انواع اتاق
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageData.rooms?.single.forSale && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                          <FaUserAlt className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">اتاق یک تخته</span>
                      </div>
                      <div className="font-bold text-lg text-gray-900">{packageData.rooms.single.price?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                    </div>
                  )}
                  
                  {packageData.rooms?.double.forSale && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                          <FaUsers className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">اتاق دو تخته</span>
                      </div>
                      <div className="font-bold text-lg text-gray-900">{packageData.rooms.double.price?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                    </div>
                  )}
                  
                  {packageData.rooms?.triple.forSale && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                          <FaUsers className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">اتاق سه تخته</span>
                      </div>
                      <div className="font-bold text-lg text-gray-900">{packageData.rooms.triple.price?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                    </div>
                  )}
                  
                  {packageData.rooms?.quadruple.forSale && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                          <FaUsers className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">اتاق چهار تخته</span>
                      </div>
                      <div className="font-bold text-lg text-gray-900">{packageData.rooms.quadruple.price?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                    </div>
                  )}
                  
                  {packageData.rooms?.quintuple.forSale && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                          <FaUsers className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">اتاق پنج تخته</span>
                      </div>
                      <div className="font-bold text-lg text-gray-900">{packageData.rooms.quintuple.price?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* بخش هتل‌های پکیج */}
            {packageData.hotels && packageData.hotels.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-l from-amber-500 to-amber-600 p-4 text-white">
                  <h2 className="text-xl font-bold flex items-center">
                    <FaHotel className="ml-2" />
                    هتل‌های پکیج
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {packageData.hotels.map((hotelItem: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-100 p-5 hover:border-amber-200 hover:bg-amber-50/20 transition-all duration-200 shadow-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="bg-amber-100 w-12 h-12 p-3 rounded-full ml-4 flex items-center justify-center">
                              <FaHotel className="text-amber-600 text-xl" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">
                                {hotelItem.hotel && typeof hotelItem.hotel === 'object' && 'name' in hotelItem.hotel 
                                  ? hotelItem.hotel.name 
                                  : `هتل ${index + 1}`}
                              </h3>
                              {hotelItem.hotel && typeof hotelItem.hotel === 'object' && 'city' in hotelItem.hotel && (
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <FaMapMarkerAlt className="ml-1 text-amber-500" />
                                  {hotelItem.hotel.city}{hotelItem.hotel.country ? `, ${hotelItem.hotel.country}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-amber-100 px-4 py-2 rounded-full text-amber-700 text-sm font-medium">
                            {hotelItem.stayDuration} روز اقامت
                          </div>
                        </div>
                        
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-100">
                            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <FaClock className="ml-2 text-amber-500" />
                              وعده‌های غذایی روز اول
                            </div>
                            <div className="flex gap-2">
                              {hotelItem.firstMeal?.sobhane && (
                                <span className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium">صبحانه</span>
                              )}
                              {hotelItem.firstMeal?.nahar && (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1.5 rounded-full font-medium">ناهار</span>
                              )}
                              {hotelItem.firstMeal?.sham && (
                                <span className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-full font-medium">شام</span>
                              )}
                              {!hotelItem.firstMeal?.sobhane && !hotelItem.firstMeal?.nahar && !hotelItem.firstMeal?.sham && (
                                <span className="text-gray-500 text-xs">بدون وعده غذایی</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-100">
                            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <FaClock className="ml-2 text-amber-500" />
                              وعده‌های غذایی روز آخر
                            </div>
                            <div className="flex gap-2">
                              {hotelItem.lastMeal?.sobhane && (
                                <span className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium">صبحانه</span>
                              )}
                              {hotelItem.lastMeal?.nahar && (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1.5 rounded-full font-medium">ناهار</span>
                              )}
                              {hotelItem.lastMeal?.sham && (
                                <span className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-full font-medium">شام</span>
                              )}
                              {!hotelItem.lastMeal?.sobhane && !hotelItem.lastMeal?.nahar && !hotelItem.lastMeal?.sham && (
                                <span className="text-gray-500 text-xs">بدون وعده غذایی</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* بخش خدمات اضافی */}
            {packageData.services && packageData.services.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-l from-green-500 to-green-600 p-4 text-white">
                  <h2 className="text-xl font-bold flex items-center">
                    <FaCog className="ml-2" />
                    خدمات اضافی
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageData.services.map((service: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center ml-3">
                            <FaCog className="text-green-600" />
                          </div>
                          <span className="font-medium text-gray-700">{service.name}</span>
                        </div>
                        <div className="font-bold text-lg text-gray-900">{service.price?.toLocaleString('fa-IR')} <span className="text-sm text-gray-500">تومان</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
            remainingCapacity={remainingCapacity}
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
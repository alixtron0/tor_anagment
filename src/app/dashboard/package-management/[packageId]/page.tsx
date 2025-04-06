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

        {/* هدر صفحه */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border-b-4 border-indigo-500">
          {/* تصویر هدر */}
          <div className="relative h-64 bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden">
            {packageData.image ? (
              <img 
                src={`http://185.94.99.35:5000${packageData.image}`} 
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
              <div className="font-bold flex flex-col">
                {packageData.hotels && packageData.hotels.length > 0 ? (
                  <>
                    <span>
                      {packageData.hotels.length} هتل
                    </span>
                    <span className="text-xs text-indigo-500 mt-1">مشاهده جزئیات</span>
                  </>
                ) : (
                  <span>بدون هتل</span>
                )}
              </div>
            </div>
            
            <div className="bg-white p-4 flex flex-col items-center justify-center text-center">
              <div className="flex gap-2 mb-2">
                {packageData.transportation?.departure === 'havaii' ? (
                  <FaPlane className="text-indigo-500 text-xl" />
                ) : (
                  <FaBus className="text-indigo-500 text-xl" />
                )}
                {packageData.transportation?.return === 'havaii' ? (
                  <FaPlane className="text-indigo-500 text-xl" />
                ) : (
                  <FaBus className="text-indigo-500 text-xl" />
                )}
              </div>
              <div className="text-gray-500 text-sm mb-1">نوع حمل و نقل</div>
              <div className="flex flex-col text-sm font-bold">
                <span>رفت: {packageData.transportation?.departure === 'havaii' ? 'هوایی' : 'زمینی'}</span>
                <span>برگشت: {packageData.transportation?.return === 'havaii' ? 'هوایی' : 'زمینی'}</span>
              </div>
            </div>
            
            <div className="bg-white p-4 flex flex-col items-center justify-center text-center">
              <FaUserFriends className="text-indigo-500 mb-2 text-xl" />
              <div className="text-gray-500 text-sm mb-1">ظرفیت</div>
              <div className="font-bold">{packageData.capacity} نفر</div>
              <div className={`text-sm mt-1 ${remainingCapacity > 10 ? 'text-green-600' : remainingCapacity > 0 ? 'text-orange-500' : 'text-red-600'}`}>
                باقی‌مانده: {remainingCapacity} نفر
              </div>
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
            
            {/* بخش هتل‌های پکیج */}
            {packageData.hotels && packageData.hotels.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-indigo-50 p-4 border-r-4 border-indigo-500">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <FaHotel className="ml-2 text-indigo-500" />
                    هتل‌های پکیج
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {packageData.hotels.map((hotelItem: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-full ml-3">
                              <FaHotel className="text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">
                                {hotelItem.hotel && typeof hotelItem.hotel === 'object' && 'name' in hotelItem.hotel 
                                  ? hotelItem.hotel.name 
                                  : `هتل ${index + 1}`}
                              </h3>
                              {hotelItem.hotel && typeof hotelItem.hotel === 'object' && 'city' in hotelItem.hotel && (
                                <div className="text-sm text-gray-500">
                                  {hotelItem.hotel.city}{hotelItem.hotel.country ? `, ${hotelItem.hotel.country}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 text-sm font-medium">
                            {hotelItem.stayDuration} روز اقامت
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">وعده‌های غذایی روز اول</div>
                            <div className="flex gap-2">
                              {hotelItem.firstMeal?.sobhane && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">صبحانه</span>
                              )}
                              {hotelItem.firstMeal?.nahar && (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">ناهار</span>
                              )}
                              {hotelItem.firstMeal?.sham && (
                                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">شام</span>
                              )}
                              {!hotelItem.firstMeal?.sobhane && !hotelItem.firstMeal?.nahar && !hotelItem.firstMeal?.sham && (
                                <span className="text-gray-500 text-xs">بدون وعده غذایی</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">وعده‌های غذایی روز آخر</div>
                            <div className="flex gap-2">
                              {hotelItem.lastMeal?.sobhane && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">صبحانه</span>
                              )}
                              {hotelItem.lastMeal?.nahar && (
                                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">ناهار</span>
                              )}
                              {hotelItem.lastMeal?.sham && (
                                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">شام</span>
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
                <div className="flex items-center gap-4">
                  <div className={`text-sm px-3 py-1 rounded-full ${
                    remainingCapacity > 10 ? 'bg-green-100 text-green-700' : 
                    remainingCapacity > 0 ? 'bg-orange-100 text-orange-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    ظرفیت باقی‌مانده: {remainingCapacity} نفر
                  </div>
                  <button
                    onClick={() => setIsReservationModalOpen(true)}
                    className={`px-4 py-2 rounded-lg shadow-md flex items-center text-sm ${
                      remainingCapacity > 0 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                    disabled={remainingCapacity <= 0}
                  >
                    <FaPlus className="ml-1" />
                    افزودن رزرو
                  </button>
                </div>
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
                    <table className="w-full min-w-full divide-y divide-gray-200 rounded-lg shadow-sm border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع رزرو</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ کل</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رزرو کننده</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ ثبت</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center justify-center">
                              <FaCog className="ml-1" />
                              عملیات
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservations.map((reservation) => (
                          <tr 
                            key={reservation._id} 
                            className="hover:bg-indigo-50/50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => goToPassengerManagement(reservation._id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                  reservation.type === 'self' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-purple-100 text-purple-800 border border-purple-300'
                                }`}>
                                  {reservation.type === 'self' ? (
                                    <>
                                      <FaUserAlt className="ml-1.5 text-xs" />
                                      شخصی
                                    </>
                                  ) : (
                                    <>
                                      <FaUserFriends className="ml-1.5 text-xs" />
                                      ادمین
                                    </>
                                  )}
                                </span>
                                {reservation.type === 'admin' && reservation.admin && (
                                  <span className="mr-2 text-gray-700 text-xs bg-gray-100 px-2 py-1 rounded">{reservation.admin.fullName}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">
                                  {reservation.count} نفر
                                  {((reservation.actualAdults ?? 0) + (reservation.actualChildren ?? 0) + (reservation.actualInfants ?? 0)) > 0 && (
                                    <span className="mr-1 font-normal text-xs text-gray-500">
                                      (ظرفیت)
                                    </span>
                                  )}
                                </span>
                                <div className="flex mt-1 gap-1.5">
                                  {(reservation.actualAdults ?? 0) > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700">
                                      <FaUserAlt className="ml-1 text-[10px]" />
                                      {reservation.actualAdults} بزرگسال
                                    </span>
                                  )}
                                  {(reservation.actualChildren ?? 0) > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700">
                                      <FaChild className="ml-1 text-[10px]" />
                                      {reservation.actualChildren} کودک
                                    </span>
                                  )}
                                  {(reservation.actualInfants ?? 0) > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-700">
                                      <FaBaby className="ml-1 text-[10px]" />
                                      {reservation.actualInfants} نوزاد
                                    </span>
                                  )}
                                  {((reservation.actualAdults ?? 0) === 0 && (reservation.actualChildren ?? 0) === 0 && (reservation.actualInfants ?? 0) === 0) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                                      <FaUserFriends className="ml-1 text-[10px]" />
                                      هنوز مسافری ثبت نشده
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                <FaMoneyBillWave className="text-green-600 ml-2" />
                                <span className="font-bold">{reservation.totalPrice.toLocaleString('fa-IR')} تومان</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                reservation.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-300' :
                                'bg-red-100 text-red-800 border border-red-300'
                              }`}>
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${
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
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center ml-2 text-indigo-600">
                                  {reservation.createdBy?.fullName?.charAt(0) || '?'}
                                </div>
                                <span className="text-gray-700">{reservation.createdBy?.fullName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <FaClock className="text-gray-400 ml-1.5" />
                                <span>{formatDate(reservation.createdAt)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusChange(reservation._id, 'confirmed')
                                  }}
                                  className={`inline-flex items-center justify-center p-2 rounded-full transition-all ${
                                    reservation.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-600 cursor-default' 
                                      : 'bg-gray-100 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:shadow-md'
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
                                  className={`inline-flex items-center justify-center p-2 rounded-full transition-all ${
                                    reservation.status === 'canceled' 
                                      ? 'bg-red-100 text-red-600 cursor-default' 
                                      : 'bg-gray-100 text-red-600 hover:bg-red-100 hover:text-red-700 hover:shadow-md'
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
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FaPlus, FaUsers, FaBed, FaCheck, FaArrowLeft, FaUserPlus, FaPassport, FaClipboardList, FaMale, FaFemale, FaChild, FaBaby, FaFileAlt, FaTicketAlt, FaFileExcel, FaPlane } from 'react-icons/fa'
import Link from 'next/link'
import RoomCard from './RoomCard'
import PassengerModal from './PassengerModal'
import AddRoomModal from './AddRoomModal'
import EditRoomModal from './EditRoomModal'
import DeleteRoomModal from './DeleteRoomModal'
import FinalizeModal from './FinalizeModal'
import PassengerListModal from './PassengerListModal'
import TicketGenerator from '@/components/ticket/TicketGenerator'

// تعریف انواع داده
interface Reservation {
  _id: string
  package: {
    _id: string
    name: string
    title?: string
    description?: string
    startDate: string
    endDate: string
    basePrice: number
    route?: any
    capacity?: number
    airline?: string
    hotel?: string | { name: string }
    price?: number
  }
  type: 'self' | 'admin'
  count: number
  adults: number
  children: number
  infants: number
  admin?: {
    _id: string
    fullName: string
  }
  status: 'pending' | 'confirmed' | 'canceled'
  createdBy: {
    user: string
    fullName: string
  }
  code?: string
  room: string
  totalPrice: number
  createdAt: string
}

interface Room {
  _id: string
  reservation: string
  type: string
  bedType: string
  capacity: number
  currentOccupancy: number
  price: number
  extraBed: boolean
  status: 'available' | 'occupied' | 'reserved'
  notes?: string
}

interface Passenger {
  _id: string
  reservation: string
  room: string
  firstName: string
  lastName: string
  englishFirstName: string
  englishLastName: string
  nationalId: string
  passportNumber: string
  birthDate: string
  passportExpiryDate: string
  gender: 'male' | 'female'
  ageCategory: 'adult' | 'child' | 'infant'
  notes?: string
}

interface ReservationStats {
  totalCapacity: number
  totalPassengers: number
  remainingCapacity: number
  byAgeCategory: {
    adults: number
    children: number
    infants: number
  }
  byGender: {
    males: number
    females: number
  }
  adultsNeeded: number
  childrenNeeded: number
  infantsNeeded: number
}

export default function PassengerManagement() {
  const params = useParams()
  const router = useRouter()
  const { packageId, reservationId } = params
  
  const [isLoading, setIsLoading] = useState(true)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [stats, setStats] = useState<ReservationStats | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false)
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false)
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false)
  const [isDeleteRoomModalOpen, setIsDeleteRoomModalOpen] = useState(false)
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false)
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null)
  const [isPassengerListModalOpen, setIsPassengerListModalOpen] = useState(false)
  const [isDownloadingReservationExcel, setIsDownloadingReservationExcel] = useState(false)
  const [isDownloadingTicketExcel, setIsDownloadingTicketExcel] = useState(false)
  const [isGeneratingTickets, setIsGeneratingTickets] = useState(false)
  const [ticketTypeModalOpen, setTicketTypeModalOpen] = useState(false)
  
  // بارگذاری اطلاعات رزرو
  const fetchReservation = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('توکن یافت نشد')
        return
      }

      const response = await axios.get(`http://185.94.99.35:5000/api/reservations/${reservationId}`, {
        headers: {
          'x-auth-token': token
        }
      })
      setReservation(response.data)
      console.log('وضعیت رزرو:', response.data.status)
    } catch (error) {
      console.error('خطا در دریافت اطلاعات رزرو:', error)
      toast.error('خطا در دریافت اطلاعات رزرو')
    }
  }
  
  // بارگذاری آمار رزرو
  const fetchStats = async () => {
    try {
      const response = await axios.get(`http://185.94.99.35:5000/api/passengers/stats/reservation/${reservationId}`)
      setStats(response.data)
    } catch (error) {
      console.error('خطا در دریافت آمار رزرو:', error)
      toast.error('خطا در دریافت آمار رزرو')
    }
  }
  
  // بارگذاری اتاق‌ها
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`http://185.94.99.35:5000/api/rooms/reservation/${reservationId}`)
      setRooms(response.data)
    } catch (error) {
      console.error('خطا در دریافت اتاق‌ها:', error)
      toast.error('خطا در دریافت اتاق‌ها')
    }
  }
  
  // بارگذاری مسافران
  const fetchPassengers = async () => {
    try {
      const response = await axios.get(`http://185.94.99.35:5000/api/passengers/reservation/${reservationId}`)
      setPassengers(response.data)
    } catch (error) {
      console.error('خطا در دریافت مسافران:', error)
      toast.error('خطا در دریافت مسافران')
    }
  }
  
  // بارگذاری تمام داده‌ها
  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchReservation(),
        fetchStats(),
        fetchRooms(),
        fetchPassengers()
      ])
    } catch (error) {
      console.error('خطا در بارگذاری داده‌ها:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // باز کردن مودال انتخاب نوع بلیط
  const openTicketTypeModal = () => {
    setTicketTypeModalOpen(true);
  };

  // بستن مودال انتخاب نوع بلیط
  const closeTicketTypeModal = () => {
    setTicketTypeModalOpen(false);
  };

  // تولید بلیط‌های PDF برای مسافران این رزرواسیون
  const generateReservationTickets = async (ticketType: 'departure' | 'return' | 'both') => {
    try {
      setIsGeneratingTickets(true);
      closeTicketTypeModal();

      const token = localStorage.getItem('token');
      
      // درخواست به API برای تولید بلیط‌ها
      const response = await axios.post(
        `http://185.94.99.35:5000/api/packages/reservation/${reservationId}/generate-tickets`,
        { ticketType },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.success) {
        // هدایت کاربر به لینک دانلود بلیط‌ها
        window.open(`http://185.94.99.35:5000/api/packages/download-ticket/${response.data.fileName}`, '_blank');
        
        // نمایش پیام موفقیت
        toast.success(`بلیط‌های ${response.data.passengerCount} مسافر با موفقیت تولید شد`);
      }
    } catch (error: any) {
      console.error('خطا در تولید بلیط‌ها:', error);
      const errorMessage = error.response?.data?.message || 'خطا در تولید بلیط‌ها';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingTickets(false);
    }
  };
  
  // ثبت نهایی رزرو
  const handleFinalSubmit = async () => {
    if (!stats || !stats.isComplete || (reservation && reservation.status === 'confirmed')) {
      return
    }
    
    setIsFinalizeModalOpen(true)
  }
  
  // دریافت مسافران یک اتاق
  const getRoomPassengers = (roomId: string) => {
    return passengers.filter(passenger => passenger.room === roomId)
  }
  
  // باز کردن مودال افزودن مسافر برای یک اتاق
  const openAddPassengerModal = (room: Room) => {
    setSelectedRoom(room)
    setSelectedPassenger(null) // حالت افزودن
    setIsPassengerModalOpen(true)
  }
  
  // باز کردن مودال ویرایش مسافر
  const openEditPassengerModal = (passenger: Passenger) => {
    const room = rooms.find(r => r._id === passenger.room) || null
    setSelectedRoom(room)
    setSelectedPassenger(passenger)
    setIsPassengerModalOpen(true)
  }
  
  // حذف مسافر
  const handleDeletePassenger = async (passengerId: string) => {
    if (!confirm('آیا از حذف این مسافر اطمینان دارید؟')) return
    
    try {
      await axios.delete(`http://185.94.99.35:5000/api/passengers/${passengerId}`)
      toast.success('مسافر با موفقیت حذف شد')
      fetchAllData() // بارگذاری مجدد داده‌ها
    } catch (error) {
      console.error('خطا در حذف مسافر:', error)
      toast.error('خطا در حذف مسافر')
    }
  }
  
  // باز کردن مودال ویرایش اتاق
  const openEditRoomModal = (room: Room) => {
    setSelectedRoom(room)
    setIsEditRoomModalOpen(true)
  }
  
  // باز کردن مودال حذف اتاق
  const openDeleteRoomModal = (room: Room) => {
    setSelectedRoom(room)
    setIsDeleteRoomModalOpen(true)
  }
  
  // تابع دانلود اکسل مسافران رزرو
  const handleDownloadReservationExcel = async () => {
    if (!reservationId) return;
    setIsDownloadingReservationExcel(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://185.94.99.35:5000/api/passengers/reservation/${reservationId}/excel`,
        {
          responseType: 'blob', // دریافت پاسخ به صورت blob
          headers: {
            'x-auth-token': token,
          },
        }
      );

      // ایجاد لینک دانلود
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `reservation_${reservation?.code || reservationId}_passengers.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // پاکسازی لینک
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('فایل اکسل با موفقیت دانلود شد');

    } catch (error: any) {
      console.error('خطا در دانلود اکسل رزرو:', error);
      if (error.response && error.response.status === 404) {
        toast.warn('هیچ مسافری برای دانلود در این رزرو یافت نشد.');
      } else {
        toast.error('خطا در دانلود فایل اکسل');
      }
    } finally {
      setIsDownloadingReservationExcel(false);
    }
  };
  
  // تابع دانلود اکسل بلیط مسافران رزرو (بر اساس قالب ticket.xlsx)
  const handleDownloadReservationTicketExcel = async () => {
    if (!reservationId) return;
    setIsDownloadingTicketExcel(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://185.94.99.35:5000/api/passengers/reservation/${reservationId}/ticket-excel`, // <-- New API endpoint
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
      let fileName = `reservation_${reservation?.code || reservationId}_tickets.xlsx`; // Default filename
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
      console.error('خطا در دانلود اکسل بلیط رزرو:', error);
       if (error.response) {
           if (error.response.status === 404) {
               toast.warn('هیچ مسافری برای دانلود بلیط اکسل در این رزرو یافت نشد.');
           } else {
                // Try to read error message from blob response
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
  
  // اجرای بارگذاری داده‌ها در شروع
  useEffect(() => {
    fetchAllData()
  }, [reservationId])
  
  // تابع کمکی برای تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }
  
  // رندر لودینگ
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="rounded-full h-14 w-14 bg-gradient-to-tr from-indigo-500 to-blue-500 animate-spin flex items-center justify-center">
          <div className="h-9 w-9 rounded-full bg-white"></div>
        </div>
      </div>
    )
  }
  
  // رندر صفحه اصلی
  return (
    <div className="space-y-6">
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div>
          <Link 
            href={`/dashboard/package-management/${packageId}`}
            className="inline-flex items-center text-blue-600 mb-2 transition hover:text-blue-700"
          >
            <FaArrowLeft className="mr-1" /> بازگشت به صفحه پکیج
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت مسافران رزرو <span className="text-indigo-600">{reservation?.code || '...'}</span></h1>
          {reservation && (
            <p className="text-gray-600">
              {reservation.package.name} - {formatDate(reservation.package.startDate)} تا {formatDate(reservation.package.endDate)}
            </p>
          )}
        </div>
        
        {/* نمایش پیشرفت تکمیل مسافران */}
        {stats && (
          <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-800 text-3xl font-bold">
              {stats.totalPassengers}/{stats.totalCapacity}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">مسافر ثبت شده</span>
              <div className="w-32 h-3 rounded-full bg-gray-200 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(stats.totalPassengers / stats.totalCapacity) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* کارت آمار */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium opacity-90">آمار مسافران</h3>
              <FaUsers className="text-2xl opacity-80" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaUsers className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{stats.totalPassengers}</span>
                </div>
                <span className="text-xs opacity-80">کل</span>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaMale className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{stats.byGender.males}</span>
                </div>
                <span className="text-xs opacity-80">مرد</span>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaFemale className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{stats.byGender.females}</span>
                </div>
                <span className="text-xs opacity-80">زن</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium opacity-90">گروه سنی</h3>
              <FaUsers className="text-2xl opacity-80" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaUsers className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{stats.byAgeCategory.adults}</span>
                </div>
                <span className="text-xs opacity-80">بزرگسال</span>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaChild className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{stats.byAgeCategory.children}</span>
                </div>
                <span className="text-xs opacity-80">کودک</span>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaBaby className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{stats.byAgeCategory.infants}</span>
                </div>
                <span className="text-xs opacity-80">نوزاد</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium opacity-90">وضعیت اتاق‌ها</h3>
              <FaBed className="text-2xl opacity-80" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaBed className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{rooms.length}</span>
                </div>
                <span className="text-xs opacity-80">کل</span>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaCheck className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{rooms.filter(r => r.status === 'occupied').length}</span>
                </div>
                <span className="text-xs opacity-80">تکمیل</span>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center">
                  <FaUsers className="mr-1 opacity-80" />
                  <span className="font-bold text-xl">{rooms.reduce((sum, room) => sum + room.capacity, 0)}</span>
                </div>
                <span className="text-xs opacity-80">ظرفیت</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* دکمه‌های عملیات */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setIsAddRoomModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FaPlus />
          افزودن اتاق
        </button>
        
        <button
          onClick={() => setIsPassengerListModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <FaClipboardList />
          لیست مسافران
        </button>
        
        {stats && stats.totalPassengers >= reservation?.count && (
          <button
            onClick={() => setIsFinalizeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FaCheck />
            ثبت نهایی رزرو
          </button>
        )}
        
        {/* دکمه دانلود اکسل رزرو */}
        <button
          onClick={handleDownloadReservationExcel}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm shadow-md ${isDownloadingReservationExcel
              ? 'bg-gray-400 text-white cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          disabled={isDownloadingReservationExcel || rooms.length === 0}
        >
          {isDownloadingReservationExcel ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          ) : (
            <FaFileExcel />
          )}
          <span>{isDownloadingReservationExcel ? 'در حال آماده سازی...' : 'دانلود اکسل مسافران'}</span>
        </button>
      </div>
      
      {/* بخش بلیط‌ها */}
      {reservation && reservation.status === 'confirmed' && passengers.length > 0 && (
        <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <FaTicketAlt className="text-indigo-600" />
            <span>بلیط‌های مسافران</span>
          </h2>
          
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex flex-col gap-4 mb-6">
              <p className="text-gray-600">
                می‌توانید بلیط‌های مسافران را به صورت PDF دریافت کنید.
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={openTicketTypeModal}
                  className={`flex items-center gap-2 py-2 px-4 text-sm font-medium bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none`}
                  disabled={isGeneratingTickets}
                >
                  {isGeneratingTickets ? (
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    <FaTicketAlt />
                  )}
                  <span>{isGeneratingTickets ? 'در حال تولید بلیط‌ها...' : 'تولید بلیط PDF برای همه مسافران'}</span>
                </button>
              </div>
            </div>
            
            <TicketGenerator 
              reservation={reservation} 
              passengers={passengers}
            />
          </div>
        </div>
      )}
      
      {/* بخش اتاق‌ها */}
      <h2 className="text-xl font-bold border-r-4 border-blue-500 pr-2 mt-6">اتاق‌های رزرو شده</h2>
      
      {rooms.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          <FaBed className="text-4xl text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">هنوز هیچ اتاقی اضافه نشده است.</p>
          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            افزودن اتاق
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <RoomCard
              key={room._id}
              room={room}
              passengers={getRoomPassengers(room._id)}
              onAddPassenger={() => openAddPassengerModal(room)}
              onEditPassenger={openEditPassengerModal}
              onDeletePassenger={handleDeletePassenger}
              onEditRoom={openEditRoomModal}
              onDeleteRoom={openDeleteRoomModal}
            />
          ))}
        </div>
      )}
      
      {/* مودال‌ها */}
      {isPassengerModalOpen && selectedRoom && (
        <PassengerModal
          isOpen={isPassengerModalOpen}
          onClose={() => setIsPassengerModalOpen(false)}
          room={selectedRoom}
          reservation={reservationId as string}
          passenger={selectedPassenger}
          onSuccess={fetchAllData}
        />
      )}
      
      {isAddRoomModalOpen && (
        <AddRoomModal
          isOpen={isAddRoomModalOpen}
          onClose={() => setIsAddRoomModalOpen(false)}
          reservation={reservationId as string}
          onSuccess={fetchAllData}
        />
      )}
      
      {isEditRoomModalOpen && selectedRoom && (
        <EditRoomModal
          isOpen={isEditRoomModalOpen}
          onClose={() => setIsEditRoomModalOpen(false)}
          room={selectedRoom}
          onSuccess={fetchAllData}
        />
      )}
      
      {isDeleteRoomModalOpen && selectedRoom && (
        <DeleteRoomModal
          isOpen={isDeleteRoomModalOpen}
          onClose={() => setIsDeleteRoomModalOpen(false)}
          room={selectedRoom}
          onSuccess={fetchAllData}
        />
      )}
      
      {isFinalizeModalOpen && stats && (
        <FinalizeModal
          isOpen={isFinalizeModalOpen}
          onClose={() => setIsFinalizeModalOpen(false)}
          reservationId={reservationId as string}
          packageId={packageId as string}
          reservationStats={stats}
          onSuccess={fetchAllData}
        />
      )}
      
      {/* مودال لیست مسافران */}
      {isPassengerListModalOpen && reservation && (
        <PassengerListModal
          isOpen={isPassengerListModalOpen}
          onClose={() => setIsPassengerListModalOpen(false)}
          passengers={passengers}
          reservationCode={reservation.code || 'بدون کد'}
          totalPrice={reservation.totalPrice}
          rooms={rooms}
        />
      )}
      
      {/* مودال انتخاب نوع بلیط */}
      {ticketTypeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full mx-4 animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 mb-4">انتخاب نوع بلیط</h3>
            <p className="text-gray-500 mb-6">لطفاً نوع بلیط‌هایی که می‌خواهید تولید کنید را انتخاب نمایید.</p>
            
            <div className="space-y-3">
              <button
                onClick={() => generateReservationTickets('departure')}
                className="w-full text-right py-3 px-4 border border-gray-300 rounded-lg hover:bg-blue-50 flex items-center"
              >
                <FaPlane className="ml-3 text-blue-500" />
                <span>فقط بلیط‌های رفت</span>
              </button>
              
              <button
                onClick={() => generateReservationTickets('return')}
                className="w-full text-right py-3 px-4 border border-gray-300 rounded-lg hover:bg-blue-50 flex items-center"
              >
                <FaPlane className="ml-3 transform rotate-180 text-blue-500" />
                <span>فقط بلیط‌های برگشت</span>
              </button>
              
              <button
                onClick={() => generateReservationTickets('both')}
                className="w-full text-right py-3 px-4 border border-gray-300 rounded-lg hover:bg-blue-50 flex items-center"
              >
                <div className="relative ml-3">
                  <FaPlane className="text-blue-500" />
                  <FaPlane className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 rotate-180 text-green-500" />
                </div>
                <span>هر دو نوع بلیط (رفت و برگشت)</span>
              </button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeTicketTypeModal}
                className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
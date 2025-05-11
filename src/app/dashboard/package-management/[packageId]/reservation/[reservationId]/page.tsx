'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FaPlus, FaUsers, FaBed, FaCheck, FaArrowLeft, FaUserPlus, FaPassport, FaClipboardList, FaMale, FaFemale, FaChild, FaBaby, FaFileAlt, FaTicketAlt, FaFileExcel, FaPlane, FaMoneyBillWave } from 'react-icons/fa'
import Link from 'next/link'
import RoomCard from './RoomCard'
import DraggableRoomLayout from './DraggableRoomLayout'
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
  sellingPrices?: {
    adult: number;
    child: number;
    infant: number;
  }
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
  totalAdults: number
  totalChildren: number
  totalInfants: number
  isComplete: boolean
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
  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null)
  
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
      toast.error('خطا در بارگذاری داده‌ها')
    } finally {
      setIsLoading(false)
    }
  }
  
  // باز کردن مودال انتخاب نوع بلیط
  const openTicketTypeModal = () => {
    setSelectedPassengerId(null); // برای همه مسافران
    setTicketTypeModalOpen(true);
  };

  // باز کردن مودال انتخاب نوع بلیط برای یک مسافر خاص
  const openTicketTypeModalForPassenger = (passengerId: string) => {
    setSelectedPassengerId(passengerId);
    setTicketTypeModalOpen(true);
  };

  // بستن مودال انتخاب نوع بلیط
  const closeTicketTypeModal = () => {
    setTicketTypeModalOpen(false);
    setSelectedPassengerId(null);
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
  
  // تولید بلیط PDF برای یک مسافر خاص
  const generateSinglePassengerTicket = async (ticketType: 'departure' | 'return' | 'both') => {
    if (!selectedPassengerId) return;
    
    try {
      setIsGeneratingTickets(true);
      closeTicketTypeModal();

      const token = localStorage.getItem('token');
      
      // درخواست به API برای تولید بلیط
      const response = await axios.post(
        `http://185.94.99.35:5000/api/packages/reservation/${reservationId}/passenger/${selectedPassengerId}/generate-ticket`,
        { ticketType },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.success) {
        // هدایت کاربر به لینک دانلود بلیط
        window.open(`http://185.94.99.35:5000/api/packages/download-ticket/${response.data.fileName}`, '_blank');
        
        // نمایش پیام موفقیت
        toast.success(`بلیط برای ${response.data.passengerName} با موفقیت تولید شد`);
      }
    } catch (error: any) {
      console.error('خطا در تولید بلیط:', error);
      const errorMessage = error.response?.data?.message || 'خطا در تولید بلیط';
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
    <div className="px-6 py-8">
      {/* هدر صفحه */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center">
            <Link 
              href={`/dashboard/package-management/${packageId}`}
              className="ml-2 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <FaArrowLeft />
            </Link>
            <h1 className="text-2xl font-bold">مدیریت مسافران رزرو</h1>
          </div>
          {reservation && (
            <p className="text-slate-600 mt-1">
              رزرو در پکیج <span className="font-medium">{reservation.package.name}</span> با کد <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{reservation.code || 'N/A'}</span>
            </p>
          )}
        </div>
        
        <div className="flex mt-4 md:mt-0 gap-2 flex-wrap">
          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
          >
            <FaPlus className="text-white" />
            افزودن اتاق
          </button>
          
          <button
            onClick={() => setIsPassengerListModalOpen(true)}
            className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
          >
            <FaUsers className="text-white" />
            لیست مسافران
          </button>
          
          <button
            onClick={openTicketTypeModal}
            className="flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition"
          >
            <FaTicketAlt className="text-white" />
            صدور بلیط
          </button>
          
          <button
            onClick={() => setIsFinalizeModalOpen(true)}
            className="flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition"
          >
            <FaCheck className="text-white" />
            تکمیل رزرو
          </button>
        </div>
      </div>
      
      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600">کل مسافران</h3>
            <div className="p-2 bg-blue-500 text-white rounded-md">
              <FaUsers />
            </div>
          </div>
          <div className="flex items-end">
            <span className="text-2xl font-bold">
              {stats?.totalPassengers || 0}
            </span>
            <span className="text-slate-500 mb-1 mr-1">/ {reservation?.count || 0}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ 
                width: `${stats?.totalPassengers && (reservation?.count || 0) > 0 
                  ? (stats.totalPassengers / (reservation?.count || 1)) * 100 
                  : 0}%` 
              }} 
            />
          </div>
        </div>
        
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600">بزرگسالان</h3>
            <div className="p-2 bg-indigo-500 text-white rounded-md">
              <FaMale />
            </div>
          </div>
          <div className="flex items-end">
            <span className="text-2xl font-bold">
              {stats?.byAgeCategory?.adults || 0}
            </span>
            <span className="text-slate-500 mb-1 mr-1">نفر</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ 
                width: `${stats?.byAgeCategory?.adults && (stats?.totalPassengers || 0) > 0
                  ? (stats.byAgeCategory.adults / (stats?.totalPassengers || 1)) * 100 
                  : 0}%` 
              }} 
            />
          </div>
        </div>
        
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600">کودکان</h3>
            <div className="p-2 bg-amber-500 text-white rounded-md">
              <FaChild />
            </div>
          </div>
          <div className="flex items-end">
            <span className="text-2xl font-bold">
              {stats?.byAgeCategory?.children || 0}
            </span>
            <span className="text-slate-500 mb-1 mr-1">نفر</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full" 
              style={{ 
                width: `${stats?.byAgeCategory?.children && (stats?.totalPassengers || 0) > 0
                  ? (stats.byAgeCategory.children / (stats?.totalPassengers || 1)) * 100 
                  : 0}%` 
              }} 
            />
          </div>
        </div>
        
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-600">نوزادان</h3>
            <div className="p-2 bg-pink-500 text-white rounded-md">
              <FaBaby />
            </div>
          </div>
          <div className="flex items-end">
            <span className="text-2xl font-bold">
              {stats?.byAgeCategory?.infants || 0}
            </span>
            <span className="text-slate-500 mb-1 mr-1">نفر</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-pink-500 rounded-full" 
              style={{ 
                width: `${stats?.byAgeCategory?.infants && (stats?.totalPassengers || 0) > 0
                  ? (stats.byAgeCategory.infants / (stats?.totalPassengers || 1)) * 100 
                  : 0}%` 
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* اتاق‌ها و مسافران با قابلیت Drag & Drop */}
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FaBed className="ml-2" />
        اتاق‌ها و مسافران
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DraggableRoomLayout
          rooms={rooms}
          passengers={passengers}
          onAddPassenger={openAddPassengerModal}
          onEditPassenger={openEditPassengerModal}
          onDeletePassenger={handleDeletePassenger}
          onEditRoom={openEditRoomModal}
          onDeleteRoom={openDeleteRoomModal}
          onDataChanged={fetchAllData}
          reservationId={reservationId as string}
        />
      )}
      
      {/* مدال‌ها */}
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
      
      {isFinalizeModalOpen && (
        <FinalizeModal
          isOpen={isFinalizeModalOpen}
          onClose={() => setIsFinalizeModalOpen(false)}
          reservationId={reservationId as string}
          packageId={packageId as string}
          reservationStats={stats}
          onSuccess={fetchAllData}
        />
      )}
      
      {isPassengerListModalOpen && (
        <PassengerListModal
          isOpen={isPassengerListModalOpen}
          onClose={() => setIsPassengerListModalOpen(false)}
          reservationId={reservationId as string}
          passengers={passengers}
          packageDetails={reservation?.package}
        />
      )}
      
      {/* مدال انتخاب نوع بلیط */}
      {ticketTypeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">انتخاب نوع بلیط</h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  closeTicketTypeModal();
                  selectedPassengerId 
                    ? generateSinglePassengerTicket('departure') 
                    : generateReservationTickets('departure');
                }}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center"
              >
                <FaPlane className="ml-2" />
                <span>بلیط رفت</span>
              </button>
              
              <button 
                onClick={() => {
                  closeTicketTypeModal();
                  selectedPassengerId 
                    ? generateSinglePassengerTicket('return') 
                    : generateReservationTickets('return');
                }}
                className="w-full p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg flex items-center"
              >
                <FaPlane className="ml-2 transform rotate-180" />
                <span>بلیط برگشت</span>
              </button>
              
              <button 
                onClick={() => {
                  closeTicketTypeModal();
                  selectedPassengerId 
                    ? generateSinglePassengerTicket('both') 
                    : generateReservationTickets('both');
                }}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg flex items-center"
              >
                <FaTicketAlt className="ml-2" />
                <span>هر دو بلیط</span>
              </button>
            </div>
            
            <div className="mt-5 flex justify-end">
              <button 
                onClick={closeTicketTypeModal}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
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
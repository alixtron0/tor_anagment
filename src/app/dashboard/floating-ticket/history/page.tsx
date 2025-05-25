'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  FaSearch, 
  FaFilePdf, 
  FaTrash, 
  FaEdit, 
  FaSync, 
  FaEye, 
  FaCalendarAlt,
  FaPlane,
  FaUserFriends,
  FaFilter,
  FaArrowUp,
  FaArrowDown,
  FaTimes,
  FaPassport,
  FaUserAlt,
  FaClock,
  FaArrowRight
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import moment from 'moment-jalaali'
import 'moment/locale/fa'
import { 
  getFloatingTicketHistory,
  deleteFloatingTicket,
  regenerateFloatingTicket
} from '@/api/floatingTicketApi'
import PersianDatePicker from '@/components/PersianDatePicker'

// تعریف نوع داده بلیط شناور
interface FloatingTicket {
  _id: string;
  passengers: {
    englishFirstName: string;
    englishLastName: string;
    documentType: 'nationalId' | 'passport';
    documentNumber: string;
    passportExpiry?: string;
    nationality?: string;
    birthDate?: string;
    gender?: 'male' | 'female';
    age?: string;
  }[];
  flightInfo: {
    origin: string;
    destination: string;
    date: string;
    time?: string;
    flightNumber?: string;
    airline?: string;
    price?: string;
    tax?: string;
    total?: string;
    aircraft?: string;
    fromair?: string;
    toair?: string;
  };
  airline?: {
    name: string;
    englishName: string;
    logo?: string;
    aircraftModel?: string;
  };
  sourceType: 'route' | 'city';
  createdBy: {
    _id: string;
    fullName: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
}

export default function FloatingTicketHistory() {
  // استیت‌ها
  const [tickets, setTickets] = useState<FloatingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalRecords: 0
  });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // فیلترهای جستجو
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
    flightNumber: '',
    airline: '',
    passengerName: '',
    documentNumber: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const router = useRouter();

  // دریافت بلیط‌ها
  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      const sortParam = `${sortDirection === 'desc' ? '-' : ''}${sortField}`;
      
      const response = await getFloatingTicketHistory({
        page: pagination.page,
        limit: pagination.limit,
        sort: sortParam,
        ...filters
      });
      
      setTickets(response.tickets);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      toast.error(err.response?.data?.message || 'خطا در دریافت بلیط‌ها');
    } finally {
      setLoading(false);
    }
  };

  // اجرای دریافت بلیط‌ها هنگام تغییر صفحه، فیلترها یا مرتب‌سازی
  useEffect(() => {
    fetchTickets();
  }, [pagination.page, pagination.limit, sortField, sortDirection]);

  // هندلر مرتب‌سازی
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // هندلر تغییر فیلترها
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // هندلر تغییر تاریخ
  const handleDateChange = (field: string, value: string) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  // اعمال فیلترها
  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 }); // برگشت به صفحه اول
    fetchTickets();
  };

  // حذف فیلترها
  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      date: '',
      flightNumber: '',
      airline: '',
      passengerName: '',
      documentNumber: '',
      dateFrom: '',
      dateTo: ''
    });
    // در اینجا باید یک فراخوانی به fetchTickets صورت بگیرد، اما بعد از بروزرسانی state
    setTimeout(() => {
      setPagination({ ...pagination, page: 1 });
      fetchTickets();
    }, 0);
  };

  // تولید مجدد بلیط
  const handleRegenerate = async (ticketId: string) => {
    try {
      setProcessingId(ticketId);
      const response = await regenerateFloatingTicket(ticketId);
      
      // باز کردن لینک دانلود در تب جدید
      if (response.downloadUrl) {
        window.open(`http://185.94.99.35:5000${response.downloadUrl}`, '_blank');
      }
      
      toast.success('بلیط با موفقیت تولید مجدد شد');
    } catch (err: any) {
      console.error('Error regenerating ticket:', err);
      toast.error(err.response?.data?.message || 'خطا در تولید مجدد بلیط');
    } finally {
      setProcessingId(null);
    }
  };

  // حذف بلیط
  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('آیا از حذف این بلیط اطمینان دارید؟')) {
      return;
    }
    
    try {
      setProcessingId(ticketId);
      await deleteFloatingTicket(ticketId);
      toast.success('بلیط با موفقیت حذف شد');
      fetchTickets(); // بازخوانی لیست بلیط‌ها
    } catch (err: any) {
      console.error('Error deleting ticket:', err);
      toast.error(err.response?.data?.message || 'خطا در حذف بلیط');
    } finally {
      setProcessingId(null);
    }
  };

  // ویرایش بلیط
  const handleEdit = (ticketId: string) => {
    router.push(`/dashboard/floating-ticket/edit/${ticketId}`);
  };

  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    return moment(dateString).locale('fa').format('jYYYY/jMM/jDD HH:mm');
  };

  // تغییر صفحه
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            تاریخچه بلیط‌های شناور
          </h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/floating-ticket')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FaPlane />
              <span>ایجاد بلیط جدید</span>
            </button>
            
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors flex items-center gap-2 ${
                filterOpen ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <FaFilter />
              <span>فیلترها</span>
            </button>
          </div>
        </div>
        
        {/* بخش فیلترها */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: filterOpen ? 'auto' : 0,
            opacity: filterOpen ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-8"
        >
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">جستجوی پیشرفته</h2>
              <div className="flex gap-2">
                <button 
                  onClick={applyFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <FaSearch />
                  <span>اعمال فیلتر</span>
                </button>
                
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <FaTimes />
                  <span>حذف فیلترها</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* فیلتر مبدا */}
              <div>
                <label className="block text-gray-700 mb-2">مبدا</label>
                <input
                  type="text"
                  name="origin"
                  value={filters.origin}
                  onChange={handleFilterChange}
                  placeholder="جستجو بر اساس مبدا"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* فیلتر مقصد */}
              <div>
                <label className="block text-gray-700 mb-2">مقصد</label>
                <input
                  type="text"
                  name="destination"
                  value={filters.destination}
                  onChange={handleFilterChange}
                  placeholder="جستجو بر اساس مقصد"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* فیلتر تاریخ پرواز */}
              <div>
                <label className="block text-gray-700 mb-2">تاریخ پرواز</label>
                <PersianDatePicker
                  value={filters.date}
                  onChange={(date) => handleDateChange('date', date)}
                  placeholder="انتخاب تاریخ پرواز"
                  className="w-full"
                />
              </div>
              
              {/* فیلتر شماره پرواز */}
              <div>
                <label className="block text-gray-700 mb-2">شماره پرواز</label>
                <input
                  type="text"
                  name="flightNumber"
                  value={filters.flightNumber}
                  onChange={handleFilterChange}
                  placeholder="مثال: W5112"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* فیلتر شرکت هواپیمایی */}
              <div>
                <label className="block text-gray-700 mb-2">شرکت هواپیمایی</label>
                <input
                  type="text"
                  name="airline"
                  value={filters.airline}
                  onChange={handleFilterChange}
                  placeholder="نام شرکت هواپیمایی"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* فیلتر نام مسافر */}
              <div>
                <label className="block text-gray-700 mb-2">نام مسافر</label>
                <input
                  type="text"
                  name="passengerName"
                  value={filters.passengerName}
                  onChange={handleFilterChange}
                  placeholder="جستجو در نام مسافران"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* فیلتر شماره سند */}
              <div>
                <label className="block text-gray-700 mb-2">شماره پاسپورت یا کد ملی</label>
                <input
                  type="text"
                  name="documentNumber"
                  value={filters.documentNumber}
                  onChange={handleFilterChange}
                  placeholder="جستجو در شماره سند مسافران"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* فیلتر محدوده تاریخ از */}
              <div>
                <label className="block text-gray-700 mb-2">تاریخ ایجاد از</label>
                <PersianDatePicker
                  value={filters.dateFrom}
                  onChange={(date) => handleDateChange('dateFrom', date)}
                  placeholder="از تاریخ"
                  className="w-full"
                />
              </div>
              
              {/* فیلتر محدوده تاریخ تا */}
              <div>
                <label className="block text-gray-700 mb-2">تاریخ ایجاد تا</label>
                <PersianDatePicker
                  value={filters.dateTo}
                  onChange={(date) => handleDateChange('dateTo', date)}
                  placeholder="تا تاریخ"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* جدول بلیط‌ها */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
              <span className="text-indigo-600">در حال بارگذاری بلیط‌ها...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaFilePdf className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">بلیطی یافت نشد</h3>
              <p className="text-gray-500 text-center max-w-md">
                هیچ بلیطی با معیارهای جستجوی شما یافت نشد. فیلترهای خود را تغییر دهید یا بلیط جدید ایجاد کنید.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th 
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('flightInfo.date')}
                    >
                      <div className="flex items-center">
                        <span>تاریخ پرواز</span>
                        {sortField === 'flightInfo.date' && (
                          sortDirection === 'asc' ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      مسیر
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      مسافران
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ایرلاین
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        <span>تاریخ ایجاد</span>
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <React.Fragment key={ticket._id}>
                      <tr className={`hover:bg-gray-50 transition-colors ${detailsId === ticket._id ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {ticket.flightInfo.date}
                            </span>
                            {ticket.flightInfo.time && (
                              <span className="text-xs text-gray-500 flex items-center mt-1">
                                <FaClock className="mr-1" />
                                {ticket.flightInfo.time}
                              </span>
                            )}
                            {ticket.flightInfo.flightNumber && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded mt-1 inline-flex items-center">
                                <FaPlane className="ml-1 text-indigo-400" size={10} />
                                {ticket.flightInfo.flightNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-800">
                              {ticket.flightInfo.origin} به {ticket.flightInfo.destination}
                            </div>
                            {ticket.flightInfo.fromair && ticket.flightInfo.toair && (
                              <div className="text-xs text-gray-500 mt-1">
                                {ticket.flightInfo.fromair} به {ticket.flightInfo.toair}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-1 rounded-full text-blue-500 mr-2">
                              <FaUserFriends />
                            </div>
                            <span className="font-medium text-gray-800">
                              {ticket.passengers.length} مسافر
                            </span>
                          </div>
                          <button 
                            onClick={() => setDetailsId(detailsId === ticket._id ? null : ticket._id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 flex items-center"
                          >
                            {detailsId === ticket._id ? 'بستن جزئیات' : 'مشاهده مسافران'}
                          </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {ticket.airline ? (
                            <div className="font-medium text-gray-800">
                              {ticket.airline.name}
                              {ticket.airline.aircraftModel && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {ticket.airline.aircraftModel}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">تعیین نشده</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-gray-800">
                              {formatDate(ticket.createdAt)}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              توسط: {ticket.createdBy?.fullName || '---'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleRegenerate(ticket._id)}
                              disabled={!!processingId}
                              className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                              title="تولید مجدد بلیط"
                            >
                              {processingId === ticket._id ? (
                                <div className="animate-spin h-4 w-4 border-t-2 border-green-600 rounded-full"></div>
                              ) : (
                                <FaFilePdf />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(ticket._id)}
                              disabled={!!processingId}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                              title="ویرایش بلیط"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(ticket._id)}
                              disabled={!!processingId}
                              className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                              title="حذف بلیط"
                            >
                              {processingId === ticket._id ? (
                                <div className="animate-spin h-4 w-4 border-t-2 border-red-600 rounded-full"></div>
                              ) : (
                                <FaTrash />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* جزئیات بیشتر مسافران */}
                      {detailsId === ticket._id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-indigo-50/70">
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="bg-indigo-100/80 text-xs">
                                    <th className="px-2 py-2 text-right font-medium text-indigo-800">#</th>
                                    <th className="px-2 py-2 text-right font-medium text-indigo-800">نام مسافر</th>
                                    <th className="px-2 py-2 text-right font-medium text-indigo-800">نوع سند</th>
                                    <th className="px-2 py-2 text-right font-medium text-indigo-800">شماره سند</th>
                                    <th className="px-2 py-2 text-right font-medium text-indigo-800">ملیت</th>
                                    <th className="px-2 py-2 text-right font-medium text-indigo-800">تاریخ تولد</th>
                                    <th className="px-2 py-2 text-right font-medium text-indigo-800">جنسیت</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ticket.passengers.map((passenger, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-2 py-2 text-sm text-gray-700">{index + 1}</td>
                                      <td className="px-2 py-2 text-sm font-medium text-gray-800">
                                        <div dir="ltr" className="text-right">
                                          {passenger.englishFirstName} {passenger.englishLastName}
                                        </div>
                                      </td>
                                      <td className="px-2 py-2 text-sm text-gray-700">
                                        {passenger.documentType === 'passport' ? (
                                          <div className="flex items-center">
                                            <FaPassport className="ml-1 text-indigo-500" />
                                            <span>پاسپورت</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center">
                                            <FaUserAlt className="ml-1 text-indigo-500" />
                                            <span>کد ملی</span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-2 py-2 text-sm font-medium">
                                        <div dir="ltr" className="text-right">
                                          {passenger.documentNumber}
                                        </div>
                                      </td>
                                      <td className="px-2 py-2 text-sm text-gray-700">{passenger.nationality || 'Iranian'}</td>
                                      <td className="px-2 py-2 text-sm text-gray-700">{passenger.birthDate || '---'}</td>
                                      <td className="px-2 py-2 text-sm text-gray-700">
                                        {passenger.gender === 'male' ? 'مرد' : passenger.gender === 'female' ? 'زن' : '---'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        
          {/* صفحه‌بندی */}
          {!loading && tickets.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page <= 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  قبلی
                </button>
                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page >= pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  بعدی
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    نمایش{' '}
                    <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>{' '}
                    تا{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.totalRecords)}
                    </span>{' '}
                    از{' '}
                    <span className="font-medium">{pagination.totalRecords}</span>{' '}
                    نتیجه
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px space-x-reverse" aria-label="Pagination">
                    <button
                      onClick={() => changePage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page <= 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">قبلی</span>
                      <FaArrowRight className="h-5 w-5" />
                    </button>
                    
                    {/* دکمه‌های صفحه */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        // اگر کمتر از 5 صفحه داریم، همه را نمایش بده
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        // اگر در صفحات اول هستیم
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        // اگر در صفحات آخر هستیم
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        // در میانه هستیم
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => changePage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => changePage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page >= pagination.totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">بعدی</span>
                      <FaArrowDown className="h-5 w-5 transform rotate-90" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
} 
'use client'

import { useState, useEffect, Fragment } from 'react'
import axios from 'axios'
import { FaEdit, FaTrash, FaSearch, FaFilePdf, FaFileExcel, FaTimes, FaSave, FaUserFriends, FaSpinner, FaCalendarAlt, FaPassport, FaIdCard, FaFilter } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, Transition } from '@headlessui/react'

// تعریف تایپ‌های مورد نیاز
interface Package {
  _id: string
  name: string
  startDate: string
  endDate: string
}

interface Reservation {
  _id: string
  status: 'pending' | 'confirmed' | 'canceled'
  code: string
  package: Package
}

interface Passenger {
  _id: string
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
  notes: string
  createdAt: string
  reservation: Reservation
}

interface PaginationData {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
}

interface EditFormData {
  firstName: string
  lastName: string
  englishFirstName: string
  englishLastName: string
  nationalId: string
  passportNumber: string
  birthDate: string
  passportExpiryDate: string
  gender: 'male' | 'female'
  notes: string
}

export default function AllPassengers() {
  // تعریف state ها
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0
  })
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isExporting, setIsExporting] = useState<boolean>(false)
  
  // state های مربوط به مدال ویرایش
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    firstName: '',
    lastName: '',
    englishFirstName: '',
    englishLastName: '',
    nationalId: '',
    passportNumber: '',
    birthDate: '',
    passportExpiryDate: '',
    gender: 'male',
    notes: ''
  })
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)

  // تبدیل تاریخ میلادی به شمسی
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fa-IR').format(date)
  }

  // تابع دریافت داده‌ها
  const fetchPassengers = async () => {
    setLoading(true)
    try {
      console.log('در حال فراخوانی API...')
      const response = await axios.get(`http://localhost:5000/api/passengers/all`, {
        params: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          search,
          sortBy,
          sortOrder
        }
      })
      console.log('پاسخ دریافت شد:', response.data)
      setPassengers(response.data.passengers || [])
      setPagination(response.data.pagination || {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalItems: 0
      })
      setError(null)
    } catch (err: any) {
      console.error('خطا در فراخوانی API:', err)
      
      // نمایش جزئیات خطا
      let errorMessage = 'خطا در دریافت اطلاعات مسافران'
      if (err.response) {
        // پاسخ سرور با کد خطا دریافت شده
        errorMessage = `خطای ${err.response.status}: ${err.response.data?.message || err.message}`
        console.error('پاسخ خطا:', err.response.data)
      } else if (err.request) {
        // درخواست ارسال شده اما پاسخی دریافت نشده
        errorMessage = 'سرور پاسخی ارسال نکرد. لطفاً بررسی کنید که سرور در حال اجرا باشد.'
      } else {
        // خطای دیگری رخ داده است
        errorMessage = `خطای ناشناخته: ${err.message}`
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // فراخوانی API با تغییر پارامترها
  useEffect(() => {
    fetchPassengers()
  }, [pagination.page, pagination.pageSize, sortBy, sortOrder])

  // تابع جستجو
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 }) // برگشت به صفحه اول
    fetchPassengers()
  }

  // تابع تغییر ترتیب
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // نمایش وضعیت رزرو با رنگ‌های مناسب
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // توابع مربوط به مدال ویرایش
  const openEditModal = (passenger: Passenger) => {
    setEditingPassenger(passenger)
    setEditFormData({
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      englishFirstName: passenger.englishFirstName,
      englishLastName: passenger.englishLastName,
      nationalId: passenger.nationalId,
      passportNumber: passenger.passportNumber,
      birthDate: passenger.birthDate.split('T')[0], // فقط تاریخ بدون زمان
      passportExpiryDate: passenger.passportExpiryDate.split('T')[0], // فقط تاریخ بدون زمان
      gender: passenger.gender,
      notes: passenger.notes || ''
    })
    setIsEditModalOpen(true)
  }
  
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingPassenger(null)
  }
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData({
      ...editFormData,
      [name]: value
    })
  }
  
  const handleUpdatePassenger = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingPassenger) return
    
    setFormSubmitting(true)
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/passengers/${editingPassenger._id}`, 
        editFormData
      )
      
      // به‌روزرسانی لیست مسافران
      setPassengers(passengers.map(p => 
        p._id === editingPassenger._id 
          ? { ...p, ...editFormData }
          : p
      ))
      
      toast.success('اطلاعات مسافر با موفقیت به‌روزرسانی شد')
      closeEditModal()
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی مسافر:', err)
      
      let errorMessage = 'خطا در به‌روزرسانی اطلاعات مسافر'
      if (err.response) {
        errorMessage = `خطا: ${err.response.data?.message || err.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setFormSubmitting(false)
    }
  }
  
  const handleDeletePassenger = async (passengerId: string) => {
    if (!confirm('آیا از حذف این مسافر اطمینان دارید؟')) return
    
    try {
      await axios.delete(`http://localhost:5000/api/passengers/${passengerId}`)
      
      // به‌روزرسانی لیست مسافران
      setPassengers(passengers.filter(p => p._id !== passengerId))
      
      toast.success('مسافر با موفقیت حذف شد')
    } catch (err: any) {
      console.error('خطا در حذف مسافر:', err)
      
      let errorMessage = 'خطا در حذف مسافر'
      if (err.response) {
        errorMessage = `خطا: ${err.response.data?.message || err.message}`
      }
      
      toast.error(errorMessage)
    }
  }

  // تابع خروجی اکسل
  const handleExportExcel = async () => {
    if (passengers.length === 0) {
      return toast.error('هیچ مسافری برای خروجی گرفتن وجود ندارد')
    }

    try {
      setIsExporting(true)
      toast.success('در حال آماده‌سازی خروجی اکسل...')

      // ارسال درخواست به بک‌اند با همان پارامترهای جستجوی فعلی
      const response = await axios.post(
        'http://localhost:5000/api/passengers/export-excel',
        {
          searchQuery: search,
          sortBy,
          sortOrder
        },
        {
          responseType: 'blob'  // برای دریافت داده به صورت بلاب
        }
      )

      // ایجاد آبجکت بلاب و لینک دانلود
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `passengers-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('فایل اکسل با موفقیت دانلود شد')
    } catch (err: any) {
      console.error('خطا در دریافت خروجی اکسل:', err)
      
      let errorMessage = 'خطا در دریافت خروجی اکسل'
      if (err.response) {
        errorMessage = `خطا: ${err.response.data?.message || err.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* هدر صفحه با طراحی مدرن */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">لیست مسافران</h1>
          <p className="text-gray-500 text-sm">مدیریت و مشاهده اطلاعات تمام مسافران سیستم</p>
        </div>
        
        <button 
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-green-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          onClick={handleExportExcel}
          disabled={isExporting || loading}
        >
          {isExporting ? (
            <FaSpinner className="animate-spin mr-1" />
          ) : (
            <FaFileExcel className="text-white/90" />
          )}
          خروجی اکسل
        </button>
      </div>

      {/* کارت‌های اطلاعات آماری با طراحی مدرن و رنگارنگ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-blue-700">تعداد کل مسافران</h3>
            <div className="w-10 h-10 flex-shrink-0 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-sm">
              <FaUserFriends />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pagination.totalItems}</p>
          <div className="w-full h-2 bg-blue-100 mt-4 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-green-700">رزروهای تایید شده</h3>
            <div className="w-10 h-10 flex-shrink-0 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-sm">
              <FaCalendarAlt />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {passengers.filter(p => p.reservation?.status === 'confirmed').length}
          </p>
          <div className="w-full h-2 bg-green-100 mt-4 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: `${passengers.length ? (passengers.filter(p => p.reservation?.status === 'confirmed').length / passengers.length) * 100 : 0}%` }} />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-white to-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-amber-700">در انتظار تایید</h3>
            <div className="w-10 h-10 flex-shrink-0 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-sm">
              <FaPassport />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {passengers.filter(p => p.reservation?.status === 'pending').length}
          </p>
          <div className="w-full h-2 bg-amber-100 mt-4 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${passengers.length ? (passengers.filter(p => p.reservation?.status === 'pending').length / passengers.length) * 100 : 0}%` }} />
          </div>
        </motion.div>
      </div>

      {/* فرم جستجو با طراحی مدرن و رنگارنگ */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        onSubmit={handleSearch} 
        className="mb-6 bg-white backdrop-blur-sm p-6 rounded-xl shadow-sm border-t-4 border-primary"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="جستجو بر اساس نام، نام خانوادگی، شماره ملی یا شماره پاسپورت..."
              className="w-full px-5 py-4 pr-12 border border-blue-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-blue-50/50 text-black placeholder-blue-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <FaSearch className="text-blue-400" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-4 rounded-xl hover:shadow-lg shadow-blue-200 shadow-md transition-all flex-shrink-0 flex items-center justify-center gap-2 min-w-[120px]"
            >
              <FaSearch className="text-sm" />
              جستجو
            </button>
            
            <button
              type="button"
              className="bg-white text-indigo-500 px-4 py-4 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center shadow-sm"
              onClick={() => toast.success('فیلترهای پیشرفته بزودی اضافه می‌شوند')}
            >
              <FaFilter />
            </button>
          </div>
        </div>
      </motion.form>

      {/* نمایش خطا */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FaTimes className="text-red-500" />
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* جدول نمایش مسافران با طراحی مدرن */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-100"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50/80">
                <th 
                  className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('lastName')}
                >
                  <div className="flex items-center">
                    <span>نام و نام خانوادگی</span>
                    {sortBy === 'lastName' && (
                      <span className="mr-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  کد ملی / پاسپورت
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  بسته سفر
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ سفر
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت رزرو
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-5">
                      <div className="flex space-x-4 rtl:space-x-reverse items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : passengers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FaUserFriends className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-lg font-medium">مسافری یافت نشد</p>
                      <p className="text-sm text-gray-400 mt-1">هیچ مسافری با معیارهای جستجوی فعلی وجود ندارد</p>
                    </div>
                  </td>
                </tr>
              ) : (
                passengers.map((passenger) => (
                  <motion.tr 
                    key={passenger._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex-shrink-0 ml-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold shadow-indigo-200 shadow-sm">
                          {passenger.firstName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {passenger.firstName} {passenger.lastName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {passenger.englishFirstName} {passenger.englishLastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <FaIdCard className="text-gray-400 w-3 h-3" />
                        {passenger.nationalId}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <FaPassport className="text-gray-400 w-3 h-3" />
                        {passenger.passportNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {passenger.reservation?.package?.name || 'نامشخص'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        کد رزرو: {passenger.reservation?.code || 'نامشخص'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {passenger.reservation?.package?.startDate ? (
                        <div>
                          <div className="text-sm text-gray-900 flex items-center">
                            <FaCalendarAlt className="text-green-400 w-3 h-3 ml-1" />
                            {formatDate(passenger.reservation.package.startDate)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            تا {passenger.reservation?.package?.endDate ? formatDate(passenger.reservation.package.endDate) : 'نامشخص'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">نامشخص</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {passenger.reservation?.status === 'confirmed' ? (
                        <span className="bg-green-50 text-green-600 py-1 px-3 rounded-full text-xs font-medium inline-flex items-center">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                          تایید شده
                        </span>
                      ) : passenger.reservation?.status === 'canceled' ? (
                        <span className="bg-red-50 text-red-600 py-1 px-3 rounded-full text-xs font-medium inline-flex items-center">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
                          لغو شده
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 py-1 px-3 rounded-full text-xs font-medium inline-flex items-center">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"></div>
                          در انتظار
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                        <button 
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          onClick={() => openEditModal(passenger)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => handleDeletePassenger(passenger._id)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* پاگینیشن با طراحی مدرن */}
      {!loading && passengers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="text-sm text-gray-500 bg-white py-2 px-4 rounded-lg shadow-sm border border-gray-100">
            نمایش <span className="font-medium text-gray-700">{(pagination.page - 1) * pagination.pageSize + 1}</span> تا{' '}
            <span className="font-medium text-gray-700">
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
            </span>{' '}
            از <span className="font-medium text-gray-700">{pagination.totalItems}</span> مسافر
          </div>
          <div className="flex">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className={`
                px-4 py-2 border-t border-b border-r border-gray-200 first:rounded-r-lg first:border-r rounded-none
                ${pagination.page === 1
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-primary'
                }
                transition-colors
              `}
            >
              قبلی
            </button>
            
            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
              const pageNumber = pagination.page <= 3
                ? index + 1
                : pagination.page >= pagination.totalPages - 2
                  ? pagination.totalPages - 4 + index
                  : pagination.page - 2 + index;

              if (pageNumber > 0 && pageNumber <= pagination.totalPages) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPagination({ ...pagination, page: pageNumber })}
                    className={`
                      px-4 py-2 border-t border-b border-r border-gray-200
                      ${pagination.page === pageNumber
                        ? 'bg-primary text-white font-medium'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                      }
                      transition-colors
                    `}
                  >
                    {pageNumber}
                  </button>
                );
              }
              return null;
            })}
            
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className={`
                px-4 py-2 border border-gray-200 last:rounded-l-lg
                ${pagination.page === pagination.totalPages
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-primary'
                }
                transition-colors
              `}
            >
              بعدی
            </button>
          </div>
        </div>
      )}

      {/* مدال ویرایش با طراحی مدرن */}
      <Transition.Root show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeEditModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-blue-900/80 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border-t-4 border-primary">
                  <div className="absolute top-0 left-0 pt-4 pl-4">
                    <button
                      type="button"
                      className="rounded-full p-1.5 bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100 transition-colors"
                      onClick={closeEditModal}
                    >
                      <span className="sr-only">بستن</span>
                      <FaTimes className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                
                  <div className="bg-white px-6 pt-6 pb-8">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-right w-full">
                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 border-b pb-4 mb-5 bg-gradient-to-l from-primary to-blue-600 bg-clip-text text-transparent">
                          ویرایش اطلاعات مسافر
                        </Dialog.Title>
                        <div className="mt-4">
                          <form className="space-y-5" onSubmit={handleUpdatePassenger}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">نام</label>
                                <input
                                  type="text"
                                  name="firstName"
                                  value={editFormData.firstName}
                                  onChange={handleFormChange}
                                  placeholder="نام خود را وارد کنید"
                                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-black placeholder-blue-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">نام خانوادگی</label>
                                <input
                                  type="text"
                                  name="lastName"
                                  value={editFormData.lastName}
                                  onChange={handleFormChange}
                                  placeholder="نام خانوادگی را وارد کنید"
                                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-black placeholder-blue-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">نام انگلیسی</label>
                                <input
                                  type="text"
                                  name="englishFirstName"
                                  value={editFormData.englishFirstName}
                                  onChange={handleFormChange}
                                  placeholder="نام انگلیسی را وارد کنید"
                                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-black placeholder-blue-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">نام خانوادگی انگلیسی</label>
                                <input
                                  type="text"
                                  name="englishLastName"
                                  value={editFormData.englishLastName}
                                  onChange={handleFormChange}
                                  placeholder="نام خانوادگی انگلیسی را وارد کنید"
                                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-black placeholder-blue-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">کد ملی</label>
                                <input
                                  type="text"
                                  name="nationalId"
                                  value={editFormData.nationalId}
                                  onChange={handleFormChange}
                                  placeholder="کد ملی معتبر وارد کنید"
                                  className="w-full px-4 py-3 bg-green-50/50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-black placeholder-green-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">شماره پاسپورت</label>
                                <input
                                  type="text"
                                  name="passportNumber"
                                  value={editFormData.passportNumber}
                                  onChange={handleFormChange}
                                  placeholder="شماره پاسپورت معتبر وارد کنید"
                                  className="w-full px-4 py-3 bg-green-50/50 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-black placeholder-green-300"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">تاریخ تولد</label>
                                <input
                                  type="date"
                                  name="birthDate"
                                  value={editFormData.birthDate}
                                  onChange={handleFormChange}
                                  placeholder="تاریخ تولد"
                                  className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors text-black"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">تاریخ انقضای پاسپورت</label>
                                <input
                                  type="date"
                                  name="passportExpiryDate"
                                  value={editFormData.passportExpiryDate}
                                  onChange={handleFormChange}
                                  placeholder="تاریخ انقضای پاسپورت"
                                  className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors text-black"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">جنسیت</label>
                              <div className="flex gap-4 mt-1">
                                <label className="inline-flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={editFormData.gender === 'male'}
                                    onChange={handleFormChange}
                                    className="form-radio text-primary h-5 w-5 border-blue-400"
                                  />
                                  <span className="mr-2 font-medium text-blue-700">مرد</span>
                                </label>
                                <label className="inline-flex items-center bg-pink-50 px-4 py-2 rounded-lg border border-pink-100 cursor-pointer hover:bg-pink-100 transition-colors">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={editFormData.gender === 'female'}
                                    onChange={handleFormChange}
                                    className="form-radio text-pink-500 h-5 w-5 border-pink-400"
                                  />
                                  <span className="mr-2 font-medium text-pink-700">زن</span>
                                </label>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 pr-1">یادداشت</label>
                              <textarea
                                name="notes"
                                value={editFormData.notes}
                                onChange={handleFormChange}
                                placeholder="یادداشت‌های مهم درباره مسافر را اینجا وارد کنید..."
                                rows={3}
                                className="w-full px-4 py-3 bg-purple-50/50 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-black placeholder-purple-300"
                              />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                              <button
                                type="button"
                                className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                                onClick={closeEditModal}
                              >
                                انصراف
                              </button>
                              <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:shadow-lg hover:from-primary/90 hover:to-blue-600/90 transition-all flex items-center gap-2 shadow-blue-200 shadow-md"
                                disabled={formSubmitting}
                              >
                                {formSubmitting ? (
                                  <>
                                    <FaSpinner className="animate-spin mr-1" />
                                    در حال ذخیره...
                                  </>
                                ) : (
                                  <>
                                    <FaSave className="w-4 h-4" />
                                    ذخیره تغییرات
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
} 
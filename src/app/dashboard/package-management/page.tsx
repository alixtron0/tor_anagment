'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaHotel, FaRoute, FaMapMarkerAlt, FaPlane, FaBus, FaEye, FaEyeSlash, FaSearch, FaFilter, FaSort, FaUserFriends } from 'react-icons/fa'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Package } from '@/components/types'
import moment from 'jalali-moment'
import { useRouter } from 'next/navigation'

// @ts-ignore
const AddPackageModal = require('./AddPackageModal').default;
// @ts-ignore
const DeleteConfirmationModal = require('./DeleteConfirmationModal').default;

export default function PackageManagement() {
  const [packages, setPackages] = useState<Package[]>([])
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [userRole, setUserRole] = useState<string>('')
  const router = useRouter()

  // بارگذاری لیست پکیج‌ها
  const fetchPackages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`http://185.94.99.35:5000/api/packages`, {
        headers: {
          'x-auth-token': token
        }
      })
      console.log('Packages data:', response.data)
      setPackages(response.data)
      setFilteredPackages(response.data)
      setLoading(false)
    } catch (error: any) {
      console.error('خطا در بارگذاری پکیج‌ها:', error)
      
      // نمایش پیام خطای دقیق‌تر
      if (error.response) {
        // خطای سرور با پاسخ
        toast.error(`خطا در بارگذاری پکیج‌ها: ${error.response.data?.message || error.response.statusText}`)
      } else if (error.request) {
        // خطای عدم پاسخ از سرور
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      } else {
        // سایر خطاها
        toast.error(`خطا در بارگذاری پکیج‌ها: ${error.message}`)
      }
      
      setLoading(false)
    }
  }

  // دریافت اطلاعات کاربر
  useEffect(() => {
    const userJson = localStorage.getItem('user')
    if (userJson) {
      try {
        const userData = JSON.parse(userJson)
        setUserRole(userData.role)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    
    fetchPackages()
  }, [])

  // فیلتر و مرتب‌سازی پکیج‌ها
  useEffect(() => {
    let result = [...packages]
    
    // اعمال جستجو
    if (searchTerm) {
      result = result.filter(pkg => 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // اعمال فیلتر وضعیت
    if (filterActive !== null) {
      result = result.filter(pkg => pkg.isActive === filterActive)
    }
    
    // اعمال مرتب‌سازی
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.startDate).getTime()
        const dateB = new Date(b.startDate).getTime()
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
      } else if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      } else if (sortBy === 'price') {
        return sortDirection === 'asc' 
          ? a.basePrice - b.basePrice
          : b.basePrice - a.basePrice
      }
      return 0
    })
    
    setFilteredPackages(result)
  }, [packages, searchTerm, filterActive, sortBy, sortDirection])

  // حذف پکیج
  const handleDeletePackage = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`http://185.94.99.35:5000/api/packages/${id}`, {
        headers: {
          'x-auth-token': token
        }
      })
      
      toast.success('پکیج با موفقیت حذف شد')
      fetchPackages()
      setIsDeleteModalOpen(false)
    } catch (error: any) {
      console.error('خطا در حذف پکیج:', error)
      
      // نمایش پیام خطای دقیق‌تر
      if (error.response) {
        // خطای سرور با پاسخ
        toast.error(`خطا در حذف پکیج: ${error.response.data?.message || error.response.statusText}`)
      } else if (error.request) {
        // خطای عدم پاسخ از سرور
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      } else {
        // سایر خطاها
        toast.error(`خطا در حذف پکیج: ${error.message}`)
      }
    }
  }

  // تغییر وضعیت فعال بودن پکیج
  const togglePackageStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `http://185.94.99.35:5000/api/packages/${id}/toggle-status`,
        { isActive: !currentStatus },
        {
          headers: {
            'x-auth-token': token
          }
        }
      )
      
      toast.success(response.data.message || `پکیج با موفقیت ${currentStatus ? 'غیرفعال' : 'فعال'} شد`)
      fetchPackages()
    } catch (error: any) {
      console.error('خطا در تغییر وضعیت پکیج:', error)
      
      // نمایش پیام خطای دقیق‌تر
      if (error.response) {
        // خطای سرور با پاسخ
        toast.error(`خطا در تغییر وضعیت پکیج: ${error.response.data?.message || error.response.statusText}`)
      } else if (error.request) {
        // خطای عدم پاسخ از سرور
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      } else {
        // سایر خطاها
        toast.error(`خطا در تغییر وضعیت پکیج: ${error.message}`)
      }
    }
  }

  // باز کردن مودال حذف
  const openDeleteModal = (pkg: Package) => {
    setCurrentPackage(pkg)
    setIsDeleteModalOpen(true)
  }

  // باز کردن مودال ویرایش
  const openEditModal = (pkg: Package) => {
    setCurrentPackage(pkg)
    setIsEditing(true)
    setIsAddModalOpen(true)
  }

  // باز کردن مودال افزودن
  const openAddModal = () => {
    setCurrentPackage(null)
    setIsEditing(false)
    setIsAddModalOpen(true)
  }

  // تغییر جهت مرتب‌سازی
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <ToastContainer position="bottom-left" autoClose={5000} rtl />
      
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white rounded-2xl p-6 shadow-lg border-b-4 border-indigo-500">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-full mr-4 text-white shadow-md">
              <FaRoute size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">مدیریت پکیج‌های سفر</h1>
              <p className="text-gray-500 text-sm">مدیریت و مشاهده پکیج‌های سفر</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در پکیج‌ها..."
              className="w-full md:w-64 px-4 py-2 pl-10 bg-indigo-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-gray-700 placeholder-gray-500"
            />
            <span className="absolute left-3 top-2.5 text-indigo-400">
              <FaSearch />
            </span>
          </div>
        </div>

        {/* فیلترها و مرتب‌سازی */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="font-medium text-gray-700 flex items-center">
            <FaFilter className="mr-2 text-indigo-500" />
            <span>فیلترها:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterActive === null ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterActive === true ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              فعال
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterActive === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              غیرفعال
            </button>
          </div>

          <div className="mr-auto flex items-center gap-2">
            <div className="font-medium text-gray-700 flex items-center">
              <FaSort className="mr-2 text-indigo-500" />
              <span>مرتب‌سازی:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-100 border-none rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="date">تاریخ</option>
              <option value="name">نام</option>
              <option value="price">قیمت</option>
            </select>
            <button
              onClick={toggleSortDirection}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg p-1.5 text-gray-700"
              title={sortDirection === 'asc' ? 'صعودی' : 'نزولی'}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* نمایش تعداد نتایج */}
        <div className="mb-4 text-gray-600 font-medium">
          {filteredPackages.length} پکیج یافت شد
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            <span className="mr-4 text-indigo-600 font-medium">در حال بارگذاری...</span>
          </div>
        ) : (
          <>
            {filteredPackages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <FaRoute className="text-indigo-500 text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">هیچ پکیجی یافت نشد</h3>
                <p className="text-gray-600 mb-6">
                  {userRole !== 'admin+' ? 
                    'می‌توانید با کلیک بر روی دکمه زیر، پکیج جدیدی ایجاد کنید.' :
                    'در حال حاضر هیچ پکیجی موجود نیست.'}
                </p>
                {userRole !== 'admin+' && (
                  <button
                    onClick={openAddModal}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2 mx-auto"
                  >
                    <FaPlus />
                    افزودن پکیج جدید
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPackages.map((pkg) => (
                  <motion.div
                    key={pkg._id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden border-t-4 ${
                      pkg.isActive ? 'border-green-500' : 'border-red-500'
                    } hover:shadow-lg transition-all duration-300 cursor-pointer`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => router.push(`/dashboard/package-management/${pkg._id}`)}
                  >
                    {/* تصویر پکیج */}
                    <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden">
                      {pkg.image ? (
                        <img 
                          src={`http://185.94.99.35:5000${pkg.image}`} 
                          alt={pkg.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaRoute className="text-white text-5xl opacity-30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 right-0 p-4 text-white">
                        <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                        <div className="flex items-center text-sm">
                          <FaMapMarkerAlt className="mr-1" />
                          <span>{getRouteName(pkg.route)}</span>
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          pkg.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pkg.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    </div>
                    
                    {/* اطلاعات پکیج */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs text-blue-600 mb-1">تاریخ شروع</div>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-blue-500 ml-2" />
                            <span className="font-medium">{formatDate(pkg.startDate)}</span>
                          </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs text-blue-600 mb-1">تاریخ پایان</div>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-blue-500 ml-2" />
                            <span className="font-medium">{formatDate(pkg.endDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* اطلاعات ادمین ایجادکننده */}
                      <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                        <div className="text-xs text-indigo-600 mb-1">ایجاد شده توسط</div>
                        <div className="flex items-center">
                          <FaUserFriends className="text-indigo-500 ml-2" />
                          <span className="font-medium">{pkg.createdBy?.fullName || 'نامشخص'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-indigo-100 p-2 rounded-full">
                            <FaHotel className="text-indigo-600" />
                          </div>
                          <span className="mr-2 text-gray-700">
                            {pkg.hotels?.length || 0} هتل
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-indigo-100 p-2 rounded-full">
                            {pkg.transportation?.departure === 'havaii' ? (
                              <FaPlane className="text-indigo-600" />
                            ) : (
                              <FaBus className="text-indigo-600" />
                            )}
                          </div>
                          <span className="mr-2 text-gray-700">
                            {pkg.transportation?.departure === 'havaii' ? 'هوایی' : 'زمینی'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-indigo-100 p-2 rounded-full">
                            <FaCalendarAlt className="text-indigo-600" />
                          </div>
                          <span className="mr-2 text-gray-700">
                            {calculateDuration(pkg.startDate, pkg.endDate)} روز
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">قیمت پایه</div>
                          <div className="text-lg font-bold text-indigo-700">
                            {pkg.basePrice?.toLocaleString('fa-IR')} تومان
                          </div>
                        </div>
                        {userRole !== 'admin+' && (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePackageStatus(pkg._id!, pkg.isActive);
                              }}
                              className={`p-2 rounded-lg ${
                                pkg.isActive 
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                              title={pkg.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                            >
                              {pkg.isActive ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(pkg);
                              }}
                              className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg"
                              title="ویرایش"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(pkg);
                              }}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg"
                              title="حذف"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* دکمه افزودن */}
      {userRole !== 'admin+' && (
        <motion.button
          onClick={openAddModal}
          className="fixed left-6 bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaPlus className="text-xl" />
        </motion.button>
      )}

      {/* مودال افزودن/ویرایش پکیج */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddPackageModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={fetchPackages}
            packageData={null}
            packageToEdit={currentPackage}
            isEditing={isEditing}
          />
        )}
      </AnimatePresence>

      {/* مودال تأیید حذف */}
      <AnimatePresence>
        {isDeleteModalOpen && currentPackage && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={() => handleDeletePackage(currentPackage._id!)}
            title="حذف پکیج"
            message={`آیا از حذف پکیج "${currentPackage.name}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`}
          />
        )}
      </AnimatePresence>
    </div>
  )
} 
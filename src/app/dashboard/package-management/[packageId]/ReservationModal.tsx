'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaSearch, FaUserAlt, FaUserFriends, FaChild, FaBaby, FaBed, FaMoneyBillWave } from 'react-icons/fa'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Package } from '@/components/types'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

interface Admin {
  _id: string
  fullName: string
  role: string
}

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  packageData: Package
  remainingCapacity: number
  onSuccess: () => void
}

interface ReservationType {
  type: 'self' | 'admin'
  count: number
  admin?: string
  services: string[]
}

// کامپوننت اصلی
function ReservationModalComponent({
  isOpen,
  onClose,
  packageData,
  remainingCapacity,
  onSuccess
}: ReservationModalProps) {
  const [availableAdmins, setAvailableAdmins] = useState<Admin[]>([])
  const [adminSearchTerm, setAdminSearchTerm] = useState('')
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [showAdminList, setShowAdminList] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  const { register, watch, control, setValue, handleSubmit, formState: { errors } } = useForm<ReservationType>({
    defaultValues: {
      type: 'self',
      count: 1,
      services: []
    }
  })

  const router = useRouter()
  
  const watchType = watch('type')
  const watchCount = watch('count')
  const watchServices = watch('services')

  // بارگذاری لیست ادمین‌ها
  const fetchAdmins = async () => {
    try {
      setIsLoadingAdmins(true)
      const token = localStorage.getItem('token')
      const response = await axios.get('http://185.94.99.35:5000/api/users/admins', {
        headers: {
          'x-auth-token': token
        }
      })
      
      // فیلتر کردن فقط ادمین‌ها و ادمین+‌ها
      const adminList = response.data.filter((user: Admin) => 
        user.role === 'admin' || user.role === 'admin+'
      )
      
      setAvailableAdmins(adminList)
      setFilteredAdmins(adminList)
    } catch (error) {
      console.error('خطا در بارگذاری لیست ادمین‌ها:', error)
      toast.error('خطا در بارگذاری لیست ادمین‌ها')
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAdmins()
    }
  }, [isOpen])

  // فیلتر کردن ادمین‌ها براساس جستجو
  useEffect(() => {
    if (adminSearchTerm.trim() === '') {
      setFilteredAdmins(availableAdmins)
    } else {
      const filtered = availableAdmins.filter(admin => 
        admin.fullName.toLowerCase().includes(adminSearchTerm.toLowerCase())
      )
      setFilteredAdmins(filtered)
    }
  }, [adminSearchTerm, availableAdmins])

  // محاسبه قیمت کل
  useEffect(() => {
    let price = 0
    
    // قیمت پایه
    price += watchCount * packageData.basePrice
    
    // قیمت خدمات انتخابی
    if (packageData.services && packageData.services.length > 0) {
      const selectedServiceObjects = packageData.services.filter(
        (service: any) => selectedServices.includes(service.name)
      );
      const servicesTotal = selectedServiceObjects.reduce(
        (total: number, service: any) => total + (service.price || 0),
        0
      );
      price += servicesTotal;
    }
    
    // هزینه خدمات
    price += packageData.servicesFee
    
    // ضرب در تعداد افراد
    price *= watchCount
    
    setTotalPrice(price)
  }, [
    watchCount,
    selectedServices,
    packageData
  ])

  // تغییر وضعیت انتخاب خدمات
  const toggleService = (serviceName: string) => {
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(prev => prev.filter(name => name !== serviceName))
    } else {
      setSelectedServices(prev => [...prev, serviceName])
    }
  }

  // انتخاب اولیه خدمات غیرقابل انتخاب
  useEffect(() => {
    if (packageData.services && packageData.services.length > 0) {
      // انتخاب سرویس‌هایی که غیرقابل انتخاب هستند به صورت خودکار
      const nonSelectableServices = packageData.services
        .filter((service: any) => service.selectable === false)
        .map((service: any) => service.name);
      
      setSelectedServices(prev => {
        // فقط سرویس‌های جدید را اضافه می‌کنیم
        const newServices = nonSelectableServices.filter(name => !prev.includes(name));
        return [...prev, ...newServices];
      });
    }
  }, [packageData.services]);

  // انتخاب ادمین
  const selectAdmin = (admin: Admin) => {
    setValue('admin', admin._id)
    setAdminSearchTerm(admin.fullName)
    setShowAdminList(false)
    setSelectedAdmin(admin)
  }

  // دریافت اطلاعات کاربر
  useEffect(() => {
    const userJson = localStorage.getItem('user')
    if (userJson) {
      try {
        const userData = JSON.parse(userJson)
        setUserRole(userData.role)
        
        // اگر کاربر همکار است، نوع رزرو را به شخصی محدود کنیم
        if (userData.role === 'admin+') {
          setValue('type', 'self')
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [setValue])

  // ارسال فرم
  const onSubmit = async (data: ReservationType) => {
    try {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (!storedUser) {
        toast.error('اطلاعات کاربر یافت نشد. لطفاً مجدداً وارد شوید')
        return
      }
      
      // بررسی ظرفیت
      if (data.count > remainingCapacity) {
        toast.error(`ظرفیت کافی برای رزرو وجود ندارد. ظرفیت باقیمانده: ${remainingCapacity} نفر`)
        return
      }
      
      // تبدیل اطلاعات کاربر از JSON به آبجکت
      const parsedUser = JSON.parse(storedUser)
      
      // تنظیم خدمات انتخابی
      data.services = selectedServices
      
      console.log('User data for reservation:', parsedUser)
      console.log('User ID used for reservation:', parsedUser.id || parsedUser._id)
      console.log('Form data being sent:', {
        ...data,
        adults: data.count,
        children: data.count,
        infants: data.count,
        room: 'double',
        totalPrice,
        userId: parsedUser.id || parsedUser._id
      })
      
      const response = await axios.post(
        `http://185.94.99.35:5000/api/reservations/package/${packageData._id}`, 
        {
          ...data,
          adults: data.count, // به جای مقدار ثابت، کل ظرفیت را به عنوان بزرگسال در نظر می‌گیریم
          children: data.count, // کل ظرفیت را به عنوان حداکثر تعداد کودک در نظر می‌گیریم
          infants: data.count, // کل ظرفیت را به عنوان حداکثر تعداد نوزاد در نظر می‌گیریم
          room: 'double', // مقدار پیش‌فرض
          totalPrice,
          userId: parsedUser.id || parsedUser._id // ارسال شناسه کاربر در بدنه درخواست
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token // اضافه کردن توکن به هدر
          }
        }
      )
      
      console.log('Reservation creation response:', response.data)
      toast.success('رزرو با موفقیت ثبت شد')
      onSuccess()
    } catch (error: any) {
      console.error('خطا در ثبت رزرو:', error)
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // نمایش خطای ظرفیت از سرور
        if (error.response.data && error.response.data.message && error.response.data.message.includes('ظرفیت کافی')) {
          toast.error(error.response.data.message)
        } else {
          toast.error(`خطا در ثبت رزرو: ${error.response.data.message || error.response.statusText}`)
        }
      } else if (error.request) {
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      } else {
        toast.error(`خطا در ثبت رزرو: ${error.message}`)
      }
    }
  }

  // اضافه کردن کلاینت-ساید رندرینگ برای بخش انتخاب ادمین
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مودال */}
        <div className="sticky top-0 z-10 bg-indigo-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold">ثبت رزرو جدید</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* نوع رزرو */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">نوع رزرو</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className={`p-4 border rounded-xl flex flex-col items-center cursor-pointer transition-all ${
                watchType === 'self' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="self"
                  {...register("type")}
                  className="hidden"
                />
                <FaUserAlt className="text-3xl mb-2 text-indigo-500" />
                <span className="font-medium">رزرو برای خودم</span>
              </label>
              
              {userRole !== 'admin+' && (
                <label className={`p-4 border rounded-xl flex flex-col items-center cursor-pointer transition-all ${
                  watchType === 'admin' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    value="admin"
                    {...register("type")}
                    className="hidden"
                  />
                  <FaUserFriends className="text-3xl mb-2 text-indigo-500" />
                  <span className="font-medium">رزرو برای ادمین</span>
                </label>
              )}
            </div>
          </div>

          {/* انتخاب ادمین (در صورت انتخاب گزینه ادمین) */}
          {watchType === 'admin' && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                انتخاب ادمین
              </label>
              <div className="relative">
                <div className="flex">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={adminSearchTerm}
                      onChange={(e) => setAdminSearchTerm(e.target.value)}
                      onFocus={() => setShowAdminList(true)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      placeholder="جستجوی ادمین..."
                    />
                    <span className="absolute left-3 top-3 text-gray-400">
                      <FaSearch />
                    </span>
                  </div>
                </div>
                
                {/* لیست ادمین‌ها - فقط در سمت کلاینت رندر شود */}
                {isMounted && showAdminList && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-20 right-0 left-0 mt-1 border border-gray-200 rounded-lg shadow-lg bg-white max-h-48 overflow-y-auto"
                  >
                    {isLoadingAdmins ? (
                      <div className="p-4 text-center text-gray-500">
                        در حال بارگذاری...
                      </div>
                    ) : filteredAdmins.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        هیچ ادمینی یافت نشد
                      </div>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <div
                          key={admin._id}
                          onClick={() => selectAdmin(admin)}
                          className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center"
                        >
                          <span>{admin.fullName}</span>
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                            {admin.role === 'admin+' ? 'ادمین+' : 'ادمین'}
                          </span>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
              {errors.admin && <div className="text-red-500 text-sm mt-1">{errors.admin.message}</div>}
              {selectedAdmin && (
                <div className="mt-2 p-2 bg-indigo-50 rounded-lg flex justify-between items-center">
                  <span className="font-medium">{selectedAdmin.fullName}</span>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {selectedAdmin.role === 'admin+' ? 'ادمین+' : 'ادمین'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* تعداد رزرو */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 font-medium">تعداد رزرو</label>
              <span className="text-sm text-gray-500">
                ظرفیت باقی‌مانده: {remainingCapacity} نفر
              </span>
            </div>
            <input
              type="number"
              min="1"
              max={remainingCapacity}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              {...register("count", {
                required: "تعداد رزرو الزامی است",
                min: { value: 1, message: "تعداد رزرو باید حداقل ۱ باشد" },
                max: { value: remainingCapacity, message: `تعداد رزرو نمی‌تواند بیشتر از ${remainingCapacity} باشد` }
              })}
            />
            {errors.count && <div className="text-red-500 text-sm mt-1">{errors.count.message}</div>}
          </div>

          {/* خدمات اضافی */}
          {isMounted && packageData.services && packageData.services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">خدمات اضافی</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packageData.services.map((service: any, index: number) => (
                  <div 
                    key={index}
                    onClick={() => service.selectable !== false ? toggleService(service.name) : null}
                    className={`flex justify-between items-center p-3 rounded-lg border ${service.selectable === false ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} transition-all ${
                      selectedServices.includes(service.name) 
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.name)}
                        disabled={service.selectable === false}
                        onChange={() => {}} // به خاطر کنترل شده بودن
                        className={`ml-2 h-5 w-5 ${service.selectable !== false ? 'text-indigo-600 focus:ring-indigo-500' : 'text-gray-400'} border-gray-300 rounded`}
                      />
                      <span>{service.name}</span>
                    </div>
                    <div className="font-bold">{service.price?.toLocaleString('fa-IR')} تومان</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* جمع کل */}
          {isMounted && (
            <div className="mt-8 mb-6 bg-indigo-50 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="font-bold text-lg flex items-center">
                  <FaMoneyBillWave className="ml-2 text-indigo-600" />
                  <span>جمع کل:</span>
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  {totalPrice.toLocaleString('fa-IR')} تومان
                </div>
              </div>
              <div className="text-gray-500 text-sm mt-2">
                {watchCount > 1 && (
                  <div className="flex justify-between">
                    <span>قیمت هر نفر:</span>
                    <span>{(totalPrice / watchCount).toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* دکمه‌های عملیات */}
          <div className="flex gap-4 justify-end mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors shadow-md"
            >
              ثبت رزرو
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// بارگذاری کامپوننت به صورت کلاینت-ساید
const ReservationModal = dynamic(() => Promise.resolve(ReservationModalComponent), {
  ssr: false,
});

export default ReservationModal; 
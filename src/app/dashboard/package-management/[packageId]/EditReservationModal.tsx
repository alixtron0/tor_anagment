'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { toast } from 'react-toastify'
import { 
  FaTimes, 
  FaUserFriends, 
  FaMoneyBillWave, 
  FaUser, 
  FaBaby, 
  FaChild, 
  FaBed,
  FaTag,
  FaShoppingCart
} from 'react-icons/fa'
import PriceInput from '@/components/PriceInput'

interface Reservation {
  _id: string;
  package: string;
  type: 'self' | 'admin';
  count: number;
  room: string;
  services: string[];
  totalPrice: number;
  sellingPrices?: {
    adult: number;
    child: number;
    infant: number;
  };
  status: 'pending' | 'confirmed' | 'canceled';
  name?: string;
}

interface Package {
  _id: string;
  name: string;
  capacity: number;
  basePrice: number;
  rooms: {
    single: { price: number, forSale: boolean },
    double: { price: number, forSale: boolean },
    triple: { price: number, forSale: boolean },
    quadruple: { price: number, forSale: boolean },
    quintuple: { price: number, forSale: boolean }
  };
  services: Array<{ _id: string, name: string, price: number }>;
}

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  packageId: string;
  onSuccess: () => void;
}

export default function EditReservationModal({
  isOpen,
  onClose,
  reservationId,
  packageId,
  onSuccess
}: EditReservationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  
  // فرم
  const [formData, setFormData] = useState({
    type: 'self',
    count: 1,
    room: 'double',
    services: [] as string[],
    totalPrice: 0,
    sellingPrices: {
      adult: 0,
      child: 0,
      infant: 0
    },
    name: ''
  })
  
  // بارگذاری اطلاعات پکیج و رزرو
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('token')
        
        // دریافت اطلاعات پکیج
        const packageResponse = await axios.get(`http://185.94.99.35:5000/api/packages/${packageId}`, {
          headers: {
            'x-auth-token': token
          }
        })
        
        // دریافت اطلاعات رزرو
        const reservationResponse = await axios.get(`http://185.94.99.35:5000/api/reservations/${reservationId}`, {
          headers: {
            'x-auth-token': token
          }
        })
        
        setPackageData(packageResponse.data)
        setReservation(reservationResponse.data)
        
        // پر کردن فرم با اطلاعات رزرو
        setFormData({
          type: reservationResponse.data.type,
          count: reservationResponse.data.count,
          room: reservationResponse.data.room,
          services: reservationResponse.data.services || [],
          totalPrice: reservationResponse.data.totalPrice,
          sellingPrices: reservationResponse.data.sellingPrices || {
            adult: packageResponse.data.basePrice || 0,
            child: packageResponse.data.basePrice ? Math.round(packageResponse.data.basePrice * 0.7) : 0,
            infant: packageResponse.data.infantPrice || 0
          },
          name: reservationResponse.data.name || ''
        })
        
      } catch (error) {
        console.error('خطا در بارگذاری اطلاعات:', error)
        toast.error('خطا در بارگذاری اطلاعات رزرو')
        onClose()
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, packageId, reservationId, onClose])
  
  // تغییر فیلدهای فرم
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }
  
  // تغییر خدمات انتخابی
  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => {
      const services = [...prev.services]
      
      if (services.includes(serviceId)) {
        return {
          ...prev,
          services: services.filter(id => id !== serviceId)
        }
      } else {
        return {
          ...prev,
          services: [...services, serviceId]
        }
      }
    })
  }
  
  // تغییر قیمت‌های فروش
  const handleSellingPriceChange = (field: 'adult' | 'child' | 'infant', value: number) => {
    setFormData({
      ...formData,
      sellingPrices: {
        ...formData.sellingPrices,
        [field]: value
      }
    })
  }
  
  // محاسبه قیمت کل
  useEffect(() => {
    if (packageData) {
      // قیمت پایه بر اساس نوع اتاق
      let baseRoomPrice = 0
      
      switch (formData.room) {
        case 'single':
          baseRoomPrice = packageData.rooms.single.price || 0
          break
        case 'double':
          baseRoomPrice = packageData.rooms.double.price || 0
          break
        case 'triple':
          baseRoomPrice = packageData.rooms.triple.price || 0
          break
        case 'quadruple':
          baseRoomPrice = packageData.rooms.quadruple.price || 0
          break
        case 'quintuple':
          baseRoomPrice = packageData.rooms.quintuple.price || 0
          break
        default:
          baseRoomPrice = packageData.basePrice || 0
      }
      
      // محاسبه قیمت بر اساس تعداد
      const basePrice = formData.count * packageData.basePrice
      
      // قیمت خدمات انتخابی
      const servicesPrice = formData.services.reduce((total, serviceId) => {
        const service = packageData.services.find(s => s._id === serviceId)
        return total + (service ? service.price : 0)
      }, 0)
      
      // محاسبه قیمت کل
      const totalPrice = basePrice + servicesPrice
      
      setFormData(prev => ({
        ...prev,
        totalPrice
      }))
    }
  }, [
    formData.type,
    formData.count,
    formData.room,
    formData.services,
    packageData
  ])
  
  // ارسال فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!packageData || !reservation) return
    
    // اعتبارسنجی تعداد مسافران
    if (formData.count < 1) {
      toast.error('حداقل یک مسافر باید داشته باشید')
      return
    }
    
    // اعتبارسنجی ظرفیت
    if (formData.count > packageData.capacity) {
      toast.error(`تعداد مسافران نمی‌تواند بیشتر از ظرفیت پکیج (${packageData.capacity} نفر) باشد`)
      return
    }
    
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.put(
        `http://185.94.99.35:5000/api/reservations/${reservationId}`,
        {
          ...formData,
          package: packageId,
        },
        {
          headers: {
            'x-auth-token': token
          }
        }
      )
      
      toast.success('رزرو با موفقیت به‌روزرسانی شد')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('خطا در به‌روزرسانی رزرو:', error)
      
      if (error.response?.data?.message) {
        toast.error(`خطا: ${error.response.data.message}`)
      } else {
        toast.error('خطا در به‌روزرسانی رزرو')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white/10 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-3xl shadow-xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">ویرایش رزرو</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <FaTimes />
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-6 flex justify-center items-center min-h-[200px]">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            <span className="mr-4 text-indigo-600 font-medium">در حال بارگذاری...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">نام رزرو</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="نام رزرو (اختیاری)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* نوع رزرو */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">نوع رزرو</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                >
                  <option value="self">شخصی</option>
                  <option value="admin">ادمین</option>
                </select>
              </div>
              
              {/* نوع اتاق */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">نوع اتاق</label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                >
                  {packageData?.rooms?.single.forSale && <option value="single">یک تخته</option>}
                  {packageData?.rooms?.double.forSale && <option value="double">دو تخته</option>}
                  {packageData?.rooms?.triple.forSale && <option value="triple">سه تخته</option>}
                  {packageData?.rooms?.quadruple.forSale && <option value="quadruple">چهار تخته</option>}
                  {packageData?.rooms?.quintuple.forSale && <option value="quintuple">پنج تخته</option>}
                </select>
              </div>
              
              {/* تعداد مسافران */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2 flex items-center">
                  <FaUserFriends className="ml-1 text-indigo-500" />
                  تعداد مسافران
                </label>
                <input
                  type="number"
                  name="count"
                  min="1"
                  max={packageData?.capacity || 1}
                  value={formData.count}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
                {packageData && (
                  <div className="text-xs text-gray-500 mt-1">
                    ظرفیت کل: {packageData.capacity} نفر
                  </div>
                )}
              </div>
            </div>
            
            {/* بخش قیمت‌های فروش */}
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <FaShoppingCart className="ml-2 text-indigo-600" />
                <h3 className="text-md font-medium text-gray-800">قیمت‌های فروش</h3>
              </div>
              
              <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* قیمت فروش بزرگسال */}
                  <div>
                    <PriceInput
                      label="قیمت فروش بزرگسال"
                      name="adultSellingPrice"
                      value={formData.sellingPrices.adult}
                      onChange={(value) => handleSellingPriceChange('adult', value)}
                      placeholder="قیمت بزرگسال"
                    />
                  </div>
                  
                  {/* قیمت فروش کودک */}
                  <div>
                    <PriceInput
                      label="قیمت فروش کودک"
                      name="childSellingPrice"
                      value={formData.sellingPrices.child}
                      onChange={(value) => handleSellingPriceChange('child', value)}
                      placeholder="قیمت کودک"
                    />
                  </div>
                  
                  {/* قیمت فروش نوزاد */}
                  <div>
                    <PriceInput
                      label="قیمت فروش نوزاد"
                      name="infantSellingPrice"
                      value={formData.sellingPrices.infant}
                      onChange={(value) => handleSellingPriceChange('infant', value)}
                      placeholder="قیمت نوزاد"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* خدمات اضافی */}
            {packageData?.services && packageData.services.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-800 mb-3">خدمات اضافی</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                  {packageData.services.map((service) => (
                    <div key={service._id} className="flex items-center border rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                      <input
                        type="checkbox"
                        id={`service-${service._id}`}
                        checked={formData.services.includes(service._id)}
                        onChange={() => handleServiceChange(service._id)}
                        className="ml-3 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor={`service-${service._id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm text-gray-800">{service.name}</div>
                        <div className="text-xs text-gray-500">{service.price.toLocaleString('fa-IR')} تومان</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* قیمت کل */}
            <div className="mt-6 p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-indigo-700 font-bold text-md">
                  <FaMoneyBillWave className="ml-2" />
                  قیمت کل
                </div>
                <div className="text-xl font-bold text-indigo-700">
                  {formData.totalPrice.toLocaleString('fa-IR')} تومان
                </div>
              </div>
            </div>
            
            {/* دکمه‌های اقدام */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors shadow-md flex items-center"
              >
                {isSubmitting && (
                  <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                به‌روزرسانی رزرو
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
} 
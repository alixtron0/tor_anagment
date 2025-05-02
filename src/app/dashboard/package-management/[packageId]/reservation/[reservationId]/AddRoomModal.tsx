'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaBed, FaPlus } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-toastify'

interface AddRoomModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: string
  onSuccess: () => void
}

interface RoomFormData {
  type: string
  capacity: number
  notes?: string
}

const roomTypes = [
  { value: 'single', label: 'یک تخته' },
  { value: 'double', label: 'دو تخته' },
  { value: 'triple', label: 'سه تخته' },
  { value: 'quadruple', label: 'چهار تخته' },
  { value: 'quintuple', label: 'پنج تخته' },
  { value: 'family', label: 'خانوادگی' },
  { value: 'vip', label: 'ویژه' },
  { value: 'shared', label: 'اشتراکی' }
]

export default function AddRoomModal({ 
  isOpen, 
  onClose, 
  reservation, 
  onSuccess 
}: AddRoomModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // تنظیم فرم
  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    formState: { errors } 
  } = useForm<RoomFormData>({
    defaultValues: {
      type: 'double',
      capacity: 2,
      notes: ''
    }
  })
  
  const watchRoomType = watch('type')
  
  // تنظیم ظرفیت پیش‌فرض بر اساس نوع اتاق
  const updateCapacityBasedOnType = (type: string) => {
    switch (type) {
      case 'single':
        setValue('capacity', 1)
        break
      case 'double':
        setValue('capacity', 2)
        break
      case 'triple':
        setValue('capacity', 3)
        break
      case 'quadruple':
        setValue('capacity', 4)
        break
      case 'quintuple':
        setValue('capacity', 5)
        break
      case 'family':
        setValue('capacity', 4)
        break
      case 'vip':
        setValue('capacity', 2)
        break
      case 'shared':
        setValue('capacity', 2)
        break
      default:
        setValue('capacity', 2)
    }
  }
  
  // ارسال فرم
  const onSubmit = async (data: RoomFormData) => {
    setIsSubmitting(true)
    
    try {
      // گرفتن توکن از localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('توکن احراز هویت یافت نشد')
      }
      
      // اضافه کردن توکن به هدر درخواست
      await axios.post('http://185.94.99.35:5000/api/rooms', {
        ...data,
        reservation
      }, {
        headers: {
          'x-auth-token': token
        }
      })
      
      toast.success('اتاق با موفقیت اضافه شد')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('خطا در ثبت اتاق:', error)
      
      if (error.response?.status === 401) {
        toast.error('شما مجوز لازم برای ایجاد اتاق را ندارید. لطفاً دوباره وارد سیستم شوید')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('خطا در ثبت اطلاعات اتاق')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مودال */}
        <div className="sticky top-0 z-10 bg-indigo-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaPlus className="ml-2" />
            افزودن اتاق جدید
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* نوع اتاق */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              نوع اتاق <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.type ? 'border-red-300' : 'border-gray-300'}`}
              {...register("type", { required: "نوع اتاق الزامی است" })}
              onChange={(e) => {
                setValue('type', e.target.value)
                updateCapacityBasedOnType(e.target.value)
              }}
            >
              {roomTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-red-500 text-sm">{errors.type.message}</p>}
          </div>
          
          {/* ظرفیت */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              ظرفیت (نفر) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="6"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`}
              {...register("capacity", { 
                required: "ظرفیت اتاق الزامی است",
                min: { value: 1, message: "ظرفیت باید حداقل 1 نفر باشد" },
                max: { value: 6, message: "ظرفیت حداکثر 6 نفر می‌تواند باشد" }
              })}
            />
            {errors.capacity && <p className="mt-1 text-red-500 text-sm">{errors.capacity.message}</p>}
          </div>
          
          {/* توضیحات */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              توضیحات
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="توضیحات اضافی درباره اتاق..."
              rows={3}
              {...register("notes")}
            ></textarea>
          </div>
          
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
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-colors shadow-md flex items-center"
            >
              {isSubmitting && (
                <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              افزودن اتاق
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
} 
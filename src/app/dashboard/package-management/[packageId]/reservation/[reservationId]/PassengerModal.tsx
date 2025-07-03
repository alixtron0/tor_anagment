'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaUserPlus, FaPassport, FaUser, FaMale, FaFemale } from 'react-icons/fa'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-toastify'
import PersianDatePicker from '@/components/PersianDatePicker'

interface RoomProps {
  _id: string
  type: string
  capacity: number
  currentOccupancy: number
  status: 'available' | 'occupied' | 'reserved'
  notes?: string
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
  notes?: string
}

interface PassengerModalProps {
  isOpen: boolean
  onClose: () => void
  room: RoomProps
  reservation: string
  passenger: Passenger | null
  onSuccess: () => void
}

interface PassengerFormData {
  firstName: string
  lastName: string
  englishFirstName: string
  englishLastName: string
  nationalId: string
  passportNumber: string
  birthDate: string
  passportExpiryDate: string
  gender: 'male' | 'female'
  notes?: string
}

export default function PassengerModal({ 
  isOpen, 
  onClose, 
  room, 
  reservation, 
  passenger, 
  onSuccess 
}: PassengerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!passenger
  
  // تنظیم فرم
  const { 
    register, 
    handleSubmit, 
    control,
    setValue,
    watch,
    formState: { errors } 
  } = useForm<PassengerFormData>({
    defaultValues: isEditMode ? {
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      englishFirstName: passenger.englishFirstName,
      englishLastName: passenger.englishLastName,
      nationalId: passenger.nationalId,
      passportNumber: passenger.passportNumber,
      birthDate: passenger.birthDate,
      passportExpiryDate: passenger.passportExpiryDate,
      gender: passenger.gender,
      notes: passenger.notes
    } : {
      gender: 'male',
      notes: ''
    }
  })
  
  const watchGender = watch('gender')
  const watchBirthDate = watch('birthDate')
  
  // محاسبه رده سنی براساس تاریخ تولد
  const calculateAgeCategory = (birthDate: string): 'infant' | 'child' | 'adult' => {
    try {
      const birthMoment = new Date(birthDate)
      const now = new Date()
      const ageInYears = (now.getTime() - birthMoment.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      
      if (ageInYears < 2) {
        return 'infant'
      } else if (ageInYears < 12) {
        return 'child'
      } else {
        return 'adult'
      }
    } catch (error) {
      return 'adult' // پیش‌فرض
    }
  }
  
  // نمایش متن رده سنی
  const getAgeCategoryText = (): string => {
    if (!watchBirthDate) return ''
    
    const category = calculateAgeCategory(watchBirthDate)
    switch (category) {
      case 'infant':
        return 'نوزاد (کمتر از 2 سال)'
      case 'child':
        return 'کودک (2 تا 12 سال)'
      case 'adult':
        return 'بزرگسال (بالای 12 سال)'
      default:
        return ''
    }
  }
  
  // بررسی اعتبار تاریخ انقضای پاسپورت (حداقل 6 ماه)
  const isPassportValid = (expiryDate: string): boolean => {
    try {
      const expiry = new Date(expiryDate)
      const sixMonthsFromNow = new Date()
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
      
      return expiry > sixMonthsFromNow
    } catch (error) {
      return false
    }
  }
  
  // ارسال فرم
  const onSubmit = async (data: PassengerFormData) => {
    // بررسی اعتبار پاسپورت
    if (!isPassportValid(data.passportExpiryDate)) {
      toast.error('تاریخ انقضای پاسپورت باید حداقل 6 ماه از تاریخ امروز اعتبار داشته باشد')
      return
    }
    
    // تعیین رده سنی براساس تاریخ تولد
    const ageCategory = calculateAgeCategory(data.birthDate)
    
    setIsSubmitting(true)
    
    try {
      if (isEditMode) {
        // ویرایش مسافر
        await axios.put(`http://185.94.99.35:5000/api/passengers/${passenger._id}`, {
          ...data,
          ageCategory, // افزودن رده سنی
          room: room._id,
          reservation
        })
        toast.success('مسافر با موفقیت به‌روزرسانی شد')
      } else {
        // افزودن مسافر جدید
        await axios.post('http://185.94.99.35:5000/api/passengers', {
          ...data,
          ageCategory, // افزودن رده سنی
          room: room._id,
          reservation
        })
        toast.success('مسافر با موفقیت اضافه شد')
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('خطا در ثبت مسافر:', error)
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('خطا در ثبت اطلاعات مسافر')
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
          <h2 className="text-xl font-bold flex items-center">
            <FaUserPlus className="ml-2" />
            {isEditMode ? 'ویرایش اطلاعات مسافر' : 'افزودن مسافر جدید'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* اطلاعات اتاق */}
          <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <h3 className="font-bold text-gray-700 mb-2">اطلاعات اتاق</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-gray-500">نوع اتاق:</span>
                <span className="mr-1 font-medium">{room.type}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">ظرفیت:</span>
                <span className="mr-1 font-medium">{room.currentOccupancy} / {room.capacity}</span>
              </div>
            </div>
          </div>
          
          {/* مشخصات فارسی */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                نام <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="نام به فارسی"
                {...register("firstName", { required: "نام الزامی است" })}
              />
              {errors.firstName && <p className="mt-1 text-red-500 text-sm">{errors.firstName.message}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                نام خانوادگی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="نام خانوادگی به فارسی"
                {...register("lastName", { required: "نام خانوادگی الزامی است" })}
              />
              {errors.lastName && <p className="mt-1 text-red-500 text-sm">{errors.lastName.message}</p>}
            </div>
          </div>
          
          {/* مشخصات انگلیسی */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                نام (انگلیسی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.englishFirstName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="First Name"
                {...register("englishFirstName", { required: "نام انگلیسی الزامی است" })}
              />
              {errors.englishFirstName && <p className="mt-1 text-red-500 text-sm">{errors.englishFirstName.message}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                نام خانوادگی (انگلیسی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.englishLastName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Last Name"
                {...register("englishLastName", { required: "نام خانوادگی انگلیسی الزامی است" })}
              />
              {errors.englishLastName && <p className="mt-1 text-red-500 text-sm">{errors.englishLastName.message}</p>}
            </div>
          </div>
          
          {/* جنسیت */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              جنسیت <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`p-4 border rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                watchGender === 'male' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="male"
                  {...register("gender")}
                  className="hidden"
                />
                <FaMale className="text-2xl ml-2 text-indigo-500" />
                <span className="font-medium">مرد</span>
              </label>
              
              <label className={`p-4 border rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                watchGender === 'female' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="female"
                  {...register("gender")}
                  className="hidden"
                />
                <FaFemale className="text-2xl ml-2 text-purple-500" />
                <span className="font-medium">زن</span>
              </label>
            </div>
          </div>
          
          {/* کد ملی و شماره پاسپورت */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                شماره ملی <span className="text-red-500">*</span>
              </label>
              <Controller
                name="nationalId"
                control={control}
                rules={{
                  required: "شماره ملی الزامی است",
                  pattern: {
                    value: /^\d{10}$/,
                    message: "شماره ملی باید دقیقاً 10 رقم باشد"
                  }
                }}
                render={({ field }) => (
                  <input
                    type="text"
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.nationalId || 
                      (field.value && field.value.length > 0 && field.value.length !== 10) 
                        ? 'border-red-300 focus:ring-red-400' 
                        : 'border-gray-300 focus:ring-indigo-400'
                    }`}
                    placeholder="شماره ملی 10 رقمی"
                    maxLength={10}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // فقط اعداد را بپذیر
                      if (/^\d*$/.test(value)) {
                        field.onChange(value);
                      }
                    }}
                    onKeyPress={(e) => {
                      // فقط اعداد را بپذیر
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                )}
                
              />
              {errors.nationalId && <p className="mt-1 text-red-500 text-sm">{errors.nationalId.message}</p>}
              {!errors.nationalId && watch("nationalId") && watch("nationalId").length > 0 && watch("nationalId").length !== 10 && (
                <p className="mt-1 text-red-500 text-sm">
                  کد ملی باید دقیقاً ۱۰ رقم باشد. {10 - watch("nationalId").length} رقم دیگر وارد کنید.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                شماره پاسپورت <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.passportNumber ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="شماره پاسپورت"
                {...register("passportNumber", { required: "شماره پاسپورت الزامی است" })}
              />
              {errors.passportNumber && <p className="mt-1 text-red-500 text-sm">{errors.passportNumber.message}</p>}
            </div>
          </div>
          
          {/* تاریخ تولد و تاریخ انقضای پاسپورت */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                تاریخ تولد <span className="text-red-500">*</span>
              </label>
              <Controller
                name="birthDate"
                control={control}
                rules={{ required: "تاریخ تولد الزامی است" }}
                render={({ field }) => (
                  <PersianDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="انتخاب تاریخ تولد"
                    error={errors.birthDate?.message}
                    className={errors.birthDate ? 'border-red-300' : ''}
                  />
                )}
              />
              {watchBirthDate && (
                <div className="mt-2 text-sm bg-blue-50 text-blue-700 p-2 rounded-lg">
                  {getAgeCategoryText()}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                تاریخ انقضای پاسپورت <span className="text-red-500">*</span>
              </label>
              <Controller
                name="passportExpiryDate"
                control={control}
                rules={{ required: "تاریخ انقضای پاسپورت الزامی است" }}
                render={({ field }) => (
                  <PersianDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="انتخاب تاریخ انقضا"
                    error={errors.passportExpiryDate?.message}
                    className={errors.passportExpiryDate ? 'border-red-300' : ''}
                  />
                )}
              />
              {watch("passportExpiryDate") && !isPassportValid(watch("passportExpiryDate")) && (
                <div className="mt-2 text-sm bg-red-50 text-red-700 p-2 rounded-lg">
                  تاریخ انقضای پاسپورت باید حداقل 6 ماه از تاریخ امروز اعتبار داشته باشد
                </div>
              )}
            </div>
          </div>
          
          {/* توضیحات */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              توضیحات
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="توضیحات اضافی..."
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
              {isEditMode ? 'به‌روزرسانی مسافر' : 'افزودن مسافر'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
} 
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaPhone, FaUser, FaEnvelope, FaMapMarkerAlt, FaCity, FaIdCard, FaUserShield, FaStar } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-toastify'

interface ContactInfoModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: string
  onSuccess: () => void
}

interface ContactInfoFormData {
  contactName: string
  contactPhone: string
  contactEmail?: string
  address?: string
  city?: string
  postalCode?: string
  emergencyName?: string
  emergencyPhone?: string
  notes?: string
}

export default function ContactInfoModal({
  isOpen,
  onClose,
  reservation,
  onSuccess
}: ContactInfoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingData, setExistingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // تنظیم فرم
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactInfoFormData>()
  
  // دریافت اطلاعات موجود (اگر قبلاً ثبت شده باشد)
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!isOpen || !reservation) return
      
      setIsLoading(true)
      try {
        const response = await axios.get(`http://185.94.99.35:5000/api/contactinfo/reservation/${reservation}`)
        setExistingData(response.data)
        reset({
          contactName: response.data.contactName,
          contactPhone: response.data.contactPhone,
          contactEmail: response.data.contactEmail || '',
          address: response.data.address || '',
          city: response.data.city || '',
          postalCode: response.data.postalCode || '',
          emergencyName: response.data.emergencyName || '',
          emergencyPhone: response.data.emergencyPhone || '',
          notes: response.data.notes || ''
        })
      } catch (error) {
        // اگر داده‌ای نبود، خطای 404 می‌آید که مشکلی نیست
        if (axios.isAxiosError(error) && error.response?.status !== 404) {
          console.error('خطا در دریافت اطلاعات تماس:', error)
          toast.error('خطا در دریافت اطلاعات تماس')
        }
        reset({
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          city: '',
          postalCode: '',
          emergencyName: '',
          emergencyPhone: '',
          notes: ''
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchExistingData()
  }, [isOpen, reservation, reset])
  
  // ارسال فرم
  const onSubmit = async (data: ContactInfoFormData) => {
    setIsSubmitting(true)
    
    try {
      await axios.post('http://185.94.99.35:5000/api/contactinfo', {
        ...data,
        reservation
      })
      
      toast.success('اطلاعات تماس با موفقیت ثبت شد')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('خطا در ثبت اطلاعات تماس:', error)
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('خطا در ثبت اطلاعات تماس')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${!isOpen && 'hidden'}`}
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
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaPhone className="ml-2" />
            اطلاعات تماس و آدرس
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              {/* بخش اطلاعات تماس اصلی */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                  <FaUser className="ml-2" />
                  اطلاعات تماس اصلی
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* نام و نام خانوادگی */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      نام و نام خانوادگی <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaUser />
                      </div>
                      <input
                        type="text"
                        className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.contactName ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="نام و نام خانوادگی تماس گیرنده"
                        {...register("contactName", { required: "نام و نام خانوادگی الزامی است" })}
                      />
                    </div>
                    {errors.contactName && <p className="mt-1 text-red-500 text-sm">{errors.contactName.message}</p>}
                  </div>
                  
                  {/* شماره تماس */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      شماره تماس <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaPhone />
                      </div>
                      <input
                        type="tel"
                        className={`w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.contactPhone ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="شماره موبایل"
                        {...register("contactPhone", { 
                          required: "شماره تماس الزامی است",
                          pattern: {
                            value: /^(09|\+989|989)\d{9}$/,
                            message: "شماره موبایل نامعتبر است"
                          }
                        })}
                      />
                    </div>
                    {errors.contactPhone && <p className="mt-1 text-red-500 text-sm">{errors.contactPhone.message}</p>}
                  </div>
                  
                  {/* ایمیل */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      ایمیل
                    </label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FaEnvelope />
                      </div>
                      <input
                        type="email"
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="آدرس ایمیل"
                        {...register("contactEmail", {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "ایمیل نامعتبر است"
                          }
                        })}
                      />
                    </div>
                    {errors.contactEmail && <p className="mt-1 text-red-500 text-sm">{errors.contactEmail.message}</p>}
                  </div>
                </div>
              </div>
              
              {/* بخش آدرس */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <FaMapMarkerAlt className="ml-2" />
                  آدرس
                </h3>
                
                <div className="space-y-4">
                  {/* آدرس کامل */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      آدرس کامل
                    </label>
                    <div className="relative">
                      <div className="absolute right-3 top-3 text-gray-400">
                        <FaMapMarkerAlt />
                      </div>
                      <textarea
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="آدرس کامل محل سکونت"
                        rows={3}
                        {...register("address")}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* شهر */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        شهر
                      </label>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <FaCity />
                        </div>
                        <input
                          type="text"
                          className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="نام شهر"
                          {...register("city")}
                        />
                      </div>
                    </div>
                    
                    {/* کد پستی */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        کد پستی
                      </label>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <FaIdCard />
                        </div>
                        <input
                          type="text"
                          className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="کد پستی 10 رقمی"
                          {...register("postalCode", {
                            pattern: {
                              value: /^\d{10}$/,
                              message: "کد پستی باید 10 رقم باشد"
                            }
                          })}
                        />
                      </div>
                      {errors.postalCode && <p className="mt-1 text-red-500 text-sm">{errors.postalCode.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* بخش تماس اضطراری */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
                  <FaUserShield className="ml-2" />
                  تماس اضطراری
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* نام و نام خانوادگی تماس اضطراری */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      نام و نام خانوادگی
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="نام فرد برای تماس اضطراری"
                      {...register("emergencyName")}
                    />
                  </div>
                  
                  {/* شماره تماس اضطراری */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      شماره تماس
                    </label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="شماره تماس اضطراری"
                      {...register("emergencyPhone", {
                        pattern: {
                          value: /^(0|\+98|98)?\d{10}$/,
                          message: "شماره تماس نامعتبر است"
                        }
                      })}
                    />
                    {errors.emergencyPhone && <p className="mt-1 text-red-500 text-sm">{errors.emergencyPhone.message}</p>}
                  </div>
                </div>
              </div>
              
              {/* بخش توضیحات */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  توضیحات اضافی
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-3 text-gray-400">
                    <FaStar />
                  </div>
                  <textarea
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="هرگونه توضیح اضافی در مورد این رزرو..."
                    rows={3}
                    {...register("notes")}
                  ></textarea>
                </div>
              </div>
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
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors shadow-md flex items-center"
              >
                {isSubmitting && (
                  <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {existingData ? 'بروزرسانی اطلاعات' : 'ثبت اطلاعات'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
} 
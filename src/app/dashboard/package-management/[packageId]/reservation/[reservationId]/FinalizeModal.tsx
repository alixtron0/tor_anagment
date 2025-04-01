'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaCheck, FaClipboard, FaFileInvoice } from 'react-icons/fa'
import axios from 'axios'
import { toast } from 'react-toastify'

interface FinalizeModalProps {
  isOpen: boolean
  onClose: () => void
  reservationId: string
  packageId: string
  reservationStats: ReservationStats
  onSuccess: () => void
}

interface ReservationStats {
  totalPassengers: number
  totalCapacity: number
  totalAdults: number
  totalChildren: number
  totalInfants: number
  adultsNeeded: number
  childrenNeeded: number
  infantsNeeded: number
  isComplete: boolean
  byAgeCategory: {
    adults: number
    children: number
    infants: number
  }
}

export default function FinalizeModal({
  isOpen,
  onClose,
  reservationId,
  packageId,
  reservationStats,
  onSuccess
}: FinalizeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationCode, setReservationCode] = useState<string>('')
  const [success, setSuccess] = useState(false)
  
  // تابع تولید کد رزرو تصادفی
  const generateReservationCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
  
  // ثبت نهایی رزرو
  const handleFinalize = async () => {
    if (!reservationStats.isComplete) {
      toast.error('ظرفیت رزرو تکمیل نشده است')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // گرفتن توکن از localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('توکن احراز هویت یافت نشد')
      }
      
      // تولید کد رزرو
      const code = generateReservationCode()
      
      // ثبت نهایی رزرو
      await axios.put(`http://185.94.99.35:5000/api/reservations/${reservationId}/finalize`, { 
        code,
        status: 'confirmed'
      }, {
        headers: {
          'x-auth-token': token
        }
      })
      
      setReservationCode(code)
      setSuccess(true)
      toast.success('رزرو با موفقیت نهایی شد')
      onSuccess()
    } catch (error: any) {
      console.error('خطا در ثبت نهایی رزرو:', error)
      
      if (error.response?.status === 401) {
        toast.error('شما مجوز لازم برای ثبت نهایی رزرو را ندارید')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('خطا در ثبت نهایی رزرو')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // کپی کد رزرو
  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservationCode)
    toast.info('کد رزرو در کلیپ‌بورد کپی شد')
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
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مودال */}
        <div className="bg-green-600 text-white p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaFileInvoice className="ml-2" />
            تأیید نهایی رزرو
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-green-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheck className="text-3xl" />
              </div>
              
              <h3 className="text-2xl font-bold mb-6">رزرو با موفقیت ثبت شد</h3>
              
              <div className="mb-8">
                <p className="text-gray-600 mb-2">کد رزرو:</p>
                <div className="flex items-center justify-center">
                  <div className="bg-gray-100 px-6 py-3 rounded-lg text-xl font-bold tracking-wider">
                    {reservationCode}
                  </div>
                  <button 
                    onClick={handleCopyCode}
                    className="bg-blue-100 text-blue-600 p-3 rounded-lg mr-2 hover:bg-blue-200"
                  >
                    <FaClipboard />
                  </button>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  بستن
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">وضعیت مسافران</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">کل مسافران:</p>
                    <p className="text-lg font-bold mt-1">
                      {reservationStats.totalPassengers} از {reservationStats.totalCapacity} نفر
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className={`h-2.5 rounded-full ${reservationStats.isComplete ? 'bg-green-600' : 'bg-blue-600'}`}
                        style={{ width: `${(reservationStats.totalPassengers / reservationStats.totalCapacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">وضعیت تکمیل:</p>
                    <p className={`text-lg font-bold mt-1 ${reservationStats.isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                      {reservationStats.isComplete ? 'تکمیل شده' : 'تکمیل نشده'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-3">جزئیات مسافران:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">بزرگسال:</p>
                      <p className="font-bold">
                        {reservationStats.totalAdults} {reservationStats.adultsNeeded > 0 && `(${reservationStats.adultsNeeded} نفر باقیمانده)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">کودک:</p>
                      <p className="font-bold">
                        {reservationStats.totalChildren} {reservationStats.childrenNeeded > 0 && `(${reservationStats.childrenNeeded} نفر باقیمانده)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">نوزاد:</p>
                      <p className="font-bold">
                        {reservationStats.totalInfants} {reservationStats.infantsNeeded > 0 && `(${reservationStats.infantsNeeded} نفر باقیمانده)`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg mb-8 ${reservationStats.isComplete ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  {reservationStats.isComplete ? (
                    <p>تمام ظرفیت رزرو تکمیل شده است و می‌توانید رزرو را نهایی کنید.</p>
                  ) : (
                    <p>برای ثبت نهایی، باید تمام ظرفیت رزرو تکمیل شود.</p>
                  )}
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
                  onClick={handleFinalize}
                  disabled={isSubmitting || !reservationStats.isComplete}
                  className={`px-6 py-3 text-white rounded-lg shadow-md flex items-center ${
                    reservationStats.isComplete
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting && (
                    <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  تأیید نهایی رزرو
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
} 
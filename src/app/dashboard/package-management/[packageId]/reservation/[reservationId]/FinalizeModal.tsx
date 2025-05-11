'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaCheck, FaClipboard, FaFileInvoice, FaExclamationCircle } from 'react-icons/fa'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

interface FinalizeModalProps {
  isOpen: boolean
  onClose: () => void
  reservationId: string
  packageId: string
  reservationStats: ReservationStats | null
  onSuccess: () => void
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

export default function FinalizeModal({
  isOpen,
  onClose,
  reservationId,
  packageId,
  reservationStats,
  onSuccess
}: FinalizeModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationCode, setReservationCode] = useState<string>('')
  const [success, setSuccess] = useState(false)
  
  if (!isOpen) return null
  
  // تابع تولید کد رزرو تصادفی
  const generateReservationCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
  
  // تابع نهایی کردن رزرو
  const handleConfirm = async () => {
    if (!reservationStats) {
      toast.error('اطلاعات رزرو در دسترس نیست. لطفاً صفحه را بارگذاری کنید')
      return
    }
    
    if (!reservationStats.isComplete) {
      toast.error('تعداد مسافران با تعداد اصلی رزرو مطابقت ندارد')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://185.94.99.35:5000/api/reservations/${reservationId}/confirm`, {}, {
        headers: {
          'x-auth-token': token
        }
      })
      
      toast.success('رزرو با موفقیت تایید شد')
      onSuccess()
      onClose()
      
      // بازگشت به صفحه اصلی بسته
      setTimeout(() => {
        router.push(`/dashboard/package-management/${packageId}`)
      }, 1500)
      
    } catch (error) {
      console.error('خطا در تایید رزرو:', error)
      toast.error('خطا در تایید رزرو')
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center">
            <FaCheck className="ml-2 text-green-500" />
            تکمیل و تایید رزرو
          </h2>
        </div>
        
        <div className="p-6">
          {!reservationStats ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-amber-700">
              <div className="flex items-center">
                <FaExclamationCircle className="ml-2 text-amber-500" />
                <span>اطلاعات آماری رزرو در دسترس نیست. لطفاً صفحه را بارگذاری مجدد کنید.</span>
              </div>
            </div>
          ) : (
            <>
              {!reservationStats.isComplete && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
                  <div className="flex items-center">
                    <FaExclamationCircle className="ml-2 text-red-500" />
                    <span>تعداد مسافران با تعداد اصلی رزرو مطابقت ندارد!</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <p className="mb-2 font-medium">وضعیت تکمیل مسافران:</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span>تعداد کل مسافران:</span>
                      <span className={reservationStats.totalPassengers >= reservationStats.totalCapacity ? "text-green-600" : "text-red-600"}>
                        {reservationStats.totalPassengers} / {reservationStats.totalCapacity}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 mb-2">
                      <div 
                        className={`h-2.5 rounded-full ${reservationStats.totalPassengers >= reservationStats.totalCapacity ? "bg-green-600" : "bg-amber-500"}`}
                        style={{ width: `${Math.min(100, (reservationStats.totalPassengers / reservationStats.totalCapacity) * 100)}%` }}
                      ></div>
                    </div>

                    <div className="border-t pt-2 mt-1">
                      <span className="text-sm text-gray-500">جزئیات مسافران:</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>بزرگسالان:</span>
                      <span className="text-gray-600">
                        {reservationStats.byAgeCategory.adults} نفر
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>کودکان:</span>
                      <span className="text-gray-600">
                        {reservationStats.byAgeCategory.children} نفر
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نوزادان:</span>
                      <span className="text-gray-600">
                        {reservationStats.byAgeCategory.infants} نفر
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p>پس از تایید نهایی، وضعیت رزرو به «تایید شده» تغییر می‌کند و امکان صدور مستندات و مدارک سفر فراهم می‌شود.</p>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            disabled={isSubmitting}
          >
            انصراف
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !reservationStats || !reservationStats.isComplete}
            className={`px-4 py-2 rounded-lg transition flex items-center ${
              isSubmitting || !reservationStats || !reservationStats.isComplete
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></span>
                در حال ثبت...
              </>
            ) : (
              <>
                <FaCheck className="ml-1" />
                تایید نهایی
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 
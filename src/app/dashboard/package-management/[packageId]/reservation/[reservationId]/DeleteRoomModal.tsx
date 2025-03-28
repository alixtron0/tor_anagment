'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaTrash } from 'react-icons/fa'
import axios from 'axios'
import { toast } from 'react-toastify'

interface DeleteRoomModalProps {
  isOpen: boolean
  onClose: () => void
  room: {
    _id: string
    type: string
    capacity: number
    currentOccupancy: number
    status: string
  }
  onSuccess: () => void
}

export default function DeleteRoomModal({ 
  isOpen, 
  onClose, 
  room,
  onSuccess
}: DeleteRoomModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  // اتاق‌های پر شده را نمی‌توان حذف کرد
  const hasOccupants = room.currentOccupancy > 0 || room.status === 'occupied'
  
  const handleDelete = async () => {
    if (hasOccupants) {
      toast.error('اتاقی که دارای مسافر است را نمی‌توان حذف کرد')
      return
    }
    
    setIsDeleting(true)
    
    try {
      // گرفتن توکن از localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('توکن احراز هویت یافت نشد')
      }
      
      // اضافه کردن توکن به هدر درخواست
      await axios.delete(`http://localhost:5000/api/rooms/${room._id}`, {
        headers: {
          'x-auth-token': token
        }
      })
      
      toast.success('اتاق با موفقیت حذف شد')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('خطا در حذف اتاق:', error)
      
      if (error.response?.status === 401) {
        toast.error('شما مجوز لازم برای حذف اتاق را ندارید. لطفاً دوباره وارد سیستم شوید')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('خطا در حذف اتاق')
      }
    } finally {
      setIsDeleting(false)
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
        className="bg-white rounded-2xl w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مودال */}
        <div className="sticky top-0 z-10 bg-red-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaTrash className="ml-2" />
            حذف اتاق
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-red-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center">
            {hasOccupants ? (
              <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                <p className="font-bold mb-2">این اتاق دارای {room.currentOccupancy} مسافر است و نمی‌تواند حذف شود.</p>
                <p>ابتدا باید مسافران این اتاق را به اتاق دیگری منتقل کنید.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <FaTrash size={30} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">آیا از حذف این اتاق اطمینان دارید؟</h3>
                <p className="text-gray-500">
                  این عملیات غیرقابل بازگشت است و تمام اطلاعات اتاق حذف خواهد شد.
                </p>
              </>
            )}
          </div>
          
          <div className="flex gap-4 justify-center mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || hasOccupants}
              className={`px-6 py-3 text-white rounded-lg shadow-md flex items-center ${hasOccupants 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-colors'}`}
            >
              {isDeleting && (
                <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              حذف اتاق
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 
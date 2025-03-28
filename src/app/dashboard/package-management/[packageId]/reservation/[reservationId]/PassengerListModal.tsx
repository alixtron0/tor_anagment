'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaFileAlt, FaDownload, FaPrint } from 'react-icons/fa'

interface PassengerListModalProps {
  isOpen: boolean
  onClose: () => void
  passengers: Passenger[]
  reservationCode: string
  totalPrice: number
  services?: Service[]
  rooms: Room[]
}

interface Passenger {
  _id: string
  room: string
  firstName: string
  lastName: string
  englishFirstName: string
  englishLastName: string
  nationalId: string
  passportNumber: string
  birthDate: string
  gender: 'male' | 'female'
  ageCategory: 'adult' | 'child' | 'infant'
}

interface Service {
  name: string
  price: number
}

interface Room {
  _id: string
  type: string
}

export default function PassengerListModal({
  isOpen,
  onClose,
  passengers,
  reservationCode,
  totalPrice,
  services = [],
  rooms
}: PassengerListModalProps) {
  
  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date)
  }
  
  // دریافت نوع اتاق براساس شناسه اتاق
  const getRoomType = (roomId: string) => {
    const room = rooms.find(r => r._id === roomId)
    if (!room) return '---'
    
    switch (room.type) {
      case 'single': return 'یک تخته'
      case 'double': return 'دو تخته'
      case 'triple': return 'سه تخته'
      case 'quadruple': return 'چهار تخته'
      case 'quintuple': return 'پنج تخته'
      case 'family': return 'خانوادگی'
      case 'vip': return 'ویژه'
      case 'shared': return 'اشتراکی'
      default: return room.type
    }
  }
  
  // چاپ لیست
  const handlePrint = () => {
    window.print()
  }
  
  // نمایش مودال فقط اگر باز باشد
  if (!isOpen) return null
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:bg-white print:p-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:rounded-none print:shadow-none"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مودال */}
        <div className="sticky top-0 z-10 bg-indigo-600 text-white p-5 rounded-t-2xl flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold flex items-center">
            <FaFileAlt className="ml-2" />
            لیست مسافران
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
              aria-label="چاپ"
            >
              <FaPrint />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
              aria-label="بستن"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* اطلاعات رزرو */}
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-xl font-bold print:text-2xl">لیست مسافران</h3>
            <div className="text-left">
              <div><span className="font-semibold">کد رزرو:</span> {reservationCode}</div>
              <div><span className="font-semibold">مبلغ کل:</span> {totalPrice.toLocaleString('fa-IR')} ریال</div>
            </div>
          </div>
          
          {/* جدول مسافران */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-right">
                  <th className="border border-gray-200 px-4 py-2">#</th>
                  <th className="border border-gray-200 px-4 py-2">نام و نام خانوادگی</th>
                  <th className="border border-gray-200 px-4 py-2">نام و نام خانوادگی(en)</th>
                  <th className="border border-gray-200 px-4 py-2">نوع اتاق</th>
                  <th className="border border-gray-200 px-4 py-2">خدمات</th>
                  <th className="border border-gray-200 px-4 py-2">تاریخ تولد</th>
                  <th className="border border-gray-200 px-4 py-2">شماره پاسپورت</th>
                  <th className="border border-gray-200 px-4 py-2">قیمت</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((passenger, index) => (
                  <tr key={passenger._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-200 px-4 py-2">{passenger.firstName} {passenger.lastName}</td>
                    <td className="border border-gray-200 px-4 py-2 text-left">{passenger.englishFirstName} {passenger.englishLastName}</td>
                    <td className="border border-gray-200 px-4 py-2">{getRoomType(passenger.room)}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {services.length > 0 ? services.map(s => s.name).join('، ') : '---'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">{formatDate(passenger.birthDate)}</td>
                    <td className="border border-gray-200 px-4 py-2">{passenger.passportNumber || '---'}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {(totalPrice / passengers.length).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* پانویس */}
          <div className="mt-8 text-sm text-gray-600 print:mt-16">
            <p>این لیست شامل {passengers.length} مسافر می‌باشد.</p>
            <p className="mt-1">تاریخ صدور: {new Date().toLocaleDateString('fa-IR')}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 
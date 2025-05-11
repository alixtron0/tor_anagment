'use client'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { FaUsers, FaUserSlash } from 'react-icons/fa'
import DraggablePassenger from './DraggablePassenger'

// Passenger interface with all required properties
interface Passenger {
  _id: string
  firstName: string
  lastName: string
  englishFirstName: string
  englishLastName: string
  gender: 'male' | 'female'
  ageCategory: 'adult' | 'child' | 'infant'
  room: string
  reservation: string
  nationalId: string
  passportNumber: string
  birthDate: string
  passportExpiryDate: string
  notes?: string
}

interface UnassignedPassengersAreaProps {
  passengers: Passenger[]
  onEditPassenger: (passenger: Passenger) => void
  onDeletePassenger: (passengerId: string) => void
  isDragging: boolean
  activeId: string | null
}

export default function UnassignedPassengersArea({
  passengers,
  onEditPassenger,
  onDeletePassenger,
  isDragging,
  activeId
}: UnassignedPassengersAreaProps) {
  // تنظیم ناحیه قابل رها کردن برای مسافران بدون اتاق
  const { isOver, setNodeRef } = useDroppable({
    id: 'unassigned',
    data: {
      type: 'unassigned-area'
    }
  })
  
  // استایل‌های مربوط به حالت‌های مختلف کشیدن و رها کردن
  const dropStyle = isOver 
    ? "border-2 border-amber-400 bg-amber-50/50" 
    : isDragging 
      ? "border border-gray-200 bg-gray-50/80" 
      : "border border-gray-200"
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl overflow-hidden shadow-sm ${dropStyle} transition-all duration-200`}
      ref={setNodeRef}
    >
      {/* هدر */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
        <h3 className="font-bold text-lg flex items-center">
          <FaUserSlash className="ml-2" />
          مسافران بدون اتاق
        </h3>
        <p className="text-amber-100 text-sm mt-1">
          مسافرانی که هنوز به اتاقی اختصاص داده نشده‌اند
        </p>
      </div>
      
      {/* محتوا */}
      <div className="p-4">
        {passengers.length === 0 ? (
          <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg">
            {isOver && isDragging 
              ? <span className="text-amber-600 font-medium">مسافر را اینجا رها کنید</span>
              : "همه مسافران به اتاق‌ها اختصاص داده شده‌اند"
            }
          </div>
        ) : (
          <div className="space-y-2">
            {passengers.map(passenger => (
              <DraggablePassenger
                key={passenger._id}
                passenger={passenger}
                onEdit={() => onEditPassenger(passenger)}
                onDelete={() => onDeletePassenger(passenger._id)}
                isActive={activeId === passenger._id}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
} 
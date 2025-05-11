'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { 
  FaBed, 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaExchangeAlt, 
  FaUsers, 
  FaChild, 
  FaBaby, 
  FaMale, 
  FaFemale, 
  FaChevronDown, 
  FaChevronUp, 
  FaCog 
} from 'react-icons/fa'
import DraggablePassenger from './DraggablePassenger'

interface Room {
  _id: string
  reservation: string
  type: string
  bedType: string
  capacity: number
  currentOccupancy: number
  price: number
  extraBed: boolean
  status: 'available' | 'occupied' | 'reserved'
  notes?: string
}

interface Passenger {
  _id: string
  reservation: string
  room: string
  firstName: string
  lastName: string
  englishFirstName: string
  englishLastName: string
  nationalId: string
  passportNumber: string
  birthDate: string
  passportExpiryDate: string
  gender: 'male' | 'female'
  ageCategory: 'adult' | 'child' | 'infant'
  notes?: string
}

interface DraggableRoomCardProps {
  room: Room
  passengers: Passenger[]
  onAddPassenger: () => void
  onEditPassenger: (passenger: Passenger) => void
  onDeletePassenger: (passengerId: string) => void
  onEditRoom: (room: Room) => void
  onDeleteRoom: (room: Room) => void
  isDragging: boolean
  activeId: string | null
}

// ترجمه انواع اتاق
const roomTypeTranslation: Record<string, string> = {
  'single': 'یک تخته',
  'double': 'دو تخته',
  'triple': 'سه تخته',
  'quadruple': 'چهار تخته',
  'quintuple': 'پنج تخته',
  'family': 'خانوادگی',
  'vip': 'ویژه',
  'shared': 'اشتراکی',
}

export default function DraggableRoomCard({ 
  room, 
  passengers, 
  onAddPassenger, 
  onEditPassenger, 
  onDeletePassenger,
  onEditRoom,
  onDeleteRoom,
  isDragging,
  activeId
}: DraggableRoomCardProps) {
  const [showPassengers, setShowPassengers] = useState(true)
  const [showActions, setShowActions] = useState(false)
  
  // گروه‌بندی مسافران بر اساس رده سنی
  const adults = passengers.filter(p => p.ageCategory === 'adult')
  const children = passengers.filter(p => p.ageCategory === 'child')
  const infants = passengers.filter(p => p.ageCategory === 'infant')
  
  // نمایش وضعیت تکمیل ظرفیت
  const occupancyPercentage = (room.currentOccupancy / room.capacity) * 100
  
  // تنظیم ناحیه قابل رها کردن با استفاده از dnd-kit
  const { isOver, setNodeRef } = useDroppable({
    id: room._id,
    data: {
      type: 'room',
      roomData: room
    }
  })
  
  // استایل‌های مربوط به حالت‌های مختلف کشیدن و رها کردن
  const dropStyle = isOver 
    ? "border-2 border-blue-400 bg-blue-50/50" 
    : isDragging 
      ? "border border-gray-200 bg-gray-50/80" 
      : "border border-gray-200"
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full ${dropStyle} transition-all duration-200`}
      ref={setNodeRef}
    >
      {/* هدر کارت */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg flex items-center">
              <FaBed className="ml-2" />
              {roomTypeTranslation[room.type] || room.type}
            </h3>
            {room.notes && (
              <p className="text-blue-100 text-sm">
                {room.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm bg-blue-500 text-white rounded-lg px-2 py-1 font-bold">
              {room.currentOccupancy}/{room.capacity}
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowActions(!showActions)}
                className="p-2 rounded-full hover:bg-white/20 transition"
              >
                <FaCog />
              </button>
              
              {/* منوی کشویی عملیات روی اتاق */}
              {showActions && (
                <div className="absolute top-full left-0 bg-white rounded-lg shadow-lg p-2 text-gray-800 z-10 w-32">
                  <button
                    onClick={() => {
                      setShowActions(false)
                      onEditRoom(room)
                    }}
                    className="flex items-center w-full p-2 hover:bg-gray-100 rounded-md"
                  >
                    <FaEdit className="ml-2 text-blue-600" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActions(false)
                      onDeleteRoom(room)
                    }}
                    className="flex items-center w-full p-2 hover:bg-gray-100 rounded-md"
                  >
                    <FaTrash className="ml-2 text-red-600" />
                    <span>حذف</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* نوار پیشرفت */}
        <div className="mt-3 h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              occupancyPercentage < 50 ? 'bg-blue-300' : 
              occupancyPercentage < 100 ? 'bg-blue-200' : 
              'bg-green-300'
            }`}
            style={{ width: `${occupancyPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* بدنه کارت */}
      <div className="p-4 flex-1 flex flex-col">
        {/* آمار مسافران */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 rounded-lg px-2 py-1 text-sm">
            <FaUsers />
            <span>{adults.length}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 rounded-lg px-2 py-1 text-sm">
            <FaChild />
            <span>{children.length}</span>
          </div>
          <div className="flex items-center gap-1 bg-pink-50 text-pink-700 rounded-lg px-2 py-1 text-sm">
            <FaBaby />
            <span>{infants.length}</span>
          </div>
          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-lg px-2 py-1 text-sm">
            <FaMale />
            <span>{passengers.filter(p => p.gender === 'male').length}</span>
          </div>
          <div className="flex items-center gap-1 bg-purple-50 text-purple-700 rounded-lg px-2 py-1 text-sm">
            <FaFemale />
            <span>{passengers.filter(p => p.gender === 'female').length}</span>
          </div>
        </div>
        
        {/* دکمه نمایش/مخفی کردن مسافران */}
        <button
          onClick={() => setShowPassengers(!showPassengers)}
          className="flex items-center justify-between w-full p-2 bg-gray-50 hover:bg-gray-100 rounded-lg mb-3 transition"
        >
          <span className="font-medium text-gray-700">لیست مسافران</span>
          {showPassengers ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
        </button>
        
        {/* لیست مسافران */}
        {showPassengers && (
          <div className="space-y-2 overflow-y-auto flex-1 mb-3">
            {passengers.length === 0 ? (
              <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg">
                {isOver && isDragging 
                  ? <span className="text-blue-600 font-medium">مسافر را اینجا رها کنید</span>
                  : "هنوز مسافری برای این اتاق ثبت نشده است"
                }
              </div>
            ) : (
              passengers.map(passenger => (
                <DraggablePassenger
                  key={passenger._id}
                  passenger={passenger}
                  onEdit={() => onEditPassenger(passenger)}
                  onDelete={() => onDeletePassenger(passenger._id)}
                  isActive={activeId === passenger._id}
                />
              ))
            )}
          </div>
        )}
        
        {/* دکمه افزودن مسافر */}
        <button
          onClick={onAddPassenger}
          disabled={room.currentOccupancy >= room.capacity}
          className={`w-full py-2 rounded-lg flex items-center justify-center font-medium transition mt-auto ${
            room.currentOccupancy >= room.capacity 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <FaUserPlus className="ml-2" />
          افزودن مسافر
        </button>
      </div>
    </motion.div>
  )
} 
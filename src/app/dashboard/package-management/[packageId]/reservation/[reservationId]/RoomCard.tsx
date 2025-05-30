'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBed, FaUserPlus, FaEdit, FaTrash, FaExchangeAlt, FaUser, FaUsers, FaChild, FaBaby, FaMale, FaFemale, FaChevronDown, FaChevronUp, FaCog } from 'react-icons/fa'

interface Room {
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
  gender: 'male' | 'female'
  ageCategory: 'adult' | 'child' | 'infant'
}

interface RoomCardProps {
  room: Room
  passengers: Passenger[]
  onAddPassenger: () => void
  onEditPassenger: (passenger: Passenger) => void
  onDeletePassenger: (passengerId: string) => void
  onEditRoom: (room: Room) => void
  onDeleteRoom: (room: Room) => void
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

// ترجمه انواع تخت
const bedTypeTranslation: Record<string, string> = {
  'single': 'تک نفره',
  'double': 'دو نفره',
  'twin': 'دوقلو',
  'queen': 'کوئین',
  'king': 'کینگ',
}

export default function RoomCard({ 
  room, 
  passengers, 
  onAddPassenger, 
  onEditPassenger, 
  onDeletePassenger,
  onEditRoom,
  onDeleteRoom
}: RoomCardProps) {
  const [showPassengers, setShowPassengers] = useState(true)
  const [showActions, setShowActions] = useState(false)
  
  // لاگ کردن اطلاعات مسافران برای دیباگ
  useEffect(() => {
    console.log('Room ID:', room._id);
    console.log('Passengers for this room:', passengers);
    passengers.forEach(p => {
      console.log(`Passenger ${p.firstName} ${p.lastName} - Age Category: ${p.ageCategory}`);
    });
  }, [room._id, passengers]);
  
  // گروه‌بندی مسافران بر اساس رده سنی - با بررسی دقیق‌تر
  const adults = passengers.filter(p => p.ageCategory === 'adult')
  const children = passengers.filter(p => p.ageCategory === 'child')
  const infants = passengers.filter(p => p.ageCategory === 'infant')
  
  // نمایش وضعیت تکمیل ظرفیت
  const occupancyPercentage = (room.currentOccupancy / room.capacity) * 100
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 flex flex-col h-full"
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
            <div className="text-sm bg-white bg-opacity-20 rounded-lg px-2 py-1 font-bold">
              {room.currentOccupancy} / {room.capacity}
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
          {/* نمایش تعداد مسافران بر اساس رده سنی */}
          {passengers.map((passenger, index) => {
            // نمایش آیکون مناسب برای هر مسافر بر اساس رده سنی
            let AgeIcon = FaUser; // آیکون پیش‌فرض
            let bgColor = 'bg-blue-50';
            let textColor = 'text-blue-700';
            
            if (passenger.ageCategory === 'infant') {
              AgeIcon = FaBaby;
              bgColor = 'bg-pink-50';
              textColor = 'text-pink-700';
            } else if (passenger.ageCategory === 'child') {
              AgeIcon = FaChild;
              bgColor = 'bg-amber-50';
              textColor = 'text-amber-700';
            } else {
              AgeIcon = FaUsers;
            }
            
            return (
              <div key={index} className={`flex items-center gap-1 ${bgColor} ${textColor} rounded-lg px-2 py-1 text-sm`}>
                <AgeIcon />
                <span>1</span>
              </div>
            );
          })}
          
          {/* آمار مسافران بر اساس جنسیت */}
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
                هنوز مسافری برای این اتاق ثبت نشده است
              </div>
            ) : (
              passengers.map(passenger => (
                <div 
                  key={passenger._id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="flex items-center">
                    <div className={`rounded-full p-2 mr-2 ${
                      passenger.gender === 'male' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {passenger.gender === 'male' ? <FaMale /> : <FaFemale />}
                    </div>
                    <div>
                      <div className="font-medium">{passenger.firstName} {passenger.lastName}</div>
                      <div className="text-xs text-gray-500">{passenger.englishFirstName} {passenger.englishLastName}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${
                          passenger.ageCategory === 'adult' ? 'bg-blue-100 text-blue-700' :
                          passenger.ageCategory === 'child' ? 'bg-amber-100 text-amber-700' :
                          'bg-pink-100 text-pink-700'
                        }`}>
                          {passenger.ageCategory === 'adult' ? 'بزرگسال' :
                           passenger.ageCategory === 'child' ? 'کودک' : 'نوزاد'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => onEditPassenger(passenger)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => onDeletePassenger(passenger._id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
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
'use client'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { FaEdit, FaFemale, FaMale, FaTrash } from 'react-icons/fa'

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

interface DraggablePassengerProps {
  passenger: Passenger
  onEdit: () => void
  onDelete: () => void
  isActive: boolean
}

export default function DraggablePassenger({ 
  passenger, 
  onEdit, 
  onDelete,
  isActive
}: DraggablePassengerProps) {
  // تنظیم قابلیت کشیدن با استفاده از dnd-kit
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: passenger._id,
    data: {
      type: 'passenger',
      passengerData: passenger
    }
  })
  
  // تبدیل ترنسفورم به استایل CSS برای انیمیشن کشیدن
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isActive ? 0 : 1,
    transition: 'opacity 0.3s ease'
  }
  
  // استایل‌های مربوط به نوع مسافر
  const ageCategoryStyle = {
    adult: 'bg-blue-100 text-blue-700',
    child: 'bg-amber-100 text-amber-700',
    infant: 'bg-pink-100 text-pink-700'
  }
  
  // ترجمه رده سنی
  const ageCategoryText = {
    adult: 'بزرگسال',
    child: 'کودک',
    infant: 'نوزاد'
  }
  
  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`flex items-center justify-between p-3 border rounded-lg transition group cursor-grab active:cursor-grabbing ${
        isActive 
          ? 'border-blue-400 shadow-md bg-blue-50'
          : 'border-gray-100 hover:bg-gray-50'
      }`}
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
            <span className={`px-2 py-0.5 rounded-full ${ageCategoryStyle[passenger.ageCategory]}`}>
              {ageCategoryText[passenger.ageCategory]}
            </span>
          </div>
        </div>
      </div>
      <div className="flex space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition">
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
        >
          <FaEdit />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 text-red-600 hover:bg-red-100 rounded"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  )
} 
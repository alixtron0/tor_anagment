'use client'
import { useState } from 'react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay
} from '@dnd-kit/core'
import { 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import DraggableRoomCard from './DraggableRoomCard'
// @ts-ignore - Fix TypeScript import error
import UnassignedPassengersArea from './UnassignedPassengersArea'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FaArrowsAlt, FaInfo, FaFemale, FaMale } from 'react-icons/fa'

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

interface DraggableRoomLayoutProps {
  rooms: Room[]
  passengers: Passenger[]
  onAddPassenger: (room: Room) => void
  onEditPassenger: (passenger: Passenger) => void
  onDeletePassenger: (passengerId: string) => void
  onEditRoom: (room: Room) => void
  onDeleteRoom: (room: Room) => void
  onDataChanged: () => void
  reservationId: string
}

export default function DraggableRoomLayout({
  rooms,
  passengers,
  onAddPassenger,
  onEditPassenger,
  onDeletePassenger,
  onEditRoom,
  onDeleteRoom,
  onDataChanged,
  reservationId
}: DraggableRoomLayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activePassenger, setActivePassenger] = useState<Passenger | null>(null)
  
  // گروه‌بندی مسافران بر اساس اتاق
  const passengersByRoom: Record<string, Passenger[]> = {}
  // مسافران بدون اتاق
  const unassignedPassengers: Passenger[] = []
  
  // گروه‌بندی مسافران
  passengers.forEach(passenger => {
    if (!passenger.room || passenger.room === 'unassigned' || passenger.room === '000000000000000000000000') {
      unassignedPassengers.push(passenger)
    } else {
      if (!passengersByRoom[passenger.room]) {
        passengersByRoom[passenger.room] = []
      }
      passengersByRoom[passenger.room].push(passenger)
    }
  })
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsDragging(true)
    
    // پیدا کردن مسافر فعال برای نمایش در overlay
    const passengerId = event.active.id as string;
    const foundPassenger = passengers.find(p => p._id === passengerId);
    if (foundPassenger) {
      setActivePassenger(foundPassenger);
    }
  }
  
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    setIsDragging(false)
    setActivePassenger(null)
    
    const { active, over } = event
    
    // اگر over وجود نداشت، کاری انجام نمی‌دهیم
    if (!over) {
      return
    }
    
    // استخراج شناسه مسافر
    const passengerId = active.id as string
    
    // استخراج شناسه اتاق مقصد (می‌تواند 'unassigned' یا شناسه اتاق باشد)
    let targetRoomId = over.id as string
    
    // اگر شناسه با 'passenger-' شروع می‌شود، به معنی این است که روی مسافر دیگری رها شده است
    // در این صورت باید اتاق آن مسافر را بیابیم
    if (targetRoomId.startsWith('passenger-')) {
      const targetPassengerId = targetRoomId.replace('passenger-', '')
      const targetPassenger = passengers.find(p => p._id === targetPassengerId)
      
      if (targetPassenger) {
        targetRoomId = targetPassenger.room || 'unassigned'
      }
    }
    
    // اگر اتاق مقصد همان اتاق مبدا باشد، کاری انجام نمی‌دهیم
    const passenger = passengers.find(p => p._id === passengerId)
    if (!passenger) {
      return
    }
    
    // اگر اتاق مقصد همان اتاق مبدا باشد و هر دو 'unassigned' نیستند
    if (passenger.room === targetRoomId && targetRoomId !== 'unassigned') {
      return
    }
    
    try {
      // بررسی ظرفیت اتاق مقصد
      if (targetRoomId !== 'unassigned') {
        const targetRoom = rooms.find(r => r._id === targetRoomId)
        if (targetRoom && targetRoom.currentOccupancy >= targetRoom.capacity) {
          toast.error('ظرفیت اتاق تکمیل است')
          return
        }
      }
      
      const token = localStorage.getItem('token') || ''
      
      try {
        // برای هر دو حالت از مسیر change-room استفاده می‌کنیم
        const response = await fetch(`http://185.94.99.35:5000/api/passengers/${passengerId}/change-room`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({
            roomId: targetRoomId === 'unassigned' ? null : targetRoomId,
            reservationId
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Server responded with status ${response.status}: ${errorData.message || 'Unknown error'}`);
        }
        
        // اطلاع‌رسانی به کامپوننت والد برای به‌روزرسانی داده‌ها
        onDataChanged()
        toast.success('مسافر با موفقیت به اتاق جدید منتقل شد')
      } catch (error) {
        console.error('Error updating passenger:', error)
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
        toast.error(`خطا در تغییر اتاق مسافر: ${errorMessage}`)
      }
    } catch (error) {
      console.error('خطا در تغییر اتاق مسافر:', error)
      const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
      toast.error('خطا در تغییر اتاق مسافر')
    }
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
    <div className="mb-6">
      <div className="bg-white rounded-lg p-3 mb-4 border border-amber-200 bg-amber-50 text-amber-700 flex items-start gap-2">
        <FaInfo className="mt-1 flex-shrink-0" />
        <div>
          <p className="text-sm">
            می‌توانید مسافران را با کشیدن و رها کردن، بین اتاق‌ها جابجا کنید. برای این کار روی مسافر مورد نظر کلیک کرده و آن را به اتاق مقصد بکشید.
          </p>
          <p className="text-sm mt-1">
            همچنین می‌توانید مسافران را به فضای «مسافران بدون اتاق» بکشید تا بعداً آن‌ها را در اتاق دیگری قرار دهید.
          </p>
        </div>
      </div>
        
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        autoScroll={true}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ position: 'relative' }}>
          {rooms.map(room => (
            <DraggableRoomCard
              key={room._id}
              room={room}
              passengers={passengersByRoom[room._id] || []}
              onAddPassenger={() => onAddPassenger(room)}
              onEditPassenger={onEditPassenger}
              onDeletePassenger={onDeletePassenger}
              onEditRoom={onEditRoom}
              onDeleteRoom={onDeleteRoom}
              isDragging={isDragging}
              activeId={activeId}
            />
          ))}
        </div>
        
        <div className="mt-6" style={{ position: 'relative' }}>
          <UnassignedPassengersArea 
            passengers={unassignedPassengers} 
            onEditPassenger={onEditPassenger}
            onDeletePassenger={onDeletePassenger}
            isDragging={isDragging}
            activeId={activeId}
          />
        </div>
        
        {isDragging && <div className="fixed inset-0 z-10 pointer-events-none"></div>}
        
        <DragOverlay adjustScale={false} zIndex={9999} dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activePassenger && (
            <div className="p-2 border rounded-md bg-white border-blue-400 shadow-lg" style={{ width: '180px' }}>
              <div className="flex items-center">
                {activePassenger.gender === 'male' 
                  ? <FaMale className="text-indigo-600 mr-1.5" size={12} /> 
                  : <FaFemale className="text-purple-600 mr-1.5" size={12} />}
                <span className="text-sm font-medium truncate">{activePassenger.firstName} {activePassenger.lastName}</span>
              </div>
              <div className="text-xs mt-1">
                <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs ${ageCategoryStyle[activePassenger.ageCategory]}`}>
                  {ageCategoryText[activePassenger.ageCategory]}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
} 
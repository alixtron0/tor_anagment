'use client'
import { useState, useEffect } from 'react'
import { FaTimes, FaUser, FaPassport, FaEdit, FaPrint, FaTicketAlt } from 'react-icons/fa'

interface Passenger {
  _id: string
  firstName: string
  lastName: string
  englishFirstName: string
  englishLastName: string
  nationalId: string
  passportNumber: string
  gender: 'male' | 'female'
  ageCategory: 'adult' | 'child' | 'infant'
  birthDate: string
  room: string
}

interface PackageDetails {
  _id: string
  name: string
  startDate: string
  endDate: string
  airline?: string
  hotel?: string | { name: string }
}

interface PassengerListModalProps {
  isOpen: boolean
  onClose: () => void
  reservationId: string
  passengers: Passenger[]
  packageDetails?: PackageDetails
}

export default function PassengerListModal({
  isOpen,
  onClose,
  reservationId,
  passengers,
  packageDetails
}: PassengerListModalProps) {
  const [selectedAgeCategory, setSelectedAgeCategory] = useState<string>('all')
  const [filteredPassengers, setFilteredPassengers] = useState<Passenger[]>(passengers)
  
  // اعمال فیلتر بر اساس رده سنی
  useEffect(() => {
    if (selectedAgeCategory === 'all') {
      setFilteredPassengers(passengers)
    } else {
      setFilteredPassengers(passengers.filter(p => p.ageCategory === selectedAgeCategory))
    }
  }, [selectedAgeCategory, passengers])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            <FaUser className="ml-2" />
            لیست مسافران
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* اطلاعات پکیج */}
        {packageDetails && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <h3 className="font-bold text-blue-800 mb-2">اطلاعات پکیج</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">نام پکیج:</span>{' '}
                <span className="font-medium">{packageDetails.name}</span>
              </div>
              <div>
                <span className="text-blue-600">تاریخ رفت:</span>{' '}
                <span className="font-medium">{new Date(packageDetails.startDate).toLocaleDateString('fa-IR')}</span>
              </div>
              <div>
                <span className="text-blue-600">تاریخ برگشت:</span>{' '}
                <span className="font-medium">{new Date(packageDetails.endDate).toLocaleDateString('fa-IR')}</span>
              </div>
              <div>
                <span className="text-blue-600">ایرلاین:</span>{' '}
                <span className="font-medium">{packageDetails.airline || 'نامشخص'}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* فیلترها */}
        <div className="p-4 border-b">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm text-gray-600">فیلتر:</span>
            <button
              onClick={() => setSelectedAgeCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedAgeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              همه ({passengers.length})
            </button>
            <button
              onClick={() => setSelectedAgeCategory('adult')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedAgeCategory === 'adult' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              بزرگسال ({passengers.filter(p => p.ageCategory === 'adult').length})
            </button>
            <button
              onClick={() => setSelectedAgeCategory('child')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedAgeCategory === 'child' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              کودک ({passengers.filter(p => p.ageCategory === 'child').length})
            </button>
            <button
              onClick={() => setSelectedAgeCategory('infant')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedAgeCategory === 'infant' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              نوزاد ({passengers.filter(p => p.ageCategory === 'infant').length})
            </button>
          </div>
        </div>
        
        {/* جدول مسافران */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نام و نام خانوادگی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نام لاتین
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  کد ملی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  شماره پاسپورت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ تولد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  جنسیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رده سنی
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    مسافری یافت نشد
                  </td>
                </tr>
              ) : (
                filteredPassengers.map(passenger => (
                  <tr key={passenger._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {passenger.firstName} {passenger.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {passenger.englishFirstName} {passenger.englishLastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {passenger.nationalId || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {passenger.passportNumber || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {passenger.birthDate ? new Date(passenger.birthDate).toLocaleDateString('fa-IR') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {passenger.gender === 'male' ? 'مرد' : 'زن'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        passenger.ageCategory === 'adult' ? 'bg-blue-100 text-blue-800' :
                        passenger.ageCategory === 'child' ? 'bg-amber-100 text-amber-800' :
                        'bg-pink-100 text-pink-800'
                      }`}>
                        {passenger.ageCategory === 'adult' ? 'بزرگسال' :
                         passenger.ageCategory === 'child' ? 'کودک' : 'نوزاد'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* فوتر */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            تعداد کل مسافران: <span className="font-bold">{passengers.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'
import { useState, useEffect } from 'react'
import moment from 'jalali-moment'
import { FaChevronRight, FaChevronLeft, FaCalendarAlt } from 'react-icons/fa'

interface PersianDatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  label?: string
  name?: string
  error?: string
  className?: string
}

const PersianDatePicker = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  label,
  name,
  error,
  className = ''
}: PersianDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null)
  const [currentMonth, setCurrentMonth] = useState<moment.Moment>(moment().locale('fa'))
  const [inputValue, setInputValue] = useState('')
  
  // لیست ماه‌های شمسی
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]

  // لیست روزهای هفته
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

  // تنظیم تاریخ انتخاب شده هنگام تغییر مقدار از خارج
  useEffect(() => {
    if (value) {
      try {
        // تبدیل تاریخ میلادی به شمسی برای نمایش
        const date = moment(value, 'YYYY/MM/DD').locale('fa')
        setSelectedDate(date)
        setCurrentMonth(date.clone())
        setInputValue(date.format('jYYYY/jMM/jDD'))
      } catch (error) {
        console.error('خطا در تبدیل تاریخ:', error)
        setSelectedDate(null)
        setInputValue('')
      }
    } else {
      setSelectedDate(null)
      setInputValue('')
    }
  }, [value])

  // رفتن به ماه قبل
  const goToPreviousMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'jMonth'))
  }

  // رفتن به ماه بعد
  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'jMonth'))
  }

  // انتخاب سال
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value)
    setCurrentMonth(currentMonth.clone().jYear(year))
  }

  // انتخاب ماه
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value)
    setCurrentMonth(currentMonth.clone().jMonth(month))
  }

  // انتخاب روز
  const selectDate = (day: moment.Moment) => {
    try {
      setSelectedDate(day)
      // نمایش تاریخ شمسی در ورودی
      setInputValue(day.format('jYYYY/jMM/jDD'))
      // تبدیل تاریخ به فرمت میلادی برای ذخیره در دیتابیس
      const gregorianDate = day.clone().locale('en').format('YYYY/MM/DD')
      onChange(gregorianDate)
      setIsOpen(false)
    } catch (error) {
      console.error('خطا در انتخاب تاریخ:', error)
    }
  }

  // ساخت آرایه‌ای از روزهای ماه جاری
  const generateDays = () => {
    const firstDayOfMonth = currentMonth.clone().startOf('jMonth')
    const daysInMonth = currentMonth.jDaysInMonth()
    
    // تعیین روز هفته برای اولین روز ماه (0 = شنبه، 6 = جمعه)
    const firstDayOfWeek = firstDayOfMonth.day()
    
    // تنظیم شنبه به عنوان روز اول هفته
    const startOffset = (firstDayOfWeek + 1) % 7
    
    const days = []
    
    // روزهای خالی قبل از شروع ماه
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }
    
    // روزهای ماه
    for (let i = 1; i <= daysInMonth; i++) {
      const day = currentMonth.clone().jDate(i)
      days.push(day)
    }
    
    return days
  }

  // تولید لیست سال‌ها
  const generateYears = () => {
    const years = []
    const currentYear = moment().locale('fa').jYear()
    
    // افزایش محدوده سال‌ها (40 سال قبل تا 40 سال بعد)
    for (let i = currentYear - 90; i <= currentYear + 90; i++) {
      years.push(i)
    }
    
    return years
  }

  // بستن تقویم با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isOpen && !target.closest('.persian-datepicker-container')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // بررسی آیا روز انتخاب شده است
  const isSelectedDay = (day: moment.Moment) => {
    return selectedDate && day.format('jYYYY/jMM/jDD') === selectedDate.format('jYYYY/jMM/jDD')
  }

  // بررسی آیا روز امروز است
  const isToday = (day: moment.Moment) => {
    return day.format('jYYYY/jMM/jDD') === moment().locale('fa').format('jYYYY/jMM/jDD')
  }

  return (
    <div className="relative persian-datepicker-container">
      {label && (
        <label className="block mb-2 font-medium text-gray-700">{label}</label>
      )}
      
      <div className="relative">
        <input
          type="text"
          name={name}
          value={inputValue}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900 cursor-pointer pr-10 ${className}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <FaCalendarAlt className="text-blue-500" />
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-red-500 text-sm">{error}</p>
      )}
      
      {isOpen && (
        <div className="absolute mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-[320px] right-0 persian-datepicker overflow-hidden animate-fadeIn">
          {/* طرح تزئینی ایرانی */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 border-8 border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 border-8 border-blue-500 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse-slow"></div>
            <div className="absolute top-1/2 right-0 w-24 h-24 border-8 border-amber-500 rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-1/2 w-24 h-24 border-8 border-amber-500 rounded-full -translate-x-1/2 translate-y-1/2 animate-pulse-slow"></div>
          </div>
          
          {/* هدر تقویم با طرح ایرانی */}
          <div className="mb-4 relative">
            <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg shadow-md relative overflow-hidden">
              {/* طرح اسلیمی */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-16 h-16 border-4 border-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-4 border-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
              </div>
              
              <button 
                onClick={goToPreviousMonth}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors relative z-10"
                aria-label="ماه قبل"
              >
                <FaChevronRight />
              </button>
              
              <div className="text-lg font-bold text-white flex items-center gap-2 relative z-10">
                <span className="text-amber-200">{currentMonth.jYear()}</span>
                <span className="px-2 py-1 bg-white/20 rounded-md">{persianMonths[currentMonth.jMonth()]}</span>
              </div>
              
              <button 
                onClick={goToNextMonth}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors relative z-10"
                aria-label="ماه بعد"
              >
                <FaChevronLeft />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={currentMonth.jYear()}
                onChange={handleYearChange}
                className="p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              >
                {generateYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              <select 
                value={currentMonth.jMonth()}
                onChange={handleMonthChange}
                className="p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              >
                {persianMonths.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* روزهای هفته با طرح ایرانی */}
          <div className="grid grid-cols-7 gap-1 mb-2 bg-blue-50 p-2 rounded-lg">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-bold text-blue-800 py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* روزهای ماه با طرح ایرانی */}
          <div className="grid grid-cols-7 gap-1 p-2 bg-gradient-to-br from-blue-50/50 to-white rounded-lg border border-blue-100">
            {generateDays().map((day, index) => (
              <div key={index} className="aspect-square p-0.5">
                {day ? (
                  <button
                    onClick={() => selectDate(day)}
                    className={`w-full h-full flex items-center justify-center rounded-full text-sm transition-all hover:scale-110 ${
                      isSelectedDay(day)
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md'
                        : isToday(day)
                        ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-blue-800 font-medium hover:from-amber-200 hover:to-amber-300'
                        : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {day.jDate()}
                  </button>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* دکمه امروز با طرح ایرانی */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                const today = moment().locale('fa')
                setCurrentMonth(today.clone())
                selectDate(today)
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium shadow-md"
            >
              برو به امروز
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersianDatePicker 
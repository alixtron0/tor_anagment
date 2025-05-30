'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { FaClock, FaChevronUp, FaChevronDown, FaEdit, FaCheck } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

interface TimeSelectorProps {
  value: string
  onChange: (time: string) => void
  label?: string
  className?: string
}

export default function TimeSelector({ value, onChange, label, className }: TimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hours, setHours] = useState<number>(0)
  const [minutes, setMinutes] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)
  const [tempTime, setTempTime] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ساعت‌های 24 ساعته
  const hourOptions = Array.from({ length: 24 }, (_, i) => i)
  
  // دقیقه‌ها (0 تا 59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

  // تنظیم مقادیر اولیه بر اساس value
  useEffect(() => {
    if (value) {
      const [hoursStr, minutesStr] = value.split(':')
      setHours(parseInt(hoursStr, 10) || 0)
      setMinutes(parseInt(minutesStr, 10) || 0)
      setTempTime(value)
    }
  }, [value])

  // بستن منو با کلیک بیرون از آن
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // تغییر ساعت
  const handleHourChange = (hour: number) => {
    setHours(hour)
    onChange(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }

  // تغییر دقیقه
  const handleMinuteChange = (minute: number) => {
    setMinutes(minute)
    onChange(`${hours.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
  }

  // افزایش ساعت
  const incrementHour = () => {
    const newHour = (hours + 1) % 24
    handleHourChange(newHour)
  }

  // کاهش ساعت
  const decrementHour = () => {
    const newHour = (hours - 1 + 24) % 24
    handleHourChange(newHour)
  }

  // افزایش دقیقه
  const incrementMinute = () => {
    const newMinute = (minutes + 1) % 60
    handleMinuteChange(newMinute)
  }

  // کاهش دقیقه
  const decrementMinute = () => {
    const newMinute = (minutes - 1 + 60) % 60
    handleMinuteChange(newMinute)
  }

  // تغییر به حالت ویرایش
  const toggleEditMode = () => {
    if (!isEditing) {
      setIsEditing(true)
      setTempTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
      // فوکوس روی ورودی بعد از رندر
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 10)
    } else {
      saveEditedTime()
    }
  }

  // ذخیره زمان ویرایش شده
  const saveEditedTime = () => {
    // پردازش ورودی برای فرمت‌های مختلف
    let h = '00'
    let m = '00'
    let timeValue = tempTime.trim()
    
    if (timeValue.includes(':')) {
      // فرمت معمولی با دونقطه (13:45)
      [h, m] = timeValue.split(':')
    } else if (timeValue.includes(' ')) {
      // فرمت با فاصله (13 45)
      [h, m] = timeValue.split(' ')
    } else if (timeValue.length <= 4) {
      // فرمت بدون جداکننده (1345)
      if (timeValue.length === 4) {
        h = timeValue.substring(0, 2)
        m = timeValue.substring(2, 4)
      } else if (timeValue.length === 3) {
        h = timeValue.substring(0, 1)
        m = timeValue.substring(1, 3)
      } else if (timeValue.length === 2) {
        h = timeValue
        m = '00'
      } else if (timeValue.length === 1) {
        h = timeValue
        m = '00'
      }
    }
    
    // تبدیل به عدد و بررسی معتبر بودن
    const newHour = parseInt(h, 10)
    const newMinute = parseInt(m, 10)
    
    if (!isNaN(newHour) && !isNaN(newMinute) && newHour >= 0 && newHour < 24 && newMinute >= 0 && newMinute < 60) {
      // زمان معتبر است
      setHours(newHour)
      setMinutes(newMinute)
      onChange(`${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`)
    } else {
      // زمان نامعتبر است
      setTempTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }
    
    setIsEditing(false)
  }

  // بررسی معتبر بودن فرمت زمان
  const isValidTimeFormat = (time: string): boolean => {
    // فرمت‌های مختلف معتبر: 13:45 یا 1345 یا 13 45
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time) || 
           /^([0-1]?[0-9]|2[0-3])[0-5][0-9]$/.test(time) || 
           /^([0-1]?[0-9]|2[0-3])\s[0-5][0-9]$/.test(time)
  }

  // مدیریت کلید Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEditedTime()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setTempTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block mb-2 font-medium text-gray-700">{label}</label>}
      
      <div 
        ref={dropdownRef} 
        className="relative"
      >
        {/* نمایش زمان انتخاب شده */}
        <div className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg bg-white hover:border-indigo-400 transition-all group">
          {isEditing ? (
            <div className="flex items-center flex-1">
              <FaClock className="ml-2 text-indigo-500 transition-colors" />
              <input
                ref={inputRef}
                type="text"
                value={tempTime}
                onChange={(e) => {
                  // فیلتر کردن ورودی برای اطمینان از ورود فقط اعداد، دونقطه و فاصله
                  const filtered = e.target.value.replace(/[^0-9: ]/g, '')
                  setTempTime(filtered)
                  
                  // اضافه کردن خودکار دونقطه بعد از دو رقم اول
                  if (filtered.length === 2 && !filtered.includes(':') && !filtered.includes(' ')) {
                    setTempTime(`${filtered}:`)
                  }
                }}
                onKeyDown={handleKeyDown}
                onBlur={saveEditedTime}
                className="flex-1 text-xl font-mono font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="دقیقه:ساعت"
                maxLength={5}
              />
            </div>
          ) : (
            <div className="flex items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
              <FaClock className="ml-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              <span className="text-xl font-mono font-semibold text-gray-800">
                {minutes.toString().padStart(2, '0')}:{hours.toString().padStart(2, '0')}
              </span>
            </div>
          )}
          <div className="flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleEditMode()
              }}
              className="p-2 ml-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
              title={isEditing ? "ذخیره" : "ویرایش مستقیم"}
            >
              {isEditing ? <FaCheck size={16} /> : <FaEdit size={16} />}
            </button>
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full">
              24h
            </div>
          </div>
        </div>

        {/* انتخابگر زمان */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-full overflow-hidden"
              style={{ width: 'calc(100% + 100px)', right: '-50px' }}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">انتخاب زمان</h3>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-center gap-8">
                  {/* انتخابگر دقیقه */}
                  <div className="flex flex-col items-center">
                    <button 
                      type="button"
                      onClick={incrementMinute}
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                      <FaChevronUp size={20} />
                    </button>
                    
                    <div className="relative my-2 w-16 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none z-10"></div>
                      <div className="text-3xl font-mono font-bold text-gray-800">
                        {minutes.toString().padStart(2, '0')}
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={decrementMinute}
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                      <FaChevronDown size={20} />
                    </button>
                  </div>
                  
                  <div className="text-3xl font-bold text-gray-400 self-center">:</div>
                  
                  {/* انتخابگر ساعت */}
                  <div className="flex flex-col items-center">
                    <button 
                      type="button"
                      onClick={incrementHour}
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                      <FaChevronUp size={20} />
                    </button>
                    
                    <div className="relative my-2 w-16 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none z-10"></div>
                      <div className="text-3xl font-mono font-bold text-gray-800">
                        {hours.toString().padStart(2, '0')}
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={decrementHour}
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                      <FaChevronDown size={20} />
                    </button>
                  </div>
                </div>

                {/* زمان‌های پیشنهادی */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">زمان‌های پیشنهادی</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {['00:00', '06:00', '12:00', '18:00', '08:30', '14:30', '16:45', '21:30'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          const [m, h] = time.split(':')
                          const newHour = parseInt(h, 10)
                          const newMinute = parseInt(m, 10)
                          setHours(newHour)
                          setMinutes(newMinute)
                          onChange(time)
                          setIsOpen(false)
                        }}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          `${minutes.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}` === time
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* دکمه‌های اقدام */}
                <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    تایید
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserPlus, FaTimes, FaCheck, FaEye, FaEyeSlash, FaChevronDown, FaCrown, FaUser } from 'react-icons/fa'
import axios from 'axios'

export default function AddAdmin() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // برای فرم افزودن ادمین
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    role: 'admin'
  })

  // تعریف گزینه‌های نقش با آیکون مناسب
  const roleOptions = [
    { id: 'admin', label: 'ادمین', icon: <FaUser className="ml-2 text-blue-400" /> },
    { id: 'admin+', label: 'همکار', icon: <FaUser className="ml-2 text-emerald-400" /> },
  ]

  useEffect(() => {
    // بارگذاری اطلاعات کاربر از localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      
      // اگر سوپر ادمین نیست، به صفحه داشبورد منتقل می‌شود
      if (parsedUser.role !== 'super-admin') {
        router.push('/dashboard')
        return
      }
    } else {
      router.push('/auth')
      return
    }
    
    setLoading(false)
  }, [router])

  // بستن دراپ‌داون زمانی که کلیک خارج از آن صورت می‌گیرد
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role: role }))
    setDropdownOpen(false)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      await axios.post('http://185.94.99.35:5000/api/users/create-admin', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setSuccess('ادمین جدید با موفقیت اضافه شد')
      
      // پاک کردن فرم
      setFormData({
        fullName: '',
        phoneNumber: '',
        password: '',
        role: 'admin'
      })
      
      // بعد از 3 ثانیه کاربر به صفحه لیست ادمین‌ها هدایت می‌شود
      setTimeout(() => {
        router.push('/dashboard/admin-management/list')
      }, 3000)
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در افزودن ادمین جدید')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-white rounded-xl shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <main className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">افزودن ادمین جدید</h1>
        <p className="text-gray-600">
          در این بخش می‌توانید کاربران جدید با نقش ادمین به سیستم اضافه کنید.
        </p>
      </div>
      
      {/* نمایش خطا یا پیام موفقیت */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-5 py-4 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      {/* فرم افزودن ادمین */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-8 mb-6 shadow-md border border-gray-100"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="fullName">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="phoneNumber">
                شماره موبایل
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="مثال: 09123456789"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ltr"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="password">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">
                نقش
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
                >
                  <div className="flex items-center">
                    {roleOptions.find(option => option.id === formData.role)?.icon}
                    <span>
                      {formData.role === 'admin' ? 'ادمین' : 'همکار'}
                    </span>
                  </div>
                  <FaChevronDown className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-10 mt-1 w-full bg-gray-100 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                    >
                      <div className="py-1">
                        {roleOptions.map(option => (
                          <div
                            key={option.id}
                            onClick={() => handleRoleSelect(option.id)}
                            className={`flex items-center px-4 py-3 hover:bg-gray-200 cursor-pointer transition-colors
                              ${formData.role === option.id ? 'bg-blue-500/20 text-blue-500' : 'text-gray-800'}`}
                          >
                            {option.icon}
                            <span>{option.label}</span>
                            {formData.role === option.id && (
                              <FaCheck className="mr-auto text-blue-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin-management/list')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-6 rounded-lg transition-colors ml-4 shadow-md"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
            >
              {submitting ? 'در حال ارسال...' : 'افزودن ادمین'}
              {!submitting && <FaUserPlus />}
            </button>
          </div>
        </form>
      </motion.div>
    </main>
  )
} 
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaUser, 
  FaLock, 
  FaPhone, 
  FaCalendarAlt, 
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns-jalali'

interface UserProfile {
  id: string
  fullName: string
  phoneNumber: string
  role: string
  createdAt: string
  lastLogin: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // وضعیت‌های نمایش/مخفی‌سازی رمز عبور
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // بارگذاری اطلاعات کاربر از localStorage
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token')
        
        if (!storedUser || !token) {
          router.push('/auth')
          return
        }
        
        const userData = JSON.parse(storedUser)
        
        // تنظیم اطلاعات کاربر
        setUser({
          id: userData.id,
          fullName: userData.fullName,
          phoneNumber: userData.phone,
          role: userData.role,
          createdAt: userData.createdAt || new Date().toISOString(),
          lastLogin: userData.lastLogin || new Date().toISOString()
        })
        
        setLoading(false)
      } catch (err) {
        setError('خطا در بارگذاری اطلاعات کاربر')
        setLoading(false)
      }
    }
    
    loadUser()
  }, [router])
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // بررسی مطابقت پسوردها
    if (newPassword !== confirmPassword) {
      setPasswordError('رمز عبور جدید و تکرار آن مطابقت ندارند')
      return
    }
    
    // بررسی طول رمز عبور
    if (newPassword.length < 6) {
      setPasswordError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد')
      return
    }
    
    setIsSubmitting(true)
    setPasswordError(null)
    setPasswordSuccess(null)
    
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.post('/api/users/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      })
      
      // در صورت موفقیت آمیز بودن
      setPasswordSuccess('رمز عبور با موفقیت تغییر یافت')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'خطا در تغییر رمز عبور')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getRoleName = (role: string) => {
    switch(role) {
      case 'super-admin':
        return 'مدیر کل'
      case 'admin':
        return 'ادمین'
      case 'admin+':
        return 'همکار'
      default:
        return 'کاربر'
    }
  }
  
  const getRoleColor = (role: string) => {
    switch(role) {
      case 'super-admin':
        return 'from-indigo-600 to-indigo-400'
      case 'admin':
        return 'from-blue-600 to-blue-400'
      case 'admin+':
        return 'from-green-600 to-green-400'
      default:
        return 'from-gray-600 to-gray-400'
    }
  }
  
  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <p className="mt-4 text-dark-text-secondary">در حال بارگذاری اطلاعات کاربر...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-3xl">
            <FaExclamationCircle />
          </div>
          <p className="mt-4 text-dark-text-secondary max-w-md">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary rounded-lg text-white"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <main className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">پروفایل کاربری</h1>
        <p className="text-dark-text-secondary">
          اطلاعات حساب کاربری و تنظیمات مربوط به آن
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* کارت اطلاعات کاربر */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300"
        >
          <div className="p-5 border-b border-dark-border/50">
            <h3 className="text-lg font-bold">اطلاعات کاربری</h3>
          </div>
          
          <div className="p-5">
            {user && (
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex-shrink-0">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white text-4xl font-bold`}>
                    {user.fullName.charAt(0)}
                  </div>
                </div>
                
                <div className="flex-grow w-full">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">{user.fullName}</h2>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(user.role)} text-white shadow-sm`}>
                        {getRoleName(user.role)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3 bg-dark-secondary/40 rounded-xl p-4">
                      <div className="w-10 h-10 rounded-full bg-dark-secondary/60 flex items-center justify-center text-blue-400">
                        <FaPhone />
                      </div>
                      <div>
                        <p className="text-xs text-dark-text-muted">شماره تلفن</p>
                        <p className="font-bold">{user.phoneNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-dark-secondary/40 rounded-xl p-4">
                      <div className="w-10 h-10 rounded-full bg-dark-secondary/60 flex items-center justify-center text-purple-400">
                        <FaCalendarAlt />
                      </div>
                      <div>
                        <p className="text-xs text-dark-text-muted">تاریخ ثبت‌نام</p>
                        <p className="font-bold">
                          {user.createdAt ? format(new Date(user.createdAt), 'yyyy/MM/dd') : 'نامشخص'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* فرم تغییر رمز عبور */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300"
        >
          <div className="p-5 border-b border-dark-border/50">
            <h3 className="text-lg font-bold">تغییر رمز عبور</h3>
          </div>
          
          <div className="p-5">
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-dark-text-secondary mb-1">
                  رمز عبور فعلی
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-3 text-dark-text-muted">
                    <FaLock />
                  </span>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full border-none bg-dark-secondary/40 rounded-xl pr-10 p-3 text-sm focus:ring-1 focus:ring-primary transition-all"
                    placeholder="رمز عبور فعلی خود را وارد کنید"
                    required
                  />
                  <button
                    type="button"
                    className="absolute left-4 top-3 text-dark-text-muted hover:text-primary focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95 p-1 rounded-full hover:bg-dark-secondary/60"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showCurrentPassword ? 'visible' : 'hidden'}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showCurrentPassword ? <FaEyeSlash className="text-primary" /> : <FaEye />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-dark-text-secondary mb-1">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-3 text-dark-text-muted">
                    <FaLock />
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full border-none bg-dark-secondary/40 rounded-xl pr-10 p-3 text-sm focus:ring-1 focus:ring-primary transition-all"
                    placeholder="رمز عبور جدید را وارد کنید"
                    required
                  />
                  <button
                    type="button"
                    className="absolute left-4 top-3 text-dark-text-muted hover:text-primary focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95 p-1 rounded-full hover:bg-dark-secondary/60"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showNewPassword ? 'visible' : 'hidden'}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showNewPassword ? <FaEyeSlash className="text-primary" /> : <FaEye />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
                <p className="text-dark-text-muted text-xs mt-1">
                  رمز عبور باید حداقل ۶ کاراکتر باشد
                </p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-text-secondary mb-1">
                  تکرار رمز عبور جدید
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-3 text-dark-text-muted">
                    <FaLock />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full border-none bg-dark-secondary/40 rounded-xl pr-10 p-3 text-sm focus:ring-1 focus:ring-primary transition-all"
                    placeholder="رمز عبور جدید را مجدد وارد کنید"
                    required
                  />
                  <button
                    type="button"
                    className="absolute left-4 top-3 text-dark-text-muted hover:text-primary focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95 p-1 rounded-full hover:bg-dark-secondary/60"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showConfirmPassword ? 'visible' : 'hidden'}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showConfirmPassword ? <FaEyeSlash className="text-primary" /> : <FaEye />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
              </div>
              
              {passwordError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-300/20 rounded-lg flex items-center gap-2 text-red-400">
                  <FaExclamationCircle />
                  <span className="text-sm">{passwordError}</span>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-300/20 rounded-lg flex items-center gap-2 text-green-400">
                  <FaCheckCircle />
                  <span className="text-sm">{passwordSuccess}</span>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-medium transition-all
                  ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-blue-500/20'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="h-4 w-4 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></span>
                    در حال پردازش...
                  </span>
                ) : 'تغییر رمز عبور'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 
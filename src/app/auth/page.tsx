'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { IoPersonOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline, IoAlertCircleOutline } from 'react-icons/io5'
import { MdOutlineFlightTakeoff, MdOutlineLocationCity } from 'react-icons/md'
import { BsSun, BsMoonStars } from 'react-icons/bs'
import Image from 'next/image'

// اسکیما برای اعتبارسنجی فرم
const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, { message: 'شماره موبایل الزامی است' })
    .regex(/^09\d{9}$/, { message: 'فرمت شماره موبایل نامعتبر است (مثال: 09123456789)' }),
  password: z
    .string()
    .min(6, { message: 'رمز عبور باید حداقل 6 کاراکتر باشد' }),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', data)
      
      // ذخیره توکن در localStorage
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // هدایت به داشبورد
      router.push('/dashboard')
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'خطا در برقراری ارتباط با سرور. لطفاً بعداً تلاش کنید.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative h-screen overflow-hidden flex items-center justify-center transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#e0e7ff]'}`}>
      {/* پس‌زمینه انیمیشنی */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* خطوط زیگزاگ متحرک */}
        <svg className="absolute w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalHatch" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke={isDarkMode ? "#fff" : "#000"} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalHatch)" />
        </svg>
        
        {/* دایره‌های متحرک */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, index) => (
            <motion.div
              key={index}
              className={`absolute rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-indigo-500'} opacity-10`}
              style={{
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
      
      {/* کلید تغییر حالت تاریک/روشن */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-4 left-4 p-3 rounded-full z-20 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-blue-900/30 text-yellow-300 hover:bg-blue-800/40' 
            : 'bg-indigo-200 text-indigo-700 hover:bg-indigo-300'
        }`}
      >
        {isDarkMode ? <BsSun className="text-xl" /> : <BsMoonStars className="text-xl" />}
      </button>

      {/* کانتینر اصلی */}
      <div className="w-full max-w-6xl px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full overflow-hidden rounded-[32px] shadow-2xl transition-all duration-500 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700' 
              : 'bg-white/70 backdrop-blur-xl border border-indigo-100'
          }`}
        >
          <div className="flex flex-col lg:flex-row">
            {/* بخش راست (فرم ورود) */}
            <div className={`w-full lg:w-7/12 p-8 lg:p-12 transition-colors duration-500 ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}>
              <div className="max-w-md mx-auto">
                <div className="text-center lg:text-right mb-10">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl lg:text-3xl font-bold mb-3"
                  >
                    ورود به حساب کاربری
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    برای استفاده از امکانات سیستم لطفاً وارد شوید
                  </motion.p>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                        isDarkMode 
                          ? 'bg-red-900/20 border border-red-900/30 text-red-300' 
                          : 'bg-red-50 border border-red-200 text-red-600'
                      }`}
                    >
                      <IoAlertCircleOutline className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* فیلد شماره موبایل */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        <IoPersonOutline className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="09123456789"
                        {...register('phoneNumber')}
                        dir="rtl"
                        className={`w-full pr-12 pl-5 py-3.5 text-right rounded-xl text-sm focus:outline-none transition-all duration-200 
                        ${isDarkMode 
                          ? 'bg-slate-800/70 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-slate-800/90 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white/50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                        } ${errors.phoneNumber ? 
                          (isDarkMode ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/30' : 'border-red-300 focus:border-red-500 focus:ring-red-200')
                          : ''
                        }`}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`mt-2 text-sm pr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}
                      >
                        {errors.phoneNumber.message}
                      </motion.p>
                    )}
                  </div>
                  
                  {/* فیلد رمز عبور */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      رمز عبور
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        <IoLockClosedOutline className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="رمز عبور خود را وارد کنید"
                        {...register('password')}
                        dir="rtl"
                        className={`w-full pr-12 pl-12 py-3.5 text-right rounded-xl text-sm focus:outline-none transition-all duration-200 
                        ${isDarkMode 
                          ? 'bg-slate-800/70 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-slate-800/90 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white/50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                        } ${errors.password ?
                          (isDarkMode ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/30' : 'border-red-300 focus:border-red-500 focus:ring-red-200')
                          : ''
                        }`}
                      />
                      <button
                        type="button"
                        className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors ${
                          isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <IoEyeOffOutline className="h-5 w-5" />
                        ) : (
                          <IoEyeOutline className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`mt-2 text-sm pr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </div>
                  
                  {/* دکمه ورود */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full py-3.5 px-6 mt-6 rounded-xl font-medium text-sm relative overflow-hidden shadow-lg ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-700/20'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-300/30'
                    } transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    <span className="relative z-10">
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          در حال ورود...
                        </div>
                      ) : (
                        "ورود به سیستم"
                      )}
                    </span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                  </motion.button>
                </form>
              </div>
            </div>
            
            {/* بخش چپ (تصویر و اطلاعات) */}
            <div className={`relative w-full lg:w-5/12 p-8 lg:p-12 overflow-hidden transition-colors duration-500 ${
              isDarkMode ? 'bg-gradient-to-br from-blue-900 to-indigo-900' : 'bg-gradient-to-br from-indigo-500 to-purple-500'
            }`}>
              {/* پترن تزئینی */}
              <div className="absolute inset-0 opacity-10">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[...Array(10)].map((_, i) => (
                    <motion.circle
                      key={i}
                      cx={Math.random() * 100}
                      cy={Math.random() * 100}
                      r={Math.random() * 10 + 2}
                      fill="#fff"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                      }}
                    />
                  ))}

                  {[...Array(5)].map((_, i) => (
                    <motion.path
                      key={`path-${i}`}
                      d={`M${Math.random() * 100},${Math.random() * 100} Q${Math.random() * 100},${Math.random() * 100} ${Math.random() * 100},${Math.random() * 100}`}
                      stroke="#fff"
                      strokeWidth="0.5"
                      fill="none"
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: Math.random() * 5 + 10,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </svg>
              </div>

              {/* محتوای بخش چپ */}
              <div className="relative z-10 h-full flex flex-col justify-between py-12">
                {/* لوگو */}
                <div className="flex justify-center lg:justify-start mb-4 lg:mb-16">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className={`relative flex items-center gap-3 ${
                      isDarkMode ? 'text-white' : 'text-white'
                    }`}>
                      <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                        <MdOutlineFlightTakeoff className="text-2xl" />
                      </div>
                      <div className="text-2xl font-bold">تورنگار</div>
                    </div>
                  </motion.div>
                </div>

                {/* اطلاعات اصلی */}
                <div className="flex-grow flex flex-col items-center lg:items-start justify-center text-white my-8">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-3xl lg:text-4xl font-bold mb-6 tracking-tight"
                  >
                    سفر خود را مدیریت کنید
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-white/70 text-sm lg:text-base max-w-md leading-relaxed text-center lg:text-right"
                  >
                    با استفاده از سیستم مدیریت تورنگار، تمام فرایندهای کاری آژانس مسافرتی خود را ساده‌تر و هوشمندتر انجام دهید.
                  </motion.p>
                  
                  {/* مزیت‌ها */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col gap-4 mt-8 w-full max-w-xs"
                  >
                    {[
                      { icon: <MdOutlineFlightTakeoff />, text: "مدیریت پروازها و رزرو بلیط" },
                      { icon: <MdOutlineLocationCity />, text: "تنظیم هتل‌ها و اقامتگاه‌ها" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className="text-sm text-white/80">{item.text}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
                
                {/* فوتر */}
                <div className="text-center lg:text-right">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-white/50 text-xs"
                  >
                    © تورنگار ۱۴۰۲ - تمامی حقوق محفوظ است
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* انیمیشن کره‌های شناور */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`floating-${i}`}
            className={`absolute rounded-full ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5' 
                : 'bg-gradient-to-br from-indigo-500/5 to-purple-500/5'
            }`}
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              filter: 'blur(40px)',
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* استایل‌های اضافی */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  )
}
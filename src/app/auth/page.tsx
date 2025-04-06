'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, Variants, Variant } from 'framer-motion'
import { FaUser, FaLock, FaExclamationCircle, FaEye, FaEyeSlash, FaPlane } from 'react-icons/fa'
import { BiCloud } from 'react-icons/bi'
import { MdLocationOn, MdOutlineAirplaneTicket } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

// تعریف اسکیما برای اعتبارسنجی فرم
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

// حرکت هواپیما
const planeFlyAnimation: Variants = {
  initial: { x: -100, y: 50, opacity: 0 },
  animate: { 
    x: 400, 
    y: -100, 
    opacity: [0, 1, 1, 0],
    transition: { 
      duration: 10,
      repeat: Infinity,
      repeatType: "loop",
      ease: "easeInOut",
      times: [0, 0.1, 0.9, 1]
    }
  }
}

// حرکت ابرها
const cloudAnimation: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: (i: number) => ({
    x: 500,
    opacity: [0, 1, 1, 0],
    transition: {
      duration: 15 + i * 2,
      repeat: Infinity,
      repeatType: "loop",
      ease: "linear",
      times: [0, 0.1, 0.9, 1],
      delay: i * 2.5
    }
  })
}

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-b from-primary via-secondary to-blue-400 p-6">
      {/* عناصر تزیینی متحرک */}
      <div className="absolute inset-0 overflow-hidden">
        {/* هواپیما پرواز کننده */}
        <motion.div
          className="absolute z-10"
          variants={planeFlyAnimation}
          initial="initial"
          animate="animate"
        >
          <FaPlane className="text-white text-4xl rotate-[30deg]" />
          <div className="absolute h-1 w-20 bg-white/30 blur-sm top-2 right-4 rotate-[30deg]" />
        </motion.div>
        
        {/* ابرها */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            custom={i}
            variants={cloudAnimation}
            initial="initial"
            animate="animate"
            style={{
              top: `${15 + i * 15}%`,
              left: `${-20 + i * 5}%`
            }}
          >
            <BiCloud className={`text-white/40 text-${4 + i}xl`} />
          </motion.div>
        ))}
        
        {/* دایره‌های تزئینی */}
        <div className="absolute top-[10%] right-[10%] w-64 h-64 rounded-full bg-primary/30 blur-[60px]" />
        <div className="absolute bottom-[20%] left-[10%] w-72 h-72 rounded-full bg-accent/20 blur-[80px]" />
      </div>
      
      {/* کارت ورود */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 bg-white/20 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/30"
      >
        {/* نشان‌دهنده پرواز بالای کارت */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute -top-14 left-[calc(50%-3rem)] w-24 h-24 rounded-full bg-gradient-to-r from-accent to-amber-400 flex items-center justify-center shadow-xl"
        >
          <MdOutlineAirplaneTicket className="text-white text-5xl" />
        </motion.div>
        
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 mt-6">ورود به سیستم</h1>
          <p className="text-white/80 text-lg">
            برای مدیریت مسافران و تورها وارد شوید
          </p>
          
          {/* خط تزیینی */}
          <div className="flex items-center justify-center my-6">
            <div className="h-0.5 bg-white/20 w-1/4"></div>
            <div className="mx-4">
              <FaPlane className="text-white/60 rotate-90" />
            </div>
            <div className="h-0.5 bg-white/20 w-1/4"></div>
          </div>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-error/10 backdrop-blur-sm border border-error/30 rounded-xl flex items-center text-white"
          >
            <FaExclamationCircle className="h-5 w-5 flex-shrink-0 ml-3 text-error" />
            <span>{error}</span>
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-white font-medium text-right">
              شماره موبایل
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-white/70" />
              </div>
              <input
                id="phoneNumber"
                type="text"
                placeholder="09123456789"
                {...register('phoneNumber')}
                dir="rtl"
                className={`block w-full pr-12 pl-4 py-4 bg-white/10 border text-right
                ${errors.phoneNumber ? 'border-error' : 'border-white/30'}
                rounded-xl focus:outline-none focus:ring-2 focus:ring-accent placeholder-white/50 text-white`}
              />
            </div>
            {errors.phoneNumber && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-sm text-error font-medium text-right"
              >
                {errors.phoneNumber.message}
              </motion.p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-white font-medium text-right">
              رمز عبور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-white/70" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="رمز عبور خود را وارد کنید"
                {...register('password')}
                dir="rtl"
                className={`block w-full pr-12 pl-10 py-4 bg-white/10 border text-right
                ${errors.password ? 'border-error' : 'border-white/30'}
                rounded-xl focus:outline-none focus:ring-2 focus:ring-accent placeholder-white/50 text-white`}
              />
              <button
                type="button"
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-white/70" />
                ) : (
                  <FaEye className="h-5 w-5 text-white/70" />
                )}
              </button>
            </div>
            {errors.password && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-sm text-error font-medium text-right"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>
          
          <div className="pt-4">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-accent to-amber-500 text-white font-bold text-lg shadow-lg hover:shadow-accent/50 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-70 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                  در حال ورود...
                </>
              ) : (
                <>
                  ورود به تورنگار
                  <FaPlane className="ml-2" />
                </>
              )}
            </motion.button>
          </div>
        </form>
        
        {/* تزیین کارت */}
        <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-accent/80 rounded-full flex items-center justify-center">
          <MdLocationOn className="text-white text-2xl" />
        </div>
        
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary/80 rounded-full flex items-center justify-center">
          <BiCloud className="text-white text-xl" />
        </div>
      </motion.div>
    </div>
  )
} 
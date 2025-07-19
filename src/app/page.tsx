'use client'
import { useState, useEffect, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FaSignInAlt, FaCheckCircle, FaPlane, FaHotel, FaTicketAlt, FaBed } from 'react-icons/fa'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// کامپوننت بسیار ساده برای CSR
const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-blue-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    )
  }
  
  return <>{children}</>
}

export default function Home() {
  const router = useRouter()
  
  // بررسی توکن - بدون استفاده از isLoading و renderContent
  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('خطا در بررسی توکن:', error)
    }
  }, [router])

  return (
    <ClientOnly>
      <main className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
        {/* تزئینات پس‌زمینه */}
        <div className="absolute inset-0 pointer-events-none">
          {/* دایره بزرگ آبی */}
          <div 
            className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[60px]"
          />
          
          {/* نوار موجی آبی */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[30vh] opacity-40"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 320\'%3E%3Cpath fill=\'%233b82f6\' fill-opacity=\'0.2\' d=\'M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,202.7C672,213,768,203,864,181.3C960,160,1056,128,1152,122.7C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\'%3E%3C/path%3E%3C/svg%3E")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col items-center justify-center min-h-screen py-20">
          {/* محتوای اصلی */}
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-16">
            {/* بخش متنی */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 max-w-xl"
            >
              <h1 className="text-6xl md:text-8xl font-bold text-slate-800 mb-12 leading-tight relative">
                <span className="relative block mb-4">مدیریت</span>
                <span className="relative block bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text mb-4">هوشمند</span>
                <span className="relative block">سفرها</span>
              </h1>
              
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                با استفاده از <span className="text-blue-600 font-semibold">جدیدترین تکنولوژی‌ها</span>، سفرهای مشتریان خود را به آسانی مدیریت کنید و <span className="text-blue-600 font-semibold">تجربه‌ای بی‌نظیر</span> برای آنها فراهم آورید.
              </p>
              
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center gap-3"
                >
                  <span className="relative z-10 flex items-center">
                    <FaSignInAlt className="text-xl" />
                    <span className="mr-2">ورود به سیستم</span>
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {/* تصویر اصلی - ساده‌سازی شده */}
            <motion.div 
              className="flex-1 w-full max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white"></div>
                
                {/* کارت‌های اطلاعات مختلف با انیمیشن‌های ساده‌تر */}
                <div className="absolute left-[10%] top-[15%] bg-white rounded-xl shadow-lg p-4 w-[30%]">
                  <div className="h-3 w-[60%] rounded-full bg-blue-200 mb-2"></div>
                  <div className="h-5 w-[90%] rounded-md bg-blue-100"></div>
                </div>
                
                <div className="absolute left-[45%] top-[40%] bg-blue-600 rounded-xl shadow-lg p-4 w-[40%]">
                  <div className="h-3 w-[60%] rounded-full bg-blue-400 mb-2"></div>
                  <div className="h-5 w-[80%] rounded-md bg-blue-500"></div>
                </div>
                
                <div className="absolute left-[15%] bottom-[20%] bg-white rounded-xl shadow-lg p-4 w-[35%]">
                  <div className="h-3 w-[70%] rounded-full bg-blue-200 mb-2"></div>
                  <div className="h-5 w-[90%] rounded-md bg-blue-100"></div>
                </div>
                
                {/* لوگوی ساده */}
                <div className="absolute left-[60%] bottom-[10%] h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-14 w-14 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* بخش ویژگی‌ها - تیک‌های خدمات */}
          <motion.div 
            className="w-full mt-24 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <FaPlane className="text-3xl" />, title: 'مدیریت پرواز‌ها', description: 'مدیریت آسان و هوشمند پروازها', bg: 'from-blue-500 to-blue-600' },
                { icon: <FaTicketAlt className="text-3xl" />, title: 'رزرو بلیط', description: 'سیستم رزرو آنلاین و هوشمند', bg: 'from-indigo-500 to-indigo-600' },
                { icon: <FaHotel className="text-3xl" />, title: 'تنظیم هتل‌ها', description: 'مدیریت و رزرو انواع هتل‌ها', bg: 'from-blue-600 to-indigo-500' },
                { icon: <FaBed className="text-3xl" />, title: 'اقامتگاه‌ها', description: 'دسترسی به انواع اقامتگاه‌ها', bg: 'from-indigo-600 to-blue-500' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${feature.bg} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                    <h3 className="text-xl font-bold text-slate-800">{feature.title}</h3>
                  </div>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* فوتر - ساده‌سازی شده */}
        <footer className="w-full py-10 relative overflow-hidden z-10">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 backdrop-blur-lg rounded-2xl p-8 border border-blue-100 shadow-xl overflow-hidden">
              {/* افکت‌های بصری پس‌زمینه */}
              <div className="absolute -top-5 -right-5 h-24 w-24 bg-blue-200/40 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-5 -left-5 h-24 w-24 bg-indigo-200/40 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 h-40 w-40 bg-blue-100/20 rounded-full blur-3xl"></div>
              
              {/* خطوط تزئینی */}
              <div className="absolute inset-0 opacity-10">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent absolute top-1/4"></div>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent absolute top-3/4"></div>
                <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent absolute left-1/4"></div>
                <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent absolute left-3/4"></div>
              </div>
              
              <div className="relative flex flex-col items-center">
                {/* لوگو و نام */}
                <div className="flex items-center justify-center mb-6">
                  <div className="group relative h-16 w-16 flex">
                    {/* حلقه‌های متحرک */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-300 opacity-80 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute inset-1 rounded-full border-2 border-indigo-300 opacity-70 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.2s' }}></div>
                    
                    {/* لوگوی اصلی */}
                    <div className="absolute inset-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 z-10">
                      <span className="text-white font-bold text-xl">AT</span>
                    </div>
                  </div>
                </div>

                {/* کپی‌رایت با طراحی جدید */}
                <div className="relative mt-4 pt-6 text-center">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <span className="text-blue-500 font-medium">©</span>
                    <span>{new Date().getFullYear()}</span>
                    <span className="relative px-3">
                      <span className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></span>
                      <span className="relative bg-white/80 px-2 font-medium">تمام حقوق برای عتبات تور محفوظ است</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </ClientOnly>
  )
}

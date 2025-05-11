'use client'
import { useState, useEffect, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FaSignInAlt } from 'react-icons/fa'
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
          
          {/* بخش ویژگی‌ها - ساده‌سازی شده */}
          <motion.div 
            className="w-full mt-24 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { number: '۱۰۰۰+', label: 'مسافر', bg: 'bg-blue-50' },
                { number: '۵۰+', label: 'تور فعال', bg: 'bg-blue-100/60' },
                { number: '۲۰+', label: 'مقصد', bg: 'bg-blue-100' },
                { number: '۲۴/۷', label: 'پشتیبانی', bg: 'bg-blue-200/60' },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={`text-center ${stat.bg} p-6 rounded-2xl border border-blue-100 backdrop-blur-sm`}
                >
                  <div className="text-4xl font-bold text-blue-900 mb-2">{stat.number}</div>
                  <div className="text-blue-700">{stat.label}</div>
                </div>
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
                      <span className="text-white font-bold text-xl">AF</span>
                    </div>
                  </div>
                </div>
                
                {/* اطلاعات با طراحی جدید */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
                  <div className="flex items-center relative">
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-2xl mb-1">
                        علی فراست
                      </span>
                      <span className="text-slate-500 text-sm">توسعه‌دهنده و طراح وب</span>
                    </div>
                  </div>
                  
                  <div className="h-10 w-px bg-gradient-to-b from-blue-200 via-indigo-300 to-blue-200 hidden md:block"></div>
                  
                  <a 
                    href="https://web.xtr.lol" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-6 py-2 rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.385 17.385 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.18 17.18 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817 18.64 18.64 0 001.988-4.718 18.627 18.627 0 005.49-2.098zM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.816zM13.878 2.43a9.755 9.755 0 016.116 3.986 11.267 11.267 0 01-3.746 2.504 18.63 18.63 0 00-2.37-6.49zM12 2.276a17.152 17.152 0 012.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0112 2.276zM10.122 2.43a18.629 18.629 0 00-2.37 6.49 11.266 11.266 0 01-3.746-2.504 9.754 9.754 0 016.116-3.985z" />
                      </svg>
                      <span className="font-medium text-sm">web.xtr.lol</span>
                    </div>
                  </a>
                  
                  <a 
                    href="tel:+989134398990" 
                    className="group relative px-6 py-2 rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-sm">۰۹۱۳۴۳۹۸۹۹۰</span>
                    </div>
                  </a>
                </div>

                {/* کپی‌رایت با طراحی جدید */}
                <div className="relative mt-4 pt-6 text-center">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
                  
                  <div className="inline-flex items-center px-4 py-1 rounded-full bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 mb-2">
                    <div className="flex items-center text-sm">
                      <span className="text-slate-500">طراحی و توسعه توسط</span>
                      <span className="mx-1 font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">علی فراست</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span className="text-blue-500 font-medium">©</span>
                    <span>{new Date().getFullYear()}</span>
                    <span className="relative px-3">
                      <span className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></span>
                      <span className="relative bg-white/80 px-2">تمامی حقوق محفوظ است</span>
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

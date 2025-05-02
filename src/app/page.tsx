'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { FaSignInAlt } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [controls, isInView])
  
  // بررسی وجود توکن و هدایت به داشبورد
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token')
          if (token) {
            router.push('/dashboard')
          } else {
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-blue-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* تزئینات پس‌زمینه */}
      <div className="absolute inset-0 pointer-events-none">
        {/* دایره بزرگ آبی */}
        <div 
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[60px]"
          style={{ 
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 70%, rgba(59,130,246,0) 100%)' 
          }}
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
        
        {/* نقاط آبی تزئینی */}
        <div className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.3) 2%, transparent 0%)',
            backgroundSize: '60px 60px' 
          }} 
        />
        
        {/* بلور‌های نور */}
        <div className="absolute top-[30%] left-[10%] w-[15vw] h-[15vw] rounded-full bg-blue-300/20 blur-[50px]" />
        <div className="absolute top-[60%] left-[60%] w-[10vw] h-[10vw] rounded-full bg-blue-400/15 blur-[40px]" />
      </div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col items-center justify-center min-h-screen py-20">
        {/* محتوای اصلی */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-16">
          {/* بخش متنی */}
          <motion.div 
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
              }
            }}
            className="flex-1 max-w-xl"
          >
            <h1 className="text-6xl md:text-8xl font-bold text-slate-800 mb-12 leading-tight relative">
              <span className="absolute -left-4 -top-4 w-20 h-20 bg-blue-200/30 rounded-full blur-2xl"></span>
              <span className="absolute -right-10 bottom-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></span>
              
              <span className="relative block mb-4 text-gradient-shadow">مدیریت</span>
              <span className="relative block bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text mb-4 text-gradient-glow">هوشمند</span>
              <span className="relative block text-gradient-shadow">سفرها</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-10 leading-relaxed relative">
              <span className="absolute -z-10 -left-4 -bottom-4 w-full h-10 bg-blue-50 blur-xl rounded-full opacity-70"></span>
              با استفاده از <span className="text-blue-600 font-semibold">جدیدترین تکنولوژی‌ها</span>، سفرهای مشتریان خود را به آسانی مدیریت کنید و <span className="text-blue-600 font-semibold">تجربه‌ای بی‌نظیر</span> برای آنها فراهم آورید.
            </p>
            
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center gap-3 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/25 transition-all"
              >
                <span className="relative z-10 flex items-center">
                  <FaSignInAlt className="text-xl" />
                  <span className="mr-2">ورود به سیستم</span>
                </span>
                
                <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="absolute top-0 right-full w-full h-full bg-white/20 skew-x-12 transition-all duration-700 group-hover:right-0"></span>
              </motion.button>
            </Link>
          </motion.div>

          {/* تصویر اصلی */}
          <motion.div 
            className="flex-1 w-full max-w-2xl"
            initial="hidden"
            animate={controls}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { 
                opacity: 1, 
                scale: 1,
                transition: { duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
              }
            }}
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-xl shadow-blue-100 transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white"></div>
              
              {/* کارت‌های اطلاعات مختلف با انیمیشن شناور */}
              <motion.div 
                className="absolute left-[10%] top-[15%] bg-white rounded-xl shadow-lg p-4 w-[30%]"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [-1, 0, -1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 5,
                  ease: "easeInOut"
                }}
              >
                <div className="h-3 w-[60%] rounded-full bg-blue-200 mb-2"></div>
                <div className="h-5 w-[90%] rounded-md bg-blue-100"></div>
              </motion.div>
              
              <motion.div 
                className="absolute left-[45%] top-[40%] bg-blue-600 rounded-xl shadow-lg p-4 w-[40%]"
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [1, 0, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 6,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <div className="h-3 w-[60%] rounded-full bg-blue-400 mb-2"></div>
                <div className="h-5 w-[80%] rounded-md bg-blue-500"></div>
              </motion.div>
              
              <motion.div 
                className="absolute left-[15%] bottom-[20%] bg-white rounded-xl shadow-lg p-4 w-[35%]"
                animate={{ 
                  y: [0, 8, 0],
                  rotate: [0, 1, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 7,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <div className="h-3 w-[70%] rounded-full bg-blue-200 mb-2"></div>
                <div className="h-5 w-[90%] rounded-md bg-blue-100"></div>
              </motion.div>
              
              {/* محل قرار دادن تصویر سفر (می‌توانید تصویر مناسب را جایگزین کنید) */}
              <div className="absolute left-[60%] bottom-[10%] h-24 w-24 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center">
                <div className="h-14 w-14 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* بخش ویژگی‌ها با برچسب و اعداد آماری */}
        <motion.div 
          className="w-full mt-24 mb-10"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.5,
              }
            }
          }}
          initial="hidden"
          animate={controls}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '۱۰۰۰+', label: 'مسافر', border: 'border-blue-100', bg: 'bg-blue-50' },
              { number: '۵۰+', label: 'تور فعال', border: 'border-blue-200', bg: 'bg-blue-100/60' },
              { number: '۲۰+', label: 'مقصد', border: 'border-blue-300', bg: 'bg-blue-100' },
              { number: '۲۴/۷', label: 'پشتیبانی', border: 'border-blue-400', bg: 'bg-blue-200/60' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className={`text-center ${stat.bg} p-6 rounded-2xl border ${stat.border} backdrop-blur-sm transition-all duration-300 hover:shadow-lg`}
              >
                <div className="text-4xl font-bold text-blue-900 mb-2">{stat.number}</div>
                <div className="text-blue-700">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* فوتر */}
      <footer className="w-full py-10 relative overflow-hidden z-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          {/* محتوای اصلی فوتر */}
          <div className="relative bg-white bg-opacity-70 backdrop-blur-lg rounded-2xl px-8 py-8 border border-blue-100 shadow-lg">
            {/* تزئینات */}
            <div className="absolute -top-5 -right-5 h-20 w-20 bg-blue-100 rounded-full blur-2xl opacity-60"></div>
            <div className="absolute -bottom-5 -left-5 h-16 w-16 bg-blue-200 rounded-full blur-2xl opacity-60"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-40 w-40 bg-blue-50 rounded-full blur-3xl opacity-30"></div>
            
            <div className="relative flex flex-col items-center">
              {/* لوگو و نام */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">AF</span>
                  <div className="absolute inset-0 rounded-full border-2 border-white opacity-30"></div>
                </div>
              </div>
              
              {/* اطلاعات */}
              <div className="flex flex-col md:flex-row items-center gap-5 mb-6">
                <div className="flex items-center relative">
                  <span className="text-blue-700 font-bold text-lg relative">
                    علی فراست
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></span>
                  </span>
                </div>
                
                <div className="h-6 w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent hidden md:block"></div>
                
                <a 
                  href="https://web.xtr.lol" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center group"
                >
                  <span className="text-sm group-hover:underline">web.xtr.lol</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 opacity-70 group-hover:opacity-100">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                </a>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className="relative px-5 py-2 rounded-full bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5">
                  <div className="flex items-center text-slate-500 text-sm">
                    <span>ساخته شده با</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 mx-1.5 animate-pulse">
                      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                    </svg>
                    <span>در بهترین استودیو طراحی</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1">
                <span>©</span>
                <span>{new Date().getFullYear()}</span>
                <span>تمامی حقوق محفوظ است</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

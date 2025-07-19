'use client'
import { useState, useEffect, ReactNode, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { FiPackage, FiHome, FiMonitor, FiGlobe, FiTrello } from "react-icons/fi";
import { 
  FaTachometerAlt, 
  FaUsersCog, 
  FaPlane, 
  FaHotel, 
  FaUserFriends, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaChevronDown,
  FaUserPlus,
  FaList,
  FaRoute,
  FaPlaneDeparture,
  FaMapMarkedAlt,
  FaCog,
  FaChartLine,
  FaTicketAlt,
  FaDollarSign,
  FaRegBell,
  FaPhone,
  FaMoon,
  FaSun,
  FaUserShield,
  FaImages
} from 'react-icons/fa'

// تعریف متغیرهای رنگی اصلی برای استفاده در سراسر کامپوننت
const colors = {
  primary: {
    light: '#3b82f6', // blue-500
    DEFAULT: '#2563eb', // blue-600
    dark: '#1d4ed8', // blue-700
  },
  secondary: {
    light: '#a5b4fc', // indigo-300
    DEFAULT: '#6366f1', // indigo-500
    dark: '#4338ca', // indigo-700
  },
  accent: {
    light: '#c7d2fe', // indigo-200
    DEFAULT: '#818cf8', // indigo-400
    dark: '#4f46e5', // indigo-600
  },
  success: {
    light: '#86efac', // green-300
    DEFAULT: '#22c55e', // green-500
    dark: '#16a34a', // green-600
  },
  warning: {
    light: '#fde68a', // amber-200
    DEFAULT: '#f59e0b', // amber-500
    dark: '#d97706', // amber-600
  },
  error: {
    light: '#fca5a5', // red-300
    DEFAULT: '#ef4444', // red-500
    dark: '#dc2626', // red-600
  },
  neutral: {
    50: '#f8fafc',     // slate-50
    100: '#f1f5f9',    // slate-100
    200: '#e2e8f0',    // slate-200
    300: '#cbd5e1',    // slate-300
    400: '#94a3b8',    // slate-400
    500: '#64748b',    // slate-500
    600: '#475569',    // slate-600
    700: '#334155',    // slate-700
    800: '#1e293b',    // slate-800
    900: '#0f172a',    // slate-900
  }
}

// گرادیان‌های پس‌زمینه
const gradients = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
  secondary: 'bg-gradient-to-r from-indigo-500 to-purple-500',
  accent: 'bg-gradient-to-r from-blue-400 to-indigo-400',
  sidebar: 'bg-gradient-to-b from-slate-800/95 to-slate-900/95',
  card: 'bg-gradient-to-br from-white to-slate-50',
  button: 'bg-gradient-to-r from-blue-600 to-indigo-600',
  success: 'bg-gradient-to-r from-green-500 to-emerald-500',
  error: 'bg-gradient-to-r from-red-500 to-rose-500',
  glass: 'bg-white/70 backdrop-blur-lg saturate-150',
}

// افکت‌های کارت
const cardEffects = {
  standard: 'bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300',
  glass: 'bg-white/70 backdrop-blur-md border border-white/50 shadow-xl shadow-slate-200/20',
  raised: 'bg-white border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300',
  smooth: 'bg-gradient-to-br from-white to-slate-50/80 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-300',
}

// افکت‌های دکمه
const buttonEffects = {
  primary: `${gradients.primary} text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300`,
  outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-300',
  glass: 'bg-white/50 backdrop-blur-md border border-white/50 text-slate-800 hover:bg-white/70 transition-all duration-300',
  text: 'text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300',
}

interface DashboardLayoutProps {
  children: ReactNode
}

interface MenuItem {
  title: string
  path: string
  icon: ReactNode
  roles: string[]
  subMenu?: {
    title: string
    path: string
    icon?: ReactNode
    roles: string[]
  }[]
}

// منوهای دا شب ورد - تعریف خارج از کامپوننت تا در هر رندر دوباره ساخته نشود
const menuItemsData: MenuItem[] = [
  {
    title: 'داشبورد',
    path: '/dashboard',
    icon: <FiHome />,
    roles: ['super-admin', 'admin', 'admin+']
  },
  {
    title: 'مدیریت همکاران',
    path: '/dashboard/admin-management',
    icon: <FaUsersCog />,
    roles: ['super-admin'],
    subMenu: [
      {
        title: 'افزودن همکار',
        path: '/dashboard/admin-management/add',
        icon: <FaUserPlus />,
        roles: ['super-admin']
      },
      {
        title: 'لیست همکاران',
        path: '/dashboard/admin-management/list',
        icon: <FaList />,
        roles: ['super-admin']
      }
    ]
  },
  {
    title: 'مدیریت تور ',
    path: '#',
    icon: <FiPackage />,
    roles: ['super-admin', 'admin', 'admin+'],
    subMenu: [
      {
        title: 'مدیریت پکیج‌های سفر',
        path: '/dashboard/package-management',
        icon: <FiPackage />,
        roles: ['super-admin', 'admin', 'admin+']
      },
      {
        title: 'مدیریت مسافران',
        path: '/dashboard/all-passengers',
        icon: <FaUserFriends />,
        roles: ['super-admin', 'admin']
      }
    ]
  },
  {
    title: 'رزروهای من',
    path: '/dashboard/my-reservations',
    icon: <FiTrello />,
    roles: ['admin+']
  },
  {
    title: 'بلیط شناور',
    path: '/dashboard/floating-ticket',
    icon: <FaTicketAlt />,
    roles: ['super-admin', 'admin'],
    subMenu: [
      {
        title: 'ایجاد بلیط جدید',
        path: '/dashboard/floating-ticket',
        icon: <FaPlaneDeparture />,
        roles: ['super-admin', 'admin']
      },
      {
        title: 'تاریخچه بلیط‌ها',
        path: '/dashboard/floating-ticket/history',
        icon: <FaList />,
        roles: ['super-admin', 'admin']
      }
    ]
  },
  {
    title: 'مدیریت راه‌ها',
    path: '/dashboard/way-management',
    icon: <FiGlobe />,
    roles: ['super-admin', 'admin'],
    subMenu: [
      {
        title: 'مدیریت مسیرها',
        path: '/dashboard/route-management',
        icon: <FaRoute />,
        roles: ['super-admin', 'admin']
      },
      {
        title: 'شرکت‌های هواپیمایی',
        path: '/dashboard/airline-management',
        icon: <FaPlane />,
        roles: ['super-admin', 'admin']
      },

      {
        title: 'مدیریت هتل‌ها',
        path: '/dashboard/hotels',
        icon: <FaHotel />,
        roles: ['super-admin', 'admin']
      },

      {
        title: 'کتابخانه تصاویر',
        path: '/dashboard/image-library',
        icon: <FaImages />,
        roles: ['super-admin', 'admin']
      },

    ]
  },

]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [headerProfileMenuOpen, setHeaderProfileMenuOpen] = useState(false)
  const [currencyData, setCurrencyData] = useState<any>(null)
  const [currencyLoading, setCurrencyLoading] = useState(true)
  const [notifications, setNotifications] = useState<{id: number; text: string; time: string; read: boolean}[]>([
    {id: 1, text: 'رزرو جدید ثبت شده است', time: '5 دقیقه پیش', read: false},
    {id: 2, text: 'بروزرسانی قیمت ارز', time: '1 ساعت پیش', read: false},
    {id: 3, text: 'پیام جدید از مدیر سیستم', time: '3 ساعت پیش', read: true},
  ])
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  
  const router = useRouter()
  const pathname = usePathname()
  
  // فیلتر منوها بر اساس نقش کاربر با useMemo
  const filteredMenuItems = useMemo(() => {
    return menuItemsData.filter(item => 
      user && item.roles.includes(user.role)
    )
  }, [user])
  
  useEffect(() => {
    // بررسی وجود توکن در localStorage
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (!token || !storedUser) {
      router.push('/auth')
      return
    }
    
    try {
      // تنظیم اطلاعات کاربر
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }, [router])
  
  // فعال کردن منوی مربوط به مسیر جاری
  useEffect(() => {
    const currentItem = menuItemsData.find(item => 
      pathname === item.path || pathname.startsWith(`${item.path}/`)
    )
    if (currentItem && currentItem.subMenu) {
      setActiveSubmenu(currentItem.title)
    }
  }, [pathname])
  
  // تنظیم نمایش منو و تشخیص موبایل/دسکتاپ
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 1024;
      setIsMobile(mobileCheck);

      if (!mobileCheck) {
        setMobileMenuOpen(false);
        setSidebarOpen(true);
      } else {
        // اولویت حفظ حالت منو در موبایل
      }
    };

    // بررسی اولیه
    handleResize();

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // دریافت اطلاعات ارز از API
  useEffect(() => {
    const fetchCurrencyData = async () => {
      try {
        setCurrencyLoading(true)
        const response = await fetch('https://brsapi.ir/Api/Market/Gold_Currency.php?key=FreeWnM1OFx0SJMkf7GBjCvlLZalUIe0')
        
        if (!response.ok) {
          throw new Error('مشکل در دریافت اطلاعات ارز')
        }
        
        const data = await response.json()
        // پیدا کردن اطلاعات دلار از بین داده‌های دریافتی
        const usdData = data.currency.find((item: any) => item.symbol === 'USD')
        setCurrencyData(usdData)
      } catch (error) {
        console.error('خطا در دریافت اطلاعات ارز:', error)
      } finally {
        setCurrencyLoading(false)
      }
    }
    
    fetchCurrencyData()
    
    // بروزرسانی هر 5 دقیقه
    const interval = setInterval(fetchCurrencyData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // بازیابی حالت تاریک از localStorage و اعمال اولیه
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
      setDarkMode(JSON.parse(storedDarkMode));
    }
    // آپشنال: بررسی ترجیح سیستم کاربر اگر مقداری در localStorage نبود
    // else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    //   setDarkMode(true);
    // }
  }, []);

  // ذخیره حالت تاریک در localStorage هنگام تغییر
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth')
  }
  
  const toggleSubmenu = (title: string) => {
    if (activeSubmenu === title) {
      setActiveSubmenu(null)
    } else {
      setActiveSubmenu(title)
    }
  }
  
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})))
  }
  
  // صفحه بارگذاری با طراحی مدرن
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50">
        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-indigo-500/5 blur-2xl animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="relative flex flex-col items-center">
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-blue-500/70 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-4 border-l-4 border-indigo-500/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-4 rounded-full border-t-4 border-b-4 border-blue-400/50 animate-spin" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-0 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <Image src="/logo.jpg" alt="عتبات تور" width={40} height={40} className="rounded-full" />
              </div>
            </div>
            <h3 className="mt-6 text-blue-700 font-medium">در حال بارگذاری پنل مدیریت</h3>
            <div className="mt-2 flex space-x-1 space-x-reverse">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <MotionConfig reducedMotion="user">
      <div className={`flex flex-col lg:flex-row min-h-screen ${darkMode ? 'dark bg-slate-900 text-slate-300' : 'bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 text-slate-800'}`}>
        {/* نوار بالایی در حالت موبایل */}
        <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 z-40 ${darkMode ? 'bg-slate-800/90 border-slate-700/70' : 'bg-white/90 border-slate-200/70'} backdrop-blur-xl px-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-gradient-to-br from-sky-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} p-0.5 shadow-lg ${darkMode ? 'shadow-sky-500/20' : 'shadow-blue-500/20'} overflow-hidden`}>
              <div className={`w-full h-full rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'} flex items-center justify-center`}>
                <Image src="/logo.jpg" alt="عتبات تور" width={24} height={24} className="rounded-full" />
              </div>
            </div>
            <div>
              <h1 className={`text-lg font-bold ${darkMode ? 'text-sky-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text'}`}>
                عتبات تور
              </h1>
              <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} -mt-1`}>سامانه مدیریت مسافرتی</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200'} shadow-md transition-colors`}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <div 
              className={`w-9 h-9 rounded-full ${darkMode ? 'bg-gradient-to-br from-sky-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} p-0.5 shadow-md ${darkMode ? 'shadow-sky-400/10' : 'shadow-blue-400/10'} cursor-pointer`}
              onClick={() => setHeaderProfileMenuOpen(!headerProfileMenuOpen)}
            >
              <div className={`w-full h-full rounded-full ${darkMode ? 'bg-slate-700' : 'bg-white'} flex items-center justify-center text-xs font-bold ${darkMode ? 'text-sky-300' : 'text-indigo-600'}`}>
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
        
        {/* دکمه منو در موبایل - ثابت در پایین صفحه */}
        <div className="lg:hidden fixed bottom-6 left-6 z-50">
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-500"
            animate={{
              backgroundColor: mobileMenuOpen ? (darkMode ? colors.error.dark : '#ef4444') : (darkMode ? colors.primary.dark : '#3b82f6'),
              rotate: mobileMenuOpen ? 180 : 0,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                rotate: mobileMenuOpen ? 90 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {mobileMenuOpen ? (
                <FaTimes className="text-xl text-white" />
              ) : (
                <FaBars className="text-xl text-white" />
              )}
            </motion.div>
            <div className={`absolute inset-0 rounded-full ${darkMode ? 'bg-sky-500/30' : 'bg-blue-500/30'} animate-ping`} style={{ animationDuration: '3s' }}></div>
          </motion.button>
        </div>
        
        {/* پوشاننده برای کلیک خارج از منو در حالت موبایل */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>
        
        {/* منوی پروفایل موبایل */}
        <AnimatePresence>
          {headerProfileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setHeaderProfileMenuOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                className={`fixed left-4 right-4 top-20 rounded-2xl shadow-2xl z-50 lg:hidden overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
              >
                <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl ${darkMode ? 'bg-gradient-to-br from-sky-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} p-0.5 shadow-md ${darkMode ? 'shadow-indigo-500/20' : 'shadow-indigo-400/20'} overflow-hidden`}>
                      <div className={`w-full h-full rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-white'} flex items-center justify-center text-lg font-bold ${darkMode ? 'text-sky-300' : 'text-indigo-600'}`}>
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.fullName}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ 
                        user?.role === 'super-admin' 
                          ? `${darkMode ? 'bg-indigo-700/50 text-indigo-300' : 'bg-indigo-100 text-indigo-800'}` 
                          : user?.role === 'admin+' 
                            ? `${darkMode ? 'bg-green-700/50 text-green-300' : 'bg-green-100 text-green-800'}` 
                            : `${darkMode ? 'bg-sky-700/50 text-sky-300' : 'bg-blue-100 text-blue-800'}`
                      }`}>
                        {user?.role === 'super-admin' 
                          ? 'مدیر کل' 
                          : user?.role === 'admin+' 
                            ? 'همکار' 
                            : 'ادمین'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Link 
                    href="/dashboard/profile"
                    className={`w-full text-right px-4 py-3 flex items-center text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-600 hover:text-sky-400' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'} transition-colors`}
                    onClick={() => setHeaderProfileMenuOpen(false)}
                  >
                    <div className={`w-7 h-7 rounded-lg ${darkMode ? 'bg-slate-600 text-sky-400' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center ml-3`}>
                      <FaUser className="text-sm" />
                    </div>
                    <span>پروفایل کاربری</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className={`w-full text-right px-4 py-3 flex items-center text-sm ${darkMode ? 'text-red-400 hover:bg-slate-600' : 'text-red-600 hover:bg-red-50'} transition-colors mt-1`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${darkMode ? 'bg-slate-600 text-red-400' : 'bg-red-100 text-red-600'} flex items-center justify-center ml-3`}>
                      <FaSignOutAlt className="text-sm" />
                    </div>
                    <span>خروج از حساب کاربری</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* منوی کوچک برای حالت موبایل */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed left-4 right-4 top-20 bottom-24 z-40 rounded-3xl shadow-2xl overflow-hidden lg:hidden ${darkMode ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white/90 border-slate-100/80'} backdrop-blur-xl`}
            >
              <div className="h-full overflow-auto p-5 custom-scrollbar">
                <div className="mb-6">
                  <h4 className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-3 px-1`}>منو اصلی</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredMenuItems.filter(item => !item.subMenu).map((item) => {
                      const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                      
                      return (
                        <Link 
                          key={item.path} 
                          href={item.path} 
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 ${ 
                            isActive 
                              ? `${darkMode ? 'bg-gradient-to-r from-sky-600 to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'} shadow-md ${darkMode ? 'shadow-sky-500/10' : 'shadow-blue-500/10'}` 
                              : `${darkMode ? 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80' : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100/80'}`
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className={`w-10 h-10 flex items-center justify-center rounded-xl mb-2 ${ 
                            isActive ? (darkMode ? 'bg-white/10' : 'bg-white/20') : (darkMode ? 'bg-slate-600 text-sky-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                          }`}>
                            {item.icon}
                          </div>
                          <span className="text-xs font-medium">{item.title}</span>
                          {isActive && (
                            <motion.div 
                              layoutId="mobileActiveIndicator"
                              className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-sky-400' : 'bg-white'}`}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
                
                {filteredMenuItems.filter(item => item.subMenu && item.subMenu.length > 0).length > 0 && (
                  <div className="mb-6">
                    <h4 className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-3 px-1`}>منوهای گروهی</h4>
                    <div className="space-y-3">
                      {filteredMenuItems.filter(item => item.subMenu && item.subMenu.length > 0).map((item) => {
                        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                        
                        return (
                          <div key={item.path} className={`${darkMode ? 'bg-slate-700/80' : 'bg-slate-50/80'} rounded-2xl p-3 shadow-sm`}>
                            <div className={`flex items-center px-2 py-2 mb-2 ${ 
                              isActive ? (darkMode ? 'text-sky-400' : 'text-blue-700') : (darkMode ? 'text-slate-300' : 'text-slate-700')
                            }`}>
                              <div className={`w-8 h-8 flex items-center justify-center rounded-xl ml-2 ${ 
                                isActive ? (darkMode ? 'bg-sky-700/50 text-sky-300' : 'bg-blue-100 text-blue-600') : (darkMode ? 'bg-slate-600 shadow-sm text-sky-400' : 'bg-white shadow-sm text-blue-500')
                              }`}>
                                {item.icon}
                              </div>
                              <span className="text-sm font-medium">{item.title}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-1 pr-8">
                              {item.subMenu?.map(subItem => {
                                const isSubActive = pathname === subItem.path;
                                
                                return (
                                  <Link 
                                    key={subItem.path} 
                                    href={subItem.path} 
                                    className={`flex items-center p-2 rounded-xl transition-colors ${ 
                                      isSubActive 
                                        ? `${darkMode ? 'bg-sky-700/50 text-sky-300' : 'bg-blue-100 text-blue-700'}` 
                                        : `${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-sky-400' : 'text-slate-700 hover:bg-slate-100'}`
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {subItem.icon && (
                                      <span className={`ml-1.5 text-xs ${ 
                                        isSubActive ? (darkMode ? 'text-sky-300' : 'text-blue-700') : (darkMode ? 'text-slate-400' : 'text-slate-500')
                                      }`}>
                                        {subItem.icon}
                                      </span>
                                    )}
                                    <span className="text-xs">{subItem.title}</span>
                                    {isSubActive && (
                                      <motion.div 
                                        className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-sky-400' : 'bg-indigo-500'} mr-auto`}
                                        layoutId="activeSubmenuIndicator"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                      />
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className={`pt-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <button 
                    onClick={handleLogout}
                    className={`flex items-center justify-center w-full p-3 rounded-xl ${darkMode ? 'bg-slate-700/50 text-red-400 hover:bg-slate-600/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-all`}
                  >
                    <FaSignOutAlt className="ml-2" />
                    <span className="text-sm">خروج از حساب کاربری</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* منوی کناری */}
        <motion.aside
          className={`fixed lg:sticky top-0 right-0 z-40 h-screen ${darkMode ? 'bg-slate-800/95 border-l-slate-700' : 'bg-white/95 border-l-slate-100'} backdrop-blur-lg shadow-xl lg:shadow-lg overflow-hidden`}
          initial={false}
          animate={{
            width: sidebarOpen ? 280 : 80,
            x: isMobile ? (mobileMenuOpen ? 0 : '100%') : 0,
          }}
          transition={{
            x: { type: "spring", stiffness: 350, damping: 35 },
            width: { duration: 0.3, ease: "easeInOut" },
          }}
        >
          {/* لوگو و دکمه جمع‌کردن منو */}
          <div className={`py-6 px-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3"
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gradient-to-br from-sky-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} p-0.5 flex items-center justify-center shadow-lg ${darkMode ? 'shadow-sky-500/20' : 'shadow-blue-500/20'} overflow-hidden`}>
                  <div className={`w-full h-full rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'} flex items-center justify-center`}>
                    <Image src="/logo.jpg" alt="عتبات تور" width={40} height={40} className="rounded-full" />
                  </div>
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mr-1"
                    >
                      <motion.h1
                        className={`text-2xl font-bold ${darkMode ? 'text-sky-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text'}`}
                        animate={{ y: [0, -2, 0] }}
                        transition={{ repeat: 0, duration: 0.5 }}
                      >
                        عتبات تور
                      </motion.h1>
                      <div className={`h-0.5 w-12 ${darkMode ? 'bg-gradient-to-r from-sky-500/30 to-indigo-500/30' : 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30'} rounded-full`}></div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>سامانه مدیریت مسافرتی</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`hidden lg:flex justify-center items-center w-8 h-8 rounded-full ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'} transition-colors duration-300`}
                whileHover={{ rotate: 15 }}
              >
                <motion.svg
                  animate={{ rotate: !sidebarOpen ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </motion.svg>
              </motion.button>
            </div>
          </div>
          
          {/* پروفایل کاربر */}
          <div className="relative">
            <motion.div 
              className={`p-4 border-b ${sidebarOpen ? 'flex items-center' : 'flex flex-col items-center'} ${darkMode ? 'border-slate-700/70' : 'border-slate-100/70'}`}
              animate={{ 
                backgroundColor: sidebarOpen ? (darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.7)') : (darkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.3)')
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex-shrink-0 relative">
                <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gradient-to-br from-sky-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} p-0.5 flex items-center justify-center shadow-md ${darkMode ? 'shadow-indigo-500/20' : 'shadow-indigo-400/20'} overflow-hidden`}>
                  <div className={`w-full h-full rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-white'} flex items-center justify-center text-lg font-bold ${darkMode ? 'text-sky-300' : 'text-indigo-600'}`}>
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-white'} p-0.5`}>
                  <div className="w-full h-full rounded-full bg-green-500"></div>
                </div>
              </div>
              
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mr-3 flex-1 overflow-hidden"
                  >
                    <h3 className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'} truncate`}>{user?.fullName}</h3>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ 
                        user?.role === 'super-admin' 
                          ? `${darkMode ? 'bg-indigo-700/50 text-indigo-300 border-indigo-600/50' : 'bg-indigo-100 text-indigo-800 border-indigo-200'}` 
                          : user?.role === 'admin+' 
                            ? `${darkMode ? 'bg-green-700/50 text-green-300 border-green-600/50' : 'bg-green-100 text-green-800 border-green-200'}` 
                            : `${darkMode ? 'bg-sky-700/50 text-sky-300 border-sky-600/50' : 'bg-blue-100 text-blue-800 border-blue-200'}`
                      }`}>
                        {user?.role === 'super-admin' 
                          ? 'مدیر کل' 
                          : user?.role === 'admin+' 
                            ? 'همکار' 
                            : 'ادمین'}
                      </span>
                      <div className="flex mr-2 gap-1">
                        <button 
                          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'hover:bg-slate-700/70' : 'hover:bg-slate-200/70'} transition-colors`}
                        >
                          <FaCog className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm`} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* منوی پروفایل */}
            <AnimatePresence>
              {profileMenuOpen && sidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, type: "spring" }}
                  className={`absolute right-0 left-0 mt-1 rounded-2xl shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'}`}
                >
                  <ul className="py-1">
                    <li>
                      <Link 
                        href="/dashboard/profile"
                        className={`w-full text-right px-4 py-2.5 flex items-center text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-600 hover:text-sky-400' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'} transition-colors`}
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className={`w-7 h-7 rounded-lg ${darkMode ? 'bg-slate-600 text-sky-400' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center ml-3`}>
                          <FaUser className="text-sm" />
                        </div>
                        <span>پروفایل کاربری</span>
                      </Link>
                    </li>
                    <li className={`border-t ${darkMode ? 'border-slate-600' : 'border-slate-100'}`}>
                      <button 
                        onClick={handleLogout}
                        className={`w-full text-right px-4 py-2.5 flex items-center text-sm ${darkMode ? 'text-red-400 hover:bg-slate-600' : 'text-red-600 hover:bg-red-50'} transition-colors`}
                      >
                        <div className={`w-7 h-7 rounded-lg ${darkMode ? 'bg-slate-600 text-red-400' : 'bg-red-100 text-red-600'} flex items-center justify-center ml-3`}>
                          <FaSignOutAlt className="text-sm" />
                        </div>
                        <span>خروج از حساب کاربری</span>
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* منوها */}
          <nav 
            className={`py-4 px-2 overflow-y-auto h-[calc(100vh-160px)] custom-scrollbar ${darkMode ? 'scrollbar-dark' : ''}`}
          >
            <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 5px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: ${darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.2)'};
                border-radius: 20px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: ${darkMode ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.3)'};
              }
              
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: ${darkMode ? 'rgba(100, 116, 139, 0.3) transparent' : 'rgba(148, 163, 184, 0.2) transparent'};
              }
            `}</style>
            
            <div className="px-4 mb-4">
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between"
                  >
                    <h2 className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'} uppercase`}>منو اصلی</h2>
                    <div className={`h-0.5 flex-1 ml-3 ${darkMode ? 'bg-gradient-to-l from-slate-600 to-transparent' : 'bg-gradient-to-l from-slate-200 to-transparent'} rounded-full`}></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <ul className="px-2 space-y-1.5">
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
                const hasSubmenu = item.subMenu && item.subMenu.length > 0
                
                return (
                  <li key={item.path}>
                    {hasSubmenu ? (
                      <div className="mb-1">
                        <motion.button
                          onClick={() => toggleSubmenu(item.title)}
                          className={`flex items-center w-full p-3 rounded-xl transition-all duration-300
                            ${isActive 
                              ? `${darkMode ? 'bg-gradient-to-r from-sky-600 to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'} shadow-lg ${darkMode ? 'shadow-sky-500/10' : 'shadow-blue-500/10'}` 
                              : `${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-sky-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`
                            }
                            ${!sidebarOpen ? 'justify-center' : 'justify-between'}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center">
                            <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${ 
                              isActive 
                                ? (darkMode ? 'bg-white/10' : 'bg-white/20') 
                                : (darkMode ? 'bg-slate-700 text-sky-400 shadow-sm' : 'bg-slate-50 text-blue-600 shadow-sm')
                            } ${!sidebarOpen ? 'mx-auto' : 'ml-2'}`}>
                              {item.icon}
                            </div>
                            <AnimatePresence>
                              {sidebarOpen && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.3 }}
                                  className="mr-2 font-medium"
                                >
                                  {item.title}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <AnimatePresence>
                            {sidebarOpen && hasSubmenu && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${ 
                                  isActive ? (darkMode ? 'bg-white/10' : 'bg-white/20') : (darkMode ? 'bg-slate-600' : 'bg-slate-100')
                                }`}
                              >
                                <motion.div
                                  animate={{ 
                                    rotate: activeSubmenu === item.title ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.4 }}
                                >
                                  <FaChevronDown className={`text-xs transition-all duration-300 ${ 
                                    isActive ? (darkMode ? 'text-white' : 'text-white') : (darkMode ? 'text-slate-400' : 'text-slate-500')
                                  }`} />
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                        
                        <AnimatePresence>
                          {sidebarOpen && hasSubmenu && activeSubmenu === item.title && (
                            <motion.ul 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4, type: "spring" }}
                              className={`mt-1 mr-6 pr-4 border-r-2 ${darkMode ? 'border-indigo-700/50' : 'border-indigo-100'} space-y-1`}
                            >
                              {item.subMenu?.map(subItem => {
                                const isSubActive = pathname === subItem.path
                                
                                return (
                                  <motion.li 
                                    key={subItem.path}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ x: 3 }}
                                  >
                                    <Link href={subItem.path}>
                                      <motion.div 
                                        className={`flex items-center p-2.5 rounded-xl transition-all duration-300
                                          ${isSubActive 
                                            ? `${darkMode ? 'bg-indigo-700/40 text-sky-300 font-medium' : 'bg-indigo-50 text-indigo-700 font-medium'}` 
                                            : `${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-sky-400' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`
                                          }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        {subItem.icon && (
                                          <div className={`w-7 h-7 flex items-center justify-center rounded-lg ml-2 ${ 
                                            isSubActive ? (darkMode ? 'bg-indigo-600/50 text-sky-300' : 'bg-indigo-100 text-indigo-600') : (darkMode ? 'bg-slate-600 text-slate-400' : 'bg-slate-50 text-slate-500')
                                          }`}>
                                            {subItem.icon}
                                          </div>
                                        )}
                                        <span className="text-sm">{subItem.title}</span>
                                        {isSubActive && (
                                          <motion.div 
                                            className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-sky-400' : 'bg-indigo-500'} mr-auto`}
                                            layoutId="activeSubmenuIndicator"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                          />
                                        )}
                                      </motion.div>
                                    </Link>
                                  </motion.li>
                                )
                              })}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link href={item.path}>
                        <motion.div 
                          className={`flex items-center p-3 rounded-xl transition-all duration-300
                            ${isActive 
                              ? `${darkMode ? 'bg-gradient-to-r from-sky-600 to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'} shadow-lg ${darkMode ? 'shadow-sky-500/10' : 'shadow-blue-500/10'}` 
                              : `${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-sky-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`
                            }
                            ${!sidebarOpen ? 'justify-center' : ''}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${ 
                            isActive 
                              ? (darkMode ? 'bg-white/10' : 'bg-white/20') 
                              : (darkMode ? 'bg-slate-700 text-sky-400 shadow-sm' : 'bg-slate-50 text-blue-600 shadow-sm')
                          } ${!sidebarOpen ? 'mx-auto' : 'ml-2'}`}>
                            {item.icon}
                          </div>
                          <AnimatePresence>
                            {sidebarOpen && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.3 }}
                                className="mr-2 font-medium"
                              >
                                {item.title}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {sidebarOpen && isActive && (
                            <motion.div 
                              className={`w-2 h-2 rounded-full ${darkMode ? 'bg-sky-400' : 'bg-white'} mr-auto`}
                              layoutId="activeIndicator"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            />
                          )}
                        </motion.div>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
            
            {/* Footer در سایدبار */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className={`px-4 pt-6 mt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}
                >
                  {/* دکمه راهنما */}
                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCredit(!showCredit)}
                      className={`w-10 h-10 rounded-full ${darkMode ? 'bg-slate-700 text-sky-400 hover:bg-slate-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} flex items-center justify-center shadow-md transition-colors`}
                    >
                      <span className="text-xl font-bold">؟</span>
                    </motion.button>
                  </div>
                  
                  {/* باکس اطلاعات توسعه‌دهنده */}
                  <AnimatePresence>
                    {showCredit && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="mt-4"
                      >
                        <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'shadow-sky-500/5 border-slate-700' : 'shadow-blue-500/10 border-indigo-100'} border`}>
                          <div className={`${darkMode ? 'bg-gradient-to-r from-sky-700 to-indigo-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} p-4 relative`}>
                            <div className={`absolute -right-6 -top-6 w-16 h-16 rounded-full ${darkMode ? 'bg-sky-600/20' : 'bg-blue-400/20'} backdrop-blur-xl`}></div>
                            <div className={`absolute -left-6 -bottom-6 w-24 h-24 rounded-full ${darkMode ? 'bg-indigo-600/20' : 'bg-indigo-400/20'} backdrop-blur-xl`}></div>
                            <h3 className={`${darkMode ? 'text-sky-300' : 'text-white'} font-bold text-lg relative z-10`}>علی فراست</h3>
                            <p className={`${darkMode ? 'text-sky-400/80' : 'text-blue-100'} text-xs relative z-10`}>توسعه‌دهنده وب‌سایت</p>
                          </div>
                          
                          <div className={`${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-700/70' : 'bg-gradient-to-br from-white to-blue-50'} p-4`}>
                            <div className="flex items-center mb-3">
                              <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-slate-700 text-sky-400' : 'bg-blue-100 text-blue-600'} flex items-center justify-center ml-3`}>
                                <FiGlobe className="text-sm" />
                              </div>
                              <div>
                                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-blue-900'} font-medium`}>وب‌سایت شخصی</p>
                                <a href="https://web.xtr.lol" target="_blank" rel="noopener noreferrer" className={`text-xs ${darkMode ? 'text-sky-400 hover:underline' : 'text-blue-600 hover:underline'}`}>web.xtr.lol</a>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-slate-700 text-indigo-400' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center ml-3`}>
                                <FaPhone className="text-sm" />
                              </div>
                              <div>
                                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-blue-900'} font-medium`}>تماس</p>
                                <a href="tel:+989134398990" className={`text-xs ${darkMode ? 'text-indigo-400 hover:underline' : 'text-indigo-600 hover:underline'}`}>۰۹۱۳۴۳۹۸۹۹۰</a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </motion.aside>
        
        {/* محتوای اصلی */}
        <div className={`flex-1 overflow-y-auto pt-4 pb-6 px-4 lg:pt-6 lg:pb-8 lg:pl-6 lg:pr-6 bg-transparent mt-16 lg:mt-0`}>
          {/* نوار بالایی دسکتاپ */}
          <div className={`hidden lg:flex items-center justify-between mb-6 ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white' } backdrop-blur-xl rounded-2xl p-4 shadow-lg ${darkMode ? 'shadow-slate-700/20' : 'shadow-slate-100/20'} sticky top-4 z-10`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gradient-to-br from-sky-700 to-indigo-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} flex items-center justify-center ${darkMode ? 'border-sky-600' : 'border-blue-100'} ${darkMode ? 'text-sky-300' : 'text-blue-500'} border`}>
                <FaDollarSign className="text-xl" />
              </div>
              <div>
                {currencyLoading ? (
                  <div className="flex flex-col">
                    <div className={`h-5 w-28 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse rounded-md mb-1`}></div>
                    <div className={`h-3 w-20 ${darkMode ? 'bg-slate-600' : 'bg-slate-100'} animate-pulse rounded-md`}></div>
                  </div>
                ) : currencyData ? (
                  <>
                    <div className="flex items-center">
                      <h2 className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        قیمت {currencyData.name}: {new Intl.NumberFormat('fa-IR').format(currencyData.price)} {currencyData.unit}
                      </h2>
                      <div className={`mr-2 px-2 py-1 rounded-lg text-xs font-medium ${ 
                        currencyData.change_percent > 0 
                          ? `${darkMode ? 'bg-green-700/30 text-green-300 border-green-600/50' : 'bg-green-100 text-green-800 border-green-200'}` 
                          : `${darkMode ? 'bg-red-700/30 text-red-300 border-red-600/50' : 'bg-red-100 text-red-800 border-red-200'}`
                       } border`}>
                        {currencyData.change_percent > 0 ? '+' : ''}{currencyData.change_percent}%
                      </div>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} flex items-center`}>
                      <span>بروزرسانی: {currencyData.date} - ساعت {currencyData.time}</span>
                      <span className="mr-2 text-xs">
                        {currencyData.change_value > 0 ? '↑' : '↓'} {new Intl.NumberFormat('fa-IR').format(Math.abs(currencyData.change_value))} {currencyData.unit}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>خطا در دریافت اطلاعات ارز</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? "حالت روشن" : "حالت تاریک"}
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200'} transition-colors shadow-md`}
              >
                {darkMode ? <FaSun size={18}/> : <FaMoon size={18}/>}
              </button>

              {/* پروفایل کاربر */}
              <div className="relative">
                <div
                  className={`flex items-center gap-3 p-2 pr-4 pl-2 rounded-xl border cursor-pointer transition-colors duration-200 ${darkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50' : 'bg-slate-50 border-slate-100 hover:bg-blue-50 hover:border-blue-100'}`}
                  onClick={() => setHeaderProfileMenuOpen(!headerProfileMenuOpen)}
                >
                  <div className="text-right">
                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.fullName}</p>
                    <p className={`text-xs flex items-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${ 
                        user?.role === 'super-admin' ? (darkMode ? 'bg-indigo-400' : 'bg-indigo-500') : 
                        user?.role === 'admin+' ? (darkMode ? 'bg-green-400' : 'bg-green-500') : (darkMode ? 'bg-sky-400' : 'bg-blue-500')
                      }`}></span>
                      {user?.role === 'super-admin' ? 'مدیر کل' : user?.role === 'admin+' ? 'همکار' : 'ادمین'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-gradient-to-br from-sky-600 to-indigo-700' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} p-0.5 shadow-md overflow-hidden`}>
                    <div className={`w-full h-full rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-white'} flex items-center justify-center text-lg font-bold ${darkMode ? 'text-sky-300' : 'text-indigo-600'}`}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                  </div>
                  <FaChevronDown className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                
                {/* منوی پروفایل هدر */}
                <AnimatePresence>
                  {headerProfileMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 30 }}
                      className={`absolute left-0 top-full mt-2 rounded-2xl shadow-xl z-50 w-52 overflow-hidden ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'}`}
                    >
                      <ul className="py-1">
                        <li>
                          <Link 
                            href="/dashboard/profile"
                            className={`w-full text-right px-4 py-3 flex items-center text-sm ${darkMode ? 'text-slate-300 hover:bg-slate-600 hover:text-sky-400' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'} rounded-xl transition-colors`}
                            onClick={() => setHeaderProfileMenuOpen(false)}
                          >
                            <div className={`w-7 h-7 rounded-lg ${darkMode ? 'bg-slate-600 text-sky-400' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center ml-3`}>
                              <FaUser className="text-sm" />
                            </div>
                            <span>پروفایل کاربری</span>
                          </Link>
                        </li>
                        <li className={`border-t ${darkMode ? 'border-slate-600' : 'border-slate-100'}`}>
                          <button 
                            onClick={handleLogout}
                            className={`w-full text-right px-4 py-3 flex items-center text-sm ${darkMode ? 'text-red-400 hover:bg-slate-600' : 'text-red-600 hover:bg-red-50'} rounded-xl transition-colors`}
                          >
                            <div className={`w-7 h-7 rounded-lg ${darkMode ? 'bg-slate-600 text-red-400' : 'bg-red-100 text-red-600'} flex items-center justify-center ml-3`}>
                              <FaSignOutAlt className="text-sm" />
                            </div>
                            <span>خروج از حساب کاربری</span>
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* فاصله بالای محتوا در موبایل */}
          <div className="h-2 lg:hidden"></div>
          
          {/* محتوای صفحه */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            {/* تزئینات پس‌زمینه */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
              <div className={`absolute top-0 right-20 w-96 h-96 ${darkMode ? 'bg-sky-800/10' : 'bg-blue-500/5'} rounded-full blur-3xl`}></div>
              <div className={`absolute bottom-40 left-20 w-96 h-96 ${darkMode ? 'bg-indigo-800/10' : 'bg-indigo-500/5'} rounded-full blur-3xl`}></div>
              <div className={`absolute top-[30%] right-[60%] w-64 h-64 ${darkMode ? 'bg-sky-700/10' : 'bg-blue-400/5'} rounded-full blur-2xl`}></div>
              <div className={`absolute bottom-0 left-[30%] w-80 h-80 ${darkMode ? 'bg-indigo-700/10' : 'bg-indigo-300/5'} rounded-full blur-3xl`}></div>
              <svg className="absolute top-0 right-0 opacity-5" width="400" height="400" viewBox="0 0 100 100">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke={`${darkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(79, 70, 229, 0.2)'}`} strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            
            {children}
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  )
} 
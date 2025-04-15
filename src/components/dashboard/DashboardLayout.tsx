'use client'
import { useState, useEffect, ReactNode, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPackage } from "react-icons/fi";
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
  FaTicketAlt
} from 'react-icons/fa'

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

// منوهای داشبورد - تعریف خارج از کامپوننت تا در هر رندر دوباره ساخته نشود
const menuItemsData: MenuItem[] = [
  {
    title: 'داشبورد',
    path: '/dashboard',
    icon: <FaChartLine />,
    roles: ['super-admin', 'admin', 'admin+']
  },
  {
    title: 'مدیریت ادمین‌ها',
    path: '/dashboard/admin-management',
    icon: <FaUsersCog />,
    roles: ['super-admin'],
    subMenu: [
      {
        title: 'افزودن ادمین',
        path: '/dashboard/admin-management/add',
        icon: <FaUserPlus />,
        roles: ['super-admin']
      },
      {
        title: 'لیست ادمین‌ها',
        path: '/dashboard/admin-management/list',
        icon: <FaList />,
        roles: ['super-admin']
      }
    ]
  },
  {
    title: 'مدیریت پکیج‌های سفر',
    path: '/dashboard/package-management',
    icon: <FiPackage />,
    roles: ['super-admin', 'admin', 'admin+']
  },
  {
    title: 'رزروهای من',
    path: '/dashboard/my-reservations',
    icon: <FaList />,
    roles: ['admin+']
  },
  {
    title: 'بلیط شناور',
    path: '/dashboard/floating-ticket',
    icon: <FaTicketAlt />,
    roles: ['super-admin', 'admin', 'admin+']
  },
  {
    title: 'مدیریت راه‌ها',
    path: '/dashboard/way-management',
    icon: <FaMapMarkedAlt />,
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

    ]
  },
  {
    title: 'مدیریت پروازها',
    path: '/dashboard/flights',
    icon: <FaPlane />,
    roles: ['super-admin', 'admin']
  },
  {
    title: 'مدیریت مسافران',
    path: '/dashboard/all-passengers',
    icon: <FaUserFriends />,
    roles: ['super-admin', 'admin']
  }
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
        // Keep current mobileMenuOpen state
        // Optionally force sidebar content closed on mobile unless manually opened?
        // For now, let's not force sidebarOpen on mobile resize
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="relative">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-400/20"></div>
          <div className="relative animate-spin rounded-full h-14 w-14 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 bg-gradient-to-br from-gray-50 to-blue-50/50 text-gray-800">
      {/* نوار بالایی در حالت موبایل */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-white/90 backdrop-blur-lg shadow-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <FaPlane className="text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              تورنگار
            </h1>
            <p className="text-[10px] text-gray-500 -mt-1">سامانه مدیریت مسافرتی</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 shadow-md shadow-blue-400/10 cursor-pointer"
            onClick={() => setHeaderProfileMenuOpen(!headerProfileMenuOpen)}
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-indigo-600">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
      
      {/* دکمه منو در موبایل - ثابت در پایین صفحه */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <motion.button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            mobileMenuOpen 
              ? 'bg-red-500 text-white rotate-90' 
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setHeaderProfileMenuOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed left-4 right-4 top-20 bg-white rounded-xl shadow-lg border border-gray-100 z-50 lg:hidden overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 shadow-md shadow-blue-400/20 ml-3">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg font-bold text-indigo-600">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{user?.fullName}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user?.role === 'super-admin' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : user?.role === 'admin+'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
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
                <button 
                  className="w-full text-right px-4 py-3 flex items-center text-sm text-gray-700 hover:bg-indigo-50 rounded-lg"
                >
                  <FaUser className="ml-2 text-gray-500" />
                  <span>پروفایل کاربری</span>
                </button>
                <button 
                  className="w-full text-right px-4 py-3 flex items-center text-sm text-gray-700 hover:bg-indigo-50 rounded-lg"
                >
                  <FaCog className="ml-2 text-gray-500" />
                  <span>تنظیمات</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-right px-4 py-3 flex items-center text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FaSignOutAlt className="ml-2" />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
            className="fixed left-4 right-4 top-20 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 lg:hidden"
          >
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">منو اصلی</h4>
              <div className="grid grid-cols-2 gap-2">
                {filteredMenuItems.filter(item => !item.subMenu).map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                  
                  return (
                    <Link 
                      key={item.path} 
                      href={item.path} 
                      className={`flex flex-col items-center justify-center p-3 rounded-xl ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg mb-1 ${
                        isActive ? 'bg-white/20' : 'text-blue-500'
                      }`}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {filteredMenuItems.filter(item => item.subMenu && item.subMenu.length > 0).length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">منوهای گروهی</h4>
                <div className="space-y-1">
                  {filteredMenuItems.filter(item => item.subMenu && item.subMenu.length > 0).map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                    
                    return (
                      <div key={item.path} className="bg-gray-50 rounded-xl p-2">
                        <div className={`flex items-center px-2 py-1 mb-1 ${
                          isActive ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          <div className={`w-6 h-6 flex items-center justify-center rounded-lg ml-2 ${
                            isActive ? 'bg-blue-100 text-blue-600' : 'text-blue-500'
                          }`}>
                            {item.icon}
                          </div>
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 pr-7">
                          {item.subMenu?.map(subItem => {
                            const isSubActive = pathname === subItem.path;
                            
                            return (
                              <Link 
                                key={subItem.path} 
                                href={subItem.path} 
                                className={`flex items-center p-2 rounded-lg ${
                                  isSubActive 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {subItem.icon && (
                                  <span className={`ml-1 text-xs ${
                                    isSubActive ? 'text-blue-700' : 'text-gray-500'
                                  }`}>
                                    {subItem.icon}
                                  </span>
                                )}
                                <span className="text-xs">{subItem.title}</span>
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
            
            <div className="pt-3 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-full p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
                <FaSignOutAlt className="ml-2" />
                <span className="text-sm">خروج از حساب کاربری</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* منوی کناری */}
      <motion.aside
        className={`fixed lg:sticky top-0 right-0 z-40 h-screen overflow-hidden bg-white shadow-lg border-l border-gray-100 lg:border-r lg:border-l-0 lg:border-gray-200`}
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          x: isMobile ? (mobileMenuOpen ? 0 : '100%') : 0,
        }}
        transition={{
          x: { type: "spring", stiffness: 350, damping: 35 },
          width: { duration: 0.3, ease: "easeInOut" },
        }}
        style={{ 
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* لوگو و دکمه جمع‌کردن منو */}
        <div className="py-6 px-4 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3 space-x-reverse"
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-2">
                  <FaPlane className="text-blue-600 text-xl" />
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
                      className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ repeat: 0, duration: 0.5 }}
                    >
                      تورنگار
                    </motion.h1>
                    <p className="text-xs text-gray-500">سامانه مدیریت مسافرتی</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex justify-center items-center w-8 h-8 text-gray-500 rounded-full hover:bg-gray-100 transition-colors duration-300"
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
            className={`p-4 border-b border-gray-100 ${sidebarOpen ? 'flex items-center' : 'flex flex-col items-center'}`}
            animate={{ 
              backgroundColor: sidebarOpen ? 'rgba(243, 244, 246, 0.7)' : 'rgba(243, 244, 246, 0.3)'
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 flex items-center justify-center shadow-md shadow-blue-400/20">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg font-bold text-indigo-600">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
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
                  <h3 className="font-medium text-gray-800 truncate">{user?.fullName}</h3>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user?.role === 'super-admin' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : user?.role === 'admin+'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
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
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <FaCog className="text-gray-500 text-sm" />
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
                transition={{ duration: 0.2 }}
                className="absolute right-0 left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden"
              >
                <ul className="py-1">
                  <li>
                    <button 
                      className="w-full text-right px-4 py-2.5 flex items-center text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <FaUser className="ml-2 text-gray-500" />
                      <span>پروفایل کاربری</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      className="w-full text-right px-4 py-2.5 flex items-center text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <FaCog className="ml-2 text-gray-500" />
                      <span>تنظیمات</span>
                    </button>
                  </li>
                  <li className="border-t border-gray-100">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2.5 flex items-center text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FaSignOutAlt className="ml-2" />
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
          className="py-4 overflow-y-auto h-[calc(100vh-160px)]"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style jsx>{`
            nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="px-4 mb-2">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-gray-500 uppercase"
                >
                  منو اصلی
                </motion.h2>
              )}
            </AnimatePresence>
          </div>
          <ul className="px-2 space-y-1">
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
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }
                          ${!sidebarOpen ? 'justify-center' : 'justify-between'}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                            isActive 
                              ? 'bg-white/20' 
                              : 'bg-gray-50 text-blue-500'
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
                                isActive ? 'bg-white/20' : 'bg-gray-100'
                              }`}
                            >
                              <motion.div
                                animate={{ 
                                  rotate: activeSubmenu === item.title ? 180 : 0,
                                }}
                                transition={{ duration: 0.4 }}
                              >
                                <FaChevronDown className={`text-xs transition-all duration-300 ${
                                  isActive ? 'text-white' : 'text-gray-500'
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
                            className="mt-1 mr-6 pr-3 border-r-2 border-indigo-100 space-y-1"
                          >
                            {item.subMenu?.map(subItem => {
                              const isSubActive = pathname === subItem.path
                              
                              return (
                                <motion.li 
                                  key={subItem.path}
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                  whileHover={{ x: 2 }}
                                >
                                  <Link href={subItem.path}>
                                    <motion.div 
                                      className={`flex items-center p-2 rounded-xl transition-all duration-300
                                        ${isSubActive 
                                          ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                          : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                                        }`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      {subItem.icon && (
                                        <div className={`w-6 h-6 flex items-center justify-center rounded-lg ml-2 ${
                                          isSubActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'
                                        }`}>
                                          {subItem.icon}
                                        </div>
                                      )}
                                      <span className="text-sm">{subItem.title}</span>
                                      {isSubActive && (
                                        <motion.div 
                                          className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-auto"
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
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }
                          ${!sidebarOpen ? 'justify-center' : ''}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                          isActive 
                            ? 'bg-white/20' 
                            : 'bg-gray-50 text-blue-500'
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
                            className="w-2 h-2 rounded-full bg-white mr-auto"
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
        </nav>
      </motion.aside>
      
      {/* محتوای اصلی */}
      <div className="flex-1 overflow-y-auto pt-4 pb-6 px-6 lg:pt-6 lg:pb-8 lg:pl-8 lg:pr-8 bg-transparent mt-16 lg:mt-0">
        {/* نوار بالایی دسکتاپ */}
        <div className="hidden lg:flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-4 z-10">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100 text-blue-500 ml-3">
              {
                pathname === '/dashboard' 
                  ? <FaChartLine /> 
                  : pathname.includes('/admin-management')
                    ? <FaUsersCog /> 
                    : pathname.includes('/route-management')
                      ? <FaRoute />
                      : pathname.includes('/airline-management')
                        ? <FaPlane />
                        : pathname.includes('/aircraft-management')
                          ? <FaPlane />
                          : pathname.includes('/flights')
                            ? <FaPlaneDeparture />
                            : pathname.includes('/hotels')
                              ? <FaHotel />
                              : pathname.includes('/passengers')
                                ? <FaUserFriends />
                                : <FaTachometerAlt />
              }
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {/* عنوان صفحه فعلی */}
                {
                  pathname === '/dashboard' 
                    ? 'داشبورد' 
                    : pathname.includes('/admin-management')
                      ? 'مدیریت ادمین‌ها' 
                      : pathname.includes('/route-management')
                        ? 'مدیریت مسیرها'
                        : pathname.includes('/airline-management')
                          ? 'شرکت‌های هواپیمایی'
                          : pathname.includes('/aircraft-management')
                            ? 'مدیریت هواپیماها'
                            : pathname.includes('/flights')
                              ? 'مدیریت پروازها'
                              : pathname.includes('/hotels')
                                ? 'مدیریت هتل‌ها'
                                : pathname.includes('/passengers')
                                  ? 'مدیریت مسافران'
                                  : 'صفحه نامشخص'
                }
              </h2>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="relative">
            <div 
              className="flex items-center gap-3 bg-gray-50 p-2 pr-4 pl-2 rounded-xl border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors duration-200"
              onClick={() => setHeaderProfileMenuOpen(!headerProfileMenuOpen)}
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
                <p className="text-xs flex items-center text-gray-500">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                    user?.role === 'super-admin' ? 'bg-indigo-500' : 
                    user?.role === 'admin+' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></span>
                  {user?.role === 'super-admin' ? 'مدیر کل' : user?.role === 'admin+' ? 'همکار' : 'ادمین'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              </div>
              <FaChevronDown className="text-xs text-gray-400" />
            </div>
            
            {/* منوی پروفایل هدر */}
            <AnimatePresence>
              {headerProfileMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 w-48"
                >
                  <ul className="py-1">
                    <li>
                      <button 
                        className="w-full text-right px-4 py-2.5 flex items-center text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <FaUser className="ml-2 text-gray-500" />
                        <span>پروفایل کاربری</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        className="w-full text-right px-4 py-2.5 flex items-center text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <FaCog className="ml-2 text-gray-500" />
                        <span>تنظیمات</span>
                      </button>
                    </li>
                    <li className="border-t border-gray-100">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-2.5 flex items-center text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="ml-2" />
                        <span>خروج از حساب کاربری</span>
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
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
            <div className="absolute top-0 right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-40 left-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
          </div>
          
          {children}
        </motion.div>
      </div>
    </div>
  )
} 
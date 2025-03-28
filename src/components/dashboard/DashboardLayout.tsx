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
  FaCog
  
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
    icon: <FaTachometerAlt />,
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
        title: 'مدیریت هواپیماها',
        path: '/dashboard/aircraft-management',
        icon: <FaPlaneDeparture />,
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
    path: '/dashboard/passengers',
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
  
  // تنظیم نمایش منو در حالت موبایل - مدیریت ابعاد صفحه
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // تنظیم وضعیت اولیه
    handleResize()

    // ثبت رویداد تغییر اندازه
    window.addEventListener('resize', handleResize)
    
    // حذف رویداد
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
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* نوار بالایی در حالت موبایل */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-lg shadow-sm px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FaPlane className="text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            تورنگار
          </h1>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all duration-300 shadow-sm"
          >
            {mobileMenuOpen ? <FaTimes className="text-red-500" /> : <FaBars className="text-blue-600" />}
          </button>
        </div>
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
      
      {/* منوی کناری */}
      <motion.aside
        className={`fixed lg:relative lg:block top-0 right-0 z-40 h-full bg-white shadow-xl
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 80,
          transition: { duration: 0.4, ease: "easeInOut" }
        }}
        style={{ 
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.05)'
        }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 40
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
                    <button className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <FaCog className="text-gray-500 text-xs" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* منوها */}
        <nav 
          className="py-4 overflow-y-auto h-[calc(100vh-232px)]"
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
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                          ${!sidebarOpen ? 'justify-center' : 'justify-between'}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <span className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'ml-3'} ${
                            isActive ? 'text-white' : 'text-blue-600'
                          }`}>
                            {item.icon}
                          </span>
                          <AnimatePresence>
                            {sidebarOpen && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.3 }}
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
                            >
                              <motion.div
                                animate={{ 
                                  rotate: activeSubmenu === item.title ? 180 : 0,
                                }}
                                transition={{ duration: 0.4 }}
                              >
                                <FaChevronDown className={`transition-all duration-300 ${
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
                            className="mt-1 mr-6 pr-2 border-r-2 border-blue-100 space-y-1"
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
                                          ? 'bg-blue-50 text-blue-700' 
                                          : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      {subItem.icon && (
                                        <span className={`ml-2 text-sm ${
                                          isSubActive ? 'text-blue-700' : 'text-gray-500'
                                        }`}>
                                          {subItem.icon}
                                        </span>
                                      )}
                                      <span>{subItem.title}</span>
                                      {isSubActive && (
                                        <motion.div 
                                          className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-auto"
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
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                          ${!sidebarOpen ? 'justify-center' : ''}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'ml-3'} ${
                          isActive ? 'text-white' : 'text-blue-600'
                        }`}>
                          {item.icon}
                        </span>
                        <AnimatePresence>
                          {sidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.3 }}
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {sidebarOpen && isActive && (
                          <motion.div 
                            className="w-1.5 h-1.5 rounded-full bg-white mr-auto"
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
        
        {/* دکمه خروج */}
        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-gray-100 bg-white">
          <motion.button
            onClick={handleLogout}
            className={`flex items-center p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 w-full ${!sidebarOpen ? 'justify-center' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={`text-lg text-red-500 ${!sidebarOpen ? 'mx-auto' : 'ml-3'}`}>
              <FaSignOutAlt />
            </span>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-800"
                >
                  خروج از حساب کاربری
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>
      
      {/* محتوای اصلی */}
      <div className="flex-1 overflow-y-auto pt-4 pb-6 px-6 lg:pt-6 lg:pb-8 lg:pl-8 lg:pr-8 bg-gray-50">
        {/* نوار بالایی دسکتاپ */}
        <div className="hidden lg:flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <span className="text-lg font-bold text-gray-700">
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
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.role === 'super-admin' ? 'مدیر کل' : user?.role === 'admin+' ? 'همکار' : 'ادمین'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* فاصله بالای محتوا در موبایل */}
        <div className="h-20 lg:hidden"></div>
        
        {/* محتوای صفحه */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
} 
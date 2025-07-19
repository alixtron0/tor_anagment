'use client'
import { motion } from 'framer-motion'
import { FaUserCircle } from 'react-icons/fa'

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* لوگو */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">عتبات تور</h1>
          </div>

          {/* منوی اصلی */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4 space-x-reverse">
              {['صفحه اصلی', 'تورها', 'هتل‌ها', 'درباره ما', 'تماس با ما'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* دکمه‌های سمت چپ */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <FaUserCircle className="text-lg" />
              ورود
            </motion.button>

            {/* دکمه منو موبایل */}
            <button className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* منوی موبایل */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {['صفحه اصلی', 'تورها', 'هتل‌ها', 'درباره ما', 'تماس با ما'].map((item) => (
            <a
              key={item}
              href="#"
              className="block px-3 py-2 text-white/80 hover:text-white transition-colors text-base font-medium"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </motion.nav>
  )
} 
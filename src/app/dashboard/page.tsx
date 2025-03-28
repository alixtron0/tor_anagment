'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FaChartLine, 
  FaUserFriends, 
  FaPlane, 
  FaHotel,
  FaCalendarAlt,
  FaExclamationCircle
} from 'react-icons/fa'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    passengers: 1258,
    bookings: 532,
    flights: 89,
    hotels: 64,
    revenue: 8452000
  })
  
  useEffect(() => {
    // بارگذاری اطلاعات کاربر از localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])
  
  // تبدیل عدد به فرمت فارسی با جداکننده هزارگان
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num)
  }
  
  return (
    <main className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {user?.role === 'super-admin' ? 'داشبورد مدیریت کل' : 'داشبورد مدیریت'}
        </h1>
        <p className="text-dark-text-secondary">
          به پنل مدیریت تورنگار خوش آمدید. در اینجا می‌توانید آمار و وضعیت سیستم را مشاهده کنید.
        </p>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'مسافران', value: stats.passengers, icon: <FaUserFriends />, color: 'from-blue-600 to-blue-400' },
          { title: 'رزروها', value: stats.bookings, icon: <FaCalendarAlt />, color: 'from-green-600 to-green-400' },
          { title: 'پروازها', value: stats.flights, icon: <FaPlane />, color: 'from-purple-600 to-purple-400' },
          { title: 'هتل‌ها', value: stats.hotels, icon: <FaHotel />, color: 'from-amber-600 to-amber-400' },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card"
          >
            <div className={`h-2 bg-gradient-to-l ${item.color}`}></div>
            <div className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-dark-text-secondary mb-1">{item.title}</h3>
                  <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
                </div>
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                  {item.icon}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* جدول محتوای اخیر */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card"
        >
          <div className="p-5 border-b border-dark-border/50">
            <h3 className="text-lg font-bold">آخرین رزروهای ثبت شده</h3>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-right text-dark-text-secondary border-b border-dark-border/50">
                    <th className="pb-3 font-medium">مسافر</th>
                    <th className="pb-3 font-medium">مقصد</th>
                    <th className="pb-3 font-medium">تاریخ</th>
                    <th className="pb-3 font-medium">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { passenger: 'علی محمدی', destination: 'کیش', date: '۱۴۰۲/۰۷/۱۲', status: 'تایید شده' },
                    { passenger: 'مریم رضایی', destination: 'استانبول', date: '۱۴۰۲/۰۷/۱۵', status: 'در انتظار پرداخت' },
                    { passenger: 'محمد جعفری', destination: 'مشهد', date: '۱۴۰۲/۰۷/۲۰', status: 'تایید شده' },
                    { passenger: 'زهرا کریمی', destination: 'دبی', date: '۱۴۰۲/۰۸/۰۲', status: 'لغو شده' },
                    { passenger: 'امیر حسینی', destination: 'تهران', date: '۱۴۰۲/۰۸/۰۵', status: 'تایید شده' },
                  ].map((booking, index) => (
                    <tr key={index} className="border-b border-dark-border/30 hover:bg-dark-hover/50 transition-colors">
                      <td className="py-3.5">{booking.passenger}</td>
                      <td className="py-3.5">{booking.destination}</td>
                      <td className="py-3.5">{booking.date}</td>
                      <td className="py-3.5">
                        <span 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'تایید شده' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'در انتظار پرداخت' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* کارت هشدارها */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card"
        >
          <div className="p-5 border-b border-dark-border/50">
            <h3 className="text-lg font-bold">هشدارها و یادآوری‌ها</h3>
          </div>
          <div className="p-5">
            <ul className="space-y-4">
              {[
                { title: 'اتمام موجودی هتل آپادانا', type: 'warning', time: '۲ ساعت پیش' },
                { title: 'پرواز تهران-استانبول با تاخیر', type: 'error', time: '۵ ساعت پیش' },
                { title: 'رزرو جدید برای تور کیش', type: 'info', time: '۸ ساعت پیش' },
                { title: 'بروزرسانی قیمت بلیط‌های پاییز', type: 'success', time: '۱ روز پیش' },
              ].map((alert, index) => (
                <li key={index} className="bg-dark-hover/50 rounded-xl p-4 transition-transform hover:translate-y-[-2px]">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ml-3 ${
                      alert.type === 'warning' ? 'bg-amber-500/30 text-amber-400' :
                      alert.type === 'error' ? 'bg-red-500/30 text-red-400' :
                      alert.type === 'info' ? 'bg-blue-500/30 text-blue-400' :
                      'bg-green-500/30 text-green-400'
                    }`}>
                      <FaExclamationCircle />
                    </div>
                    <div>
                      <h4 className="text-dark-text-primary font-medium">{alert.title}</h4>
                      <p className="text-dark-text-muted text-sm mt-1">{alert.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 
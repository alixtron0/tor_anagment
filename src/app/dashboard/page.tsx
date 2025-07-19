'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FaChartLine, 
  FaUserFriends, 
  FaPlane, 
  FaHotel,
  FaCalendarAlt,
  FaExclamationCircle,
  FaTicketAlt,
  FaGlobe,
  FaClock
} from 'react-icons/fa'
import { BsCheckCircleFill, BsClockHistory, BsHourglass } from 'react-icons/bs'
import StatCard from '@/components/dashboard/StatCard'
import PieChartComponent from '@/components/dashboard/PieChartComponent'
import { getPackageStats } from '@/api/packageApi'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>({
    packageStats: {
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      total: 0
    },
    destinationStats: [],
    reservationStats: {
      total: 0,
      confirmed: 0,
      pending: 0
    },
    resourceStats: {
      totalHotels: 0,
      totalAirlines: 0
    },
    popularPackages: []
  })
  
  // آماده‌سازی داده‌ها برای نمودار وضعیت پکیج‌ها
  const packageStatusData = [
    { name: 'در انتظار شروع', value: dashboardData.packageStats.notStarted, color: '#3B82F6' },
    { name: 'در حال اجرا', value: dashboardData.packageStats.inProgress, color: '#10B981' },
    { name: 'پایان یافته', value: dashboardData.packageStats.completed, color: '#6366F1' }
  ]
  
  useEffect(() => {
    // بارگذاری اطلاعات کاربر از localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    
    // دریافت آمار دا شب ورد
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await getPackageStats()
        setDashboardData(data)
      } catch (err: any) {
        console.error('خطا در دریافت آمار دا شب ورد:', err)
        setError(err.message || 'خطا در دریافت اطلاعات دا شب ورد')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])
  
  // تبدیل عدد به فرمت فارسی با جداکننده هزارگان
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num)
  }
  
  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <p className="mt-4 text-dark-text-secondary">در حال بارگذاری آمار...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-3xl">
            <FaExclamationCircle />
          </div>
          <p className="mt-4 text-dark-text-secondary max-w-md">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary rounded-lg text-white"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <main className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {user?.role === 'super-admin' ? 'داشبورد مدیریت کل' : 'دا شب ورد مدیریت'}
        </h1>
        <p className="text-dark-text-secondary">
          به پنل مدیریت عتبات تور خوش آمدید. در اینجا می‌توانید آمار و وضعیت سیستم را مشاهده کنید.
        </p>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="کل پکیج‌ها"
          value={dashboardData.packageStats.total}
          icon={<FaGlobe />}
          color="from-blue-600 to-blue-400"
          index={0}
        />
        <StatCard
          title="رزروها"
          value={dashboardData.reservationStats.total}
          icon={<FaCalendarAlt />}
          color="from-green-600 to-green-400"
          index={1}
        />
        <StatCard
          title="هتل‌ها"
          value={dashboardData.resourceStats.totalHotels}
          icon={<FaHotel />}
          color="from-purple-600 to-purple-400"
          index={2}
        />
        <StatCard
          title="ایرلاین‌ها"
          value={dashboardData.resourceStats.totalAirlines}
          icon={<FaPlane />}
          color="from-amber-600 to-amber-400"
          index={3}
        />
      </div>

      {/* نمودارهای وضعیت پکیج‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-12 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300"
        >
          <div className="p-5 border-b border-dark-border/50">
            <h3 className="text-lg font-bold">آمار وضعیت پکیج‌های سفر</h3>
          </div>
          <div className="p-5 h-auto">
            <PieChartComponent 
              data={packageStatusData} 
              title="وضعیت پکیج‌ها بر اساس زمان" 
            />
          </div>
        </motion.div>
      </div>
    </main>
  )
} 
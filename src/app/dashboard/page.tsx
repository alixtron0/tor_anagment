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
import BarChartComponent from '@/components/dashboard/BarChartComponent'
import PopularPackagesTable from '@/components/dashboard/PopularPackagesTable'
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
  
  // آماده‌سازی داده‌ها برای نمودار وضعیت رزروها
  const reservationStatusData = [
    { name: 'تأیید شده', value: dashboardData.reservationStats.confirmed, color: '#10B981' },
    { name: 'در انتظار', value: dashboardData.reservationStats.pending, color: '#F59E0B' }
  ]
  
  // آماده‌سازی داده‌ها برای نمودار مقصدها
  const destinationData = dashboardData.destinationStats.slice(0, 5).map((item: any) => ({
    name: item.destination,
    value: item.count
  }))
  
  useEffect(() => {
    // بارگذاری اطلاعات کاربر از localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    
    // دریافت آمار داشبورد
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await getPackageStats()
        setDashboardData(data)
      } catch (err: any) {
        console.error('خطا در دریافت آمار داشبورد:', err)
        setError(err.message || 'خطا در دریافت اطلاعات داشبورد')
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
          {user?.role === 'super-admin' ? 'داشبورد مدیریت کل' : 'داشبورد مدیریت'}
        </h1>
        <p className="text-dark-text-secondary">
          به پنل مدیریت تورنگار خوش آمدید. در اینجا می‌توانید آمار و وضعیت سیستم را مشاهده کنید.
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
          className="lg:col-span-7 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300"
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-5 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300"
        >
          <div className="p-5 border-b border-dark-border/50">
            <h3 className="text-lg font-bold">رزروها و وضعیت کلی سیستم</h3>
          </div>
          <div className="p-5 h-96">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium">آمار کلی</h4>
                <div className="bg-dark-secondary/50 text-dark-text-muted text-xs px-2 py-1 rounded-md">
                  مجموع: {formatNumber(dashboardData.packageStats.total)}
                </div>
              </div>
              <div className="bg-dark-secondary/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-medium">نسبت وضعیت پکیج‌ها</h4>
                    <p className="text-dark-text-muted text-xs mt-1">پکیج‌های در انتظار، در حال اجرا و پایان یافته</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
                    <FaChartLine />
                  </div>
                </div>
                
                <div className="w-full bg-dark-secondary/40 h-6 rounded-full overflow-hidden">
                  {dashboardData.packageStats.total > 0 ? (
                    <div className="flex h-full">
                      <div 
                        className="bg-blue-500 h-full flex items-center justify-center text-xs text-white font-medium" 
                        style={{ 
                          width: `${(dashboardData.packageStats.notStarted / dashboardData.packageStats.total) * 100}%`,
                          minWidth: dashboardData.packageStats.notStarted > 0 ? '2.5rem' : '0'
                        }}
                      >
                        {dashboardData.packageStats.notStarted > 0 ? 
                          `${Math.round((dashboardData.packageStats.notStarted / dashboardData.packageStats.total) * 100)}%` : ''}
                      </div>
                      <div 
                        className="bg-green-500 h-full flex items-center justify-center text-xs text-white font-medium" 
                        style={{ 
                          width: `${(dashboardData.packageStats.inProgress / dashboardData.packageStats.total) * 100}%`,
                          minWidth: dashboardData.packageStats.inProgress > 0 ? '2.5rem' : '0'
                        }}
                      >
                        {dashboardData.packageStats.inProgress > 0 ? 
                          `${Math.round((dashboardData.packageStats.inProgress / dashboardData.packageStats.total) * 100)}%` : ''}
                      </div>
                      <div 
                        className="bg-purple-500 h-full flex items-center justify-center text-xs text-white font-medium" 
                        style={{ 
                          width: `${(dashboardData.packageStats.completed / dashboardData.packageStats.total) * 100}%`,
                          minWidth: dashboardData.packageStats.completed > 0 ? '2.5rem' : '0'
                        }}
                      >
                        {dashboardData.packageStats.completed > 0 ? 
                          `${Math.round((dashboardData.packageStats.completed / dashboardData.packageStats.total) * 100)}%` : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full bg-dark-border/20 flex items-center justify-center">
                      <span className="text-dark-text-muted text-xs">داده‌ای وجود ندارد</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium">آمار رزروها</h4>
                <div className="bg-dark-secondary/50 text-dark-text-muted text-xs px-2 py-1 rounded-md">
                  مجموع: {formatNumber(dashboardData.reservationStats.total)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-secondary/50 rounded-xl p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center text-2xl">
                    <BsCheckCircleFill />
                  </div>
                  <div>
                    <p className="text-dark-text-muted text-xs">تأیید شده</p>
                    <p className="text-xl font-bold">{formatNumber(dashboardData.reservationStats.confirmed)}</p>
                  </div>
                </div>
                <div className="bg-dark-secondary/50 rounded-xl p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                    <BsClockHistory />
                  </div>
                  <div>
                    <p className="text-dark-text-muted text-xs">در انتظار</p>
                    <p className="text-xl font-bold">{formatNumber(dashboardData.reservationStats.pending)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium">منابع سیستم</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-secondary/50 rounded-xl p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl">
                    <FaHotel />
                  </div>
                  <div>
                    <p className="text-dark-text-muted text-xs">هتل‌ها</p>
                    <p className="text-xl font-bold">{formatNumber(dashboardData.resourceStats.totalHotels)}</p>
                  </div>
                </div>
                <div className="bg-dark-secondary/50 rounded-xl p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl">
                    <FaPlane />
                  </div>
                  <div>
                    <p className="text-dark-text-muted text-xs">ایرلاین‌ها</p>
                    <p className="text-xl font-bold">{formatNumber(dashboardData.resourceStats.totalAirlines)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* مقصدهای محبوب و جدول پکیج‌های محبوب */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-7 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 rtl"
        >
          <div className="p-5 border-b border-dark-border/50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">مقصدهای محبوب</h3>
              <div className="text-sm text-dark-text-muted">بر اساس تعداد پکیج‌ها</div>
            </div>
          </div>
          <div className="p-5 h-[350px]">
            <BarChartComponent 
              data={destinationData}
              title="مقصدهای پرطرفدار"
              color="#3B82F6"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-5 bg-dark-secondary/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300"
        >
          <div className="p-5 border-b border-dark-border/50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">پکیج‌های محبوب</h3>
              <div className="text-sm text-dark-text-muted">بر اساس تعداد رزرو</div>
            </div>
          </div>
          <div className="p-5 h-[350px]">
            <PopularPackagesTable packages={dashboardData.popularPackages} />
          </div>
        </motion.div>
      </div>
    </main>
  )
} 
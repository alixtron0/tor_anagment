'use client'
import { motion } from 'framer-motion'
import { FaPlane, FaHotel, FaUserFriends, FaSignInAlt } from 'react-icons/fa'
import { MdTour, MdDashboard } from 'react-icons/md'
import Link from 'next/link'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } }
}

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* پس‌زمینه مدرن و پیشرفته */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent z-0">
        {/* الگوی مش گرادیانت */}
        <div className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
            backgroundSize: '100px 100px' 
          }} 
        />
        
        {/* دایره‌های تزئینی با بلور */}
        <div className="absolute top-[10%] right-[5%] w-[30vw] h-[30vw] bg-accent/40 rounded-full blur-[80px] animate-pulse" 
          style={{ animationDuration: '15s' }} 
        />
        <div className="absolute bottom-[10%] left-[5%] w-[25vw] h-[25vw] bg-primary/30 rounded-full blur-[60px] animate-pulse" 
          style={{ animationDuration: '20s' }} 
        />
        <div className="absolute top-[40%] left-[20%] w-[15vw] h-[15vw] bg-white/20 rounded-full blur-[50px] animate-pulse" 
          style={{ animationDuration: '25s' }} 
        />
        
        {/* خطوط موجی */}
        <div className="absolute bottom-0 left-0 right-0 h-[20vh] opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 320\'%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'1\' d=\'M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\'%3E%3C/path%3E%3C/svg%3E")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>
      
      <div className="relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          {/* بخش هدر */}
          <div className="text-center mb-20 pt-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="inline-block mb-6 p-2 rounded-full bg-white/10 backdrop-blur-md"
            >
              <div className="px-6 py-2 rounded-full bg-white/10">
                <span className="text-white/90 font-medium">سیستم مدیریت هوشمند تورهای مسافرتی</span>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="inline-block">مدیریت</span>{" "}
              <span className="inline-block bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">هوشمند</span>{" "}
              <span className="inline-block">سفرها</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-white/80 mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              با استفاده از جدیدترین تکنولوژی‌ها، سفرهای مشتریان خود را به آسانی مدیریت کنید
            </motion.p>
            
            {/* دکمه‌ها */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  className="px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  <FaSignInAlt className="text-xl" />
                  ورود به سیستم
                </motion.button>
              </Link>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
              >
                <MdDashboard className="text-xl" />
                بررسی تورها
              </motion.button>
            </div>
          </div>

          {/* بخش ویژگی‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            {[
              { title: 'مدیریت مسافران', icon: FaUserFriends, description: 'مدیریت آسان اطلاعات و رزروهای مسافران' },
              { title: 'مدیریت پروازها', icon: FaPlane, description: 'پیگیری و مدیریت بلیط‌های هواپیما' },
              { title: 'مدیریت هتل‌ها', icon: FaHotel, description: 'رزرو و مدیریت اقامتگاه‌ها' },
              { title: 'مدیریت تورها', icon: MdTour, description: 'برنامه‌ریزی و مدیریت تورهای مسافرتی' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors group"
              >
                <div className="bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                  <feature.icon className="text-3xl text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{feature.title}</h2>
                <p className="text-white/70 group-hover:text-white/90 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* بخش آمار */}
          <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '۱۰۰۰+', label: 'مسافر' },
              { number: '۵۰+', label: 'تور فعال' },
              { number: '۲۰+', label: 'مقصد' },
              { number: '۲۴/۷', label: 'پشتیبانی' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="text-center bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10"
              >
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}

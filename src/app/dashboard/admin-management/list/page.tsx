'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserPlus, FaTrash, FaEye, FaEyeSlash, FaTimes, FaExclamationTriangle } from 'react-icons/fa'
import axios from 'axios'

type Admin = {
  _id: string
  fullName: string
  phone: string
  password?: string // فقط برای نمایش به سوپر ادمین نشان داده می‌شود
  role: string
  createdAt: string
}

export default function AdminList() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // برای نمایش/عدم نمایش رمز عبور
  const [showPasswords, setShowPasswords] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{show: boolean, adminId: string, adminName: string}>({
    show: false,
    adminId: '',
    adminName: ''
  })

  useEffect(() => {
    // بارگذاری اطلاعات کاربر از localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      
      // اگر سوپر ادمین نیست، به صفحه داشبورد منتقل می‌شود
      if (parsedUser.role !== 'super-admin') {
        router.push('/dashboard')
        return
      }
    } else {
      router.push('/auth')
      return
    }
    
    fetchAdmins()
  }, [router])
  
  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://185.94.99.35:5000/api/users/admins', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAdmins(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در بارگذاری لیست ادمین‌ها')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }
  
  const confirmDelete = (admin: Admin) => {
    setDeleteModal({
      show: true,
      adminId: admin._id,
      adminName: admin.fullName
    })
  }
  
  const closeDeleteModal = () => {
    setDeleteModal({
      show: false,
      adminId: '',
      adminName: ''
    })
  }
  
  const handleDeleteAdmin = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://185.94.99.35:5000/api/users/${deleteModal.adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setSuccess('ادمین با موفقیت حذف شد')
      setTimeout(() => setSuccess(null), 5000)
      
      // بارگذاری مجدد لیست ادمین‌ها
      fetchAdmins()
      closeDeleteModal()
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در حذف ادمین')
      setTimeout(() => setError(null), 5000)
      closeDeleteModal()
    } finally {
      setLoading(false)
    }
  }
  
  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Intl.DateTimeFormat('fa-IR', options).format(date)
  }
  
  if (loading && admins.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-white rounded-xl shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <main className="px-6 py-8 bg-white rounded-xl shadow-sm">
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">لیست ادمین‌ها</h1>
          
          <button
            onClick={() => router.push('/dashboard/admin-management/add')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-5 rounded-lg transition-colors shadow-md"
          >
            <FaUserPlus />
            <span>افزودن ادمین جدید</span>
          </button>
        </div>
        
        <p className="text-gray-600">
          مدیریت ادمین‌های سیستم و مشاهده اطلاعات آن‌ها
        </p>
      </div>
      
      {/* نمایش خطا یا پیام موفقیت */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-5 py-4 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      {/* جدول ادمین‌ها */}
      <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">لیست ادمین‌ها</h3>
          
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            {showPasswords ? <FaEyeSlash /> : <FaEye />}
            <span className="text-sm">{showPasswords ? 'پنهان کردن رمزها' : 'نمایش رمزها'}</span>
          </button>
        </div>
        
        <div className="p-5">
          {admins.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              هیچ ادمینی در سیستم ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-right text-gray-500 border-b border-gray-100">
                    <th className="pb-4 font-medium">نام و نام خانوادگی</th>
                    <th className="pb-4 font-medium">شماره موبایل</th>
                    <th className="pb-4 font-medium">رمز عبور</th>
                    <th className="pb-4 font-medium">نقش</th>
                    <th className="pb-4 font-medium">تاریخ ایجاد</th>
                    <th className="pb-4 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="py-4 text-gray-800">{admin.fullName}</td>
                      <td className="py-4 ltr text-center text-gray-800">{admin.phone}</td>
                      <td className="py-4 text-gray-800">
                        {showPasswords ? admin.password : '••••••••'}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs 
                          ${admin.role === 'super-admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {admin.role === 'super-admin' ? 'مدیر کل' : 'ادمین'}
                        </span>
                      </td>
                      <td className="py-4 text-gray-700">{formatDate(admin.createdAt)}</td>
                      <td className="py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => confirmDelete(admin)}
                            className="p-2.5 text-red-400 hover:text-red-300 transition-colors rounded-full hover:bg-red-500/20"
                            title="حذف"
                            disabled={admin.role === 'super-admin'}
                          >
                            <FaTrash className={admin.role === 'super-admin' ? 'opacity-30' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* مودال تأیید حذف ادمین */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeDeleteModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-full">
                    <FaExclamationTriangle className="text-white text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-white">تأیید حذف ادمین</h3>
                </div>
                <button 
                  onClick={closeDeleteModal}
                  className="text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 p-2"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  آیا از حذف کاربر <span className="font-bold">{deleteModal.adminName}</span> اطمینان دارید؟
                  <br />
                  <span className="text-red-500 mt-2 block text-sm">این عملیات غیرقابل بازگشت می‌باشد.</span>
                </p>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={closeDeleteModal}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-5 rounded-lg transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleDeleteAdmin}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaTrash />
                    <span>حذف ادمین</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
} 
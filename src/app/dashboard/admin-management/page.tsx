'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaUserPlus, FaEdit, FaTrash, FaTimes, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa'
import axios from 'axios'

type Admin = {
  _id: string
  fullName: string
  phone: string
  password?: string // فقط برای نمایش به سوپر ادمین نشان داده می‌شود
  role: string
  createdAt: string
}

export default function AdminManagementRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // هدایت به صفحه لیست ادمین‌ها
    router.push('/dashboard/admin-management/list')
  }, [router])
  
  return (
    <div className="flex justify-center items-center min-h-[60vh] bg-white rounded-xl shadow-sm dark:bg-slate-800">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-sky-500"></div>
    </div>
  )
} 
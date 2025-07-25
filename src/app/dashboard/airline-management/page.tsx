'use client'

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaPen, FaTrash, FaEye, FaEyeSlash, FaUpload, FaSearch, FaPlane } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import ClientUpload from '@/components/ClientUpload';

// تعریف طرح اعتبارسنجی فرم
const airlineSchema = z.object({
  name: z.string().min(2, { message: 'نام شرکت هواپیمایی باید حداقل 2 کاراکتر باشد' }),
  aircraftModel: z.string().optional(),
  description: z.string().optional(),
});

type AirlineFormData = z.infer<typeof airlineSchema>;

interface Airline {
  _id: string;
  name: string;
  logo: string;
  aircraftModel?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AirlineManagement() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentAirlineId, setCurrentAirlineId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredAirlines, setFilteredAirlines] = useState<Airline[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تنظیمات فرم
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<AirlineFormData>({
    resolver: zodResolver(airlineSchema),
    defaultValues: {
      name: '',
      aircraftModel: '',
      description: '',
    }
  });

  // دریافت شرکت‌های هواپیمایی
  const fetchAirlines = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://185.94.99.35:5000/api/airlines', {
        headers: { 'x-auth-token': token }
      });
      setAirlines(response.data);
      setFilteredAirlines(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching airlines:', err);
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات شرکت‌های هواپیمایی');
      toast.error(err.response?.data?.message || 'خطا در دریافت اطلاعات شرکت‌های هواپیمایی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirlines();
  }, []);

  // فیلتر کردن شرکت‌های هواپیمایی بر اساس جستجو
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAirlines(airlines);
    } else {
      const filtered = airlines.filter(airline =>
        airline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (airline.aircraftModel && airline.aircraftModel.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAirlines(filtered);
    }
  }, [searchTerm, airlines]);

  // مدیریت تغییر فایل لوگو
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // نمایش پیش‌نمایش
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // انتخاب تصویر از کامپوننت ClientUpload
  const handleImageSelect = (imageUrl: string) => {
    setLogoPreview(imageUrl);
    // اگر تصویر از کتابخانه انتخاب شده باشد، فایل را null می‌کنیم
    if (imageUrl.includes('http://185.94.99.35:5000')) {
      setLogoFile(null);
    }
  };

  // ارسال فرم
  const onSubmit = async (data: AirlineFormData) => {
    try {
      const token = localStorage.getItem('token');
      
      // ایجاد فرم‌دیتا برای ارسال فایل
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('aircraftModel', data.aircraftModel || '');
      formData.append('description', data.description || '');
      
      // اگر تصویر از کتابخانه انتخاب شده باشد
      if (logoPreview && logoPreview.includes('http://185.94.99.35:5000')) {
        // استخراج مسیر نسبی تصویر از URL کامل
        const imagePath = logoPreview.replace('http://185.94.99.35:5000', '');
        formData.append('imageFromLibrary', imagePath);
      } 
      // اگر فایل آپلود شده باشد
      else if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (editMode && currentAirlineId) {
        // به‌روزرسانی شرکت هواپیمایی
        await axios.put(`http://185.94.99.35:5000/api/airlines/${currentAirlineId}`, formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('شرکت هواپیمایی با موفقیت به‌روزرسانی شد');
      } else {
        // ایجاد شرکت هواپیمایی جدید
        await axios.post('http://185.94.99.35:5000/api/airlines', formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('شرکت هواپیمایی جدید با موفقیت ایجاد شد');
      }

      // بازنشانی فرم و دریافت مجدد اطلاعات
      reset();
      setEditMode(false);
      setCurrentAirlineId(null);
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchAirlines();
    } catch (err: any) {
      console.error('Error submitting airline:', err);
      toast.error(err.response?.data?.message || 'خطا در ثبت اطلاعات شرکت هواپیمایی');
    }
  };

  // تنظیم فرم برای ویرایش
  const handleEdit = (airline: Airline) => {
    setEditMode(true);
    setCurrentAirlineId(airline._id);
    setValue('name', airline.name);
    setValue('aircraftModel', airline.aircraftModel || '');
    setValue('description', airline.description || '');
    
    // تنظیم پیش‌نمایش لوگو
    if (airline.logo) {
      setLogoPreview(`http://185.94.99.35:5000${airline.logo}`);
    } else {
      setLogoPreview(null);
    }
    
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لغو حالت ویرایش
  const handleCancel = () => {
    setEditMode(false);
    setCurrentAirlineId(null);
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    reset();
  };

  // تغییر وضعیت فعال بودن شرکت هواپیمایی
  const toggleAirlineStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const airline = airlines.find(a => a._id === id);
      
      if (!airline) return;
      
      // ایجاد فرم‌دیتا برای ارسال
      const formData = new FormData();
      formData.append('name', airline.name);
      formData.append('aircraftModel', airline.aircraftModel || '');
      formData.append('description', airline.description || '');
      formData.append('isActive', (!currentStatus).toString());
      
      await axios.put(`http://185.94.99.35:5000/api/airlines/${id}`, formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      fetchAirlines();
      toast.success(`شرکت هواپیمایی ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`);
    } catch (err: any) {
      console.error('Error toggling airline status:', err);
      toast.error(err.response?.data?.message || 'خطا در تغییر وضعیت شرکت هواپیمایی');
    }
  };

  // حذف شرکت هواپیمایی
  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این شرکت هواپیمایی اطمینان دارید؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://185.94.99.35:5000/api/airlines/${id}`, {
        headers: { 'x-auth-token': token }
      });
      
      fetchAirlines();
      toast.success('شرکت هواپیمایی با موفقیت حذف شد');
    } catch (err: any) {
      console.error('Error deleting airline:', err);
      toast.error(err.response?.data?.message || 'خطا در حذف شرکت هواپیمایی');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه - طراحی جدید */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20 transform scale-150"></div>
              <div className="relative bg-white p-5 rounded-full shadow-xl border-2 border-blue-100 dark:bg-slate-800 dark:border-sky-700">
                <FaPlane size={40} className="text-blue-600 dark:text-sky-500" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3 dark:text-slate-200">مدیریت شرکت‌های هواپیمایی</h1>
          <p className="text-gray-500 max-w-2xl mx-auto dark:text-slate-400">
            در این بخش می‌توانید شرکت‌های هواپیمایی را مدیریت کنید، اطلاعات آن‌ها را ویرایش کنید و شرکت‌های جدید اضافه نمایید.
          </p>
          
          <div className="mt-8 max-w-xl mx-auto relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در شرکت‌های هواپیمایی..."
              className="w-full px-6 py-4 pl-12 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400 transition-all shadow-md dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-sky-500 dark:text-slate-200 dark:placeholder-slate-400"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-sky-500">
              <FaSearch size={18} />
            </span>
          </div>
        </motion.div>
        
        {/* فرم افزودن/ویرایش شرکت هواپیمایی */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-3xl mb-8 overflow-hidden transition-all duration-300 transform hover:shadow-xl border border-gray-200 shadow-lg dark:bg-slate-800 dark:border-slate-700"
        >
          <div className={`p-1 ${editMode ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}></div>
          <div className="p-8">
            <h2 className="text-2xl font-bold flex items-center mb-8 text-gray-800 dark:text-slate-200">
              <div className={`p-4 rounded-xl mr-5 ${editMode ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-700/50 dark:text-yellow-400' : 'bg-blue-100 text-blue-600 dark:bg-sky-700/50 dark:text-sky-400'}`}>
                {editMode ? <FaPen size={22} /> : <FaPlus size={22} />}
              </div>
              <span className="mr-4">{editMode ? 'ویرایش شرکت هواپیمایی' : 'افزودن شرکت هواپیمایی جدید'}</span>
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-lg font-medium text-gray-700 dark:text-slate-300">نام شرکت هواپیمایی</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-sky-500 dark:focus:bg-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                  placeholder="مثال: ایران ایر"
                />
                {errors.name && (
                  <span className="text-red-500 text-sm dark:text-red-400">{errors.name.message}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-lg font-medium text-gray-700 dark:text-slate-300">مدل هواپیما</label>
                <input
                  type="text"
                  {...register('aircraftModel')}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-sky-500 dark:focus:bg-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                  placeholder="مثال: Airbus A320"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-lg font-medium text-gray-700 mb-2 dark:text-slate-300">توضیحات</label>
                <textarea
                  {...register('description')}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-sky-500 dark:focus:bg-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                  rows={4}
                  placeholder="توضیحات اضافی درباره این شرکت هواپیمایی..."
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-lg font-medium text-gray-700 mb-2 dark:text-slate-300">لوگو</label>
                <div className="flex flex-wrap items-center gap-6">
                  <ClientUpload 
                    onSelect={handleImageSelect}
                    defaultImage={logoPreview || ''}
                    title="انتخاب لوگوی شرکت هواپیمایی"
                    buttonText="انتخاب لوگو"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-center justify-end gap-4 mt-4">
                {editMode && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all flex items-center dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500 dark:focus:ring-slate-500"
                  >
                    <span className="ml-2">انصراف</span>
                  </button>
                )}
                <button
                  type="submit"
                  className={`px-8 py-4 ${
                    editMode 
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  } text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center`}
                >
                  {editMode ? <FaPen className="ml-3" size={18} /> : <FaPlus className="ml-3" size={18} />}
                  <span>{editMode ? 'به‌روزرسانی شرکت هواپیمایی' : 'افزودن شرکت هواپیمایی'}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        
        {/* جدول شرکت‌های هواپیمایی */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700"
        >
          <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center dark:text-slate-200">
              <span className="bg-blue-100 text-blue-600 p-4 rounded-xl mr-5 dark:bg-sky-700/50 dark:text-sky-400">
                <FaPlane size={22} />
              </span>
              <span className="mr-4">لیست شرکت‌های هواپیمایی</span>
              <span className="mr-4 text-base text-gray-500 font-normal bg-gray-100 px-4 py-1.5 rounded-full dark:text-slate-400 dark:bg-slate-700">
                {filteredAirlines.length} شرکت
              </span>
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent dark:border-t-sky-500 dark:border-r-sky-500"></div>
                <p className="mr-4 text-gray-600 text-lg dark:text-slate-400">در حال بارگذاری...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-600 p-6 rounded-xl border border-red-200 flex items-center dark:bg-red-800/50 dark:text-red-400 dark:border-red-700/60">
                <span className="ml-3 text-2xl">⚠️</span>
                <span>{error}</span>
              </div>
            ) : (
              <>
                {filteredAirlines.length === 0 ? (
                  <div className="bg-gray-100 text-gray-600 p-12 rounded-xl border border-gray-200 text-center dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-xl">هیچ شرکت هواپیمایی یافت نشد</p>
                    <p className="text-gray-500 mt-3 dark:text-slate-400">می‌توانید با کلیک بر روی «افزودن شرکت هواپیمایی جدید» شروع کنید</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                      <thead className="bg-gray-50 dark:bg-slate-700/60">
                        <tr>
                          <th className="py-5 px-6 text-right text-sm font-medium text-gray-600 uppercase tracking-wider dark:text-slate-400">لوگو</th>
                          <th className="py-5 px-6 text-right text-sm font-medium text-gray-600 uppercase tracking-wider dark:text-slate-400">نام شرکت</th>
                          <th className="py-5 px-6 text-right text-sm font-medium text-gray-600 uppercase tracking-wider dark:text-slate-400">مدل هواپیما</th>
                          <th className="py-5 px-6 text-right text-sm font-medium text-gray-600 uppercase tracking-wider dark:text-slate-400">وضعیت</th>
                          <th className="py-5 px-6 text-right text-sm font-medium text-gray-600 uppercase tracking-wider dark:text-slate-400">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-600 dark:bg-slate-800">
                        {filteredAirlines.map((airline, index) => (
                          <motion.tr 
                            key={airline._id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 + 0.5 }}
                            className="hover:bg-gray-50 transition-colors dark:hover:bg-slate-700/70"
                          >
                            <td className="py-5 px-6">
                              {airline.logo ? (
                                <div className="w-16 h-16 relative border border-gray-200 rounded-xl overflow-hidden bg-white p-2 shadow-md dark:border-slate-600 dark:bg-slate-700">
                                  <img 
                                    src={`http://185.94.99.35:5000${airline.logo}`} 
                                    alt={airline.name} 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-xl border border-gray-200 dark:bg-slate-600 dark:border-slate-500">
                                  <span className="text-gray-400 text-xs dark:text-slate-500">بدون لوگو</span>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6 font-medium text-gray-800 text-lg dark:text-slate-200">{airline.name}</td>
                            <td className="py-5 px-6 text-gray-600 dark:text-slate-300">
                              {airline.aircraftModel || (
                                <span className="text-gray-400 text-sm dark:text-slate-500">مشخص نشده</span>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                                airline.isActive 
                                  ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-700/50 dark:text-green-300 dark:border-green-600/50' 
                                  : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-700/50 dark:text-red-300 dark:border-red-600/50'
                              }`}>
                                <span className={`w-2 h-2 ml-2 rounded-full ${
                                  airline.isActive ? 'bg-green-500' : 'bg-red-500'
                                }`}></span>
                                {airline.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-right text-sm font-medium">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleEdit(airline)}
                                  className="p-3 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-all flex items-center dark:bg-yellow-700/50 dark:text-yellow-400 dark:hover:bg-yellow-600/50"
                                  title="ویرایش"
                                >
                                  <FaPen size={14} />
                                  <span className="mr-3 text-xs hidden lg:inline">ویرایش</span>
                                </button>
                                <button
                                  onClick={() => toggleAirlineStatus(airline._id, airline.isActive)}
                                  className={`p-3 rounded-lg transition-all flex items-center ${
                                    airline.isActive 
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-700/50 dark:text-red-400 dark:hover:bg-red-600/50' 
                                      : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-700/50 dark:text-green-400 dark:hover:bg-green-600/50'
                                  }`}
                                  title={airline.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                >
                                  {airline.isActive ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                  <span className="mr-3 text-xs hidden lg:inline">{airline.isActive ? 'غیرفعال' : 'فعال'}</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(airline._id)}
                                  className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all flex items-center dark:bg-red-700/50 dark:text-red-400 dark:hover:bg-red-600/50"
                                  title="حذف"
                                >
                                  <FaTrash size={14} />
                                  <span className="mr-3 text-xs hidden lg:inline">حذف</span>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
'use client'

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaPen, FaTrash, FaEye, FaEyeSlash, FaUpload, FaSearch, FaPlane, FaGlobe } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

// تعریف طرح اعتبارسنجی فرم
const airlineSchema = z.object({
  name: z.string().min(2, { message: 'نام شرکت هواپیمایی باید حداقل 2 کاراکتر باشد' }),
  code: z.string().min(2, { message: 'کد شرکت هواپیمایی باید حداقل 2 کاراکتر باشد' }),
  country: z.string().min(2, { message: 'کشور باید حداقل 2 کاراکتر باشد' }),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'فرمت ایمیل صحیح نیست' }).optional().or(z.literal('')),
  address: z.string().optional(),
  description: z.string().optional(),
});

type AirlineFormData = z.infer<typeof airlineSchema>;

interface Airline {
  _id: string;
  name: string;
  code: string;
  country: string;
  logo: string;
  website?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
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
      code: '',
      country: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      description: '',
    }
  });

  // دریافت شرکت‌های هواپیمایی
  const fetchAirlines = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/airlines', {
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
        airline.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airline.country.toLowerCase().includes(searchTerm.toLowerCase())
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

  // ارسال فرم
  const onSubmit = async (data: AirlineFormData) => {
    try {
      const token = localStorage.getItem('token');
      
      // ایجاد فرم‌دیتا برای ارسال فایل
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('code', data.code);
      formData.append('country', data.country);
      formData.append('website', data.website || '');
      formData.append('phone', data.phone || '');
      formData.append('email', data.email || '');
      formData.append('address', data.address || '');
      formData.append('description', data.description || '');
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (editMode && currentAirlineId) {
        // به‌روزرسانی شرکت هواپیمایی
        await axios.put(`http://localhost:5000/api/airlines/${currentAirlineId}`, formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('شرکت هواپیمایی با موفقیت به‌روزرسانی شد');
      } else {
        // ایجاد شرکت هواپیمایی جدید
        await axios.post('http://localhost:5000/api/airlines', formData, {
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
    setValue('code', airline.code);
    setValue('country', airline.country);
    setValue('website', airline.website || '');
    setValue('phone', airline.contactInfo.phone || '');
    setValue('email', airline.contactInfo.email || '');
    setValue('address', airline.contactInfo.address || '');
    setValue('description', airline.description || '');
    
    // تنظیم پیش‌نمایش لوگو
    if (airline.logo) {
      setLogoPreview(`http://localhost:5000${airline.logo}`);
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
      formData.append('code', airline.code);
      formData.append('country', airline.country);
      formData.append('website', airline.website || '');
      formData.append('phone', airline.contactInfo.phone || '');
      formData.append('email', airline.contactInfo.email || '');
      formData.append('address', airline.contactInfo.address || '');
      formData.append('description', airline.description || '');
      formData.append('isActive', (!currentStatus).toString());
      
      await axios.put(`http://localhost:5000/api/airlines/${id}`, formData, {
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
      await axios.delete(`http://localhost:5000/api/airlines/${id}`, {
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white rounded-2xl p-6 shadow-lg border-b-4 border-blue-500">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-blue-500 p-3 rounded-full mr-4 text-white">
              <FaPlane size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">مدیریت شرکت‌های هواپیمایی</h1>
              <p className="text-gray-500 text-sm">مدیریت و مشاهده اطلاعات شرکت‌های هواپیمایی</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در شرکت‌های هواپیمایی..."
              className="w-full md:w-64 px-4 py-2 pl-10 bg-blue-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-500 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-blue-400">
              <FaSearch />
            </span>
          </div>
        </div>
        
        {/* فرم افزودن/ویرایش شرکت هواپیمایی */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden transition-all duration-300 transform hover:shadow-xl">
          <div className={`p-1 ${editMode ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center mb-6 text-gray-800">
              <div className={`p-2 rounded-full mr-2 ${editMode ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                {editMode ? <FaPen size={14} /> : <FaPlus size={14} />}
              </div>
              {editMode ? 'ویرایش شرکت هواپیمایی' : 'افزودن شرکت هواپیمایی جدید'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">نام شرکت</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: ایران ایر"
                />
                {errors.name && (
                  <span className="text-red-500 text-xs">{errors.name.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">کد شرکت</label>
                <input
                  type="text"
                  {...register('code')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: IR"
                />
                {errors.code && (
                  <span className="text-red-500 text-xs">{errors.code.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">کشور</label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: ایران"
                />
                {errors.country && (
                  <span className="text-red-500 text-xs">{errors.country.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">وب‌سایت</label>
                <input
                  type="text"
                  {...register('website')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: https://www.iranair.com"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">شماره تماس</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: 021-12345678"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">ایمیل</label>
                <input
                  type="text"
                  {...register('email')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: info@iranair.com"
                />
                {errors.email && (
                  <span className="text-red-500 text-xs">{errors.email.message}</span>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="آدرس دفتر مرکزی..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea
                  {...register('description')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  rows={3}
                  placeholder="توضیحات اضافی درباره این شرکت هواپیمایی..."
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">لوگو</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      accept="image/jpeg,image/png,image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all flex items-center shadow-sm"
                    >
                      <FaUpload className="ml-2" />
                      انتخاب فایل لوگو
                    </button>
                    {logoFile && <span className="text-gray-700 mr-2 text-sm">{logoFile.name}</span>}
                  </div>
                  
                  {logoPreview && (
                    <div className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg text-xs"
                        title="حذف تصویر"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-center justify-end gap-2 mt-4">
                {editMode && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                  >
                    انصراف
                  </button>
                )}
                <button
                  type="submit"
                  className={`px-6 py-3 ${editMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${editMode ? 'focus:ring-yellow-400' : 'focus:ring-blue-400'} transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]`}
                >
                  {editMode ? 'به‌روزرسانی شرکت هواپیمایی' : 'افزودن شرکت هواپیمایی'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* جدول شرکت‌های هواپیمایی */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-1 bg-blue-500"></div>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2">
                <FaGlobe size={14} />
              </span>
              لیست شرکت‌های هواپیمایی
              <span className="mr-2 text-sm text-gray-500 font-normal">({filteredAirlines.length} شرکت)</span>
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent"></div>
                <p className="mr-4 text-gray-600">در حال بارگذاری...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center">
                <span className="ml-2">❌</span>
                {error}
              </div>
            ) : (
              <>
                {filteredAirlines.length === 0 ? (
                  <div className="bg-gray-50 text-gray-500 p-6 rounded-lg border border-gray-100 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p>هیچ شرکت هواپیمایی یافت نشد.</p>
                    <p className="text-sm mt-2">می‌توانید با افزودن یک شرکت هواپیمایی به لیست بالا اضافه کنید.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">لوگو</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام شرکت</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کد</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کشور</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAirlines.map((airline, index) => (
                          <tr key={airline._id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {airline.logo ? (
                                <div className="w-14 h-14 relative border border-gray-200 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
                                  <img 
                                    src={`http://localhost:5000${airline.logo}`} 
                                    alt={airline.name} 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 bg-gray-100 flex items-center justify-center rounded-lg">
                                  <span className="text-gray-400 text-xs">بدون لوگو</span>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-800">{airline.name}</td>
                            <td className="py-4 px-6 whitespace-nowrap font-mono bg-blue-50 text-blue-700 rounded-lg text-center font-bold w-16">{airline.code}</td>
                            <td className="py-4 px-6 whitespace-nowrap text-gray-600">{airline.country}</td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${airline.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className={`w-2 h-2 mr-1 rounded-full ${airline.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {airline.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(airline)}
                                  className="p-2 bg-yellow-50 text-yellow-600 rounded-full hover:bg-yellow-100 transition-all"
                                  title="ویرایش"
                                >
                                  <FaPen size={14} />
                                </button>
                                <button
                                  onClick={() => toggleAirlineStatus(airline._id, airline.isActive)}
                                  className={`p-2 rounded-full transition-all ${airline.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                  title={airline.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                >
                                  {airline.isActive ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                                <button
                                  onClick={() => handleDelete(airline._id)}
                                  className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all"
                                  title="حذف"
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client'

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaPen, FaTrash, FaEye, FaEyeSlash, FaUpload, FaSearch, FaPlaneDeparture, FaPlane } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

// تعریف طرح اعتبارسنجی فرم
const aircraftSchema = z.object({
  model: z.string().min(2, { message: 'مدل هواپیما باید حداقل 2 کاراکتر باشد' }),
  manufacturer: z.string().min(2, { message: 'سازنده هواپیما باید حداقل 2 کاراکتر باشد' }),
  airline: z.string().min(1, { message: 'انتخاب شرکت هواپیمایی الزامی است' }),
  economyCapacity: z.string().optional(),
  businessCapacity: z.string().optional(),
  firstClassCapacity: z.string().optional(),
  maxRange: z.string().optional(),
  cruiseSpeed: z.string().optional(),
  description: z.string().optional(),
});

type AircraftFormData = z.infer<typeof aircraftSchema>;

interface Airline {
  _id: string;
  name: string;
  code: string;
  logo: string;
}

interface Aircraft {
  _id: string;
  model: string;
  manufacturer: string;
  airline: Airline;
  image: string;
  capacity: {
    economy: number;
    business: number;
    firstClass: number;
  };
  maxRange: number;
  cruiseSpeed: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AircraftManagement() {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentAircraftId, setCurrentAircraftId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredAircrafts, setFilteredAircrafts] = useState<Aircraft[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تنظیمات فرم
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<AircraftFormData>({
    resolver: zodResolver(aircraftSchema),
    defaultValues: {
      model: '',
      manufacturer: '',
      airline: '',
      economyCapacity: '',
      businessCapacity: '',
      firstClassCapacity: '',
      maxRange: '',
      cruiseSpeed: '',
      description: '',
    }
  });

  // دریافت هواپیماها
  const fetchAircrafts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://185.94.99.35:5000/api/aircrafts', {
        headers: { 'x-auth-token': token }
      });
      setAircrafts(response.data);
      setFilteredAircrafts(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching aircrafts:', err);
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات هواپیماها');
      toast.error(err.response?.data?.message || 'خطا در دریافت اطلاعات هواپیماها');
    } finally {
      setLoading(false);
    }
  };

  // دریافت شرکت‌های هواپیمایی
  const fetchAirlines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://185.94.99.35:5000/api/airlines', {
        headers: { 'x-auth-token': token }
      });
      
      // فقط شرکت‌های هواپیمایی فعال را نمایش می‌دهیم
      const activeAirlines = response.data.filter((airline: any) => airline.isActive);
      setAirlines(activeAirlines);
    } catch (err: any) {
      console.error('Error fetching airlines:', err);
      toast.error(err.response?.data?.message || 'خطا در دریافت اطلاعات شرکت‌های هواپیمایی');
    }
  };

  useEffect(() => {
    fetchAirlines();
    fetchAircrafts();
  }, []);

  // فیلتر کردن هواپیماها بر اساس جستجو
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAircrafts(aircrafts);
    } else {
      const filtered = aircrafts.filter(aircraft =>
        aircraft.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aircraft.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aircraft.airline.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAircrafts(filtered);
    }
  }, [searchTerm, aircrafts]);

  // مدیریت تغییر فایل تصویر
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // نمایش پیش‌نمایش
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ارسال فرم
  const onSubmit = async (data: AircraftFormData) => {
    try {
      const token = localStorage.getItem('token');
      
      // ایجاد فرم‌دیتا برای ارسال فایل
      const formData = new FormData();
      formData.append('model', data.model);
      formData.append('manufacturer', data.manufacturer);
      formData.append('airline', data.airline);
      formData.append('economyCapacity', data.economyCapacity || '0');
      formData.append('businessCapacity', data.businessCapacity || '0');
      formData.append('firstClassCapacity', data.firstClassCapacity || '0');
      formData.append('maxRange', data.maxRange || '0');
      formData.append('cruiseSpeed', data.cruiseSpeed || '0');
      formData.append('description', data.description || '');
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editMode && currentAircraftId) {
        // به‌روزرسانی هواپیما
        await axios.put(`http://185.94.99.35:5000/api/aircrafts/${currentAircraftId}`, formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('هواپیما با موفقیت به‌روزرسانی شد');
      } else {
        // ایجاد هواپیمای جدید
        await axios.post('http://185.94.99.35:5000/api/aircrafts', formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('هواپیمای جدید با موفقیت ایجاد شد');
      }

      // بازنشانی فرم و دریافت مجدد اطلاعات
      reset();
      setEditMode(false);
      setCurrentAircraftId(null);
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchAircrafts();
    } catch (err: any) {
      console.error('Error submitting aircraft:', err);
      toast.error(err.response?.data?.message || 'خطا در ثبت اطلاعات هواپیما');
    }
  };

  // تنظیم فرم برای ویرایش
  const handleEdit = (aircraft: Aircraft) => {
    setEditMode(true);
    setCurrentAircraftId(aircraft._id);
    setValue('model', aircraft.model);
    setValue('manufacturer', aircraft.manufacturer);
    setValue('airline', aircraft.airline._id);
    setValue('economyCapacity', aircraft.capacity.economy.toString());
    setValue('businessCapacity', aircraft.capacity.business.toString());
    setValue('firstClassCapacity', aircraft.capacity.firstClass.toString());
    setValue('maxRange', aircraft.maxRange.toString());
    setValue('cruiseSpeed', aircraft.cruiseSpeed.toString());
    setValue('description', aircraft.description || '');
    
    // تنظیم پیش‌نمایش تصویر
    if (aircraft.image) {
      setImagePreview(`http://185.94.99.35:5000${aircraft.image}`);
    } else {
      setImagePreview(null);
    }
    
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لغو حالت ویرایش
  const handleCancel = () => {
    setEditMode(false);
    setCurrentAircraftId(null);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    reset();
  };

  // تغییر وضعیت فعال بودن هواپیما
  const toggleAircraftStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const aircraft = aircrafts.find(a => a._id === id);
      
      if (!aircraft) return;
      
      // ایجاد فرم‌دیتا برای ارسال
      const formData = new FormData();
      formData.append('model', aircraft.model);
      formData.append('manufacturer', aircraft.manufacturer);
      formData.append('airline', aircraft.airline._id);
      formData.append('economyCapacity', aircraft.capacity.economy.toString());
      formData.append('businessCapacity', aircraft.capacity.business.toString());
      formData.append('firstClassCapacity', aircraft.capacity.firstClass.toString());
      formData.append('maxRange', aircraft.maxRange.toString());
      formData.append('cruiseSpeed', aircraft.cruiseSpeed.toString());
      formData.append('description', aircraft.description || '');
      formData.append('isActive', (!currentStatus).toString());
      
      await axios.put(`http://185.94.99.35:5000/api/aircrafts/${id}`, formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      fetchAircrafts();
      toast.success(`هواپیما ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`);
    } catch (err: any) {
      console.error('Error toggling aircraft status:', err);
      toast.error(err.response?.data?.message || 'خطا در تغییر وضعیت هواپیما');
    }
  };

  // حذف هواپیما
  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این هواپیما اطمینان دارید؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://185.94.99.35:5000/api/aircrafts/${id}`, {
        headers: { 'x-auth-token': token }
      });
      
      fetchAircrafts();
      toast.success('هواپیما با موفقیت حذف شد');
    } catch (err: any) {
      console.error('Error deleting aircraft:', err);
      toast.error(err.response?.data?.message || 'خطا در حذف هواپیما');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white rounded-2xl p-6 shadow-lg border-b-4 border-indigo-500">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-full mr-4 text-white shadow-md">
              <FaPlaneDeparture size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">مدیریت هواپیماها</h1>
              <p className="text-gray-500 text-sm">مدیریت و مشاهده اطلاعات هواپیماها</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در هواپیماها..."
              className="w-full md:w-64 px-4 py-2 pl-10 bg-indigo-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 placeholder-gray-500 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-indigo-400">
              <FaSearch />
            </span>
          </div>
        </div>
        
        {/* فرم افزودن/ویرایش هواپیما */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden transition-all duration-300 transform hover:shadow-xl">
          <div className={`p-1 ${editMode ? 'bg-yellow-500' : 'bg-indigo-500'}`}></div>
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center mb-6 text-gray-800">
              <div className={`p-2 rounded-full mr-2 ${editMode ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {editMode ? <FaPen size={14} /> : <FaPlus size={14} />}
              </div>
              {editMode ? 'ویرایش هواپیما' : 'افزودن هواپیمای جدید'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">مدل هواپیما</label>
                <input
                  type="text"
                  {...register('model')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: بوئینگ 737"
                />
                {errors.model && (
                  <span className="text-red-500 text-xs">{errors.model.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">سازنده</label>
                <input
                  type="text"
                  {...register('manufacturer')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: بوئینگ"
                />
                {errors.manufacturer && (
                  <span className="text-red-500 text-xs">{errors.manufacturer.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">شرکت هواپیمایی</label>
                <select
                  {...register('airline')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                >
                  <option value="">انتخاب شرکت هواپیمایی</option>
                  {airlines.map(airline => (
                    <option key={airline._id} value={airline._id}>
                      {airline.name} ({airline.code})
                    </option>
                  ))}
                </select>
                {errors.airline && (
                  <span className="text-red-500 text-xs">{errors.airline.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">ظرفیت کلاس اقتصادی</label>
                <input
                  type="number"
                  {...register('economyCapacity')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: 150"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">ظرفیت کلاس بیزینس</label>
                <input
                  type="number"
                  {...register('businessCapacity')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: 20"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">ظرفیت فرست کلاس</label>
                <input
                  type="number"
                  {...register('firstClassCapacity')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: 10"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">حداکثر برد (کیلومتر)</label>
                <input
                  type="number"
                  {...register('maxRange')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: 5000"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">سرعت پرواز (کیلومتر بر ساعت)</label>
                <input
                  type="number"
                  {...register('cruiseSpeed')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: 850"
                />
              </div>
              
              <div className="space-y-1 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                <textarea
                  {...register('description')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  rows={3}
                  placeholder="توضیحات اضافی درباره این هواپیما..."
                ></textarea>
              </div>
              
              <div className="space-y-1 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">تصویر هواپیما</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/jpeg,image/png,image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all flex items-center shadow-sm"
                    >
                      <FaUpload className="ml-2" />
                      انتخاب فایل تصویر
                    </button>
                    {imageFile && <span className="text-gray-700 mr-2 text-sm">{imageFile.name}</span>}
                  </div>
                  
                  {imagePreview && (
                    <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
                      <img 
                        src={imagePreview} 
                        alt="Aircraft Preview" 
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
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
              
              <div className="md:col-span-3 flex items-center justify-end gap-2 mt-4">
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
                  className={`px-6 py-3 ${editMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${editMode ? 'focus:ring-yellow-400' : 'focus:ring-indigo-400'} transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]`}
                >
                  {editMode ? 'به‌روزرسانی هواپیما' : 'افزودن هواپیما'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* جدول هواپیماها */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-1 bg-indigo-500"></div>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-full mr-2">
                <FaPlane size={14} />
              </span>
              لیست هواپیماها
              <span className="mr-2 text-sm text-gray-500 font-normal">({filteredAircrafts.length} هواپیما)</span>
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent"></div>
                <p className="mr-4 text-gray-600">در حال بارگذاری...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center">
                <span className="ml-2">❌</span>
                {error}
              </div>
            ) : (
              <>
                {filteredAircrafts.length === 0 ? (
                  <div className="bg-gray-50 text-gray-500 p-8 rounded-lg border border-gray-100 text-center">
                    <div className="text-5xl mb-4">✈️</div>
                    <p className="text-lg font-medium">هیچ هواپیمایی یافت نشد</p>
                    <p className="text-sm mt-2 text-gray-400">می‌توانید با تکمیل فرم بالا، هواپیمای جدیدی اضافه کنید</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تصویر</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مدل</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سازنده</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شرکت هواپیمایی</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ظرفیت کل</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAircrafts.map((aircraft, index) => (
                          <tr key={aircraft._id} className={`hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {aircraft.image ? (
                                <div className="w-14 h-14 relative border border-gray-200 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
                                  <img 
                                    src={`http://185.94.99.35:5000${aircraft.image}`} 
                                    alt={aircraft.model} 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 bg-gray-100 flex items-center justify-center rounded-lg">
                                  <FaPlaneDeparture className="text-gray-400" size={20} />
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-800">{aircraft.model}</td>
                            <td className="py-4 px-6 whitespace-nowrap text-gray-600">{aircraft.manufacturer}</td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center">
                                {aircraft.airline.logo && (
                                  <div className="w-8 h-8 ml-3 relative">
                                    <img 
                                      src={`http://185.94.99.35:5000${aircraft.airline.logo}`} 
                                      alt={aircraft.airline.name} 
                                      className="w-full h-full object-contain rounded-full bg-white p-1 border border-gray-200 shadow-sm"
                                    />
                                  </div>
                                )}
                                <span className="text-gray-700">{aircraft.airline.name}</span>
                                <span className="mr-1 px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md">{aircraft.airline.code}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="font-medium text-gray-800 text-lg">{aircraft.capacity.economy + aircraft.capacity.business + aircraft.capacity.firstClass}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-gray-500 text-xs px-2 py-1 bg-gray-100 rounded-md">
                                  اقتصادی: {aircraft.capacity.economy}
                                </span>
                                <span className="text-indigo-600 text-xs px-2 py-1 bg-indigo-50 rounded-md">
                                  بیزینس: {aircraft.capacity.business}
                                </span>
                                <span className="text-purple-600 text-xs px-2 py-1 bg-purple-50 rounded-md">
                                  فرست: {aircraft.capacity.firstClass}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${aircraft.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className={`w-2 h-2 mr-1 rounded-full ${aircraft.isActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                {aircraft.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(aircraft)}
                                  className="p-2 bg-yellow-50 text-yellow-600 rounded-full hover:bg-yellow-100 transition-all shadow-sm hover:shadow"
                                  title="ویرایش"
                                >
                                  <FaPen size={14} />
                                </button>
                                <button
                                  onClick={() => toggleAircraftStatus(aircraft._id, aircraft.isActive)}
                                  className={`p-2 rounded-full transition-all shadow-sm hover:shadow ${aircraft.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                  title={aircraft.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                >
                                  {aircraft.isActive ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                                <button
                                  onClick={() => handleDelete(aircraft._id)}
                                  className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all shadow-sm hover:shadow"
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
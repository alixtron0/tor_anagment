'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaPen, FaTrash, FaEye, FaEyeSlash, FaSearch, FaRoute, FaMapMarkedAlt, FaExchangeAlt, FaArrowLeft, FaCity } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';

// تعریف طرح اعتبارسنجی فرم
const routeSchema = z.object({
  origin: z.string().min(2, { message: 'مبدا باید حداقل 2 کاراکتر باشد' }),
  destination: z.string().min(2, { message: 'مقصد باید حداقل 2 کاراکتر باشد' }),
  description: z.string().optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

const citySchema = z.object({
  name: z.string().min(2, { message: 'نام شهر باید حداقل 2 کاراکتر باشد' }),
  description: z.string().optional(),
});

type CityFormData = z.infer<typeof citySchema>;

interface Route {
  _id: string;
  origin: string;
  destination: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface City {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [citiesLoading, setCitiesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [viewMode, setViewMode] = useState<'routes' | 'cities'>('routes');
  const [currentCityId, setCurrentCityId] = useState<string | null>(null);
  const [cityEditMode, setCityEditMode] = useState<boolean>(false);

  // تنظیمات فرم مسیر
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin: '',
      destination: '',
      description: '',
    }
  });

  // تنظیمات فرم شهر
  const { 
    register: registerCity, 
    handleSubmit: handleSubmitCity, 
    reset: resetCity, 
    formState: { errors: cityErrors }, 
    setValue: setValueCity 
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  // دریافت مسیرها
  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/routes', {
        headers: { 'x-auth-token': token }
      });
      setRoutes(response.data);
      setFilteredRoutes(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات مسیرها');
      toast.error(err.response?.data?.message || 'خطا در دریافت اطلاعات مسیرها');
    } finally {
      setLoading(false);
    }
  };

  // دریافت شهرها
  const fetchCities = async () => {
    setCitiesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/cities', {
        headers: { 'x-auth-token': token }
      });
      setCities(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching cities:', err);
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات شهرها');
      toast.error(err.response?.data?.message || 'خطا در دریافت اطلاعات شهرها');
    } finally {
      setCitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchCities();
  }, []);

  // فیلتر کردن مسیرها بر اساس جستجو
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRoutes(routes);
    } else {
      const filtered = routes.filter(route =>
        route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRoutes(filtered);
    }
  }, [searchTerm, routes]);

  // ارسال فرم مسیر
  const onSubmit = async (data: RouteFormData) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...data
      };

      if (editMode && currentRouteId) {
        // به‌روزرسانی مسیر
        await axios.put(`http://localhost:5000/api/routes/${currentRouteId}`, payload, {
          headers: { 'x-auth-token': token }
        });
        toast.success('مسیر با موفقیت به‌روزرسانی شد');
      } else {
        // ایجاد مسیر جدید
        await axios.post('http://localhost:5000/api/routes', payload, {
          headers: { 'x-auth-token': token }
        });
        toast.success('مسیر جدید با موفقیت ایجاد شد');
      }

      // بازنشانی فرم و دریافت مجدد اطلاعات
      reset();
      setEditMode(false);
      setCurrentRouteId(null);
      fetchRoutes();
    } catch (err: any) {
      console.error('Error submitting route:', err);
      toast.error(err.response?.data?.message || 'خطا در ثبت اطلاعات مسیر');
    }
  };

  // ارسال فرم شهر
  const onSubmitCity = async (data: CityFormData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (cityEditMode && currentCityId) {
        // به‌روزرسانی شهر
        await axios.put(`http://localhost:5000/api/cities/${currentCityId}`, data, {
          headers: { 'x-auth-token': token }
        });
        toast.success('شهر با موفقیت به‌روزرسانی شد');
      } else {
        // ایجاد شهر جدید
        await axios.post('http://localhost:5000/api/cities', data, {
          headers: { 'x-auth-token': token }
        });
        toast.success('شهر جدید با موفقیت ایجاد شد');
      }

      // بازنشانی فرم و دریافت مجدد اطلاعات
      resetCity();
      setCityEditMode(false);
      setCurrentCityId(null);
      fetchCities();
    } catch (err: any) {
      console.error('Error submitting city:', err);
      toast.error(err.response?.data?.message || 'خطا در ثبت اطلاعات شهر');
    }
  };

  // تنظیم فرم برای ویرایش
  const handleEdit = (route: Route) => {
    setEditMode(true);
    setCurrentRouteId(route._id);
    setValue('origin', route.origin);
    setValue('destination', route.destination);
    setValue('description', route.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // تنظیم فرم برای ویرایش شهر
  const handleEditCity = (city: City) => {
    setCityEditMode(true);
    setCurrentCityId(city._id);
    setValueCity('name', city.name);
    setValueCity('description', city.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لغو حالت ویرایش
  const handleCancel = () => {
    setEditMode(false);
    setCurrentRouteId(null);
    reset();
  };

  // لغو حالت ویرایش شهر
  const handleCancelCity = () => {
    setCityEditMode(false);
    setCurrentCityId(null);
    resetCity();
  };

  // تغییر وضعیت فعال بودن مسیر
  const toggleRouteStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const route = routes.find(r => r._id === id);
      
      if (!route) return;
      
      await axios.put(`http://localhost:5000/api/routes/${id}`, {
        ...route,
        isActive: !currentStatus
      }, {
        headers: { 'x-auth-token': token }
      });
      
      fetchRoutes();
      toast.success(`مسیر ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`);
    } catch (err: any) {
      console.error('Error toggling route status:', err);
      toast.error(err.response?.data?.message || 'خطا در تغییر وضعیت مسیر');
    }
  };

  // تغییر وضعیت فعال بودن شهر
  const toggleCityStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const city = cities.find(c => c._id === id);
      
      if (!city) return;
      
      await axios.put(`http://localhost:5000/api/cities/${id}`, {
        ...city,
        isActive: !currentStatus
      }, {
        headers: { 'x-auth-token': token }
      });
      
      fetchCities();
      toast.success(`شهر ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`);
    } catch (err: any) {
      console.error('Error toggling city status:', err);
      toast.error(err.response?.data?.message || 'خطا در تغییر وضعیت شهر');
    }
  };

  // حذف مسیر
  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این مسیر اطمینان دارید؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/routes/${id}`, {
        headers: { 'x-auth-token': token }
      });
      
      fetchRoutes();
      toast.success('مسیر با موفقیت حذف شد');
    } catch (err: any) {
      console.error('Error deleting route:', err);
      toast.error(err.response?.data?.message || 'خطا در حذف مسیر');
    }
  };

  // حذف شهر
  const handleDeleteCity = async (id: string) => {
    if (!window.confirm('آیا از حذف این شهر اطمینان دارید؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/cities/${id}`, {
        headers: { 'x-auth-token': token }
      });
      
      fetchCities();
      toast.success('شهر با موفقیت حذف شد');
    } catch (err: any) {
      console.error('Error deleting city:', err);
      toast.error(err.response?.data?.message || 'خطا در حذف شهر');
    }
  };

  // جابجایی مبدا و مقصد
  const swapOriginDestination = () => {
    const origin = getValue('origin');
    const destination = getValue('destination');
    setValue('origin', destination);
    setValue('destination', origin);
  };

  // دریافت مقدار فیلد فرم
  const getValue = (field: keyof RouteFormData) => {
    return (document.querySelector(`[name="${field}"]`) as HTMLInputElement)?.value || '';
  };

  // تغییر حالت نمایش (مسیرها یا شهرها)
  const toggleViewMode = (mode: 'routes' | 'cities') => {
    setViewMode(mode);
    setSearchTerm('');
    setEditMode(false);
    setCityEditMode(false);
    reset();
    resetCity();
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه - طراحی جدید */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <span className="bg-gradient-to-r from-indigo-500 to-blue-600 p-3 rounded-full text-white shadow-lg">
              {viewMode === 'routes' ? <FaRoute size={24} /> : <FaCity size={24} />}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            {viewMode === 'routes' ? 'مدیریت مسیرها' : 'مدیریت شهرها'}
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            {viewMode === 'routes' 
              ? 'در این بخش می‌توانید مسیرهای پروازی را مدیریت کنید. مسیرها شامل مبدا و مقصد هستند.' 
              : 'در این بخش می‌توانید شهرها را مدیریت کنید.'}
          </p>
        </motion.div>
        
        {/* گزینه‌های انتخاب بین مسیرها و شهرها */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 flex justify-center"
        >
          <div className="bg-gray-100 p-1.5 rounded-xl inline-flex shadow-md">
            <button 
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                viewMode === 'routes' 
                  ? 'bg-white text-indigo-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => toggleViewMode('routes')}
            >
              <FaRoute className="inline ml-1.5" />
              مسیرها
            </button>
            <button 
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                viewMode === 'cities' 
                  ? 'bg-white text-indigo-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => toggleViewMode('cities')}
            >
              <FaCity className="inline ml-1.5" />
              شهرها
            </button>
          </div>
        </motion.div>

        {/* جستجو */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12 relative max-w-md mx-auto"
        >
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={viewMode === 'routes' ? "جستجو در مسیرها..." : "جستجو در شهرها..."}
              className="w-full px-5 py-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-gray-700 placeholder-gray-400"
            />
            <span className="absolute left-4 top-4 text-gray-400">
              <FaSearch size={18} />
            </span>
          </div>
        </motion.div>
        
        {viewMode === 'routes' ? (
          <>
            {/* فرم افزودن/ویرایش مسیر - طراحی جدید */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12"
            >
              <div className="text-center mb-8">
                <span className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  editMode ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {editMode ? <FaPen size={24} /> : <FaPlus size={24} />}
                </span>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editMode ? 'ویرایش مسیر' : 'افزودن مسیر جدید'}
                </h2>
                <p className="text-gray-500 mt-2">
                  اطلاعات مورد نیاز را وارد کنید
                </p>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">مبدا</label>
                    <input
                      type="text"
                      {...register('origin')}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                      placeholder="مثال: تهران"
                    />
                    {errors.origin && (
                      <span className="text-red-500 text-sm">{errors.origin.message}</span>
                    )}
                  </div>
                  
                  <div className="space-y-2 relative">
                    <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                      مقصد
                      <button
                        type="button"
                        onClick={swapOriginDestination}
                        className="text-indigo-500 hover:text-indigo-700 p-1 bg-indigo-50 rounded-full"
                        title="جابجایی مبدا و مقصد"
                      >
                        <FaExchangeAlt size={16} />
                      </button>
                    </label>
                    <input
                      type="text"
                      {...register('destination')}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                      placeholder="مثال: اصفهان"
                    />
                    {errors.destination && (
                      <span className="text-red-500 text-sm">{errors.destination.message}</span>
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                    <textarea
                      {...register('description')}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                      rows={3}
                      placeholder="توضیحات اضافی درباره این مسیر..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  {editMode && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none transition-all"
                    >
                      انصراف
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`px-8 py-3 ${
                      editMode 
                        ? 'bg-yellow-500 hover:bg-yellow-600' 
                        : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90'
                    } text-white rounded-xl focus:outline-none transition-all shadow-md`}
                  >
                    {editMode ? 'به‌روزرسانی مسیر' : 'افزودن مسیر'}
                  </button>
                </div>
              </form>
            </motion.div>
            
            {/* جدول مسیرها - طراحی جدید */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">لیست مسیرها</h2>
                <p className="text-gray-500 mt-2">مدیریت مسیرهای پروازی</p>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent"></div>
                  <p className="mr-4 text-gray-600">در حال بارگذاری...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-8 mx-8 my-6 rounded-xl border border-red-100 flex items-center">
                  <span className="ml-3">❌</span>
                  {error}
                </div>
              ) : (
                <>
                  {filteredRoutes.length === 0 ? (
                    <div className="bg-gray-50 text-gray-500 p-12 m-8 rounded-xl border border-gray-200 text-center">
                      <div className="text-6xl mb-6">🗺️</div>
                      <p className="text-xl font-medium">هیچ مسیری یافت نشد</p>
                      <p className="text-gray-400 mt-3 max-w-md mx-auto">
                        می‌توانید با تکمیل فرم بالا، مسیر جدیدی اضافه کنید
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto p-6">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50 text-right">
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">مسیر</th>
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">توضیحات</th>
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">وضعیت</th>
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredRoutes.map((route, index) => (
                            <motion.tr 
                              key={route._id} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                  <div className="bg-indigo-100 p-2 rounded-xl mr-3">
                                    <FaRoute className="text-indigo-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2 space-x-reverse font-medium text-gray-900">
                                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">{route.origin}</span>
                                      <span className="text-indigo-400">
                                        <FaArrowLeft className="h-4 w-4" />
                                      </span>
                                      <span className="rounded-lg bg-green-50 px-2 py-1 text-green-700">{route.destination}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-500">
                                {route.description || 'بدون توضیحات'}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  route.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <span className={`w-2 h-2 mr-1 rounded-full ${
                                    route.isActive 
                                      ? 'bg-green-500' 
                                      : 'bg-red-500'
                                  } animate-pulse`}></span>
                                  {route.isActive ? 'فعال' : 'غیرفعال'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                  <button
                                    onClick={() => handleEdit(route)}
                                    className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all"
                                    title="ویرایش"
                                  >
                                    <FaPen size={16} />
                                  </button>
                                  <button
                                    onClick={() => toggleRouteStatus(route._id, route.isActive)}
                                    className={`p-2 rounded-lg transition-all ${
                                      route.isActive 
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}
                                    title={route.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                  >
                                    {route.isActive ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(route._id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                    title="حذف"
                                  >
                                    <FaTrash size={16} />
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
            </motion.div>
          </>
        ) : (
          <>
            {/* فرم افزودن/ویرایش شهر - طراحی جدید */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12"
            >
              <div className="text-center mb-8">
                <span className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  cityEditMode ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {cityEditMode ? <FaPen size={24} /> : <FaPlus size={24} />}
                </span>
                <h2 className="text-2xl font-bold text-gray-800">
                  {cityEditMode ? 'ویرایش شهر' : 'افزودن شهر جدید'}
                </h2>
                <p className="text-gray-500 mt-2">
                  اطلاعات مورد نیاز را وارد کنید
                </p>
              </div>
              
              <form onSubmit={handleSubmitCity(onSubmitCity)} className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 gap-8 mb-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">نام شهر</label>
                    <input
                      type="text"
                      {...registerCity('name')}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                      placeholder="مثال: تهران"
                    />
                    {cityErrors.name && (
                      <span className="text-red-500 text-sm">{cityErrors.name.message}</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                    <textarea
                      {...registerCity('description')}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                      rows={3}
                      placeholder="توضیحات اضافی درباره این شهر..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  {cityEditMode && (
                    <button
                      type="button"
                      onClick={handleCancelCity}
                      className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none transition-all"
                    >
                      انصراف
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`px-8 py-3 ${
                      cityEditMode 
                        ? 'bg-yellow-500 hover:bg-yellow-600' 
                        : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90'
                    } text-white rounded-xl focus:outline-none transition-all shadow-md`}
                  >
                    {cityEditMode ? 'به‌روزرسانی شهر' : 'افزودن شهر'}
                  </button>
                </div>
              </form>
            </motion.div>
            
            {/* جدول شهرها - طراحی جدید */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">لیست شهرها</h2>
                <p className="text-gray-500 mt-2">مدیریت شهرها</p>
              </div>
              
              {citiesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent"></div>
                  <p className="mr-4 text-gray-600">در حال بارگذاری...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-8 mx-8 my-6 rounded-xl border border-red-100 flex items-center">
                  <span className="ml-3">❌</span>
                  {error}
                </div>
              ) : (
                <>
                  {cities.length === 0 ? (
                    <div className="bg-gray-50 text-gray-500 p-12 m-8 rounded-xl border border-gray-200 text-center">
                      <div className="text-6xl mb-6">🏙️</div>
                      <p className="text-xl font-medium">هیچ شهری یافت نشد</p>
                      <p className="text-gray-400 mt-3 max-w-md mx-auto">
                        می‌توانید با تکمیل فرم بالا، شهر جدیدی اضافه کنید
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto p-6">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50 text-right">
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">نام شهر</th>
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">توضیحات</th>
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">وضعیت</th>
                            <th className="py-4 px-6 text-sm font-medium text-gray-500">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {cities.map((city, index) => (
                            <motion.tr 
                              key={city._id} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                  <div className="bg-indigo-100 p-2 rounded-xl mr-3">
                                    <FaCity className="text-indigo-600" />
                                  </div>
                                  <div className="font-medium text-gray-900">
                                    {city.name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-500">
                                {city.description || 'بدون توضیحات'}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  city.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <span className={`w-2 h-2 mr-1 rounded-full ${
                                    city.isActive 
                                      ? 'bg-green-500' 
                                      : 'bg-red-500'
                                  } animate-pulse`}></span>
                                  {city.isActive ? 'فعال' : 'غیرفعال'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                  <button
                                    onClick={() => handleEditCity(city)}
                                    className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all"
                                    title="ویرایش"
                                  >
                                    <FaPen size={16} />
                                  </button>
                                  <button
                                    onClick={() => toggleCityStatus(city._id, city.isActive)}
                                    className={`p-2 rounded-lg transition-all ${
                                      city.isActive 
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}
                                    title={city.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                  >
                                    {city.isActive ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCity(city._id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                    title="حذف"
                                  >
                                    <FaTrash size={16} />
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
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
} 
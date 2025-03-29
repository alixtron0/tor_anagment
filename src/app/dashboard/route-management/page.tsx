'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaPen, FaTrash, FaEye, FaEyeSlash, FaSearch, FaRoute, FaMapMarkedAlt, FaExchangeAlt, FaArrowLeft } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// تعریف طرح اعتبارسنجی فرم
const routeSchema = z.object({
  origin: z.string().min(2, { message: 'مبدا باید حداقل 2 کاراکتر باشد' }),
  destination: z.string().min(2, { message: 'مقصد باید حداقل 2 کاراکتر باشد' }),
  distance: z.string().optional(),
  estimatedDuration: z.string().optional(),
  description: z.string().optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface Route {
  _id: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);

  // تنظیمات فرم
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin: '',
      destination: '',
      distance: '',
      estimatedDuration: '',
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

  useEffect(() => {
    fetchRoutes();
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

  // ارسال فرم
  const onSubmit = async (data: RouteFormData) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...data,
        distance: data.distance ? parseInt(data.distance) : 0,
        estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration) : 0,
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

  // تنظیم فرم برای ویرایش
  const handleEdit = (route: Route) => {
    setEditMode(true);
    setCurrentRouteId(route._id);
    setValue('origin', route.origin);
    setValue('destination', route.destination);
    setValue('distance', route.distance.toString());
    setValue('estimatedDuration', route.estimatedDuration.toString());
    setValue('description', route.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لغو حالت ویرایش
  const handleCancel = () => {
    setEditMode(false);
    setCurrentRouteId(null);
    reset();
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

  // تبدیل دقیقه به فرمت ساعت و دقیقه
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} دقیقه`;
    return `${hours} ساعت و ${mins} دقیقه`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white rounded-2xl p-6 shadow-lg border-b-4 border-indigo-500">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-full mr-4 text-white shadow-md">
              <FaRoute size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">مدیریت مسیرها</h1>
              <p className="text-gray-500 text-sm">مدیریت و مشاهده مسیرهای پروازی</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در مسیرها..."
              className="w-full md:w-64 px-4 py-2 pl-10 bg-indigo-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-gray-700 placeholder-gray-500"
            />
            <span className="absolute left-3 top-2.5 text-indigo-400">
              <FaSearch />
            </span>
          </div>
        </div>
        
        {/* فرم افزودن/ویرایش مسیر */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden transition-all duration-300 transform hover:shadow-xl">
          <div className={`p-1 ${editMode ? 'bg-yellow-500' : 'bg-indigo-500'}`}></div>
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center mb-6 text-gray-800">
              <div className={`p-2 rounded-full mr-2 ${editMode ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {editMode ? <FaPen size={14} /> : <FaPlus size={14} />}
              </div>
              {editMode ? 'ویرایش مسیر' : 'افزودن مسیر جدید'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-gray-700">مبدا</label>
                <input
                  type="text"
                  {...register('origin')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                  placeholder="مثال: تهران"
                />
                {errors.origin && (
                  <span className="text-red-500 text-xs">{errors.origin.message}</span>
                )}
              </div>
              
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                  مقصد
                  <button
                    type="button"
                    onClick={swapOriginDestination}
                    className="text-indigo-500 hover:text-indigo-700 p-1"
                    title="جابجایی مبدا و مقصد"
                  >
                    <FaExchangeAlt size={14} />
                  </button>
                </label>
                <input
                  type="text"
                  {...register('destination')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                  placeholder="مثال: اصفهان"
                />
                {errors.destination && (
                  <span className="text-red-500 text-xs">{errors.destination.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">مسافت (کیلومتر)</label>
                <input
                  type="number"
                  {...register('distance')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                  placeholder="مثال: 430"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">مدت زمان تخمینی (دقیقه)</label>
                <input
                  type="number"
                  {...register('estimatedDuration')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                  placeholder="مثال: 60"
                />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                <textarea
                  {...register('description')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                  rows={3}
                  placeholder="توضیحات اضافی درباره این مسیر..."
                ></textarea>
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
                  className={`px-6 py-3 ${editMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${editMode ? 'focus:ring-yellow-400' : 'focus:ring-indigo-400'} transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]`}
                >
                  {editMode ? 'به‌روزرسانی مسیر' : 'افزودن مسیر'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* جدول مسیرها */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-1 bg-indigo-500"></div>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-full mr-2">
                <FaMapMarkedAlt size={14} />
              </span>
              لیست مسیرها
              <span className="mr-2 text-sm text-gray-500 font-normal">({filteredRoutes.length} مسیر)</span>
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
                {filteredRoutes.length === 0 ? (
                  <div className="bg-gray-50 text-gray-500 p-8 rounded-lg border border-gray-100 text-center">
                    <div className="text-5xl mb-4">🗺️</div>
                    <p className="text-lg font-medium">هیچ مسیری یافت نشد</p>
                    <p className="text-sm mt-2 text-gray-400">می‌توانید با تکمیل فرم بالا، مسیر جدیدی اضافه کنید</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مسیر</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مسافت</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">زمان تخمینی</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredRoutes.map((route, index) => (
                          <tr key={route._id} className={`hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="bg-indigo-100 p-2 rounded-full mr-2 shadow-sm">
                                  <FaRoute size={14} className="text-indigo-600" />
                                </div>
                                <div>
                                  <div className="flex items-center font-medium text-gray-800">
                                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">{route.origin}</span>
                                    <span className="mx-2 text-indigo-400">
                                      <FaArrowLeft className="h-4 w-4" />
                                    </span>
                                    <span className="rounded-lg bg-green-50 px-2 py-1 text-green-700">{route.destination}</span>
                                  </div>
                                  {route.description && (
                                    <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-1 rounded">{route.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-800">{route.distance.toLocaleString('fa-IR')}</span>
                                <span className="text-gray-500 text-sm mr-1 bg-gray-100 px-2 py-0.5 rounded">کیلومتر</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-gray-700">
                              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-medium">
                                {formatDuration(route.estimatedDuration)}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${route.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className={`w-2 h-2 mr-1 rounded-full ${route.isActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                {route.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(route)}
                                  className="p-2 bg-yellow-50 text-yellow-600 rounded-full hover:bg-yellow-100 transition-all shadow-sm hover:shadow"
                                  title="ویرایش"
                                >
                                  <FaPen size={14} />
                                </button>
                                <button
                                  onClick={() => toggleRouteStatus(route._id, route.isActive)}
                                  className={`p-2 rounded-full transition-all shadow-sm hover:shadow ${route.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                  title={route.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                >
                                  {route.isActive ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                                <button
                                  onClick={() => handleDelete(route._id)}
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
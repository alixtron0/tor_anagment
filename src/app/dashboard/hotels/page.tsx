'use client'

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaPen, FaTrash, FaEye, FaEyeSlash, FaUpload, FaSearch, FaHotel, FaMapMarkerAlt, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// تعریف طرح اعتبارسنجی فرم
const hotelSchema = z.object({
  name: z.string().min(2, { message: 'نام هتل باید حداقل 2 کاراکتر باشد' }),
  city: z.string().min(2, { message: 'شهر باید حداقل 2 کاراکتر باشد' }),
  country: z.string().min(2, { message: 'کشور باید حداقل 2 کاراکتر باشد' }),
  description: z.string().optional(),
  stars: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5, {
    message: 'تعداد ستاره‌ها باید بین 1 تا 5 باشد'
  }),
});

type HotelFormData = z.infer<typeof hotelSchema>;

interface Hotel {
  _id: string;
  name: string;
  stars: number;
  city: string;
  country: string;
  mainImage: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  hotelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteModal = ({ isOpen, hotelName, onConfirm, onCancel }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                  حذف هتل
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    آیا از حذف هتل <span className="font-bold text-gray-700">{hotelName}</span> اطمینان دارید؟
                  </p>
                  <p className="text-sm text-red-500 mt-2">
                    این عملیات غیرقابل بازگشت است!
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-300 transform hover:scale-105"
            >
              حذف
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HotelManagement() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentHotelId, setCurrentHotelId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; hotelId: string | null; hotelName: string }>({
    isOpen: false,
    hotelId: null,
    hotelName: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تنظیمات فرم
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<HotelFormData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      name: '',
      city: '',
      country: '',
      description: '',
      stars: '3',
    }
  });

  // دریافت هتل‌ها
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/hotels', {
        headers: { 'x-auth-token': token }
      });
      setHotels(response.data);
      setFilteredHotels(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching hotels:', err);
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات هتل‌ها');
      toast.error(err.response?.data?.message || 'خطا در دریافت اطلاعات هتل‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // فیلتر کردن هتل‌ها بر اساس جستجو
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHotels(hotels);
    } else {
      const filtered = hotels.filter(hotel =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHotels(filtered);
    }
  }, [searchTerm, hotels]);

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
  const onSubmit = async (data: HotelFormData) => {
    try {
      const token = localStorage.getItem('token');
      
      // ایجاد فرم‌دیتا برای ارسال فایل
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('stars', data.stars);
      formData.append('city', data.city);
      formData.append('country', data.country);
      formData.append('address', data.city + ', ' + data.country); // آدرس ساده
      formData.append('description', data.description || '');
      formData.append('checkInTime', '14:00'); // مقدار پیش‌فرض
      formData.append('checkOutTime', '12:00'); // مقدار پیش‌فرض
      
      if (imageFile) {
        formData.append('mainImage', imageFile);
      }

      if (editMode && currentHotelId) {
        // به‌روزرسانی هتل
        await axios.put(`http://localhost:5000/api/hotels/${currentHotelId}`, formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('هتل با موفقیت به‌روزرسانی شد');
      } else {
        // ایجاد هتل جدید
        await axios.post('http://localhost:5000/api/hotels', formData, {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('هتل جدید با موفقیت ایجاد شد');
      }

      // بازنشانی فرم و دریافت مجدد اطلاعات
      reset();
      setEditMode(false);
      setCurrentHotelId(null);
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchHotels();
    } catch (err: any) {
      console.error('Error submitting hotel:', err);
      toast.error(err.response?.data?.message || 'خطا در ثبت اطلاعات هتل');
    }
  };

  // تنظیم فرم برای ویرایش
  const handleEdit = (hotel: Hotel) => {
    setEditMode(true);
    setCurrentHotelId(hotel._id);
    setValue('name', hotel.name);
    setValue('stars', hotel.stars.toString());
    setValue('city', hotel.city);
    setValue('country', hotel.country);
    setValue('description', hotel.description || '');
    
    // تنظیم پیش‌نمایش تصویر
    if (hotel.mainImage) {
      setImagePreview(`http://localhost:5000${hotel.mainImage}`);
    } else {
      setImagePreview(null);
    }
    
    setImageFile(null);
    
    // اسکرول به بالای صفحه
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لغو ویرایش
  const handleCancel = () => {
    setEditMode(false);
    setCurrentHotelId(null);
    reset();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // نمایش مودال تایید حذف
  const showDeleteConfirm = (hotel: Hotel) => {
    setDeleteModal({
      isOpen: true,
      hotelId: hotel._id,
      hotelName: hotel.name
    });
  };

  // حذف هتل
  const handleDelete = async () => {
    if (!deleteModal.hotelId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/hotels/${deleteModal.hotelId}`, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        setHotels(hotels.filter(hotel => hotel._id !== deleteModal.hotelId));
        setFilteredHotels(filteredHotels.filter(hotel => hotel._id !== deleteModal.hotelId));
        toast.success('هتل با موفقیت حذف شد');
      }
    } catch (err: any) {
      console.error('Error deleting hotel:', err);
      toast.error(err.response?.data?.message || 'خطا در حذف هتل');
    } finally {
      setDeleteModal({ isOpen: false, hotelId: null, hotelName: '' });
    }
  };

  // تغییر وضعیت فعال/غیرفعال
  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5000/api/hotels/${id}/status`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      setHotels(hotels.map(hotel => 
        hotel._id === id ? { ...hotel, isActive: response.data.isActive } : hotel
      ));
      
      setFilteredHotels(filteredHotels.map(hotel => 
        hotel._id === id ? { ...hotel, isActive: response.data.isActive } : hotel
      ));
      
      toast.success(`هتل با موفقیت ${response.data.isActive ? 'فعال' : 'غیرفعال'} شد`);
    } catch (err: any) {
      console.error('Error toggling hotel status:', err);
      toast.error(err.response?.data?.message || 'خطا در تغییر وضعیت هتل');
    }
  };

  // نمایش ستاره‌های هتل
  const renderStars = (count: number) => {
    return Array(5).fill(0).map((_, index) => (
      <FaStar 
        key={index} 
        className={index < count ? "text-yellow-500" : "text-gray-300"} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white rounded-2xl p-6 shadow-lg border-b-4 border-indigo-500">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-full mr-4 text-white shadow-md">
              <FaHotel size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">مدیریت هتل‌ها</h1>
              <p className="text-gray-500 text-sm">مدیریت و مشاهده اطلاعات هتل‌ها</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در هتل‌ها..."
              className="w-full md:w-64 px-4 py-2 pl-10 bg-indigo-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 placeholder-gray-500 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-indigo-400">
              <FaSearch />
            </span>
          </div>
        </div>
        
        {/* فرم افزودن/ویرایش هتل */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden transition-all duration-300 transform hover:shadow-xl">
          <div className={`p-1 ${editMode ? 'bg-yellow-500' : 'bg-indigo-500'}`}></div>
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center mb-6 text-gray-800">
              <div className={`p-2 rounded-full mr-2 ${editMode ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {editMode ? <FaPen size={14} /> : <FaPlus size={14} />}
              </div>
              {editMode ? 'ویرایش هتل' : 'افزودن هتل جدید'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">نام هتل</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: هتل اسپیناس پالاس"
                />
                {errors.name && (
                  <span className="text-red-500 text-xs">{errors.name.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">تعداد ستاره</label>
                <select
                  {...register('stars')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                >
                  <option value="1">1 ستاره</option>
                  <option value="2">2 ستاره</option>
                  <option value="3">3 ستاره</option>
                  <option value="4">4 ستاره</option>
                  <option value="5">5 ستاره</option>
                </select>
                {errors.stars && (
                  <span className="text-red-500 text-xs">{errors.stars.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">کشور</label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: ایران"
                />
                {errors.country && (
                  <span className="text-red-500 text-xs">{errors.country.message}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">شهر</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="مثال: تهران"
                />
                {errors.city && (
                  <span className="text-red-500 text-xs">{errors.city.message}</span>
                )}
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                <textarea
                  {...register('description')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400 transition-all"
                  rows={3}
                  placeholder="توضیحات اضافی درباره این هتل..."
                ></textarea>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">تصویر هتل</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all flex items-center shadow-sm"
                    >
                      <FaUpload className="ml-2" />
                      انتخاب تصویر هتل
                    </button>
                    {imageFile && <span className="text-gray-700 mr-2 text-sm">{imageFile.name}</span>}
                  </div>
                  
                  {imagePreview && (
                    <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
                      <img 
                        src={imagePreview} 
                        alt="Hotel Preview" 
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
                  {editMode ? 'به‌روزرسانی هتل' : 'افزودن هتل'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* لیست هتل‌ها */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-1 bg-indigo-500"></div>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-full mr-2">
                <FaHotel size={14} />
              </span>
              لیست هتل‌ها
              <span className="mr-2 text-sm text-gray-500 font-normal">({filteredHotels.length} هتل)</span>
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
                {filteredHotels.length === 0 ? (
                  <div className="bg-gray-50 text-gray-500 p-8 rounded-lg border border-gray-100 text-center">
                    <div className="text-5xl mb-4">🏨</div>
                    <p className="text-lg font-medium">هیچ هتلی یافت نشد</p>
                    <p className="text-sm mt-2 text-gray-400">می‌توانید با تکمیل فرم بالا، هتل جدیدی اضافه کنید</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تصویر</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام هتل</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ستاره</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">موقعیت</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                          <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredHotels.map((hotel, index) => (
                          <tr key={hotel._id} className={`hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {hotel.mainImage ? (
                                <div className="w-14 h-14 relative border border-gray-200 rounded-lg overflow-hidden bg-white p-1 shadow-sm">
                                  <img 
                                    src={`http://localhost:5000${hotel.mainImage}`} 
                                    alt={hotel.name} 
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 bg-gray-100 flex items-center justify-center rounded-lg">
                                  <FaHotel className="text-gray-400" size={20} />
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-800">{hotel.name}</td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex">
                                {renderStars(hotel.stars)}
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <FaMapMarkerAlt className="text-red-500 ml-1" />
                                <span className="text-gray-700">{hotel.city}، {hotel.country}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${hotel.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span className={`w-2 h-2 mr-1 rounded-full ${hotel.isActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                {hotel.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center justify-start gap-2">
                                <button
                                  onClick={() => handleEdit(hotel)}
                                  className="p-2 bg-yellow-50 text-yellow-600 rounded-full hover:bg-yellow-100 transition-all shadow-sm hover:shadow"
                                  title="ویرایش"
                                >
                                  <FaPen size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(hotel._id)}
                                  className={`p-2 rounded-full transition-all shadow-sm hover:shadow ${hotel.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                  title={hotel.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                                >
                                  {hotel.isActive ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                                <button
                                  onClick={() => showDeleteConfirm(hotel)}
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

      {/* اضافه کردن مودال جدید */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        hotelName={deleteModal.hotelName}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, hotelId: null, hotelName: '' })}
      />
    </div>
  );
} 
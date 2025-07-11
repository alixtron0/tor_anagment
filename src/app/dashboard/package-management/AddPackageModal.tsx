'use client'
import { useState, useEffect } from 'react'
import { FaTimes, FaPlus, FaCalendarAlt, FaChevronDown, FaHotel, FaConciergeBell, FaBed, FaMapMarkerAlt, FaUpload, FaImage, FaGlobe, FaLock, FaExchangeAlt } from 'react-icons/fa'
import axios from 'axios'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import moment from 'jalali-moment'
import { Package, HotelStay, MealOptions } from '@/components/types'
import PriceInput from '@/components/PriceInput'
import CustomCheckbox from '@/components/CustomCheckbox'
import AirlineSelect from '@/components/AirlineSelect'
import PersianDatePicker from '@/components/PersianDatePicker'
import TimeSelector from '@/components/TimeSelector'
import ClientUpload from '@/components/ClientUpload'

interface Route {
  _id: string
  name: string
  origin: string
  destination: string
}

interface City {
  _id: string
  name: string
}

interface Hotel {
  _id: string
  name: string
  city: string
}

interface ServiceItem {
  name: string;
  price: number;
  calculateInPackage: boolean;
  selectable: boolean;
}

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packageData: Package | null;
  isEditing: boolean;
  packageToEdit: Package | null;
  onPackageLoaded?: (packageData: Package) => void;
}

export default function AddPackageModal({
  isOpen,
  onClose,
  onSuccess,
  packageData,
  isEditing,
  packageToEdit,
  onPackageLoaded
}: AddPackageModalProps) {
  const [routes, setRoutes] = useState<Route[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)
  const [routeLoading, setRouteLoading] = useState(true)
  const [cityLoading, setCityLoading] = useState(true)
  const [hotelLoading, setHotelLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [services, setServices] = useState<ServiceItem[]>([
    { name: 'صبحانه', price: 0, calculateInPackage: true, selectable: true },
    { name: 'ناهار', price: 0, calculateInPackage: true, selectable: true },
    { name: 'شام', price: 0, calculateInPackage: true, selectable: true },
    { name: 'ترانسفر', price: 0, calculateInPackage: true, selectable: true },
    { name: 'گشت شهری', price: 0, calculateInPackage: true, selectable: true }
  ])
  const [imagePreview, setImagePreview] = useState<string>('')
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [showDepartureAirline, setShowDepartureAirline] = useState(false)
  const [showReturnAirline, setShowReturnAirline] = useState(false)
  const [selectedDepartureAirline, setSelectedDepartureAirline] = useState<string>('')
  const [selectedReturnAirline, setSelectedReturnAirline] = useState<string>('')
  const [routeSelectionType, setRouteSelectionType] = useState<'predefined' | 'custom'>('predefined')
  const [originCity, setOriginCity] = useState<string>('')
  const [destinationCity, setDestinationCity] = useState<string>('')
  
  const defaultValues: Package = {
    name: '',
    isPublic: true,
    allAccess: true,
    route: '',
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '00:00',
    transportation: {
      departure: 'zamini' as 'zamini' | 'havaii',
      return: 'zamini' as 'zamini' | 'havaii',
      departureFlightNumber: '',
      returnFlightNumber: ''
    },
    basePrice: 0,
    infantPrice: 0,
    servicesFee: 0,
    capacity: 0,
    hotels: [
      {
        hotel: '',
        stayDuration: 1,
        firstMeal: { sobhane: false, nahar: false, sham: false },
        lastMeal: { sobhane: false, nahar: false, sham: false }
      }
    ],
    services: [],
    rooms: {
      single: { price: 0, forSale: true },
      double: { price: 0, forSale: true },
      triple: { price: 0, forSale: true },
      quadruple: { price: 0, forSale: true },
      quintuple: { price: 0, forSale: true }
    },
    isActive: true
  };

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<Package>({
    defaultValues: defaultValues
  })

  const watchAllFields = watch()
  const watchStartDate = watch('startDate')
  const watchEndDate = watch('endDate')
  const watchHotels = watch('hotels')

  // محاسبه تعداد روزهای پکیج
  const calculateTotalDays = () => {
    if (!watchStartDate || !watchEndDate) return 0
    
    try {
      const startDate = moment(watchStartDate, 'YYYY/MM/DD')
      const endDate = moment(watchEndDate, 'YYYY/MM/DD')
      
      // محاسبه تفاوت به روز
      const diffDays = endDate.diff(startDate, 'days')
      return diffDays + 1 // شامل شب آخر
    } catch (error) {
      console.error('خطا در محاسبه روزها:', error)
      return 0
    }
  }

  // محاسبه مجموع روزهای اقامت در هتل‌ها
  const calculateTotalStayDuration = () => {
    return watchHotels.reduce((total, hotel) => total + (hotel.stayDuration || 0), 0)
  }

  // بررسی اعتبار تعداد روزهای اقامت
  const isStayDurationValid = () => {
    // حذف محدودیت - همیشه معتبر است
    return true
  }

  // اضافه کردن محاسبه قیمت کل با بهره‌گیری از watchAllFields
  useEffect(() => {
    try {
      // دریافت مستقیم مقدار قیمت پایه
      const baseRaw = watchAllFields.basePrice;
      const base = typeof baseRaw === 'number' ? baseRaw : parseFloat(baseRaw) || 0;
      console.log('قیمت پایه خام:', baseRaw, 'تبدیل شده:', base);
      
      const servicesTotal = services.reduce((total, service) => {
        if (service.calculateInPackage) {
          return total + (service.price || 0);
        }
        return total;
      }, 0);
      
      // محاسبه و تنظیم قیمت کل
      const total = base + servicesTotal;
      console.log('قیمت پایه:', base, 'قیمت سرویس‌ها:', servicesTotal, 'قیمت کل:', total);
      setTotalPrice(total);
    } catch (error) {
      console.error('خطا در محاسبه قیمت کل:', error);
    }
  }, [watchAllFields.basePrice, services]);

  // بارگذاری داده‌ها
  useEffect(() => {
    // بارگذاری مسیرها
    const fetchRoutes = async () => {
      try {
        setRouteLoading(true)
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://185.94.99.35:5000/api/routes`, {
          headers: {
            'x-auth-token': token
          }
        })
        console.log('Routes data:', response.data); // برای دیباگ
        setRoutes(response.data)
        setRouteLoading(false)
      } catch (error) {
        console.error('خطا در بارگذاری مسیرها:', error)
        toast.error('خطا در بارگذاری لیست مسیرها')
        setRouteLoading(false)
      }
    }

    // بارگذاری شهرها
    const fetchCities = async () => {
      try {
        setCityLoading(true)
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://185.94.99.35:5000/api/cities`, {
          headers: {
            'x-auth-token': token
          }
        })
        setCities(response.data)
        setCityLoading(false)
      } catch (error) {
        console.error('خطا در بارگذاری شهرها:', error)
        toast.error('خطا در بارگذاری لیست شهرها')
        setCityLoading(false)
      }
    }

    // بارگذاری هتل‌ها
    const fetchHotels = async () => {
      try {
        setHotelLoading(true)
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://185.94.99.35:5000/api/hotels`, {
          headers: {
            'x-auth-token': token
          }
        })
        setHotels(response.data)
        setHotelLoading(false)
      } catch (error) {
        console.error('خطا در بارگذاری هتل‌ها:', error)
        toast.error('خطا در بارگذاری لیست هتل‌ها')
        setHotelLoading(false)
      }
    }

    fetchRoutes()
    fetchCities()
    fetchHotels()
  }, [isEditing, packageData])

  // دریافت پکیج برای ویرایش
  useEffect(() => {
    const loadPackageData = async () => {
      if (isOpen && isEditing && packageToEdit?._id) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://185.94.99.35:5000/api/packages/${packageToEdit._id}`, {
            headers: {
              'x-auth-token': token
            }
          });
          
          const packageData = response.data;
          console.log('Package data for editing:', packageData);
          
          // اضافه کردن لاگ برای بررسی داده‌های حمل و نقل
          console.log('Transportation data:', packageData.transportation);
          console.log('Departure Flight Number:', packageData.transportation.departureFlightNumber);
          console.log('Return Flight Number:', packageData.transportation.returnFlightNumber);
          
          // تنظیم داده‌های فرم
          reset({
            _id: packageData._id,
            name: packageData.name,
            isPublic: packageData.isPublic,
            allAccess: packageData.allAccess,
            route: packageData.route._id || packageData.route,
            startDate: packageData.startDate,
            startTime: packageData.startTime || '00:00',
            endDate: packageData.endDate,
            endTime: packageData.endTime || '00:00',
            transportation: {
              departure: packageData.transportation.departure,
              return: packageData.transportation.return,
              departureAirline: packageData.transportation.departureAirline || '',
              returnAirline: packageData.transportation.returnAirline || '',
              departureFlightNumber: packageData.transportation.departureFlightNumber || '',
              returnFlightNumber: packageData.transportation.returnFlightNumber || ''
            },
            basePrice: packageData.basePrice,
            infantPrice: packageData.infantPrice,
            servicesFee: packageData.servicesFee,
            capacity: packageData.capacity,
            hotels: packageData.hotels.map((hotel: any) => ({
              hotel: hotel.hotel._id || hotel.hotel,
              stayDuration: hotel.stayDuration,
              firstMeal: hotel.firstMeal,
              lastMeal: hotel.lastMeal
            })),
            rooms: packageData.rooms,
            image: packageData.image,
            isActive: packageData.isActive
          });
          
          // تنظیم حالت نمایش ایرلاین‌ها بر اساس نوع حمل و نقل
          setShowDepartureAirline(packageData.transportation.departure === 'havaii');
          setShowReturnAirline(packageData.transportation.return === 'havaii');
          
          // تنظیم ایرلاین‌های انتخاب شده
          if (packageData.transportation.departureAirline) {
            const departureAirlineId = typeof packageData.transportation.departureAirline === 'object' 
              ? packageData.transportation.departureAirline._id 
              : packageData.transportation.departureAirline;
            
            setSelectedDepartureAirline(departureAirlineId);
            console.log('Setting departure airline ID:', departureAirlineId);
          }
          
          if (packageData.transportation.returnAirline) {
            const returnAirlineId = typeof packageData.transportation.returnAirline === 'object' 
              ? packageData.transportation.returnAirline._id 
              : packageData.transportation.returnAirline;
            
            setSelectedReturnAirline(returnAirlineId);
            console.log('Setting return airline ID:', returnAirlineId);
          }
          
          // تنظیم سرویس‌ها
          if (packageData.services && packageData.services.length > 0) {
            console.log('Services from API:', packageData.services);
            
            // تطبیق ساختار isSelectable با selectable برای سازگاری
            const mappedServices = packageData.services.map((service: any) => {
              console.log('Processing service:', service);
              return {
                name: service.name,
                price: service.price || 0,
                calculateInPackage: service.calculateInPackage !== undefined ? service.calculateInPackage : true,
                selectable: service.selectable !== undefined ? service.selectable : 
                          (service.isSelectable !== undefined ? service.isSelectable : true)
              };
            });
            
            console.log('Mapped services for state:', mappedServices);
            setServices(mappedServices);
          }
          
          // نمایش پیش‌نمایش تصویر
          if (packageData.image) {
            setImagePreview(`http://185.94.99.35:5000${packageData.image}`);
          }
          
          // فراخوانی تابع کالبک
          if (typeof onPackageLoaded === 'function') {
            onPackageLoaded(packageData);
          }
        } catch (error) {
          console.error('خطا در بارگذاری اطلاعات پکیج:', error);
          toast.error('خطا در بارگذاری اطلاعات پکیج');
        }
      }
    };
    
    loadPackageData();
  }, [isOpen, isEditing, packageToEdit, reset, onPackageLoaded]);

  // افزودن هتل جدید
  const addHotel = () => {
    const hotels = watchHotels.slice()
    hotels.push({
      hotel: '',
      stayDuration: 1,
      firstMeal: { sobhane: false, nahar: false, sham: false },
      lastMeal: { sobhane: false, nahar: false, sham: false }
    })
    setValue('hotels', hotels)
  }

  // حذف هتل
  const removeHotel = (index: number) => {
    const hotels = watchHotels.slice()
    hotels.splice(index, 1)
    setValue('hotels', hotels)
  }

  // تغییر وضعیت وعده غذایی
  const toggleMeal = (hotelIndex: number, mealType: 'firstMeal' | 'lastMeal', meal: keyof MealOptions) => {
    const hotels = [...watchHotels]
    
    // اطمینان از وجود ساختار داده مناسب
    if (!hotels[hotelIndex]) {
      // ایجاد یک هتل جدید با مقادیر پیش‌فرض
      hotels[hotelIndex] = {
        hotel: '',
        stayDuration: 1,
        firstMeal: { sobhane: false, nahar: false, sham: false },
        lastMeal: { sobhane: false, nahar: false, sham: false }
      }
    }
    
    if (!hotels[hotelIndex][mealType]) {
      hotels[hotelIndex][mealType] = { sobhane: false, nahar: false, sham: false }
    }
    
    // تغییر وضعیت
    hotels[hotelIndex][mealType][meal] = !hotels[hotelIndex][mealType][meal]
    setValue('hotels', hotels)
  }

  // تغییر وضعیت سرویس
  const toggleService = (serviceName: string) => {
    const currentServices = [...services];
    const serviceIndex = currentServices.findIndex(s => s.name === serviceName);
    
    if (serviceIndex !== -1) {
      currentServices.splice(serviceIndex, 1);
    } else {
      currentServices.push({
        name: serviceName,
        price: 0,
        calculateInPackage: true,
        selectable: true
      });
    }
    
    setServices(currentServices);
  }

  // تغییر تب فعال
  const changeTab = (tab: string) => {
    setActiveTab(tab)
  }

  // جابجایی مبدا و مقصد
  const swapOriginDestination = () => {
    const temp = originCity;
    setOriginCity(destinationCity);
    setDestinationCity(temp);
  }

  // آماده‌سازی و ارسال داده‌ها به سرور
  const onSubmit = async (data: Package) => {
    // بررسی تعداد روزهای اقامت و نمایش هشدار (بدون توقف فرآیند)
    const totalDays = calculateTotalDays();
    const totalStayDuration = calculateTotalStayDuration();
    if (totalStayDuration > totalDays) {
      toast.warning('مجموع روزهای اقامت در هتل‌ها بیشتر از کل مدت پکیج است. در صورت نیاز می‌توانید ادامه دهید.');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // تنظیم داده‌های مربوط به حمل و نقل
      if (data.transportation.departure === 'havaii' && !data.transportation.departureAirline) {
        toast.error('لطفاً شرکت هواپیمایی رفت را انتخاب کنید');
        setLoading(false);
        return;
      }

      if (data.transportation.return === 'havaii' && !data.transportation.returnAirline) {
        toast.error('لطفاً شرکت هواپیمایی برگشت را انتخاب کنید');
        setLoading(false);
        return;
      }

      // بررسی و ترکیب داده‌های مسیر
      let routeData = data.route;
      if (routeSelectionType === 'custom' && originCity && destinationCity) {
        // ارسال درخواست ایجاد مسیر جدید یا دریافت مسیر موجود
        try {
          const routeResponse = await axios.post(
            `http://185.94.99.35:5000/api/routes/find-or-create`,
            { 
              origin: originCity, 
              destination: destinationCity 
            },
            {
              headers: { 'x-auth-token': token }
            }
          );
          
          routeData = routeResponse.data._id;
        } catch (routeError: any) {
          console.error('خطا در ثبت مسیر:', routeError);
          toast.error(routeError.response?.data?.message || 'خطا در ثبت مسیر');
          setLoading(false);
          return;
        }
      }

      // تنظیم سرویس‌ها
      const packageServices = services.map(service => ({
        name: service.name,
        price: service.price,
        calculateInPackage: service.calculateInPackage,
        selectable: service.selectable
      }));

      console.log('Services to be sent:', packageServices);

      // ترکیب داده‌ها
      const packageData = {
        ...data,
        route: routeData,
        basePrice: Number(data.basePrice) || 0,
        infantPrice: Number(data.infantPrice) || 0,
        servicesFee: Number(data.servicesFee) || 0,
        capacity: Number(data.capacity) || 0,
        startTime: data.startTime || '00:00',
        endTime: data.endTime || '00:00',
        services: packageServices,
        hotels: data.hotels.map(hotel => ({
          hotel: hotel.hotel,
          stayDuration: parseInt(hotel.stayDuration.toString()) || 1,
          firstMeal: hotel.firstMeal || { sobhane: false, nahar: false, sham: false },
          lastMeal: hotel.lastMeal || { sobhane: false, nahar: false, sham: false }
        })),
        transportation: {
          departure: data.transportation?.departure || 'zamini',
          return: data.transportation?.return || 'zamini',
          departureAirline: data.transportation?.departureAirline || undefined,
          returnAirline: data.transportation?.returnAirline || undefined,
          departureFlightNumber: data.transportation?.departureFlightNumber || '',
          returnFlightNumber: data.transportation?.returnFlightNumber || ''
        },
        rooms: {
          single: { 
            price: Number(data.rooms?.single?.price) || 0, 
            forSale: data.rooms?.single?.forSale !== undefined ? data.rooms.single.forSale : true 
          },
          double: { 
            price: Number(data.rooms?.double?.price) || 0, 
            forSale: data.rooms?.double?.forSale !== undefined ? data.rooms.double.forSale : true 
          },
          triple: { 
            price: Number(data.rooms?.triple?.price) || 0, 
            forSale: data.rooms?.triple?.forSale !== undefined ? data.rooms.triple.forSale : true 
          },
          quadruple: { 
            price: Number(data.rooms?.quadruple?.price) || 0, 
            forSale: data.rooms?.quadruple?.forSale !== undefined ? data.rooms.quadruple.forSale : true 
          },
          quintuple: { 
            price: Number(data.rooms?.quintuple?.price) || 0, 
            forSale: data.rooms?.quintuple?.forSale !== undefined ? data.rooms.quintuple.forSale : true 
          }
        }
      };
      
      // اطمینان از وجود مقادیر الزامی
      if (!packageData.route && routeSelectionType === 'predefined') {
        toast.error('انتخاب مسیر الزامی است');
        setLoading(false);
        return;
      }
      
      if (routeSelectionType === 'custom' && (!originCity || !destinationCity)) {
        toast.error('انتخاب شهر مبدا و مقصد الزامی است');
        setLoading(false);
        return;
      }
      
      if (packageData.hotels.length === 0 || !packageData.hotels[0].hotel) {
        toast.error('انتخاب حداقل یک هتل الزامی است');
        setLoading(false);
        return;
      }
      
      console.log('Sending package data:', packageData);
      
      if (isEditing && packageData?._id) {
        // ویرایش پکیج موجود
        await axios.put(
          `http://185.94.99.35:5000/api/packages/${packageData._id}`,
          packageData,
          {
            headers: {
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('پکیج با موفقیت ویرایش شد');
      } else {
        // افزودن پکیج جدید
        const response = await axios.post(
          `http://185.94.99.35:5000/api/packages`,
          packageData,
          {
            headers: {
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Server response:', response.data);
        toast.success('پکیج جدید با موفقیت ایجاد شد');
      }
      
      onSuccess();
      onClose();
      setLoading(false);
    } catch (error: any) {
      console.error('خطا در ذخیره پکیج:', error);
      
      // نمایش خطای دقیق‌تر
      if (error.response) {
        console.error('Server error data:', error.response.data);
        const errorMessage = error.response.data.message || 
                            (error.response.data.errors && error.response.data.errors.length > 0 
                              ? error.response.data.errors[0].msg 
                              : 'خطا در ذخیره اطلاعات پکیج');
        toast.error(errorMessage);
      } else {
        toast.error('خطا در ارتباط با سرور');
      }
      
      setLoading(false);
    }
  };

  // کلید Escape برای بستن مودال
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen, onClose])

  // جلوگیری از اسکرول صفحه هنگام باز بودن مودال
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // انتخاب تصویر از کامپوننت ClientUpload
  const handleImageSelect = (imageUrl: string) => {
    setImagePreview(imageUrl);
    
    // استخراج مسیر نسبی تصویر از URL کامل
    if (imageUrl.includes('http://185.94.99.35:5000')) {
      const relativePath = imageUrl.replace('http://185.94.99.35:5000', '');
      setValue('image', relativePath);
    } else if (imageUrl) {
      setValue('image', imageUrl);
    } else {
      setValue('image', '');
    }
  };

  // پیش‌فرض‌های اولیه
  useEffect(() => {
    if (isOpen && !isEditing) {
      reset({
        isActive: true,
        isPublic: true,
        allAccess: true,
        transportation: {
          departure: 'zamini',
          return: 'zamini'
        },
        rooms: {
          single: { price: 0, forSale: true },
          double: { price: 0, forSale: true },
          triple: { price: 0, forSale: true },
          quadruple: { price: 0, forSale: true },
          quintuple: { price: 0, forSale: true }
        },
        hotels: [{ 
          stayDuration: 1,
          firstMeal: { sobhane: false, nahar: false, sham: false },
          lastMeal: { sobhane: false, nahar: false, sham: false }
        }]
      });
      setServices([
        { name: 'صبحانه', price: 0, calculateInPackage: true, selectable: true },
        { name: 'ناهار', price: 0, calculateInPackage: true, selectable: true },
        { name: 'شام', price: 0, calculateInPackage: true, selectable: true },
        { name: 'ترانسفر', price: 0, calculateInPackage: true, selectable: true },
        { name: 'گشت شهری', price: 0, calculateInPackage: true, selectable: true }
      ]);
    }
  }, [isOpen, isEditing, reset]);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl my-4 mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مودال */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white relative z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {isEditing ? 'ویرایش پکیج' : 'افزودن پکیج جدید'}
            </h3>
            <button
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
              onClick={onClose}
              aria-label="بستن"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* تب‌ها */}
        <div className="bg-gray-50 border-b relative z-10">
          <div className="flex overflow-x-auto">
            <button
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => changeTab('basic')}
            >
              <FaMapMarkerAlt /> اطلاعات پایه
            </button>
            <button
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'hotels' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => changeTab('hotels')}
            >
              <FaHotel /> هتل‌ها
            </button>
            <button
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'services' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => changeTab('services')}
            >
              <FaConciergeBell /> سرویس‌ها
            </button>
            <button
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'rooms' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => changeTab('rooms')}
            >
              <FaBed /> اتاق‌ها
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10">
          <div className="max-h-[calc(100vh-15rem)] overflow-y-auto p-6">
            
            {/* تب اطلاعات پایه */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* نام پکیج */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">نام پکیج</label>
                  <input
                    type="text"
                    {...register('name', { required: 'نام پکیج الزامی است' })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all bg-white text-gray-900 hover:border-gray-300"
                    placeholder="نام پکیج را وارد کنید"
                  />
                  {errors.name && (
                    <p className="mt-1 text-red-500 text-sm">{errors.name.message}</p>
                  )}
                </div>

                {/* وضعیت نمایش */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">وضعیت نمایش</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setValue('isPublic', true)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                      ${watchAllFields.isPublic ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${watchAllFields.isPublic ? 'border-blue-500' : 'border-gray-300'}`}>
                        {watchAllFields.isPublic && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaGlobe className={`${watchAllFields.isPublic ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${watchAllFields.isPublic ? 'text-blue-700' : 'text-gray-600'}`}>عمومی</span>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setValue('isPublic', false)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                      ${!watchAllFields.isPublic ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${!watchAllFields.isPublic ? 'border-blue-500' : 'border-gray-300'}`}>
                        {!watchAllFields.isPublic && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaLock className={`${!watchAllFields.isPublic ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${!watchAllFields.isPublic ? 'text-blue-700' : 'text-gray-600'}`}>خصوصی</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* مسیر */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">نوع انتخاب مسیر</label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                      ${routeSelectionType === 'predefined' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setRouteSelectionType('predefined')}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${routeSelectionType === 'predefined' ? 'border-blue-500' : 'border-gray-300'}`}>
                        {routeSelectionType === 'predefined' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className={`font-medium ${routeSelectionType === 'predefined' ? 'text-blue-700' : 'text-gray-600'}`}>
                        انتخاب از مسیرهای موجود
                      </span>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                      ${routeSelectionType === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setRouteSelectionType('custom')}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${routeSelectionType === 'custom' ? 'border-blue-500' : 'border-gray-300'}`}>
                        {routeSelectionType === 'custom' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className={`font-medium ${routeSelectionType === 'custom' ? 'text-blue-700' : 'text-gray-600'}`}>
                        انتخاب شهر مبدا و مقصد
                      </span>
                    </label>
                  </div>

                  {routeSelectionType === 'predefined' ? (
                    <div className="relative">
                      <select
                        {...register('route', { required: routeSelectionType === 'predefined' })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none bg-white text-gray-900"
                        disabled={routeLoading}
                      >
                        <option value="">انتخاب مسیر</option>
                        {routes.map((route) => (
                          <option key={route._id} value={route._id} className="text-gray-900">
                            {route.origin} به {route.destination}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaChevronDown className="text-primary" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block mb-2 font-medium text-gray-700">شهر مبدا</label>
                        <select
                          value={originCity}
                          onChange={(e) => setOriginCity(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none bg-white text-gray-900"
                          disabled={cityLoading}
                        >
                          <option value="">انتخاب شهر مبدا</option>
                          {cities.map((city) => (
                            <option key={city._id} value={city.name} className="text-gray-900">
                              {city.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 top-8 flex items-center pl-3 pointer-events-none">
                          <FaChevronDown className="text-primary" />
                        </div>
                      </div>
                      
                      <div className="relative">
                        <label className="block mb-2 font-medium text-gray-700 flex items-center justify-between">
                          شهر مقصد
                          <button
                            type="button"
                            onClick={swapOriginDestination}
                            className="text-indigo-500 hover:text-indigo-700 p-1 bg-indigo-50 rounded-full"
                            title="جابجایی مبدا و مقصد"
                          >
                            <FaExchangeAlt size={16} />
                          </button>
                        </label>
                        <select
                          value={destinationCity}
                          onChange={(e) => setDestinationCity(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none bg-white text-gray-900"
                          disabled={cityLoading}
                        >
                          <option value="">انتخاب شهر مقصد</option>
                          {cities.map((city) => (
                            <option key={city._id} value={city.name} className="text-gray-900">
                              {city.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 top-8 flex items-center pl-3 pointer-events-none">
                          <FaChevronDown className="text-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {errors.route && routeSelectionType === 'predefined' && (
                    <p className="mt-1 text-red-500 text-sm">{errors.route.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* تاریخ شروع */}
                  <div>
                    <Controller
                      control={control}
                      name="startDate"
                      rules={{ required: 'تاریخ شروع الزامی است' }}
                      render={({ field }) => (
                        <PersianDatePicker
                          value={field.value}
                          onChange={(date) => {
                            if (date) {
                              field.onChange(date);
                            }
                          }}
                          label="تاریخ شروع"
                          error={errors.startDate?.message}
                        />
                      )}
                    />
                  </div>

                  {/* تاریخ پایان */}
                  <div>
                    <Controller
                      control={control}
                      name="endDate"
                      rules={{ required: 'تاریخ پایان الزامی است' }}
                      render={({ field }) => (
                        <PersianDatePicker
                          value={field.value}
                          onChange={(date) => {
                            if (date) {
                              field.onChange(date);
                            }
                          }}
                          label="تاریخ پایان"
                          error={errors.endDate?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* آپلود تصویر */}
                <div className="space-y-2">
                  <label className="block font-medium text-gray-700">تصویر پکیج</label>
                  <div className="flex items-center gap-4">
                    <ClientUpload 
                      onSelect={handleImageSelect}
                      defaultImage={imagePreview || ''}
                      title="انتخاب تصویر پکیج"
                      buttonText="انتخاب تصویر"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">می‌توانید از کتابخانه تصاویر انتخاب کنید یا تصویر جدید آپلود کنید</p>
                      <p className="text-sm text-gray-600">فرمت‌های مجاز: JPG، PNG، WEBP</p>
                    </div>
                  </div>
                </div>

                {/* بخش حمل و نقل */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">حمل و نقل</h3>
                  
                  {/* رفت */}
                  <div className="space-y-2">
                    <label className="block font-medium">نوع حمل و نقل (رفت)</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          {...register('transportation.departure')}
                          value="zamini"
                          onChange={(e) => {
                            if (e.target.checked) setShowDepartureAirline(false);
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <span>زمینی</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          {...register('transportation.departure')}
                          value="havaii"
                          onChange={(e) => {
                            if (e.target.checked) setShowDepartureAirline(true);
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <span>هوایی</span>
                      </label>
                    </div>
                    
                    {/* انتخاب شرکت هواپیمایی و شماره پرواز برای رفت */}
                    {showDepartureAirline && (
                      <div className="space-y-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <AirlineSelect
                          label="شرکت هواپیمایی (رفت)"
                          name="transportation.departureAirline"
                          register={register}
                          onAirlineChange={(airlineId) => setSelectedDepartureAirline(airlineId)}
                          defaultValue={selectedDepartureAirline}
                        />
                        
                        {/* زمان پرواز رفت */}
                        <TimeSelector
                          label="ساعت پرواز (رفت)"
                          value={watch('startTime') || '00:00'}
                          onChange={(time) => setValue('startTime', time)}
                          className="mb-4"
                        />
                        
                        {/* شماره پرواز رفت */}
                        <div>
                          <label className="block mb-2 font-medium text-gray-700">شماره پرواز (رفت)</label>
                          <input
                            type="text"
                            {...register('transportation.departureFlightNumber')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white text-gray-900"
                            placeholder="مثال: W5 5022"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* برگشت */}
                  <div className="space-y-2">
                    <label className="block font-medium">نوع حمل و نقل (برگشت)</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          {...register('transportation.return')}
                          value="zamini"
                          onChange={(e) => {
                            if (e.target.checked) setShowReturnAirline(false);
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <span>زمینی</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                        <input
                          type="radio"
                          {...register('transportation.return')}
                          value="havaii"
                          onChange={(e) => {
                            if (e.target.checked) setShowReturnAirline(true);
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <span>هوایی</span>
                      </label>
                    </div>

                    {/* انتخاب شرکت هواپیمایی و شماره پرواز برای برگشت */}
                    {showReturnAirline && (
                      <div className="space-y-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <AirlineSelect
                          label="شرکت هواپیمایی (برگشت)"
                          name="transportation.returnAirline"
                          register={register}
                          onAirlineChange={(airlineId) => setSelectedReturnAirline(airlineId)}
                          defaultValue={selectedReturnAirline}
                        />
                        
                        {/* زمان پرواز برگشت */}
                        <TimeSelector
                          label="ساعت پرواز (برگشت)"
                          value={watch('endTime') || '00:00'}
                          onChange={(time) => setValue('endTime', time)}
                          className="mb-4"
                        />
                        
                        {/* شماره پرواز برگشت */}
                        <div>
                          <label className="block mb-2 font-medium text-gray-700">شماره پرواز (برگشت)</label>
                          <input
                            type="text"
                            {...register('transportation.returnFlightNumber')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white text-gray-900"
                            placeholder="مثال: W5 5023"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* قیمت‌ها و ظرفیت */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PriceInput
                    label="قیمت پایه"
                    name="basePrice"
                    register={register}
                    error={errors.basePrice?.message}
                    onChange={(value) => {
                      console.log('قیمت پایه تغییر کرد:', value);
                      // به‌روزرسانی مقدار در فرم
                      setValue('basePrice', value);
                      
                      // محاسبه و به‌روزرسانی مستقیم قیمت کل
                      const servicesTotal = services.reduce((total, service) => {
                        if (service.calculateInPackage) {
                          return total + (service.price || 0);
                        }
                        return total;
                      }, 0);
                      const newTotal = value + servicesTotal;
                      console.log('قیمت پایه:', value, 'قیمت سرویس‌ها:', servicesTotal, 'قیمت کل جدید:', newTotal);
                      setTotalPrice(newTotal);
                    }}
                  />
                  <PriceInput
                    label="قیمت نوزاد"
                    name="infantPrice"
                    register={register}
                    error={errors.infantPrice?.message}
                  />
                  <PriceInput
                    label="دلار خدمات"
                    name="servicesFee"
                    register={register}
                    error={errors.servicesFee?.message}
                  />
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">ظرفیت</label>
                    <input
                      type="number"
                      {...register('capacity')}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all bg-white text-gray-900 hover:border-gray-300"
                      min="0"
                      placeholder="تعداد ظرفیت را وارد کنید"
                    />
                  </div>
                </div>

                {/* نمایش جمع کل */}
                <div className="mt-6 p-6 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">جمع کل:</span>
                    <span className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('fa-IR').format(totalPrice)} تومان
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* تب هتل‌ها */}
            {activeTab === 'hotels' && (
              <div className="space-y-6">
                {watchHotels.map((hotel, index) => (
                  <div key={index} className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="text-lg font-semibold text-gray-700">هتل {index + 1}</h5>
                      {watchHotels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHotel(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">انتخاب هتل</label>
                        <div className="relative">
                          <select
                            {...register(`hotels.${index}.hotel` as const)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none bg-white text-gray-900"
                          >
                            <option value="">انتخاب هتل</option>
                            {hotels.map((h) => (
                              <option key={h._id} value={h._id} className="text-gray-900">
                                {h.name} ({h.city})
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaChevronDown className="text-primary" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-gray-700">مدت اقامت (شب)</label>
                        <input
                          type="number"
                          {...register(`hotels.${index}.stayDuration` as const)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white text-gray-900"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* وعده‌های غذایی */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* وعده‌های غذایی شب اول */}
                      <div className="p-4 border-2 border-blue-200 rounded-lg bg-white shadow-md">
                        <h6 className="font-bold text-blue-800 mb-3 text-lg">وعده‌های غذایی شب اول</h6>
                        <div className="flex flex-wrap gap-6">
                          {['sobhane', 'nahar', 'sham'].map((meal) => (
                            <div key={meal} className="flex items-center">
                              <label 
                                className="relative inline-flex items-center cursor-pointer gap-3"
                                onClick={() => toggleMeal(index, 'firstMeal', meal as keyof MealOptions)}
                              >
                                <div className={`w-8 h-8 flex items-center justify-center rounded-md border-2 transition-all ${
                                  watchHotels[index]?.firstMeal?.[meal as keyof MealOptions] 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                    : 'bg-white border-gray-400 hover:border-blue-400'
                                }`}>
                                  {watchHotels[index]?.firstMeal?.[meal as keyof MealOptions] && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-gray-800 font-medium text-base">
                                  {meal === 'sobhane' ? 'صبحانه' : meal === 'nahar' ? 'ناهار' : 'شام'}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* وعده‌های غذایی شب آخر */}
                      <div className="p-4 border-2 border-blue-200 rounded-lg bg-white shadow-md">
                        <h6 className="font-bold text-blue-800 mb-3 text-lg">وعده‌های غذایی شب آخر</h6>
                        <div className="flex flex-wrap gap-6">
                          {['sobhane', 'nahar', 'sham'].map((meal) => (
                            <div key={meal} className="flex items-center">
                              <label 
                                className="relative inline-flex items-center cursor-pointer gap-3"
                                onClick={() => toggleMeal(index, 'lastMeal', meal as keyof MealOptions)}
                              >
                                <div className={`w-8 h-8 flex items-center justify-center rounded-md border-2 transition-all ${
                                  watchHotels[index]?.lastMeal?.[meal as keyof MealOptions] 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                    : 'bg-white border-gray-400 hover:border-blue-400'
                                }`}>
                                  {watchHotels[index]?.lastMeal?.[meal as keyof MealOptions] && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-gray-800 font-medium text-base">
                                  {meal === 'sobhane' ? 'صبحانه' : meal === 'nahar' ? 'ناهار' : 'شام'}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addHotel}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 bg-white"
                >
                  <FaPlus />
                  افزودن هتل جدید
                </button>
              </div>
            )}

            {/* تب سرویس‌ها */}
            {activeTab === 'services' && (
              <div>
                <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-blue-100">
                  <table className="w-full">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-right font-bold text-blue-800 border-b">نام سرویس</th>
                        <th className="px-6 py-4 text-right font-bold text-blue-800 border-b">قیمت</th>
                        <th className="px-6 py-4 text-center font-bold text-blue-800 border-b">محاسبه</th>
                        <th className="px-6 py-4 text-center font-bold text-blue-800 border-b">انتخابی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service, index) => (
                        <tr key={index} className="border-b hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 text-gray-900 font-medium">{service.name}</td>
                          <td className="px-6 py-4">
                            <PriceInput
                              label={`قیمت ${service.name}`}
                              name={`services.${index}.price`}
                              register={register}
                              value={service.price}
                              onChange={(value) => {
                                const newServices = [...services];
                                newServices[index].price = value;
                                setServices(newServices);
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <label 
                                className="relative inline-flex items-center cursor-pointer"
                                onClick={() => {
                                  const newServices = [...services];
                                  newServices[index].calculateInPackage = !newServices[index].calculateInPackage;
                                  setServices(newServices);
                                }}
                              >
                                <div className={`w-8 h-8 flex items-center justify-center rounded-md border-2 transition-all ${
                                  service.calculateInPackage 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                    : 'bg-white border-gray-400 hover:border-blue-400'
                                }`}>
                                  {service.calculateInPackage && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <label 
                                className="relative inline-flex items-center cursor-pointer"
                                onClick={() => {
                                  const newServices = [...services];
                                  newServices[index].selectable = !newServices[index].selectable;
                                  setServices(newServices);
                                }}
                              >
                                <div className={`w-8 h-8 flex items-center justify-center rounded-md border-2 transition-all ${
                                  service.selectable 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                    : 'bg-white border-gray-400 hover:border-blue-400'
                                }`}>
                                  {service.selectable && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* تب اتاق‌ها */}
            {activeTab === 'rooms' && (
              <div>
                <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-blue-100">
                  <table className="w-full">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-right font-bold text-blue-800 border-b">نوع اتاق</th>
                        <th className="px-6 py-4 text-right font-bold text-blue-800 border-b">قیمت</th>
                        <th className="px-6 py-4 text-center font-bold text-blue-800 border-b">قابل فروش</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries({
                        single: 'سینگل',
                        double: 'دو تخته',
                        triple: 'سه تخته',
                        quadruple: 'چهار تخته',
                        quintuple: 'پنج تخته'
                      }).map(([key, label]) => (
                        <tr key={key} className="border-b hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
                          <td className="px-6 py-4">
                            <PriceInput
                              label={`قیمت ${label}`}
                              name={`rooms.${key as 'single' | 'double' | 'triple' | 'quadruple' | 'quintuple'}.price`}
                              register={register}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <label 
                                className="relative inline-flex items-center cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault(); // جلوگیری از رفتار پیش‌فرض
                                  const currentValue = watch(`rooms.${key as 'single' | 'double' | 'triple' | 'quadruple' | 'quintuple'}.forSale`);
                                  setValue(`rooms.${key as 'single' | 'double' | 'triple' | 'quadruple' | 'quintuple'}.forSale`, !currentValue);
                                }}
                              >
                                <div className={`w-8 h-8 flex items-center justify-center rounded-md border-2 transition-all ${
                                  watch(`rooms.${key as 'single' | 'double' | 'triple' | 'quadruple' | 'quintuple'}.forSale`) 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                    : 'bg-white border-gray-400 hover:border-blue-400'
                                }`}>
                                  {watch(`rooms.${key as 'single' | 'double' | 'triple' | 'quadruple' | 'quintuple'}.forSale`) && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* دکمه‌های کنترلی */}
          <div className="bg-white border-t py-4 px-6 flex justify-end gap-3 sticky bottom-0 shadow-lg z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all font-medium flex items-center gap-2"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:opacity-90 transition-all font-bold flex items-center gap-2 shadow-xl shadow-blue-500/30 min-w-[160px] justify-center transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditing ? 'ویرایش پکیج' : 'افزودن پکیج'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
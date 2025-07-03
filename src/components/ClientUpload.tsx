'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaImage, 
  FaUpload, 
  FaTimes, 
  FaSearch, 
  FaSpinner, 
  FaCheck, 
  FaImages, 
  FaFilter,
  FaArrowRight
} from 'react-icons/fa'
import { getImages, uploadImage, ImageItem } from '@/api/imageLibraryApi'
import { toast } from 'react-toastify'

interface ClientUploadProps {
  onSelect: (imageUrl: string, imageId?: string) => void
  defaultImage?: string
  defaultMode?: 'library' | 'upload'
  title?: string
  buttonText?: string
  className?: string
}

export default function ClientUpload({
  onSelect,
  defaultImage = '',
  defaultMode = 'library',
  title = 'انتخاب تصویر',
  buttonText = 'انتخاب تصویر',
  className = ''
}: ClientUploadProps) {
  // حالت‌های مختلف
  const [mode, setMode] = useState<'library' | 'upload'>(defaultMode)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(defaultImage || null)
  
  // حالت‌های مربوط به آپلود
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadCategory, setUploadCategory] = useState('general')
  const [uploadLoading, setUploadLoading] = useState(false)
  
  // حالت‌های مربوط به کتابخانه
  const [libraryImages, setLibraryImages] = useState<ImageItem[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>(['all', 'general', 'package', 'hotel', 'airline'])
  const [libraryLoading, setLibraryLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  
  // بارگذاری تصاویر کتابخانه
  const fetchLibraryImages = async () => {
    try {
      setLibraryLoading(true)
      const images = await getImages()
      setLibraryImages(images)
      setFilteredImages(images)
      
      // استخراج دسته‌بندی‌های موجود
      const uniqueCategories = ['all', ...new Set(images.map(img => img.category))]
      setCategories(uniqueCategories)
    } catch (error: any) {
      toast.error('خطا در بارگذاری تصاویر کتابخانه')
      console.error('Error fetching library images:', error)
    } finally {
      setLibraryLoading(false)
    }
  }
  
  // فیلتر کردن تصاویر بر اساس جستجو و دسته‌بندی
  useEffect(() => {
    let result = [...libraryImages]
    
    // اعمال فیلتر دسته‌بندی
    if (selectedCategory !== 'all') {
      result = result.filter(img => img.category === selectedCategory)
    }
    
    // اعمال فیلتر جستجو
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(img => 
        img.name.toLowerCase().includes(searchLower) || 
        (img.tags && img.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      )
    }
    
    setFilteredImages(result)
  }, [libraryImages, searchTerm, selectedCategory])
  
  // انتخاب فایل برای آپلود
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // بررسی نوع فایل
      if (!file.type.match('image.*')) {
        toast.error('فقط فایل‌های تصویری مجاز هستند')
        return
      }
      
      // بررسی حجم فایل (حداکثر 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم فایل نباید بیشتر از 5 مگابایت باشد')
        return
      }
      
      setUploadFile(file)
      setUploadName(file.name.split('.')[0])
      
      // نمایش پیش‌نمایش
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // آپلود تصویر جدید
  const handleUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // جلوگیری از ارسال فرم
    
    if (!uploadFile) {
      toast.error('لطفاً یک تصویر انتخاب کنید')
      return
    }
    
    if (!uploadName.trim()) {
      toast.error('لطفاً نام تصویر را وارد کنید')
      return
    }
    
    try {
      setUploadLoading(true)
      
      const formData = new FormData()
      formData.append('image', uploadFile)
      formData.append('name', uploadName.trim())
      formData.append('category', uploadCategory)
      
      const response = await uploadImage(formData)
      
      // انتخاب تصویر آپلود شده
      const imageUrl = `http://185.94.99.35:5000${response.path}`
      setPreviewImage(imageUrl)
      onSelect(imageUrl, response._id)
      
      // بستن مودال و پاک کردن فرم
      setIsModalOpen(false)
      setUploadFile(null)
      setUploadPreview(null)
      setUploadName('')
      
      toast.success('تصویر با موفقیت آپلود شد')
      
      // بروزرسانی لیست تصاویر کتابخانه
      fetchLibraryImages()
    } catch (error: any) {
      toast.error('خطا در آپلود تصویر')
      console.error('Error uploading image:', error)
    } finally {
      setUploadLoading(false)
    }
  }
  
  // انتخاب تصویر از کتابخانه
  const handleSelectFromLibrary = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // جلوگیری از ارسال فرم
    
    if (!selectedImage) {
      toast.error('لطفاً یک تصویر انتخاب کنید')
      return
    }
    
    const imageUrl = `http://185.94.99.35:5000${selectedImage.path}`
    setPreviewImage(imageUrl)
    onSelect(imageUrl, selectedImage._id)
    setIsModalOpen(false)
  }
  
  // بستن مودال با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false)
      }
    }
    
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModalOpen])
  
  // بارگذاری تصاویر کتابخانه هنگام باز شدن مودال
  useEffect(() => {
    if (isModalOpen && mode === 'library') {
      fetchLibraryImages()
    }
  }, [isModalOpen, mode])
  
  return (
    <div className={`relative ${className}`}>
      {/* دکمه انتخاب تصویر */}
      <div className="flex flex-col items-center">
        <div 
          onClick={(e) => {
            e.preventDefault() // جلوگیری از ارسال فرم
            setIsModalOpen(true)
          }}
          className="relative cursor-pointer group"
        >
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-indigo-400 transition-all duration-300">
            {previewImage ? (
              <div className="w-full h-full relative">
                <img 
                  src={previewImage} 
                  alt="Selected" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-300">
                  <FaUpload className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400 group-hover:text-indigo-500 transition-all duration-300">
                <FaImage className="text-3xl mb-2" />
                <span className="text-xs font-medium">{buttonText}</span>
              </div>
            )}
          </div>
        </div>
        
        {previewImage && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault() // جلوگیری از ارسال فرم
              setPreviewImage(null)
              setSelectedImage(null)
              onSelect('', '')
            }}
            className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center"
          >
            <FaTimes className="ml-1" size={10} />
            حذف تصویر
          </button>
        )}
      </div>
      
      {/* مودال انتخاب تصویر */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault() // جلوگیری از ارسال فرم
                setIsModalOpen(false)
              }}
            />
            
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-50 relative"
            >
              {/* هدر مودال */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <FaImages className="ml-2" />
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault() // جلوگیری از ارسال فرم
                    setIsModalOpen(false)
                  }}
                  className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
                >
                  <FaTimes />
                </button>
              </div>
              
              {/* تب‌ها */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault() // جلوگیری از ارسال فرم
                    setMode('library')
                  }}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
                    mode === 'library'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  انتخاب از کتابخانه
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault() // جلوگیری از ارسال فرم
                    setMode('upload')
                  }}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
                    mode === 'upload'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  آپلود تصویر جدید
                </button>
              </div>
              
              {/* محتوای مودال */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {mode === 'library' ? (
                  <div>
                    {/* جستجو و فیلتر */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-xl">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* جستجو */}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="جستجو در تصاویر..."
                            className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                          />
                          <span className="absolute left-3 top-3.5 text-gray-400">
                            <FaSearch />
                          </span>
                          {searchTerm && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault() // جلوگیری از ارسال فرم
                                setSearchTerm('')
                              }}
                              className="absolute left-10 top-3.5 text-gray-400 hover:text-gray-600"
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                        
                        {/* فیلتر دسته‌بندی */}
                        <div className="flex items-center">
                          <span className="ml-2 text-gray-600 flex items-center">
                            <FaFilter className="ml-1" /> دسته‌بندی:
                          </span>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {categories.map(category => (
                              <button
                                type="button"
                                key={category}
                                onClick={(e) => {
                                  e.preventDefault() // جلوگیری از ارسال فرم
                                  setSelectedCategory(category)
                                }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                  selectedCategory === category
                                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                                }`}
                              >
                                {category === 'all' ? 'همه' : category}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* نمایش تصاویر */}
                    {libraryLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="flex flex-col items-center">
                          <FaSpinner className="text-indigo-600 text-3xl animate-spin mb-2" />
                          <span className="text-gray-600">در حال بارگذاری تصاویر...</span>
                        </div>
                      </div>
                    ) : filteredImages.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl shadow-md p-12 text-center">
                        <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                          <FaImages className="text-indigo-500 text-3xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">هیچ تصویری یافت نشد</h3>
                        <p className="text-gray-600 mb-6">
                          {searchTerm || selectedCategory !== 'all' ? 
                            'با تغییر فیلترها، تصاویر بیشتری را مشاهده کنید.' : 
                            'می‌توانید با انتخاب تب «آپلود تصویر جدید»، تصویر جدیدی اضافه کنید.'}
                        </p>
                        {(searchTerm || selectedCategory !== 'all') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault() // جلوگیری از ارسال فرم
                              setSearchTerm('')
                              setSelectedCategory('all')
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            پاک کردن فیلترها
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {filteredImages.map((image) => (
                            <div
                              key={image._id}
                              onClick={(e) => {
                                e.preventDefault() // جلوگیری از ارسال فرم
                                setSelectedImage(image)
                              }}
                              className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-300 h-40 ${
                                selectedImage?._id === image._id
                                  ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                                  : 'border-gray-200 hover:border-indigo-300'
                              }`}
                            >
                              <img
                                src={`http://185.94.99.35:5000${image.path}`}
                                alt={image.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                                <h4 className="text-white text-sm font-medium truncate">{image.name}</h4>
                                <p className="text-white/70 text-xs truncate">{image.category}</p>
                              </div>
                              {selectedImage?._id === image._id && (
                                <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-full">
                                  <FaCheck size={12} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                          <button
                            type="button"
                            onClick={handleSelectFromLibrary}
                            disabled={!selectedImage}
                            className={`px-6 py-3 rounded-xl flex items-center transition-all ${
                              selectedImage
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <span>انتخاب تصویر</span>
                            <FaArrowRight className="mr-2" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* بخش انتخاب تصویر */}
                      <div className="w-full">
                        <div
                          onClick={(e) => {
                            e.preventDefault() // جلوگیری از ارسال فرم
                            fileInputRef.current?.click()
                          }}
                          className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            uploadPreview ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*"
                          />
                          
                          {uploadPreview ? (
                            <div className="relative w-full h-full p-2">
                              <img
                                src={uploadPreview}
                                alt="پیش‌نمایش"
                                className="w-full h-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault() // جلوگیری از ارسال فرم
                                  setUploadFile(null)
                                  setUploadPreview(null)
                                  if (fileInputRef.current) fileInputRef.current.value = ''
                                }}
                                className="absolute top-4 right-4 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500">
                              <FaImage className="text-4xl mb-2" />
                              <span className="font-medium mb-1">تصویر را انتخاب کنید</span>
                              <span className="text-xs text-gray-400">یا بکشید و اینجا رها کنید</span>
                              <span className="mt-2 text-xs text-gray-400">حداکثر 5MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* بخش اطلاعات تصویر */}
                      <div className="w-full flex flex-col gap-4">
                        {/* نام تصویر */}
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            نام تصویر <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                            placeholder="نام تصویر را وارد کنید"
                            disabled={uploadLoading}
                            required
                          />
                        </div>
                        
                        {/* دسته‌بندی */}
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            دسته‌بندی
                          </label>
                          <select
                            id="category"
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                            disabled={uploadLoading}
                          >
                            <option value="general">عمومی</option>
                            <option value="package">پکیج</option>
                            <option value="hotel">هتل</option>
                            <option value="airline">ایرلاین</option>
                            <option value="city">شهر</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* دکمه آپلود */}
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploadLoading || !uploadFile || !uploadName.trim()}
                        className={`px-6 py-3 rounded-xl flex items-center transition-all ${
                          uploadLoading || !uploadFile || !uploadName.trim()
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                        }`}
                      >
                        {uploadLoading ? (
                          <>
                            <FaSpinner className="animate-spin ml-2" />
                            در حال آپلود...
                          </>
                        ) : (
                          <>
                            <FaUpload className="ml-2" />
                            آپلود و انتخاب تصویر
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

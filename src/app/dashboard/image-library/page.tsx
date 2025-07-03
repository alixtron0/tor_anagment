'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, ToastContainer } from 'react-toastify'
import { FaImages, FaUpload, FaSearch, FaFilter, FaTimes, FaSpinner } from 'react-icons/fa'
import { getImages, ImageItem } from '@/api/imageLibraryApi'
import UploadModal from './components/UploadModal'
import ImageCard from './components/ImageCard'
import ImageDetailsModal from './components/ImageDetailsModal'
import 'react-toastify/dist/ReactToastify.css'

export default function ImageLibrary() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>(['all', 'general', 'package', 'hotel', 'airline'])

  // بارگذاری لیست تصاویر
  const fetchImages = async () => {
    try {
      setLoading(true)
      const data = await getImages()
      setImages(data)
      setFilteredImages(data)
      
      // استخراج دسته‌بندی‌های موجود
      const uniqueCategories = ['all', ...new Set(data.map(img => img.category))]
      setCategories(uniqueCategories)
    } catch (error: any) {
      toast.error(error.message || 'خطا در بارگذاری تصاویر')
    } finally {
      setLoading(false)
    }
  }

  // بارگذاری اولیه
  useEffect(() => {
    fetchImages()
  }, [])

  // فیلتر تصاویر بر اساس جستجو و دسته‌بندی
  useEffect(() => {
    let result = [...images]
    
    // اعمال فیلتر دسته‌بندی
    if (selectedCategory !== 'all') {
      result = result.filter(img => img.category === selectedCategory)
    }
    
    // اعمال فیلتر جستجو
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(img => 
        img.name.toLowerCase().includes(searchLower) || 
        img.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }
    
    setFilteredImages(result)
  }, [images, searchTerm, selectedCategory])

  // آپلود تصویر جدید
  const handleImageUpload = () => {
    setIsUploadModalOpen(true)
  }

  // بستن مودال آپلود
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
  }

  // آپلود موفق
  const handleUploadSuccess = () => {
    fetchImages()
    setIsUploadModalOpen(false)
    toast.success('تصویر با موفقیت آپلود شد')
  }

  // نمایش جزئیات تصویر
  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image)
  }

  // بستن مودال جزئیات
  const handleCloseDetailsModal = () => {
    setSelectedImage(null)
  }

  // حذف تصویر
  const handleImageDelete = () => {
    fetchImages()
    setSelectedImage(null)
    toast.success('تصویر با موفقیت حذف شد')
  }

  // ویرایش تصویر
  const handleImageUpdate = () => {
    fetchImages()
    toast.success('اطلاعات تصویر با موفقیت بروزرسانی شد')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <ToastContainer position="bottom-left" autoClose={5000} rtl />
      
      {/* هدر صفحه */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white rounded-2xl p-6 shadow-lg border-b-4 border-indigo-500">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <FaImages className="text-indigo-600 text-2xl" />
            </div>
            <div className="mr-4">
              <h1 className="text-2xl font-bold text-gray-800">کتابخانه تصاویر</h1>
              <p className="text-gray-500 text-sm">مدیریت و آپلود تصاویر</p>
            </div>
          </div>
          
          <button
            onClick={handleImageUpload}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
          >
            <FaUpload />
            <span>آپلود تصویر جدید</span>
          </button>
        </div>
        
        {/* بخش جستجو و فیلتر */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            {/* جستجو */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در تصاویر..."
                className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">
                <FaSearch />
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
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
                    key={category}
                    onClick={() => setSelectedCategory(category)}
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
        
        {/* نمایش تعداد نتایج */}
        <div className="mb-4 text-gray-600 font-medium">
          {filteredImages.length} تصویر یافت شد
        </div>
        
        {/* گرید تصاویر */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <FaSpinner className="text-indigo-600 text-3xl animate-spin mb-2" />
              <span className="text-gray-600">در حال بارگذاری تصاویر...</span>
            </div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <FaImages className="text-indigo-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">هیچ تصویری یافت نشد</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all' ? 
                'با تغییر فیلترها، تصاویر بیشتری را مشاهده کنید.' : 
                'می‌توانید با کلیک بر روی دکمه آپلود، تصویر جدیدی اضافه کنید.'}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
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
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredImages.map((image, index) => (
              <motion.div
                key={image._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={() => handleImageClick(image)}
              >
                <ImageCard image={image} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* مودال آپلود تصویر */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadModal
            onClose={handleCloseUploadModal}
            onSuccess={handleUploadSuccess}
          />
        )}
      </AnimatePresence>
      
      {/* مودال جزئیات تصویر */}
      <AnimatePresence>
        {selectedImage && (
          <ImageDetailsModal
            image={selectedImage}
            onClose={handleCloseDetailsModal}
            onDelete={handleImageDelete}
            onUpdate={handleImageUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  )
} 
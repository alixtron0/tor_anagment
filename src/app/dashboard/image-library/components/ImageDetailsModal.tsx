'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaTimes, FaImage, FaSpinner, FaTag, FaPlus, FaTrash, FaCopy, FaPencilAlt, FaCheck, FaCalendarAlt, FaUser } from 'react-icons/fa'
import { ImageItem, updateImageDetails, deleteImage } from '@/api/imageLibraryApi'
import moment from 'jalali-moment'

interface ImageDetailsModalProps {
  image: ImageItem;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export default function ImageDetailsModal({ image, onClose, onDelete, onUpdate }: ImageDetailsModalProps) {
  const [name, setName] = useState(image.name)
  const [category, setCategory] = useState(image.category)
  const [tags, setTags] = useState<string[]>(image.tags || [])
  const [currentTag, setCurrentTag] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // دسته‌بندی‌های پیش‌فرض
  const categories = ['general', 'package', 'hotel', 'airline', 'city']
  
  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    try {
      return moment(dateString).locale('fa').format('jYYYY/jMM/jDD HH:mm')
    } catch (error) {
      return dateString
    }
  }
  
  // تبدیل سایز فایل به فرمت خوانا
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'نامشخص'
    
    const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
  
  // اضافه کردن تگ
  const handleAddTag = () => {
    if (!currentTag.trim()) return
    if (tags.includes(currentTag.trim())) return
    if (tags.length >= 10) {
      setError('حداکثر 10 تگ می‌توانید اضافه کنید')
      return
    }
    
    setTags([...tags, currentTag.trim()])
    setCurrentTag('')
  }
  
  // حذف تگ
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  // کپی آدرس تصویر
  const handleCopyImagePath = () => {
    const imageUrl = `http://185.94.99.35:5000${image.path}`
    navigator.clipboard.writeText(imageUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  
  // بروزرسانی اطلاعات تصویر
  const handleUpdate = async () => {
    if (!name.trim()) {
      setError('نام تصویر نمی‌تواند خالی باشد')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      await updateImageDetails(image._id, {
        name: name.trim(),
        category,
        tags
      })
      
      onUpdate()
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'خطا در بروزرسانی اطلاعات')
    } finally {
      setLoading(false)
    }
  }
  
  // حذف تصویر
  const handleDeleteImage = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await deleteImage(image._id)
      onDelete()
    } catch (err: any) {
      setError(err.message || 'خطا در حذف تصویر')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {/* هدر مودال */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaImage className="ml-2" />
            <h2 className="text-lg font-bold">جزئیات تصویر</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            disabled={loading}
          >
            <FaTimes />
          </button>
        </div>
        
        {/* محتوای مودال */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-60px)]">
          <div className="flex flex-col md:flex-row gap-6">
            {/* بخش تصویر */}
            <div className="w-full md:w-1/2">
              <div className="bg-gray-100 rounded-xl overflow-hidden shadow-md h-80">
                <img
                  src={`http://185.94.99.35:5000${image.path}`}
                  alt={image.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* اطلاعات فنی تصویر */}
              <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-700 mb-2">اطلاعات فنی</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500">نام فایل:</span>
                    <span className="mr-1 text-gray-700 truncate">{image.filename}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">حجم:</span>
                    <span className="mr-1 text-gray-700">{formatFileSize(image.size)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">نوع فایل:</span>
                    <span className="mr-1 text-gray-700">{image.mimetype || 'نامشخص'}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-gray-400 ml-1" />
                    <span className="text-gray-700">{formatDate(image.createdAt)}</span>
                  </div>
                </div>
                
                {/* دکمه کپی آدرس */}
                <button
                  onClick={handleCopyImagePath}
                  className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={loading}
                >
                  {copied ? (
                    <>
                      <FaCheck />
                      <span>کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <FaCopy />
                      <span>کپی آدرس تصویر</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* بخش اطلاعات و ویرایش */}
            <div className="w-full md:w-1/2 flex flex-col">
              {/* دکمه‌های عملیات */}
              <div className="flex justify-end mb-4">
                {isEditing ? (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm flex items-center"
                    disabled={loading}
                  >
                    <FaTimes className="ml-1" />
                    <span>انصراف</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm flex items-center"
                    disabled={loading}
                  >
                    <FaPencilAlt className="ml-1" />
                    <span>ویرایش</span>
                  </button>
                )}
              </div>
              
              {/* فرم اطلاعات */}
              <div className="flex flex-col gap-4">
                {/* نام تصویر */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    نام تصویر {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      placeholder="نام تصویر را وارد کنید"
                      disabled={loading}
                      required
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                      {image.name}
                    </div>
                  )}
                </div>
                
                {/* دسته‌بندی */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    دسته‌بندی
                  </label>
                  {isEditing ? (
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      disabled={loading}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                      {image.category || 'بدون دسته‌بندی'}
                    </div>
                  )}
                </div>
                
                {/* تگ‌ها */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    تگ‌ها
                  </label>
                  {isEditing ? (
                    <>
                      <div className="flex">
                        <input
                          type="text"
                          id="tags"
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-r-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                          placeholder="تگ را وارد کنید"
                          disabled={loading}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-l-lg hover:bg-indigo-700 transition-colors"
                          disabled={loading || !currentTag.trim()}
                        >
                          <FaPlus />
                        </button>
                      </div>
                      
                      {/* نمایش تگ‌ها */}
                      {tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-sm"
                            >
                              <FaTag className="ml-1 text-indigo-400 text-xs" />
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="mr-1 text-indigo-400 hover:text-indigo-600"
                                disabled={loading}
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500">بدون تگ</div>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 min-h-[40px]">
                      {image.tags && image.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {image.tags.map((tag, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                            >
                              <FaTag className="ml-1 text-gray-400 text-[8px]" />
                              {tag}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">بدون تگ</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* اطلاعات آپلود کننده */}
                {image.createdBy && (
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUser className="ml-1 text-gray-400" />
                      <span>آپلود شده توسط: {image.createdBy.fullName}</span>
                    </div>
                  </div>
                )}
                
                {/* خطا */}
                {error && (
                  <div className="bg-red-50 text-red-600 p-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                {/* دکمه‌های عملیات */}
                <div className="flex gap-2 mt-auto pt-4">
                  {isEditing ? (
                    <button
                      onClick={handleUpdate}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                      disabled={loading || !name.trim()}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin ml-2" />
                          در حال بروزرسانی...
                        </>
                      ) : (
                        <>
                          <FaCheck className="ml-2" />
                          ذخیره تغییرات
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      {deleteConfirm ? (
                        <>
                          <button
                            onClick={() => setDeleteConfirm(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading}
                          >
                            انصراف
                          </button>
                          <button
                            onClick={handleDeleteImage}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                            disabled={loading}
                          >
                            {loading ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaTrash className="ml-2" />
                                تأیید حذف
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(true)}
                          className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                          disabled={loading}
                        >
                          <FaTrash className="ml-2" />
                          حذف تصویر
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 
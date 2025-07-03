'use client'
import { useState, useRef, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { FaUpload, FaTimes, FaImage, FaSpinner, FaTag, FaPlus, FaTrash } from 'react-icons/fa'
import { uploadImage } from '@/api/imageLibraryApi'

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('general')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // دسته‌بندی‌های پیش‌فرض
  const categories = ['general', 'package', 'hotel', 'airline', 'city']
  
  // انتخاب فایل
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    
    // بررسی نوع فایل
    if (!file.type.match('image.*')) {
      setError('فقط فایل‌های تصویری مجاز هستند')
      return
    }
    
    // بررسی حجم فایل (حداکثر 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم فایل نباید بیشتر از 5 مگابایت باشد')
      return
    }
    
    setSelectedFile(file)
    
    // نمایش پیش‌نمایش
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // تنظیم نام پیش‌فرض اگر خالی باشد
    if (!name) {
      const fileName = file.name.split('.')[0]
      setName(fileName)
    }
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
  
  // ارسال فرم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!selectedFile) {
      setError('لطفاً یک تصویر انتخاب کنید')
      return
    }
    
    if (!name.trim()) {
      setError('لطفاً نام تصویر را وارد کنید')
      return
    }
    
    try {
      setLoading(true)
      
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('name', name.trim())
      formData.append('category', category)
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags))
      }
      
      await uploadImage(formData)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود تصویر')
      setLoading(false)
    }
  }
  
  // کلیک روی دکمه انتخاب فایل
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {/* هدر مودال */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaUpload className="ml-2" />
            <h2 className="text-lg font-bold">آپلود تصویر جدید</h2>
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
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
            {/* بخش انتخاب تصویر */}
            <div className="w-full md:w-1/2">
              <div
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  preview ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  disabled={loading}
                />
                
                {preview ? (
                  <div className="relative w-full h-full p-2">
                    <img
                      src={preview}
                      alt="پیش‌نمایش"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        setPreview(null)
                      }}
                      className="absolute top-4 right-4 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                      disabled={loading}
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
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              {/* نام تصویر */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  نام تصویر <span className="text-red-500">*</span>
                </label>
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
              </div>
              
              {/* دسته‌بندی */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  دسته‌بندی
                </label>
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
              </div>
              
              {/* تگ‌ها */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  تگ‌ها
                </label>
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
                {tags.length > 0 && (
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
                )}
              </div>
              
              {/* خطا */}
              {error && (
                <div className="bg-red-50 text-red-600 p-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {/* دکمه‌های عملیات */}
              <div className="flex gap-2 mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  disabled={loading || !selectedFile || !name.trim()}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin ml-2" />
                      در حال آپلود...
                    </>
                  ) : (
                    <>
                      <FaUpload className="ml-2" />
                      آپلود تصویر
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
} 
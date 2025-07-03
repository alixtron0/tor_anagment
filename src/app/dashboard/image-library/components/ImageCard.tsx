'use client'
import { useState } from 'react'
import { FaImage, FaTag } from 'react-icons/fa'
import { ImageItem } from '@/api/imageLibraryApi'
import moment from 'jalali-moment'

interface ImageCardProps {
  image: ImageItem;
}

export default function ImageCard({ image }: ImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    try {
      return moment(dateString).locale('fa').format('jYYYY/jMM/jDD')
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

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 h-full flex flex-col">
      {/* بخش تصویر */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-pulse flex flex-col items-center">
              <FaImage className="text-gray-300 text-4xl mb-2" />
              <span className="text-gray-400 text-xs">در حال بارگذاری...</span>
            </div>
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
              <FaImage className="text-gray-300 text-4xl mb-2" />
              <span className="text-gray-500 text-xs">خطا در بارگذاری تصویر</span>
            </div>
          </div>
        ) : (
          <img
            src={`http://185.94.99.35:5000${image.path}`}
            alt={image.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {/* نشانگر دسته‌بندی */}
        <div className="absolute top-2 right-2">
          <span className="bg-indigo-600/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
            {image.category}
          </span>
        </div>
      </div>
      
      {/* بخش اطلاعات */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{image.name}</h3>
        
        <div className="text-xs text-gray-500 mb-3 flex items-center">
          <span className="ml-2">{formatDate(image.createdAt)}</span>
          <span>•</span>
          <span className="mr-2">{formatFileSize(image.size)}</span>
        </div>
        
        {/* تگ‌ها */}
        {image.tags && image.tags.length > 0 && (
          <div className="mt-auto pt-2">
            <div className="flex flex-wrap gap-1">
              {image.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                >
                  <FaTag className="ml-1 text-gray-400 text-[8px]" />
                  {tag}
                </span>
              ))}
              {image.tags.length > 3 && (
                <span className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                  +{image.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

// تعریف پراپ‌های کامپوننت
interface TicketTemplateProps {
  ticketData: {
    ticketId: string;
    passenger: {
      englishFirstName: string;
      englishLastName: string;
      documentType?: string;
      documentNumber?: string;
      nationality?: string;
    };
    flightInfo: {
      origin: string;
      destination: string;
      date: string;
      time?: string;
      flightNumber?: string;
      aircraft?: string;
      seat?: string;
      airline?: string;
      reservation_number?: string;
    };
    airlineInfo?: {
      name?: string;
      englishName?: string;
      logo?: string;
    };
  };
  downloadable?: boolean;
}

// تابع کمکی برای تبدیل نام شهرها به فارسی
const persianizeCity = (city: string): string => {
  const cityMap: Record<string, string> = {
    'Tehran': 'تهران',
    'Mashhad': 'مشهد',
    'Isfahan': 'اصفهان',
    'Shiraz': 'شیراز',
    'Tabriz': 'تبریز',
    'Kish': 'کیش',
    'Qeshm': 'قشم',
    'Dubai': 'دبی',
    'Istanbul': 'استانبول',
    'Ankara': 'آنکارا',
    'London': 'لندن',
    'Paris': 'پاریس',
    'Rome': 'رم',
    'Moscow': 'مسکو',
    'Beijing': 'پکن',
    'Tokyo': 'توکیو',
    'Delhi': 'دهلی',
    'Madrid': 'مادرید',
    'Frankfurt': 'فرانکفورت',
    'Amsterdam': 'آمستردام',
    'Doha': 'دوحه',
    'Riyadh': 'ریاض',
    'Jeddah': 'جده'
  };

  return cityMap[city] || city;
};

// تبدیل تاریخ به فرمت فارسی
const formatPersianDate = (dateStr: string): string => {
  try {
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    
    // اگر تاریخ به فرمت yyyy/mm/dd است
    if (dateStr.includes('/')) {
      const dateParts = dateStr.split('/');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        
        if (year > 1500) { // احتمالاً میلادی است
          const persianYear = year - 621; // تقریبی
          return `${day} ${persianMonths[month-1]} ${persianYear}`;
        } else { // احتمالاً شمسی است
          return `${day} ${persianMonths[month-1]} ${year}`;
        }
      }
    }
    
    // اگر تاریخ در قالب دیگری است
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear() - 621; // تقریبی
      const month = date.getMonth();
      const day = date.getDate();
      
      return `${day} ${persianMonths[month]} ${year}`;
    }
    
    return dateStr;
  } catch (error) {
    console.error('خطا در تبدیل تاریخ:', error);
    return dateStr;
  }
};

const TicketTemplate: React.FC<TicketTemplateProps> = ({ ticketData, downloadable = true }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // تولید شماره رزرو تصادفی اگر وجود نداشته باشد
  const reservationNumber = ticketData.flightInfo.reservation_number || 
    Math.floor(Math.random() * 10000000).toString();

  // دانلود بلیط به صورت PDF
  const downloadPDF = async (): Promise<void> => {
    if (!ticketRef.current) return;

    // نمایش پیام "در حال بارگیری"
    const loadingToast = toast.loading('در حال تولید بلیط...');
    
    try {
      // به جای تغییر رنگ‌ها در DOM اصلی، در فرآیند clone آن‌ها را بازنویسی می‌کنیم
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        onclone: (document, element) => {
          // اضافه کردن یک استایل جایگزین به صفحه کلون شده
          const style = document.createElement('style');
          style.textContent = `
            * {
              color: #000000 !important;
              background-color: #FFFFFF !important;
              border-color: #E5E7EB !important;
            }
            
            /* استایل‌های خاص برای اجزای بلیط */
            #ticket-container {
              width: 842px !important;
              height: 595px !important;
              background-color: #FFFFFF !important;
              border: 1px solid #E5E7EB !important;
              border-radius: 0.5rem !important;
              font-family: Vazirmatn, system-ui !important;
              direction: rtl !important;
            }
            
            /* نوار بالای بلیط */
            #ticket-container > div:first-child {
              height: 5rem !important;
              background-color: #3B82F6 !important;
            }
            #ticket-container > div:first-child * {
              color: #FFFFFF !important;
            }
            
            /* لوگو */
            #ticket-container > div:first-child > div:first-child {
              background-color: #60A5FA !important;
            }
            
            /* اطلاعات پرواز */
            #ticket-container > div:nth-child(2) > div:first-child {
              background-color: #F3F4F6 !important;
            }
            
            /* اطلاعات هواپیما */
            #ticket-container > div:nth-child(2) > div:nth-child(2) > div:first-child {
              background-color: #1E40AF !important;
              color: #FFFFFF !important;
            }
            #ticket-container > div:nth-child(2) > div:nth-child(2) > div:first-child * {
              color: #FFFFFF !important;
            }
            
            /* اطلاعات مسافر */
            #ticket-container > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) {
              background-color: #DBEAFE !important;
            }
            #ticket-container > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) h3,
            #ticket-container > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) span {
              color: #1E3A8A !important;
            }
            
            /* فوتر */
            #ticket-container > div:last-child {
              background-color: #F9FAFB !important;
              border-top: 1px solid #E5E7EB !important;
            }
          `;
          document.head.appendChild(style);
        }
      });
      
      // پاک کردن پیام toast
      toast.dismiss(loadingToast);
      
      // تبدیل canvas به تصویر
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // تنظیم اندازه PDF در A4 افقی
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // افزودن متادیتا
      pdf.setProperties({
        title: `بلیط پرواز ${ticketData.passenger.englishFirstName} ${ticketData.passenger.englishLastName}`,
        subject: `پرواز ${ticketData.flightInfo.origin} به ${ticketData.flightInfo.destination}`,
        creator: 'سیستم مدیریت تورنگار'
      });
      
      // محاسبه ابعاد تصویر در PDF
      const imgWidth = 297; // عرض A4 به میلی‌متر
      const imgHeight = 210; // ارتفاع A4 به میلی‌متر
      
      // اضافه کردن تصویر به PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // دانلود PDF
      pdf.save(`ticket-${ticketData.ticketId.substring(0, 8)}.pdf`);
      
      toast.success('بلیط با موفقیت دانلود شد.');
    } catch (error) {
      console.error('خطا در تولید PDF:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در تولید فایل PDF. لطفا دوباره تلاش کنید.');
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* اگر قابلیت دانلود فعال است، دکمه دانلود را نمایش می‌دهیم */}
      {downloadable && (
        <button
          onClick={downloadPDF}
          style={{ 
            backgroundColor: '#2563eb', 
            marginBottom: '1rem', 
            padding: '0.5rem 1rem', 
            color: 'white', 
            borderRadius: '0.375rem', 
            transition: 'background-color 0.3s ease' 
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          دانلود بلیط پرواز
        </button>
      )}
      
      {/* قالب بلیط پرواز */}
      <div
        id="ticket-container"
        ref={ticketRef}
        style={{ 
          width: '842px', 
          height: '595px', 
          backgroundColor: 'white',
          border: '1px solid #e5e7eb', 
          borderRadius: '0.5rem', 
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'Vazirmatn, system-ui',
          direction: 'rtl'
        }}
      >
        {/* نوار بالای بلیط */}
        <div style={{ 
          height: '5rem', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 1.5rem',
          backgroundColor: '#3b82f6'
        }}>
          {/* لوگو یا آیکون */}
          <div style={{ 
            width: '3.5rem', 
            height: '3.5rem', 
            borderRadius: '9999px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden',
            backgroundColor: '#60a5fa'
          }}>
            {ticketData.airlineInfo?.logo ? (
              <img 
                src={`/uploads/${ticketData.airlineInfo.logo}`} 
                alt="Logo" 
                width="56" 
                height="56" 
              />
            ) : (
              <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>T</span>
            )}
          </div>
          
          {/* عنوان بلیط */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>پروازکارت</h1>
            <p style={{ color: 'white', fontSize: '0.875rem' }}>شماره:{ticketData.ticketId.substring(0, 8)}</p>
          </div>
          
          {/* لوگوی ایرلاین */}
          <div style={{ width: '5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ticketData.airlineInfo?.logo ? (
              <img 
                src={`/uploads/${ticketData.airlineInfo.logo}`} 
                alt="Airline Logo" 
                width="80" 
                height="50"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <span style={{ color: 'white', fontSize: '1.125rem' }}>
                {ticketData.flightInfo.airline || 'ایرلاین'}
              </span>
            )}
          </div>
        </div>
        
        {/* بخش اصلی بلیط */}
        <div style={{ padding: '2rem' }}>
          {/* مسیر پرواز */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            marginBottom: '2rem', 
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            {/* مبدا و مقصد */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '1rem'
            }}>
              {/* مبدا */}
              <div style={{ textAlign: 'center', width: '30%' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>از</p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {ticketData.flightInfo.origin}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {ticketData.flightInfo.origin}
                </p>
              </div>
              
              {/* خط و آیکون هواپیما */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '40%',
                position: 'relative' 
              }}>
                <div style={{ height: '2px', width: '80%', backgroundColor: '#9ca3af' }}></div>
                <div style={{ 
                  position: 'absolute',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>✈️</span>
                </div>
              </div>
              
              {/* مقصد */}
              <div style={{ textAlign: 'center', width: '30%' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>به</p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {ticketData.flightInfo.destination}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {ticketData.flightInfo.destination}
                </p>
              </div>
            </div>
            
            {/* تاریخ و زمان */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              borderTop: '1px solid #d1d5db',
              paddingTop: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>تاریخ پرواز</p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatPersianDate(ticketData.flightInfo.date)}
                </h3>
                <p style={{ fontSize: '1rem', color: '#4b5563' }}>
                  ساعت: {ticketData.flightInfo.time}
                </p>
              </div>
            </div>
          </div>
          
          {/* اطلاعات هواپیما و پرواز */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* اطلاعات هواپیما */}
            <div style={{ 
              flex: '1', 
              padding: '1rem', 
              backgroundColor: '#1e40af', 
              borderRadius: '0.5rem', 
              color: 'white'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>اطلاعات پرواز</h3>
              <div style={{ marginBottom: '0.5rem' }}>
                <p><span style={{ opacity: '0.75' }}>هواپیما:</span> {ticketData.flightInfo.aircraft || '-'}</p>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <p><span style={{ opacity: '0.75' }}>شماره پرواز:</span> {ticketData.flightInfo.flightNumber || '-'}</p>
              </div>
              <div>
                <p><span style={{ opacity: '0.75' }}>صندلی:</span> {ticketData.flightInfo.seat || '-'}</p>
              </div>
            </div>
            
            {/* اطلاعات مسافر */}
            <div style={{ 
              flex: '2', 
              padding: '1rem', 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.5rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e3a8a' }}>اطلاعات مسافر</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <p><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>نام:</span> {ticketData.passenger.englishFirstName} {ticketData.passenger.englishLastName}</p>
                <p><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>کد ملی:</span> {ticketData.passenger.documentNumber || '-'}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>نوع مدرک:</span> {ticketData.passenger.documentType || '-'}</p>
                <p><span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>ملیت:</span> {ticketData.passenger.nationality || '-'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* بارکد و کد QR */}
        <div style={{ 
          position: 'absolute', 
          bottom: '0', 
          left: '0', 
          width: '100%', 
          backgroundColor: '#f9fafb', 
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* بارکد نمادین */}
          <div style={{ width: '40%' }}>
            <div style={{ 
              height: '3rem',
              borderRadius: '0.25rem',
              overflow: 'hidden',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {Array(20).fill(0).map((_, i) => (
                <div key={i} style={{ 
                  height: '90%', 
                  width: `${Math.random() * 3 + 1}px`, 
                  backgroundColor: '#111827',
                  marginLeft: '2px'
                }}></div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem', color: '#6b7280' }}>
              {ticketData.ticketId}
            </p>
          </div>
          
          {/* متن وسط */}
          <div style={{ textAlign: 'center', width: '20%' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              تور نگار
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              سیستم مدیریت آژانس‌های مسافرتی
            </p>
          </div>
          
          {/* کد QR نمادین */}
          <div style={{ width: '40%', display: 'flex', justifyContent: 'flex-end' }}>
            <div>
              <div style={{ 
                width: '4rem',
                height: '4rem',
                backgroundColor: 'white',
                borderRadius: '0.25rem',
                padding: '0.25rem',
                overflow: 'hidden',
                marginLeft: 'auto'
              }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gridTemplateRows: 'repeat(5, 1fr)',
                  gap: '2px',
                  width: '100%',
                  height: '100%'
                }}>
                  {Array(25).fill(0).map((_, i) => (
                    <div key={i} style={{ backgroundColor: Math.random() > 0.5 ? '#111827' : 'white' }}></div>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem', color: '#6b7280' }}>
                اسکن کنید
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketTemplate; 
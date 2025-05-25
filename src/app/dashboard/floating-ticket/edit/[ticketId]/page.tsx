'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { getFloatingTicketById } from '@/api/floatingTicketApi'

// این کامپوننت فقط به عنوان یک پل برای انتقال اطلاعات به صفحه اصلی بلیط شناور عمل می‌کند
export default function EditFloatingTicket({ params }: { params: { ticketId: string } }) {
  const router = useRouter();
  const { ticketId } = params;

  useEffect(() => {
    const loadTicketData = async () => {
      try {
        const ticketData = await getFloatingTicketById(ticketId);
        
        // ذخیره اطلاعات بلیط در localStorage برای استفاده در صفحه اصلی
        localStorage.setItem('edit_floating_ticket', JSON.stringify({
          id: ticketId,
          data: ticketData,
          timestamp: Date.now() // برای تعیین اینکه داده قدیمی است یا خیر
        }));
        
        // هدایت به صفحه اصلی بلیط شناور
        toast.info('در حال بارگذاری اطلاعات بلیط...', { autoClose: 2000 });
        router.push('/dashboard/floating-ticket');
      } catch (error: any) {
        console.error('Error loading ticket data:', error);
        toast.error(error.response?.data?.message || 'خطا در بارگذاری اطلاعات بلیط');
        
        // در صورت خطا هم به صفحه اصلی بلیط شناور بازگردان
        setTimeout(() => {
          router.push('/dashboard/floating-ticket');
        }, 2000);
      }
    };
    
    loadTicketData();
  }, [ticketId, router]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">در حال بارگذاری اطلاعات بلیط</h1>
        <p className="text-gray-600">لطفاً منتظر بمانید...</p>
      </div>
    </div>
  );
} 
'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast as reactToastify } from 'react-toastify'
import { Toaster } from 'react-hot-toast'
import { FaArrowRight } from 'react-icons/fa'
import TicketTemplate from '../TicketTemplate'

export default function TicketDetail() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);
  
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          reactToastify.error('لطفاً مجدداً وارد شوید');
          router.push('/auth/login');
          return;
        }
        
        // در حالت واقعی، اینجا داده از سرور دریافت می‌شود
        // اما فعلاً از داده‌های محلی استفاده می‌کنیم
        // می‌توانید منطق را برای دریافت داده‌ها از سرور گسترش دهید
        
        //  شب یه‌سازی دریافت داده از سرور
        setTimeout(() => {
          const dummyTicketData = {
            ticketId: params.id,
            passenger: {
              englishFirstName: 'ALI',
              englishLastName: 'FARASAT',
              documentType: 'passport',
              documentNumber: '123456789',
              nationality: 'IRAN'
            },
            flightInfo: {
              origin: 'Tehran',
              destination: 'Istanbul',
              date: '1404/03/31',
              time: '12:30',
              flightNumber: 'TK123',
              aircraft: 'Airbus A320',
              seat: '12A',
              airline: 'Turkish Airlines',
              reservation_number: '8605182'
            },
            airlineInfo: {
              name: 'ترکیش ایرلاینز',
              englishName: 'Turkish Airlines',
              logo: null
            }
          };
          
          setTicketData(dummyTicketData);
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('خطا در دریافت اطلاعات بلیط:', error);
        reactToastify.error('خطا در دریافت اطلاعات بلیط');
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [params.id, router]);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <FaArrowRight />
          بازگشت
        </button>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-8 text-gray-800">
            جزئیات بلیط
          </h1>
          
          {loading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : ticketData ? (
            <div className="flex justify-center">
              <TicketTemplate ticketData={ticketData} />
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">
                بلیط مورد نظر یافت نشد.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
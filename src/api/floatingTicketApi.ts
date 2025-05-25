import axios from 'axios';
import { getAuthHeader } from './authUtils';

const API_URL = 'http://185.94.99.35:5000/api/floating-ticket';

// نوع داده‌های پارامترهای جستجو
interface SearchParams {
  page?: number;
  limit?: number;
  sort?: string;
  origin?: string;
  destination?: string;
  date?: string;
  flightNumber?: string;
  airline?: string;
  passengerName?: string;
  documentNumber?: string;
  dateFrom?: string;
  dateTo?: string;
}

// دریافت لیست بلیط‌های شناور با امکان فیلتر و جستجو
export const getFloatingTicketHistory = async (params: SearchParams = {}) => {
  try {
    const headers = getAuthHeader();
    
    // ساخت پارامترهای URL
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const response = await axios.get(
      `${API_URL}/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching floating ticket history:', error);
    throw error;
  }
};

// دریافت جزئیات یک بلیط شناور
export const getFloatingTicketById = async (ticketId: string) => {
  try {
    const headers = getAuthHeader();
    const response = await axios.get(`${API_URL}/history/${ticketId}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching floating ticket ${ticketId}:`, error);
    throw error;
  }
};

// تولید مجدد یک بلیط شناور
export const regenerateFloatingTicket = async (ticketId: string) => {
  try {
    const headers = getAuthHeader();
    const response = await axios.post(`${API_URL}/regenerate/${ticketId}`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error regenerating floating ticket ${ticketId}:`, error);
    throw error;
  }
};

// ویرایش بلیط شناور
export const updateFloatingTicket = async (ticketId: string, ticketData: any) => {
  try {
    const headers = getAuthHeader();
    const response = await axios.put(`${API_URL}/history/${ticketId}`, ticketData, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error updating floating ticket ${ticketId}:`, error);
    throw error;
  }
};

// حذف بلیط شناور
export const deleteFloatingTicket = async (ticketId: string) => {
  try {
    const headers = getAuthHeader();
    const response = await axios.delete(`${API_URL}/history/${ticketId}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error deleting floating ticket ${ticketId}:`, error);
    throw error;
  }
}; 
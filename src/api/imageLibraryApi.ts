import axios from 'axios';
import { API_BASE_URL } from './config';

export interface ImageItem {
  _id: string;
  name: string;
  path: string;
  filename: string;
  size?: number;
  mimetype?: string;
  category: string;
  tags: string[];
  createdBy?: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
}

// آپلود تصویر جدید به کتابخانه
export const uploadImage = async (formData: FormData) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(`${API_BASE_URL}/image-library`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'خطا در آپلود تصویر');
  }
};

// دریافت لیست تصاویر کتابخانه
export const getImages = async (params?: { category?: string; search?: string }) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.get(`${API_BASE_URL}/image-library`, {
      headers: {
        'x-auth-token': token
      },
      params
    });
    
    return response.data as ImageItem[];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'خطا در دریافت لیست تصاویر');
  }
};

// دریافت اطلاعات یک تصویر
export const getImageById = async (id: string) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.get(`${API_BASE_URL}/image-library/${id}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data as ImageItem;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'خطا در دریافت اطلاعات تصویر');
  }
};

// حذف تصویر
export const deleteImage = async (id: string) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.delete(`${API_BASE_URL}/image-library/${id}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'خطا در حذف تصویر');
  }
};

// ویرایش اطلاعات تصویر
export const updateImageDetails = async (id: string, data: { name?: string; category?: string; tags?: string[] }) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.put(`${API_BASE_URL}/image-library/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'خطا در بروزرسانی اطلاعات تصویر');
  }
}; 
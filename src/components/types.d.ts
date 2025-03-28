declare module '@/components/DashboardLayout' {
  import { ReactNode } from 'react';
  
  interface DashboardLayoutProps {
    children: ReactNode;
  }
  
  const DashboardLayout: React.FC<DashboardLayoutProps>;
  
  export default DashboardLayout;
}

declare module 'react-toastify' {
  export const toast: {
    success(message: string, options?: any): void;
    error(message: string, options?: any): void;
    warning(message: string, options?: any): void;
    info(message: string, options?: any): void;
  };
  
  export const ToastContainer: React.FC<any>;
}

// تایپ‌های مربوط به پکیج سفر
export interface PackageRoom {
  price: number;
  forSale: boolean;
}

export interface PackageRooms {
  single: PackageRoom;
  double: PackageRoom;
  triple: PackageRoom;
  quadruple: PackageRoom;
  quintuple: PackageRoom;
}

export interface MealOptions {
  sobhane: boolean;
  nahar: boolean;
  sham: boolean;
}

export interface HotelStay {
  hotel: string;
  stayDuration: number;
  firstMeal: MealOptions;
  lastMeal: MealOptions;
}

export interface Package {
  _id?: string;
  name: string;
  allAccess: boolean;
  route: string;
  startDate: string;
  endDate: string;
  transportationType: 'zamini' | 'havaii';
  hotels: HotelStay[];
  services: string[];
  rooms: PackageRooms;
  isActive: boolean;
  createdAt?: string;
} 
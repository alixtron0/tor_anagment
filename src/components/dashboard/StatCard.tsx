import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  index: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// تبدیل عدد به فرمت فارسی با جداکننده هزارگان
const formatNumber = (num: number | string) => {
  if (typeof num === 'string') return num;
  return new Intl.NumberFormat('fa-IR').format(num);
};

export default function StatCard({ title, value, icon, color, index, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className={`h-1.5 bg-gradient-to-l ${color}`}></div>
      <div className="p-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-medium text-slate-500 mb-1">{title}</h3>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-slate-800">{formatNumber(value)}</p>
              
              {trend && (
                <span className={`mr-2 text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white text-xl shadow-md`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 
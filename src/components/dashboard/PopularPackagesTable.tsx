import React from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';

interface PopularPackageProps {
  packages: Array<{
    name: string;
    count: number;
  }>;
}

export default function PopularPackagesTable({ packages }: PopularPackageProps) {
  if (!packages || packages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-dark-text-muted">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4">محبوب‌ترین پکیج‌ها</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-right text-dark-text-secondary border-b border-dark-border/50">
              <th className="pb-3 font-medium">رتبه</th>
              <th className="pb-3 font-medium">نام پکیج</th>
              <th className="pb-3 font-medium">تعداد رزرو</th>
              <th className="pb-3 font-medium">محبوبیت</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, index) => (
              <motion.tr 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border-b border-dark-border/30 hover:bg-dark-hover/50 transition-colors"
              >
                <td className="py-3.5">
                  <div className={`
                    h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-amber-500/20 text-amber-400' : 
                      index === 1 ? 'bg-slate-400/20 text-slate-400' : 
                      index === 2 ? 'bg-amber-700/20 text-amber-700' : 
                      'bg-dark-border/20 text-dark-text-muted'}
                  `}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-3.5">{pkg.name}</td>
                <td className="py-3.5">{pkg.count}</td>
                <td className="py-3.5">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        className={`${i < 5 - index || i < 3 ? 'text-amber-400' : 'text-dark-border/30'} text-sm`} 
                      />
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
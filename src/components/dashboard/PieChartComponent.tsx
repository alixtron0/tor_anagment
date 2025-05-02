import React from 'react';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
}

export default function PieChartComponent({ data, title }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-dark-text-muted">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  // محاسبه کل برای درصدها
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // اضافه کردن درصد به داده‌ها
  const enhancedData = data.map(item => ({
    ...item,
    percent: item.value / total
  }));

  // بررسی اگر همه مقادیر صفر هستند
  const allZero = enhancedData.every(item => item.value === 0);

  return (
    <div className="h-full flex flex-col justify-center">
      <h3 className="text-xl font-bold mb-6 text-center">{title}</h3>
      
      <div className="flex flex-col items-center">
        {/* کارت‌های آمار جزئیات */}
        <div className="grid grid-cols-3 gap-6 w-full mb-8">
          {enhancedData.map((entry, index) => (
            <div 
              key={`card-${index}`} 
              className="flex flex-col items-center p-6 rounded-lg bg-dark-secondary/40 border border-dark-border/20 hover:bg-dark-secondary/60 transition-all shadow-lg"
              style={{ borderRight: `4px solid ${entry.color}` }}
            >
              <span className="text-dark-text-muted text-sm mb-2">{entry.name}</span>
              <span className="text-3xl font-bold mb-1">{entry.value}</span>
              <span className="text-dark-text-secondary text-sm mt-2">
                {entry.value > 0 ? `${(entry.percent * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
        
        {allZero ? (
          <div className="flex-grow flex items-center justify-center mt-4">
            <div className="text-center p-8 bg-dark-secondary/20 rounded-xl">
              <p className="text-dark-text-muted">هیچ پکیجی در سیستم وجود ندارد</p>
              <p className="text-dark-text-muted text-sm mt-2">لطفاً پکیج‌های جدید اضافه کنید</p>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center">
            <div className="text-center mt-4 p-4 bg-dark-secondary/20 rounded-xl w-full">
              <p className="text-dark-text-secondary">
                مجموع کل: <span className="font-bold text-lg">{total}</span> پکیج
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
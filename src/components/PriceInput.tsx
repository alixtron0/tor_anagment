import React, { useState, useEffect } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { FaMoneyBillWave } from 'react-icons/fa';

interface PriceInputProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: string;
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}

const PriceInput: React.FC<PriceInputProps> = ({
  label,
  name,
  register,
  error,
  defaultValue = 0,
  value,
  onChange,
  placeholder = 'مبلغ را وارد کنید'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const formatNumber = (value: string | number): string => {
    if (!value) return '';
    
    // تبدیل به رشته و حذف همه کاراکترهای غیر عددی
    const numStr = value.toString().replace(/[^\d]/g, '');
    
    // تبدیل به عدد و فرمت‌بندی با کاما
    const num = parseInt(numStr);
    if (isNaN(num)) return '';
    
    return num.toLocaleString('en-US');
  };
  
  const [displayValue, setDisplayValue] = useState<string>(formatNumber(value !== undefined ? value : defaultValue));

  // به‌روزرسانی displayValue هنگام تغییر value از خارج
  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatNumber(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // حذف همه کاراکترهای غیر عددی و کاما
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const numericValue = parseInt(rawValue) || 0;
    
    setDisplayValue(formatNumber(numericValue));
    
    if (onChange) {
      onChange(numericValue);
    }
    
    // به‌روزرسانی مقدار نمایشی با فرمت جدید
    e.target.value = formatNumber(numericValue);
    return numericValue;
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="block font-medium text-gray-700">{label}</label>
      <div className="relative group">
        <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none transition-colors ${isFocused ? 'text-primary' : 'text-gray-400'}`}>
          <FaMoneyBillWave className="w-5 h-5" />
        </div>
        <input
          type="text"
          inputMode="numeric"
          {...register(name, {
            setValueAs: (value: string | number) => {
              if (typeof value === 'number') return value;
              return parseInt(value.replace(/[^\d]/g, '')) || 0;
            }
          })}
          value={displayValue}
          onChange={(e) => handleChange(e)}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-4 pr-10 py-3 border rounded-lg transition-all bg-white text-gray-900 text-left dir-ltr
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 
            'border-gray-200 focus:border-primary focus:ring-primary/20'}
            focus:outline-none focus:ring-4 hover:border-gray-300`}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default PriceInput; 
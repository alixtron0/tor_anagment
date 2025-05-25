import { useState, useEffect } from 'react';
import { UseFormRegister } from 'react-hook-form';
import axios from 'axios';
import { FaPlane } from 'react-icons/fa';

interface Airline {
  _id: string;
  name: string;
  code: string;
  logo?: string;
}

interface AirlineSelectProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onAirlineChange?: (airlineId: string) => void;
}

export default function AirlineSelect({
  label,
  name,
  register,
  error,
  defaultValue,
  onChange,
  onAirlineChange
}: AirlineSelectProps) {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue || '');

  useEffect(() => {
    console.log(`AirlineSelect - Default Value for ${label}:`, defaultValue);
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue, label]);

  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://185.94.99.35:5000/api/airlines', {
          headers: {
            'x-auth-token': token
          }
        });
        setAirlines(response.data);
        
        if (defaultValue) {
          const selectedAirline = response.data.find((airline: Airline) => airline._id === defaultValue);
          console.log(`Selected airline for ${label}:`, selectedAirline ? selectedAirline.name : 'Not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('خطا در دریافت لیست ایرلاین‌ها:', error);
        setLoading(false);
      }
    };

    fetchAirlines();
  }, [defaultValue, label]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedValue(value);
    if (onChange) onChange(value);
    if (onAirlineChange) onAirlineChange(value);
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium text-gray-700">{label}</label>
      <div className="relative">
        <select
          {...register(name)}
          onChange={handleChange}
          value={selectedValue}
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none bg-white text-gray-900"
          disabled={loading}
        >
          <option value="">انتخاب ایرلاین</option>
          {airlines.map((airline) => (
            <option 
              key={airline._id} 
              value={airline._id}
              selected={airline._id === selectedValue}
            >
              {airline.name} ({airline.code})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FaPlane className="text-primary" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
} 
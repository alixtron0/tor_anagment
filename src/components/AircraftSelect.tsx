import { useState, useEffect } from 'react';
import { UseFormRegister } from 'react-hook-form';
import axios from 'axios';
import { FaPlaneDeparture } from 'react-icons/fa';

interface Aircraft {
  _id: string;
  model: string;
  manufacturer: string;
  capacity: {
    economy: number;
    business?: number;
    first?: number;
  };
}

interface AircraftSelectProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  airlineId?: string;
  error?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export default function AircraftSelect({
  label,
  name,
  register,
  airlineId,
  error,
  defaultValue,
  onChange
}: AircraftSelectProps) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAircraft = async () => {
      if (!airlineId) {
        setAircraft([]);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://185.94.99.35:5000/api/aircrafts/airline/${airlineId}`, {
          headers: {
            'x-auth-token': token
          }
        });
        setAircraft(response.data);
        setLoading(false);
      } catch (error) {
        console.error('خطا در دریافت لیست هواپیماها:', error);
        setLoading(false);
      }
    };

    fetchAircraft();
  }, [airlineId]);

  if (!airlineId) return null;

  return (
    <div className="space-y-2">
      <label className="block font-medium text-gray-700">{label}</label>
      <div className="relative">
        <select
          {...register(name)}
          onChange={(e) => onChange?.(e.target.value)}
          defaultValue={defaultValue}
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none bg-white text-gray-900"
          disabled={loading}
        >
          <option value="">انتخاب هواپیما</option>
          {aircraft.map((plane) => (
            <option key={plane._id} value={plane._id}>
              {plane.manufacturer} {plane.model} (ظرفیت: {plane.capacity.economy})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FaPlaneDeparture className="text-primary" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
} 
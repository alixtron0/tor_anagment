import { UseFormRegister } from 'react-hook-form';
import { FaCheck } from 'react-icons/fa';

interface CustomCheckboxProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export default function CustomCheckbox({
  label,
  name,
  register,
  checked,
  onChange,
  className = ''
}: CustomCheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer group ${className}`} style={{ '--input-focus': '#2d8cf0', '--input-out-of-focus': '#ccc', '--bg-color': '#fff', '--bg-color-alt': '#666', '--main-color': '#323232' } as React.CSSProperties}>
      <div className="relative">
        <input
          type="checkbox"
          {...register(name)}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="absolute opacity-0 w-8 h-8 cursor-pointer"
        />
        <div className="w-8 h-8 relative bg-[var(--input-out-of-focus)] border-2 border-[var(--main-color)] rounded-md shadow-[4px_4px_var(--main-color)] transition-all duration-300 peer-checked:bg-[var(--input-focus)]">
          <div className="absolute top-[2px] left-[8px] w-[7px] h-[15px] border-r-[2.5px] border-b-[2.5px] border-[var(--bg-color)] rotate-45 scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
        </div>
      </div>
      <span className="select-none text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
  );
} 
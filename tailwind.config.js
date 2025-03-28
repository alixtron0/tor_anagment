/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ['var(--font-primary)', 'Cairo', 'sans-serif'],
      },
      colors: {
        primary: '#1E40AF', // آبی تیره
        secondary: '#3B82F6', // آبی روشن
        neutral: '#F3F4F6', // خاکستری روشن
        accent: '#F59E0B', // نارنجی طلایی
        success: '#10B981', // سبز
        error: '#EF4444', // قرمز
        'text-primary': '#1F2937', // خاکستری تیره
        'text-secondary': '#6B7280', // خاکستری متوسط
        dark: {
          primary: '#2D3748', // تیره برای پس‌زمینه - بسیار روشن‌تر شده
          secondary: '#3A4C66', // تیره‌تر برای کارت‌ها - بسیار روشن‌تر شده
          accent: '#5A6B81', // برای عناصر متمایز - بسیار روشن‌تر شده
          hover: '#4B5C74', // برای حالت هاور در تم تیره - بسیار روشن‌تر شده
          active: '#6A7E99', // برای حالت اکتیو در تم تیره - بسیار روشن‌تر شده
          border: '#6A7E99', // برای خطوط مرزی در تم تیره - بسیار روشن‌تر شده
          text: {
            primary: '#FFFFFF', // متن اصلی در تم تیره
            secondary: '#E2E8F0', // متن ثانویه در تم تیره
            muted: '#A0AEC0', // متن کمرنگ در تم تیره
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-in-out',
        'slide-left': 'slideLeft 0.3s ease-in-out',
        'slide-right': 'slideRight 0.3s ease-in-out',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSlow: {
          '0%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
          '100%': { opacity: '0.4', transform: 'scale(1)' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      boxShadow: {
        'nav': '0 4px 12px 0 rgba(0, 0, 0, 0.25)',
        'card': '0 4px 8px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        'elevated': '0 10px 20px 0 rgba(0, 0, 0, 0.12), 0 4px 8px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}; 
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  color: string;
}

// کامپوننت tooltip سفارشی
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-primary/90 backdrop-blur-md p-3 rounded-lg border border-dark-border/50 shadow-lg">
        <p className="text-dark-text-primary font-bold text-base mb-1">{label}</p>
        <p className="text-dark-text-primary">
          <span className="font-medium">تعداد پکیج:</span> {payload[0].value}
        </p>
      </div>
    );
  }

  return null;
};

// برچسب سفارشی برای میله‌ها
const renderCustomizedLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  return (
    <text 
      x={x + width + 5} 
      y={y + height / 2} 
      fill="#fff" 
      textAnchor="start" 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {value}
    </text>
  );
};

export default function BarChartComponent({ data, title, color }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-dark-text-muted">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  // مرتب‌سازی داده‌ها براساس مقدار (نزولی)
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // ایجاد آرایه‌ای از رنگ‌های گرادیانت بر اساس رنگ اصلی
  const generateGradientColors = (baseColor: string, count: number) => {
    // تبدیل رنگ هگز به HSL برای کار راحت‌تر با رنگ
    const hexToHSL = (hex: string) => {
      // حذف # از ابتدای رنگ اگر وجود داشته باشد
      hex = hex.replace('#', '');
      
      // تبدیل رنگ هگز به RGB
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
      }
      
      return [h * 360, s * 100, l * 100];
    };
    
    // تبدیل HSL به هگز
    const hslToHex = (h: number, s: number, l: number) => {
      h /= 360;
      s /= 100;
      l /= 100;
      
      let r, g, b;
      
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      
      const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };
    
    // ایجاد رنگ‌های گرادیانت
    const [h, s, l] = hexToHSL(baseColor);
    const colors = [];
    
    for (let i = 0; i < count; i++) {
      // کاهش ا شب اع و روشنایی برای هر میله با ا شب اع و روشنایی کمتر
      const newS = Math.max(s - (i * 5), s - 30);
      const newL = Math.min(l + (i * 3), l + 15);
      colors.push(hslToHex(h, newS, newL));
    }
    
    return colors;
  };
  
  const colors = generateGradientColors(color, sortedData.length);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-center">{title}</h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={sortedData}
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 5,
            }}
            barSize={26}
            className="rtl"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
            <XAxis 
              type="number" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#aaa', fontSize: 12 }}
              tickFormatter={(value) => value === 0 ? '' : value.toString()}
              reversed // برای RTL کردن محور X
              orientation="top"
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={90}
              style={{ fill: 'white', fontSize: '0.75rem' }}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#fff',
                fontSize: 12,
                fontWeight: 'medium',
                textAnchor: 'end',
              }}
              mirror
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 4, 4]}
              animationDuration={1500}
              animationEasing="ease-in-out"
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                style={{ fill: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}
                content={renderCustomizedLabel}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
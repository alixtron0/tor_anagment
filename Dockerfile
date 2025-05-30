# Dockerfile برای فرانت‌اند Next.js
FROM node:20-alpine AS base

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی فایل‌های package.json و package-lock.json
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm ci

# کپی تمام فایل‌های پروژه
COPY . .

# حذف پوشه server برای کاهش حجم ایمیج (چون سرور در داکر جداگانه اجرا می‌شود)
RUN rm -rf server

# ساخت پروژه
RUN npm run build

# مرحله اجرا
FROM node:20-alpine AS runner
WORKDIR /app

# متغیرهای محیطی
ENV NODE_ENV production
ENV NEXT_PUBLIC_API_URL=http://server:5000/api

# کپی فایل‌های ساخته شده از مرحله قبل
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# اجرای برنامه
CMD ["npm", "start"]

# پورت مورد استفاده
EXPOSE 3000

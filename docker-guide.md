# راهنمای استفاده از داکر برای پروژه مدیریت تور

## پیش‌نیازها

برای اجرای این پروژه با داکر، نیاز به نصب موارد زیر در سرور اوبونتو دارید:

1. **نصب Docker**:
   ```bash
   sudo apt update
   sudo apt install apt-transport-https ca-certificates curl software-properties-common
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
   sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
   sudo apt update
   sudo apt install docker-ce
   ```

2. **نصب Docker Compose**:
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **اضافه کردن کاربر به گروه داکر** (برای اجرای داکر بدون نیاز به sudo):
   ```bash
   sudo usermod -aG docker $USER
   ```
   سپس سیستم را ریستارت کنید یا خارج و دوباره وارد شوید.

## نحوه اجرای پروژه با داکر

1. **انتقال پروژه به سرور اوبونتو**:
   - با استفاده از ابزارهایی مانند `scp`، `rsync` یا `git clone` پروژه را به سرور اوبونتو منتقل کنید.

2. **ساخت و اجرای کانتینرها**:
   ```bash
   cd /path/to/tor_anagment
   docker-compose up -d
   ```
   پارامتر `-d` باعث می‌شود کانتینرها در پس‌زمینه اجرا شوند.

3. **بررسی وضعیت کانتینرها**:
   ```bash
   docker-compose ps
   ```

4. **مشاهده لاگ‌ها**:
   ```bash
   # مشاهده لاگ همه سرویس‌ها
   docker-compose logs
   
   # مشاهده لاگ یک سرویس خاص
   docker-compose logs frontend
   docker-compose logs server
   docker-compose logs mongodb
   
   # مشاهده لاگ‌ها به صورت زنده
   docker-compose logs -f
   ```

5. **توقف کانتینرها**:
   ```bash
   docker-compose down
   ```

## نکات مهم

1. **تنظیمات دیتابیس**:
   - در حالت داکر، آدرس دیتابیس MongoDB به `mongodb:27017` تغییر کرده است.
   - داده‌های دیتابیس در یک volume ذخیره می‌شوند و با توقف کانتینرها از بین نمی‌روند.

2. **آپلود فایل‌ها**:
   - پوشه `uploads` به عنوان یک volume به کانتینر سرور متصل شده است و فایل‌های آپلود شده حفظ می‌شوند.

3. **دسترسی به برنامه**:
   - فرانت‌اند: `http://your-server-ip:3000`
   - سرور API: `http://your-server-ip:5000`

4. **بک‌آپ گیری از دیتابیس**:
   ```bash
   # ایجاد بک‌آپ
   docker exec -it tor_anagment_mongodb_1 mongodump --out /data/backup
   
   # انتقال بک‌آپ به سیستم میزبان
   docker cp tor_anagment_mongodb_1:/data/backup ./mongodb-backup
   ```

5. **بازیابی دیتابیس**:
   ```bash
   # انتقال فایل‌های بک‌آپ به کانتینر
   docker cp ./mongodb-backup tor_anagment_mongodb_1:/data/backup
   
   # بازیابی دیتابیس
   docker exec -it tor_anagment_mongodb_1 mongorestore /data/backup
   ```

## عیب‌یابی

1. **مشکل در اتصال به دیتابیس**:
   - اطمینان حاصل کنید که سرویس MongoDB به درستی اجرا شده است.
   - متغیر محیطی `MONGODB_URI` در سرویس سرور را بررسی کنید.

2. **مشکل در اتصال فرانت‌اند به سرور**:
   - متغیر محیطی `NEXT_PUBLIC_API_URL` در سرویس فرانت‌اند را بررسی کنید.
   - مطمئن شوید که سرویس سرور به درستی اجرا شده است.

3. **مشکل در آپلود فایل‌ها**:
   - دسترسی‌های پوشه `uploads` را بررسی کنید.
   - مطمئن شوید که volume به درستی به کانتینر متصل شده است.

4. **بازسازی ایمیج‌ها**:
   اگر تغییراتی در کد ایجاد کرده‌اید و می‌خواهید ایمیج‌ها را دوباره بسازید:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

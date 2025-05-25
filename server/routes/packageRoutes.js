const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Package = require('../models/Package');
const Hotel = require('../models/Hotel');
const Route = require('../models/Route');
const Airline = require('../models/Airline');
const Reservation = require('../models/Reservation');
const Passenger = require('../models/Passenger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts, PDFName } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const exceljs = require('exceljs');
const Room = require('../models/Room');

/**
 * @route   GET /api/packages
 * @desc    دریافت تمام پکیج‌ها
 * @access  خصوصی
 */
router.get('/', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    // فیلتر بر اساس نقش کاربر
    let filter = {};
    
    // اگر کاربر ادمین+ باشد، فقط پکیج‌های عمومی را ببیند
    if (req.user.role === 'admin+') {
      filter = { isPublic: true };
      console.log('کاربر با نقش admin+ فقط پکیج‌های عمومی را می‌بیند');
    } else {
      console.log(`کاربر با نقش ${req.user.role} همه پکیج‌ها را می‌بیند`);
    }

    // دریافت پکیج‌ها با مدیریت خطا
    const packages = await Package.find(filter)
      .populate({
        path: 'route',
        select: 'origin destination',
        model: 'Route'
      })
      .populate({
        path: 'hotels.hotel',
        select: 'name city country',
        model: 'Hotel'
      })
      .populate({
        path: 'createdBy.user',
        select: 'fullName role',
        model: 'User'
      })
      .sort({ createdAt: -1 });
    
    res.json(packages);
  } catch (err) {
    console.error('خطا در دریافت پکیج‌ها:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت پکیج‌ها: ${err.message}` });
  }
});

/**
 * @route   GET /api/packages/:id
 * @desc    دریافت یک پکیج با شناسه
 * @access  خصوصی
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    const package = await Package.findById(req.params.id)
      .populate({
        path: 'route',
        select: 'origin destination',
        model: 'Route'
      })
      .populate({
        path: 'hotels.hotel',
        select: 'name city country',
        model: 'Hotel'
      })
      .populate({
        path: 'createdBy.user',
        select: 'fullName role',
        model: 'User'
      })
      .populate({
        path: 'transportation.departureAirline',
        model: 'airline'
      })
      .populate({
        path: 'transportation.returnAirline',
        model: 'airline'
      });
    
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    
    // بررسی دسترسی برای پکیج‌های خصوصی
    if (package.isPublic === false && req.user.role === 'admin+') {
      console.log(`کاربر با نقش ${req.user.role} تلاش کرد به پکیج خصوصی با شناسه ${req.params.id} دسترسی پیدا کند`);
      return res.status(403).json({ message: 'شما اجازه دسترسی به این پکیج خصوصی را ندارید' });
    }
    
    res.json(package);
  } catch (err) {
    console.error('خطا در دریافت پکیج:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در دریافت پکیج: ${err.message}` });
  }
});

/**
 * @route   GET /api/packages/:id/hotel-report
 * @desc    دریافت گزارش هتل پکیج به صورت اکسل
 * @access  خصوصی
 */
router.get('/:id/hotel-report', auth, async (req, res) => {
  try {
    // بررسی وجود پکیج
    const package = await Package.findById(req.params.id)
      .populate({
        path: 'route',
        select: 'origin destination',
        model: 'Route'
      })
      .populate({
        path: 'hotels.hotel',
        select: 'name city country',
        model: 'Hotel'
      });
    
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    
    // دریافت تمام رزروهای این پکیج
    const reservations = await Reservation.find({ package: req.params.id });
      
    if (!reservations || reservations.length === 0) {
      return res.status(404).json({ message: 'هیچ رزروی برای این پکیج یافت نشد' });
    }
    
    // بازیابی همه اتاق‌های مرتبط با رزروها
    const reservationIds = reservations.map(r => r._id);
    const rooms = await Room.find({ reservation: { $in: reservationIds } });
    
    // بازیابی همه مسافران مرتبط با اتاق‌ها
    const roomIds = rooms.map(room => room._id);
    const passengers = await Passenger.find({ room: { $in: roomIds } })
      .populate('room')
      .populate('reservation');
    
    // گروه‌بندی مسافران براساس نوع اتاق
    const roomTypeGroups = {};
    
    // اضافه کردن مسافران به گروه‌های اتاق
    passengers.forEach(passenger => {
      if (!passenger.room) return;
      
      const roomType = passenger.room.type;
      if (!roomTypeGroups[roomType]) {
        roomTypeGroups[roomType] = [];
      }
      
      roomTypeGroups[roomType].push({
        firstName: passenger.firstName || '',
        lastName: passenger.lastName || '',
        nationalCode: passenger.nationalId || '',
        roomNumber: passenger.room.notes || 'تعیین نشده',
        services: passenger.notes || '',
        gender: passenger.gender || '',
        ageCategory: passenger.ageCategory || ''
      });
    });
    
    // ترجمه نوع اتاق
    const roomTypeTranslation = {
      'single': 'یک تخته',
      'double': 'دو تخته',
      'triple': 'سه تخته',
      'quadruple': 'چهار تخته',
      'quintuple': 'پنج تخته',
      'family': 'خانوادگی',
      'vip': 'ویژه',
      'shared': 'اشتراکی'
    };
    
    // ایجاد فایل اکسل
    const workbook = new exceljs.Workbook();
    workbook.creator = 'سیستم مدیریت تور';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    
    // افزودن شیت
    const worksheet = workbook.addWorksheet('گزارش هتل', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.7,
          right: 0.7,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        }
      },
      headerFooter: {
        oddHeader: 'گزارش هتل پکیج',
        oddFooter: 'صفحه &P از &N'
      },
      properties: {tabColor: {argb: '4F81BD'}}
    });
    
    // تنظیم جهت راست به چپ
    worksheet.views = [{ rightToLeft: true }];
    
    // تنظیم ستون‌ها
    worksheet.columns = [
      { header: 'ردیف', key: 'index', width: 7, style: { numFmt: '@', alignment: { horizontal: 'center' } } },
      { header: 'نام', key: 'firstName', width: 15 },
      { header: 'نام خانوادگی', key: 'lastName', width: 20 },
      { header: 'کد ملی', key: 'nationalCode', width: 15, style: { numFmt: '@', alignment: { horizontal: 'center' } } },
      { header: 'جنسیت', key: 'gender', width: 10 },
      { header: 'رده سنی', key: 'ageCategory', width: 10 },
      { header: 'شماره اتاق', key: 'roomNumber', width: 12 },
      { header: 'خدمات', key: 'services', width: 30 }
    ];
    
    // ---- بخش عنوان و اطلاعات پکیج ----
    // عنوان اصلی
    worksheet.mergeCells('A1:H2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `گزارش مسافران هتل - ${package.name}`;
    titleCell.font = {
      name: 'B Nazanin',
      size: 18,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    titleCell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    titleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // تاریخ سفر
    worksheet.mergeCells('A3:B3');
    worksheet.getCell('A3').value = 'تاریخ رفت:';
    worksheet.getCell('A3').font = { bold: true, name: 'B Nazanin', size: 12 };
    worksheet.getCell('A3').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DAEEF3' } };
    
    worksheet.mergeCells('C3:D3');
    worksheet.getCell('C3').value = formatPersianDate(package.startDate);
    worksheet.getCell('C3').font = { name: 'B Nazanin', size: 12 };
    worksheet.getCell('C3').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('C3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DAEEF3' } };
    
    // تاریخ برگشت
    worksheet.mergeCells('E3:F3');
    worksheet.getCell('E3').value = 'تاریخ برگشت:';
    worksheet.getCell('E3').font = { bold: true, name: 'B Nazanin', size: 12 };
    worksheet.getCell('E3').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('E3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DAEEF3' } };
    
    worksheet.mergeCells('G3:H3');
    worksheet.getCell('G3').value = formatPersianDate(package.endDate);
    worksheet.getCell('G3').font = { name: 'B Nazanin', size: 12 };
    worksheet.getCell('G3').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('G3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DAEEF3' } };
    
    // مسیر سفر
    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'مسیر:';
    worksheet.getCell('A4').font = { bold: true, name: 'B Nazanin', size: 12 };
    worksheet.getCell('A4').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5F0FA' } };
    
    worksheet.mergeCells('C4:H4');
    worksheet.getCell('C4').value = `${package.route.origin} به ${package.route.destination}`;
    worksheet.getCell('C4').font = { name: 'B Nazanin', size: 12 };
    worksheet.getCell('C4').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('C4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5F0FA' } };
    
    // هتل‌ها
    if (package.hotels && package.hotels.length > 0) {
      worksheet.mergeCells('A5:B5');
      worksheet.getCell('A5').value = 'هتل‌ها:';
      worksheet.getCell('A5').font = { bold: true, name: 'B Nazanin', size: 12 };
      worksheet.getCell('A5').alignment = { horizontal: 'right', vertical: 'middle' };
      worksheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DAEEF3' } };
      
      worksheet.mergeCells('C5:H5');
      const hotelNames = package.hotels.map(h => {
        if (typeof h.hotel === 'object' && h.hotel !== null && 'name' in h.hotel) {
          return h.hotel.name + (h.stayDuration ? ` (${h.stayDuration}  شب )` : '');
        }
        return 'نامشخص';
      }).join(' / ');
      
      worksheet.getCell('C5').value = hotelNames;
      worksheet.getCell('C5').font = { name: 'B Nazanin', size: 12 };
      worksheet.getCell('C5').alignment = { horizontal: 'right', vertical: 'middle' };
      worksheet.getCell('C5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DAEEF3' } };
    }
    
    // تعداد مسافران
    const totalPassengers = Object.values(roomTypeGroups).flat().length;
    
    worksheet.mergeCells('A6:B6');
    worksheet.getCell('A6').value = 'تعداد کل مسافران:';
    worksheet.getCell('A6').font = { bold: true, name: 'B Nazanin', size: 12 };
    worksheet.getCell('A6').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5F0FA' } };
    
    worksheet.mergeCells('C6:D6');
    worksheet.getCell('C6').value = totalPassengers + ' نفر';
    worksheet.getCell('C6').font = { name: 'B Nazanin', size: 12 };
    worksheet.getCell('C6').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('C6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5F0FA' } };
    
    // تاریخ گزارش
    worksheet.mergeCells('E6:F6');
    worksheet.getCell('E6').value = 'تاریخ گزارش:';
    worksheet.getCell('E6').font = { bold: true, name: 'B Nazanin', size: 12 };
    worksheet.getCell('E6').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('E6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5F0FA' } };
    
    worksheet.mergeCells('G6:H6');
    const today = new Date();
    // استفاده از jalali-moment برای تبدیل تاریخ امروز به شمسی
    const moment = require('jalali-moment');
    const todayJalali = moment().locale('fa').format('jYYYY/jMM/jDD');
    worksheet.getCell('G6').value = todayJalali;
    worksheet.getCell('G6').font = { name: 'B Nazanin', size: 12 };
    worksheet.getCell('G6').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('G6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5F0FA' } };
    
    // اضافه کردن فضای خالی
    worksheet.addRow([]);
    
    // هدر جدول اصلی
    const headerRow = worksheet.addRow(['ردیف', 'نام', 'نام خانوادگی', 'کد ملی', 'جنسیت', 'رده سنی', 'شماره اتاق', 'خدمات']);
    headerRow.height = 25;
    
    // قالب‌بندی هدر جدول
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        name: 'B Nazanin',
        size: 12,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F81BD' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // ترجمه رده سنی و جنسیت
    const ageCategoryTranslation = {
      'adult': 'بزرگسال',
      'child': 'کودک',
      'infant': 'نوزاد'
    };
    
    const genderTranslation = {
      'male': 'مرد',
      'female': 'زن'
    };
    
    // افزودن داده‌ها به اکسل - گروه‌بندی بر اساس نوع اتاق
    let rowIndex = 9; // شروع از سطر 9 بعد از هدر جدول
    let passengerIndex = 1; // شماره ردیف مسافران از 1 شروع می‌شود
    
    // رنگ‌های متناوب برای تیتر انواع اتاق
    const roomTypeColors = [
      { header: 'D5E3F0', row: 'E5F0FA' }, // آبی روشن
      { header: 'E5E0EC', row: 'F2EFF5' }, // بنفش روشن
      { header: 'FDEADA', row: 'FDF2E9' }, // نارنجی روشن
      { header: 'E2EFDA', row: 'EBF5E4' }, // سبز روشن
      { header: 'FFF2CC', row: 'FFF9E6' }  // زرد روشن
    ];
    
    let colorIndex = 0;
    
    // برای هر نوع اتاق
    const roomTypesToDisplay = ['single', 'double', 'triple', 'quadruple', 'quintuple', 'family', 'vip', 'shared'];
    
    roomTypesToDisplay.forEach(roomType => {
      if (roomTypeGroups[roomType] && roomTypeGroups[roomType].length > 0) {
        const currentColor = roomTypeColors[colorIndex % roomTypeColors.length];
        colorIndex++;
        
        // عنوان نوع اتاق
        worksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
        const roomTitleCell = worksheet.getCell(`A${rowIndex}`);
        roomTitleCell.value = `نوع تخت: ${roomTypeTranslation[roomType] || roomType}`;
        roomTitleCell.font = {
          bold: true,
          size: 14,
          name: 'B Nazanin',
          color: { argb: '000000' }
        };
        roomTitleCell.alignment = {
          horizontal: 'right',
          vertical: 'middle'
        };
        roomTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: currentColor.header }
        };
        roomTitleCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        worksheet.getRow(rowIndex).height = 25;
        rowIndex++;
        
        // اضافه کردن مسافران هر اتاق
        roomTypeGroups[roomType].forEach((passenger, index) => {
          const genderValue = genderTranslation[passenger.gender] || passenger.gender || '';
          const ageCategoryValue = ageCategoryTranslation[passenger.ageCategory] || passenger.ageCategory || '';
          
          const dataRow = worksheet.addRow([
            passengerIndex,
            passenger.firstName,
            passenger.lastName,
            passenger.nationalCode,
            genderValue,
            ageCategoryValue,
            passenger.roomNumber,
            passenger.services
          ]);
          
          passengerIndex++; // افزایش شماره ردیف برای مسافر بعدی
          
          // قالب‌بندی سطر داده
          dataRow.height = 22;
          dataRow.eachCell((cell, colNumber) => {
            cell.font = {
              name: 'B Nazanin',
              size: 11
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // تنظیم حالت متن
            if (colNumber === 1) { // ردیف
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (colNumber === 4) { // کد ملی
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              // تنظیم قالب متنی برای کد ملی تا صفرهای ابتدایی حفظ شوند
              cell.numFmt = '@';
            } else if (colNumber === 5 || colNumber === 6) { // جنسیت و رده سنی
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (colNumber === 7) { // شماره اتاق
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else {
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            
            // رنگ زمینه متناوب برای سطرها
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: (index % 2 === 0) ? currentColor.row : 'FFFFFF' }
            };
          });
          
          rowIndex++;
        });
        
        // اضافه کردن یک سطر خالی بین گروه‌ها
        const emptyRow = worksheet.addRow([]);
        emptyRow.height = 10;
        rowIndex++;
      }
    });
    
    // اضافه کردن توضیحات پایین صفحه
    const footerRow = rowIndex + 1;
    worksheet.mergeCells(`A${footerRow}:H${footerRow}`);
    worksheet.getCell(`A${footerRow}`).value = 'این گزارش توسط سیستم مدیریت تور به صورت خودکار تولید شده است.';
    worksheet.getCell(`A${footerRow}`).font = { italic: true, name: 'B Nazanin', size: 10, color: { argb: '666666' } };
    worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // تنظیم پاسخ HTTP
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="hotel-report-${package.name.replace(/\s+/g, '-')}.xlsx"`);
    
    // ارسال فایل
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error('خطا در ایجاد گزارش هتل:', err.message);
    res.status(500).json({ message: `خطای سرور در ایجاد گزارش هتل: ${err.message}` });
  }
});

// تنظیمات multer برای آپلود تصویر
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/packages';
    // ایجاد دایرکتوری اگر وجود نداشته باشد
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('فقط فایل‌های تصویری (JPG، PNG) مجاز هستند'));
  }
});

// مسیر آپلود تصویر
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'لطفاً یک تصویر انتخاب کنید'
      });
    }

    res.json({
      status: 'success',
      path: req.file.path
    });
  } catch (error) {
    console.error('خطا در آپلود تصویر:', error);
    res.status(500).json({
      status: 'error',
      message: 'خطا در آپلود تصویر'
    });
  }
});

/**
 * @route   POST /api/packages
 * @desc    ایجاد پکیج جدید
 * @access  خصوصی
 */
router.post('/', [
  auth,
  check('name', 'وارد کردن نام پکیج الزامی است').not().isEmpty(),
  check('route', 'انتخاب مسیر الزامی است').not().isEmpty(),
  check('startDate', 'تاریخ شروع الزامی است').not().isEmpty(),
  check('endDate', 'تاریخ پایان الزامی است').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    const {
      name,
      isPublic,
      allAccess,
      route,
      startDate,
      startTime,
      endDate,
      endTime,
      transportation,
      basePrice,
      infantPrice,
      servicesFee,
      capacity,
      hotels,
      services,
      rooms,
      image,
      isActive
    } = req.body;

    // بررسی وجود مسیر
    const routeExists = await Route.findById(route);
    if (!routeExists) {
      return res.status(404).json({ message: 'مسیر انتخابی یافت نشد' });
    }

    // بررسی وجود هتل‌ها
    if (hotels && hotels.length > 0) {
      for (const hotelItem of hotels) {
        const hotelExists = await Hotel.findById(hotelItem.hotel);
        if (!hotelExists) {
          return res.status(404).json({ message: `هتل با شناسه ${hotelItem.hotel} یافت نشد` });
        }
      }
    }

    // ایجاد پکیج جدید
    const newPackage = new Package({
      name,
      isPublic: isPublic !== undefined ? isPublic : true,
      allAccess: allAccess !== undefined ? allAccess : true,
      route,
      startDate,
      startTime,
      endDate,
      endTime,
      transportation,
      basePrice: basePrice || 0,
      infantPrice: infantPrice || 0,
      servicesFee: servicesFee || 0,
      capacity: capacity || 0,
      hotels: hotels || [],
      services: services || [],
      rooms,
      image,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: {
        user: req.user._id,
        fullName: req.user.fullName
      }
    });

    const savedPackage = await newPackage.save();
    
    res.status(201).json({
      message: 'پکیج با موفقیت ایجاد شد',
      package: savedPackage
    });
  } catch (err) {
    console.error('خطا در ایجاد پکیج:', err);
    res.status(500).json({ message: `خطای سرور در ایجاد پکیج: ${err.message}` });
  }
});

/**
 * @route   PUT /api/packages/:id
 * @desc    به‌روزرسانی پکیج
 * @access  خصوصی
 */
router.put('/:id', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package || !Route || !Hotel) {
      console.error('مدل‌های مورد نیاز یافت نشدند');
      return res.status(500).json({ message: 'خطای سرور: مدل‌های مورد نیاز یافت نشدند' });
    }

    const {
      name,
      isPublic,
      allAccess,
      route,
      startDate,
      startTime,
      endDate,
      endTime,
      transportation,
      basePrice,
      infantPrice,
      servicesFee,
      capacity,
      hotels,
      services,
      rooms,
      image,
      isActive
    } = req.body;

    // بررسی وجود پکیج
    let package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }

    // بررسی وجود مسیر
    if (route) {
      const routeExists = await Route.findById(route);
      if (!routeExists) {
        return res.status(404).json({ message: 'مسیر انتخابی یافت نشد' });
      }
    }

    // بررسی وجود هتل‌ها
    if (hotels && hotels.length > 0) {
      for (const hotelItem of hotels) {
        const hotelExists = await Hotel.findById(hotelItem.hotel);
        if (!hotelExists) {
          return res.status(404).json({ message: `هتل با شناسه ${hotelItem.hotel} یافت نشد` });
        }
      }
    }

    // به‌روزرسانی فیلدها
    const packageFields = {
      name: name || package.name,
      isPublic: isPublic !== undefined ? isPublic : package.isPublic,
      allAccess: allAccess !== undefined ? allAccess : package.allAccess,
      route: route || package.route,
      startDate: startDate || package.startDate,
      startTime: startTime || package.startTime,
      endDate: endDate || package.endDate,
      endTime: endTime || package.endTime,
      transportation: transportation || package.transportation,
      basePrice: basePrice !== undefined ? basePrice : package.basePrice,
      infantPrice: infantPrice !== undefined ? infantPrice : package.infantPrice,
      servicesFee: servicesFee !== undefined ? servicesFee : package.servicesFee,
      capacity: capacity !== undefined ? capacity : package.capacity,
      hotels: hotels || package.hotels,
      services: services || package.services,
      rooms: rooms || package.rooms,
      image: image || package.image,
      isActive: isActive !== undefined ? isActive : package.isActive
    };

    // به‌روزرسانی پکیج
    package = await Package.findByIdAndUpdate(
      req.params.id,
      { $set: packageFields },
      { new: true }
    );

    res.json({
      message: 'پکیج با موفقیت به‌روزرسانی شد',
      package
    });
  } catch (err) {
    console.error('خطا در به‌روزرسانی پکیج:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در به‌روزرسانی پکیج: ${err.message}` });
  }
});

/**
 * @route   DELETE /api/packages/:id
 * @desc    حذف پکیج
 * @access  خصوصی
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package) {
      console.error('مدل Package یافت نشد');
      return res.status(500).json({ message: 'خطای سرور: مدل Package یافت نشد' });
    }

    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }

    await Package.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'پکیج با موفقیت حذف شد' });
  } catch (err) {
    console.error('خطا در حذف پکیج:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در حذف پکیج: ${err.message}` });
  }
});

/**
 * @route   PATCH /api/packages/:id/toggle-status
 * @desc    تغییر وضعیت فعال/غیرفعال پکیج
 * @access  خصوصی
 */
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    // بررسی وجود مدل‌ها
    if (!Package) {
      console.error('مدل Package یافت نشد');
      return res.status(500).json({ message: 'خطای سرور: مدل Package یافت نشد' });
    }

    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ message: 'وضعیت فعال بودن باید مشخص شود' });
    }
    
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }

    package.isActive = isActive;
    await package.save();
    
    res.json({ 
      message: `پکیج با موفقیت ${isActive ? 'فعال' : 'غیرفعال'} شد`,
      id: package._id, 
      isActive: package.isActive 
    });
  } catch (err) {
    console.error('خطا در تغییر وضعیت پکیج:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }
    res.status(500).json({ message: `خطای سرور در تغییر وضعیت پکیج: ${err.message}` });
  }
});

/**
 * @route   POST /api/packages/:id/generate-tickets
 * @desc    تولید بلیط برای تمامی مسافران یک پکیج
 * @access  خصوصی
 */
router.post('/:id/generate-tickets', auth, async (req, res) => {
  try {
    const packageId = req.params.id;
    const { ticketType } = req.body; // رفت (departure)، برگشت (return) یا هر دو (both)
    
    // بررسی نوع بلیط
    if (!['departure', 'return', 'both'].includes(ticketType)) {
      return res.status(400).json({ message: 'نوع بلیط نامعتبر است' });
    }

    // دریافت اطلاعات پکیج
    const packageData = await Package.findById(packageId)
      .populate('route')
      .populate({
        path: 'transportation.departureAirline',
        model: 'airline'
      })
      .populate({
        path: 'transportation.returnAirline',
        model: 'airline'
      });
    
    if (!packageData) {
      return res.status(404).json({ message: 'پکیج مورد نظر یافت نشد' });
    }

    // دریافت تمام رزروهای فعال پکیج
    const reservations = await Reservation.find({ 
      package: packageId, 
      status: { $ne: 'canceled' } 
    });

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'هیچ رزرو فعالی برای این پکیج یافت نشد' });
    }

    // دریافت تمام مسافران برای رزروهای این پکیج
    const reservationIds = reservations.map(res => res._id);
    const passengers = await Passenger.find({ reservation: { $in: reservationIds } });

    if (passengers.length === 0) {
      return res.status(404).json({ message: 'هیچ مسافری برای این پکیج یافت نشد' });
    }

    // --- مسیر قالب و فونت --- 
    const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'package-ticket-template.pdf');
    const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'ttf', 'Vazirmatn-Regular.ttf');

    // --- خواندن فایل‌ها --- 
    let templateBytes, vazirFontBytes;
    try {
      // اگر فایل قالب وجود نداشت، از قالب بلیط شناور استفاده می‌کنیم
      if (!fs.existsSync(templatePath)) {
        const floatingTicketTemplatePath = path.join(__dirname, '..', 'assets', 'templates', 'template.pdf');
        templateBytes = fs.readFileSync(floatingTicketTemplatePath);
      } else {
        templateBytes = fs.readFileSync(templatePath);
      }
      console.log('PDF template read successfully.');
    } catch (err) {
        console.error("CRITICAL: Could not read PDF template file:", err);
        return res.status(500).json({ message: 'خطا در خواندن فایل قالب PDF.' });
    }
    
    try {
      vazirFontBytes = fs.readFileSync(fontPath);
      console.log('Vazir font file read successfully.');
    } catch (err) {
        console.warn("Could not read Vazir font file:", err, "Proceeding without custom font.");
        vazirFontBytes = null;
    }

    // ایجاد فایل PDF خروجی نهایی
    const finalPdfDoc = await PDFDocument.create();
    if (vazirFontBytes) {
      finalPdfDoc.registerFontkit(fontkit);
    }

    // مشخص کردن اطلاعات بلیط‌ها (رفت، برگشت یا هر دو)
    const ticketsToGenerate = [];
    
    // اطلاعات بلیط رفت
    if (ticketType === 'departure' || ticketType === 'both') {
      // دریافت اطلاعات فرودگاه‌ها برای این مسیر
      let fromair = '';
      let toair = '';
      let fromAirportCode = '';
      let toAirportCode = '';
      
      try {
        // استفاده از آدرس نسبی API داخلی
        const airportInfo = await axios.get(`http://185.94.99.35:5000/api/routes/airports/info/${packageData.route.origin}/${packageData.route.destination}`);
        if (airportInfo.data) {
          // استخراج اطلاعات فرودگاه‌ها
          fromair = airportInfo.data.originAirport?.name || '';
          toair = airportInfo.data.destinationAirport?.name || '';
          fromAirportCode = airportInfo.data.originAirport?.code || '';
          toAirportCode = airportInfo.data.destinationAirport?.code || '';
        }
      } catch (airportError) {
        console.error('Error fetching departure airport info:', airportError);
      }
      
      ticketsToGenerate.push({
        type: 'departure',
        origin: packageData.route.origin,
        destination: packageData.route.destination,
        fromair, // نام فرودگاه مبدا
        toair,   // نام فرودگاه مقصد
        fromAirportCode, // کد فرودگاه مبدا
        toAirportCode,   // کد فرودگاه مقصد
        date: packageData.startDate,
        time: packageData.startTime,
        airline: packageData.transportation.departureAirline,
        transportation: packageData.transportation.departure
      });
    }
    
    // اطلاعات بلیط برگشت
    if (ticketType === 'return' || ticketType === 'both') {
      // دریافت اطلاعات فرودگاه‌ها برای مسیر برگشت (مقصد به مبدا)
      let fromair = '';
      let toair = '';
      let fromAirportCode = '';
      let toAirportCode = '';
      
      try {
        // استفاده از آدرس نسبی API داخلی با معکوس کردن مبدا و مقصد
        const airportInfo = await axios.get(`http://185.94.99.35:5000/api/routes/airports/info/${packageData.route.destination}/${packageData.route.origin}`);
        if (airportInfo.data) {
          // استخراج اطلاعات فرودگاه‌ها
          fromair = airportInfo.data.originAirport?.name || '';
          toair = airportInfo.data.destinationAirport?.name || '';
          fromAirportCode = airportInfo.data.originAirport?.code || '';
          toAirportCode = airportInfo.data.destinationAirport?.code || '';
        }
      } catch (airportError) {
        console.error('Error fetching return airport info:', airportError);
      }
      
      ticketsToGenerate.push({
        type: 'return',
        origin: packageData.route.destination, // معکوس کردن مبدا و مقصد
        destination: packageData.route.origin,
        fromair, // نام فرودگاه مبدا (در مسیر برگشت)
        toair,   // نام فرودگاه مقصد (در مسیر برگشت)
        fromAirportCode, // کد فرودگاه مبدا (در مسیر برگشت)
        toAirportCode,   // کد فرودگاه مقصد (در مسیر برگشت)
        date: packageData.endDate,
        time: packageData.endTime,
        airline: packageData.transportation.returnAirline,
        transportation: packageData.transportation.return
      });
    }

    // پردازش هر مسافر و هر نوع بلیط (رفت/برگشت)
    for (const passenger of passengers) {
      for (const ticketInfo of ticketsToGenerate) {
        // بررسی نوع وسیله نقلیه - اگر هوایی نیست، شاید بخواهیم رفتار متفاوتی داشته باشیم
        const isAirTransportation = ticketInfo.transportation === 'havaii';
        
        // --- بارگذاری PDF و ثبت Fontkit برای هر مسافر --- 
        let pdfDoc;
        try {
          pdfDoc = await PDFDocument.load(templateBytes);
          pdfDoc.registerFontkit(fontkit); 
          console.log(`PDF Template loaded for passenger ${passenger.englishFirstName} ${passenger.englishLastName}`);
        } catch (loadError) {
          console.error('CRITICAL: Error loading PDF template or registering fontkit:', loadError);
          return res.status(500).json({ message: 'خطای حیاتی در بارگذاری قالب PDF.' });
        } 
        
        // --- جاسازی فونت --- 
        let vazirFont = null;
        if (vazirFontBytes) {
          try {
            vazirFont = await pdfDoc.embedFont(vazirFontBytes);
          } catch (fontEmbedError) {
            console.error("ERROR: Could not embed Vazir font:", fontEmbedError);
          }
        }
          
        // --- دریافت فرم و فیلدها --- 
        let form;
        try {
          form = pdfDoc.getForm();
          
          // نمایش لیست تمام فیلدهای موجود در قالب PDF
          console.log("====== لیست تمام فیلدهای موجود در قالب PDF ======");
          const fields = form.getFields();
          fields.forEach(field => {
            console.log(`نام فیلد: "${field.getName()}", نوع: "${field.constructor.name}"`);
          });
          console.log("=================================================");
          
        } catch (formError) {
          console.error('CRITICAL: Error getting form from PDF:', formError);
          if (formError.message.includes('does not contain a form')) {
            console.warn("The PDF template does not seem to contain an AcroForm.");
          }
          return res.status(500).json({ message: 'خطای حیاتی در پردازش فرم PDF.' });
        }
        
        // عنوان نوع بلیط به فارسی (فقط برای لاگ)
        const ticketTypeText = ticketInfo.type === 'departure' ? 'بلیط رفت' : 'بلیط برگشت';
        
        // تولید شماره بلیط تصادفی
        const randomTicketNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        
        // --- نگاشت داده‌ها به نام فیلدها --- 
        // اضافه کردن لاگ برای بررسی مقادیر شماره پرواز
        console.log('FLIGHT NUMBERS DEBUG:', {
          departureFlightNumber: packageData.transportation?.departureFlightNumber || 'Not set',
          returnFlightNumber: packageData.transportation?.returnFlightNumber || 'Not set',
          ticketType: ticketInfo.type
        });
        
        const fieldDataMap = {
          'from': ticketInfo.origin || '',
          'to': ticketInfo.destination || '',
          'date': ticketInfo.date || '',
          'time': ticketInfo.time || '',
          'name': passenger.englishFirstName || '',
          'familiy': passenger.englishLastName || '',
          'pnumber': passenger.passportNumber || passenger.nationalId || '',
          'flightn': ticketInfo.type === 'departure' 
                    ? (packageData.transportation?.departureFlightNumber || 'Departure') 
                    : (packageData.transportation?.returnFlightNumber || 'Return'),
          'aircraft': isAirTransportation && ticketInfo.airline?.aircraftModel ? 
                      ticketInfo.airline.aircraftModel : 
                      '',
          'price': '', 
          'tax': '',
          'total': '',
          'logo_af_image': isAirTransportation && ticketInfo.airline?.logo ? 
                          ticketInfo.airline.logo : 
                          '',
          'age': calculateAge(passenger.birthDate) || '',
          // اضافه کردن فیلدهای فرودگاه
          'fromair': ticketInfo.fromair || '',
          'toair': ticketInfo.toair || '',
          'fromAirportCode': ticketInfo.fromAirportCode || '',
          'toAirportCode': ticketInfo.toAirportCode || ''
        };
        
        // --- محاسبه قیمت براساس رده سنی مسافر ---
        let ticketPrice = 0;
        let ticketTax = 0;
        let ticketTotal = 0;

        // محاسبه قیمت براساس رده سنی مسافر
        const age = getNumericAge(passenger.birthDate);
        if (age < 2) {
          // نوزاد
          ticketPrice = packageData.infantPrice;
        } else {
          // بزرگسال و کودک (قیمت یکسان)
          ticketPrice = packageData.basePrice;
        }
        
        // محاسبه مالیات (در این سیستم صفر است)
        ticketTax = 0;
        
        // محاسبه جمع کل
        ticketTotal = ticketPrice + ticketTax;
        
        // به‌روزرسانی مقادیر در فیلدها
        fieldDataMap['price'] = ticketPrice.toString();
        fieldDataMap['tax'] = ticketTax.toString();
        fieldDataMap['total'] = ticketTotal.toString();
        
        // لاگ کردن مقادیر فیلدها برای دیباگ
        console.log(`====== مقادیر فیلدها برای مسافر ${passenger.englishFirstName} ${passenger.englishLastName} - ${ticketTypeText} ======`);
        Object.entries(fieldDataMap).forEach(([key, value]) => {
          console.log(`${key}: "${value}"`);
        });
        console.log("=====================================================");
        
        // بررسی نام‌های جایگزین برای فیلدها - ممکن است نام‌های فیلدها در قالب متفاوت باشند
        const alternativeFieldNames = {
          'from': ['from', 'From', 'origin', 'Origin', 'departure', 'Departure', 'مبدا'],
          'to': ['to', 'To', 'destination', 'Destination', 'arrival', 'Arrival', 'مقصد'],
          'date': ['date', 'Date', 'flightDate', 'FlightDate', 'تاریخ'],
          'time': ['time', 'Time', 'flightTime', 'FlightTime', 'ساعت'],
          'name': ['name', 'Name', 'firstName', 'FirstName', 'نام'],
          'familiy': ['familiy', 'Familiy', 'family', 'Family', 'lastName', 'LastName', 'نام_خانوادگی', 'نام خانوادگی'],
          'pnumber': ['pnumber', 'Pnumber', 'documentNumber', 'DocumentNumber', 'passportNumber', 'PassportNumber', 'شماره_سند', 'شماره سند'],
          'flightn': ['flightn', 'Flightn', 'flightNumber', 'FlightNumber', 'شماره_پرواز', 'شماره پرواز'],
          'aircraft': ['aircraft', 'Aircraft', 'aircraftModel', 'AircraftModel', 'مدل_هواپیما', 'مدل هواپیما'],
          'price': ['price', 'Price', 'ticketPrice', 'TicketPrice', 'قیمت'],
          'tax': ['tax', 'Tax', 'مالیات'],
          'total': ['total', 'Total', 'totalPrice', 'TotalPrice', 'قیمت_کل', 'قیمت کل'],
          'logo_af_image': ['logo_af_image', 'Logo', 'logo', 'airlineLogo', 'AirlineLogo', 'لوگو'],
          'age': ['age', 'Age', 'passengerAge', 'PassengerAge', 'سن'],
          'fromair': ['fromair', 'Fromair', 'originAirport', 'OriginAirport', 'departureAirport', 'DepartureAirport', 'مبدافرودگاه'],
          'toair': ['toair', 'Toair', 'destinationAirport', 'DestinationAirport', 'arrivalAirport', 'ArrivalAirport', 'مقصدفرودگاه'],
          'fromAirportCode': ['fromAirportCode', 'FromAirportCode', 'originAirportCode', 'OriginAirportCode', 'departureAirportCode', 'DepartureAirportCode', 'مبدافرودگاهکد'],
          'toAirportCode': ['toAirportCode', 'ToAirportCode', 'destinationAirportCode', 'DestinationAirportCode', 'arrivalAirportCode', 'ArrivalAirportCode', 'مقصدفرودگاهکد']
        };
        
        // پر کردن فیلدهای فرم
        for (const [mainFieldName, fieldValue] of Object.entries(fieldDataMap)) {
          let fieldFilled = false;
          
          // ابتدا تلاش می‌کنیم با نام اصلی
          try {
            const field = form.getTextField(mainFieldName);
            if (field) {
              // field.setText(fieldValue);
              setTextWithSkyBlueColor(field, fieldValue);
              
              // مطمئن شویم که از فونت وزیر استفاده می‌کنیم
              if (vazirFont) {
                try {
                  field.updateAppearances(vazirFont);
                } catch (fontError) {
                  console.warn(`Could not update appearance with Vazir font for field ${mainFieldName}:`, fontError);
                }
              }
              
              fieldFilled = true;
            }
          } catch (fieldError) {
            // ادامه با نام‌های جایگزین
          }
          
          // اگر با نام اصلی موفق نبودیم، نام‌های جایگزین را امتحان می‌کنیم
          if (!fieldFilled && alternativeFieldNames[mainFieldName]) {
            for (const altFieldName of alternativeFieldNames[mainFieldName]) {
              if (altFieldName === mainFieldName) continue; // نام اصلی را دوباره امتحان نکن
              
              try {
                const field = form.getTextField(altFieldName);
                if (field) {
                  // field.setText(fieldValue);
                  setTextWithSkyBlueColor(field, fieldValue);
                  
                  // مطمئن شویم که از فونت وزیر استفاده می‌کنیم
                  if (vazirFont) {
                    try {
                      field.updateAppearances(vazirFont);
                    } catch (fontError) {
                      console.warn(`Could not update appearance with Vazir font for field ${altFieldName}:`, fontError);
                    }
                  }
                  
                  fieldFilled = true;
                  break; // از حلقه خارج شو چون فیلد را پر کردیم
                }
              } catch (altFieldError) {
                // ادامه به نام جایگزین بعدی
              }
            }
          }
        }
        
        console.log(`تعداد کل فیلدهای پر شده: ${Object.keys(fieldDataMap).length}`);
        
        // پردازش ویژه برای لوگوی ایرلاین
        if (isAirTransportation && ticketInfo.airline?.logo) {
          try {
            console.log("RESERVATION: Processing airline logo:", ticketInfo.airline.logo);
            console.log("RESERVATION: Full airline data:", JSON.stringify(ticketInfo.airline, null, 2));
            let logoUrl = ticketInfo.airline.logo;
            let logoImage = null;
            
            // بررسی مسیر لوگو
            if (logoUrl.includes('/uploads/')) {
              // استخراج بخش آخر مسیر
              const parts = logoUrl.split('/uploads/');
              const relativePath = parts.length > 1 ? parts[1] : logoUrl;
              const filePath = path.join(__dirname, '..', 'uploads', relativePath);
              console.log(`RESERVATION: Looking for logo at: ${filePath}`);
              
              if (fs.existsSync(filePath)) {
                try {
                  // خواندن فایل از مسیر محلی
                  const logoBuffer = fs.readFileSync(filePath);
                  console.log("RESERVATION: Logo file read successfully");
                  
                  // تعیین فرمت تصویر بر اساس پسوند فایل
                  if (filePath.toLowerCase().endsWith('.png')) {
                    logoImage = await pdfDoc.embedPng(logoBuffer);
                  } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
                    logoImage = await pdfDoc.embedJpg(logoBuffer);
                  } else {
                    try {
                      logoImage = await pdfDoc.embedPng(logoBuffer);
                    } catch (e) {
                      logoImage = await pdfDoc.embedJpg(logoBuffer);
                    }
                  }
                  console.log("RESERVATION: Successfully loaded logo image");
                } catch (logoError) {
                  console.error("RESERVATION: Error loading logo:", logoError);
                }
              } else {
                // جستجو در پوشه‌های دیگر
                console.log("RESERVATION: Logo not found, searching in alternative directories");
                const airlineLogoPath = path.join(__dirname, '..', 'uploads', 'airlines');
                if (fs.existsSync(airlineLogoPath)) {
                  const fileName = path.basename(logoUrl);
                  const airlineFilePath = path.join(airlineLogoPath, fileName);
                  console.log(`RESERVATION: Looking for logo in airlines folder: ${airlineFilePath}`);
                  
                  if (fs.existsSync(airlineFilePath)) {
                    try {
                      const logoBuffer = fs.readFileSync(airlineFilePath);
                      if (airlineFilePath.toLowerCase().endsWith('.png')) {
                        logoImage = await pdfDoc.embedPng(logoBuffer);
                      } else {
                        logoImage = await pdfDoc.embedJpg(logoBuffer);
                      }
                      console.log("RESERVATION: Found logo in airlines directory");
                    } catch (err) {
                      console.error("RESERVATION: Error loading logo from airlines directory:", err);
                    }
                  }
                }
              }
            }
            
            // اگر لوگو بارگذاری شد، آن را به PDF اضافه کنیم
            if (logoImage) {
              // ابتدا تلاش می‌کنیم آن را در فیلد logo_af_image قرار دهیم
              try {
                const fields = form.getFields();
                const logoField = fields.find(field => field.getName() === 'logo_af_image');
                
                if (logoField) {
                  console.log(`RESERVATION: Found logo field with type: ${logoField.constructor.name}`);
                  
                  // بررسی نوع فیلد
                  if (logoField.constructor.name === 'PDFButton') {
                    console.log("RESERVATION: Logo field is a button, setting button image");
                    try {
                      const button = form.getButton('logo_af_image');
                      button.setImage(logoImage);
                      console.log("RESERVATION: Successfully set button image");
                    } catch (buttonErr) {
                      console.error("RESERVATION: Error setting button image:", buttonErr);
                    }
                  } else {
                    console.log("RESERVATION: Logo field is not a button, trying standard method");
                    try {
                      const textField = form.getTextField('logo_af_image');
                      textField.setImage(logoImage);
                      console.log("RESERVATION: Successfully set image on text field");
                    } catch (textFieldErr) {
                      console.error("RESERVATION: Error setting image on text field:", textFieldErr);
                    }
                  }
                } else {
                  console.log("RESERVATION: logo_af_image field not found, adding logo directly to page");
                  
                  // اگر فیلد پیدا نشد، لوگو را مستقیماً روی صفحه قرار می‌دهیم
                  const pages = pdfDoc.getPages();
                  const firstPage = pages[0];
                  const { width, height } = firstPage.getSize();
                  
                  firstPage.drawImage(logoImage, {
                    x: width - 100,
                    y: height - 50,
                    width: 80,
                    height: 40
                  });
                  
                  console.log("RESERVATION: Successfully added logo directly to page");
                }
              } catch (logoFieldError) {
                console.error("RESERVATION: Error processing logo field:", logoFieldError);
                
                // اگر هر خطایی رخ داد، لوگو را مستقیماً روی صفحه قرار می‌دهیم
                try {
                  const pages = pdfDoc.getPages();
                  const firstPage = pages[0];
                  const { width, height } = firstPage.getSize();
                  
                  firstPage.drawImage(logoImage, {
                    x: width - 100,
                    y: height - 50,
                    width: 80,
                    height: 40
                  });
                  
                  console.log("RESERVATION: Successfully added logo directly to page as fallback");
                } catch (drawError) {
                  console.error("RESERVATION: Final error when drawing logo:", drawError);
                }
              }
            } else {
              console.log("RESERVATION: No logo image loaded, skipping logo");
            }
          } catch (mainLogoError) {
            console.error("RESERVATION: Main logo processing error:", mainLogoError);
          }
        } else {
          console.log("RESERVATION: Skip logo processing - isAirTransportation:", isAirTransportation, "has logo:", !!ticketInfo.airline?.logo);
        }
        
        // نهایی کردن فرم
        try {
          form.flatten();
        } catch (flattenError) {
          console.error('Error flattening form:', flattenError);
        }

        // --- اضافه کردن صفحات این مسافر به PDF نهایی ---
        try {
          const pdfBytes = await pdfDoc.save();
          const loadedPdf = await PDFDocument.load(pdfBytes);
          const [passengerPage] = await finalPdfDoc.copyPages(loadedPdf, [0]);
          finalPdfDoc.addPage(passengerPage);
          console.log(`Page added to final PDF for passenger ${passenger.englishFirstName} ${passenger.englishLastName} - ${ticketInfo.type}`);
        } catch (pageError) {
          console.error('Error adding page to final PDF:', pageError);
        }
      }
    }

    // --- ذخیره PDF نهایی ---
    let finalPdfBytes;
    try {
      finalPdfBytes = await finalPdfDoc.save();
      console.log('Final PDF with all passengers saved successfully.');
    } catch (saveError) {
      console.error('CRITICAL: Error saving final PDF:', saveError);
      return res.status(500).json({ message: 'خطای حیاتی در ذخیره‌سازی PDF نهایی.' });
    }

    // --- ذخیره فایل PDF در سرور ---
    const uploadDirectory = path.join(__dirname, '..', 'uploads', 'tickets');
    
    // اطمینان از وجود دایرکتوری
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }
    
    // ایجاد نام فایل منحصر به فرد
    const uniqueFilename = `package-tickets-${packageId}-${uuidv4()}.pdf`;
    const filePath = path.join(uploadDirectory, uniqueFilename);
    
    try {
      fs.writeFileSync(filePath, finalPdfBytes);
      console.log(`Generated PDF with ${passengers.length} passengers saved to: ${filePath}`);
      
      // تنظیم کوکی CSRF در صورت نیاز
      if (req.csrfToken) {
        res.cookie('XSRF-TOKEN', req.csrfToken());
      }
      
      // تنظیم هدرهای CORS
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-auth-token,Authorization');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // آدرس دانلود فایل
      const downloadUrl = `/api/packages/download-ticket/${uniqueFilename}`;
      
      // ارسال پاسخ به کلاینت
      res.json({
        success: true,
        message: 'بلیط‌ها با موفقیت تولید شدند',
        fileName: uniqueFilename,
        downloadUrl,
        passengerCount: passengers.length,
        packageName: packageData.name
      });
    } catch (writeError) {
      console.error(`CRITICAL: Error writing PDF file to ${filePath}:`, writeError);
      return res.status(500).json({ message: 'خطا در ذخیره فایل PDF در سرور.' });
    }
  } catch (err) {
    console.error('خطای کلی در تولید PDF:', err);
    res.status(500).json({ message: 'خطای داخلی سرور هنگام تولید PDF.' });
  }
});

/**
 * @route   GET /api/packages/download-ticket/:fileName
 * @desc    دانلود فایل PDF بلیط‌های تولید شده
 * @access  عمومی
 */
router.get('/download-ticket/:fileName', async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '..', 'uploads', 'tickets', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'فایل مورد نظر یافت نشد' });
    }
    
    // تنظیم هدرهای HTTP برای دانلود فایل
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    // ارسال فایل
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('خطا در دانلود فایل:', err);
    res.status(500).json({ message: 'خطای داخلی سرور هنگام دانلود فایل.' });
  }
});

/**
 * @route   POST /api/packages/reservation/:id/generate-tickets
 * @desc    تولید بلیط برای مسافران یک رزرواسیون خاص
 * @access  خصوصی
 */
router.post('/reservation/:id/generate-tickets', auth, async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { ticketType } = req.body; // رفت (departure)، برگشت (return) یا هر دو (both)
    
    // بررسی نوع بلیط
    if (!['departure', 'return', 'both'].includes(ticketType)) {
      return res.status(400).json({ message: 'نوع بلیط نامعتبر است' });
    }

    // دریافت اطلاعات رزرواسیون
    const reservation = await Reservation.findById(reservationId)
      .populate('package');
    
    if (!reservation) {
      return res.status(404).json({ message: 'رزرواسیون مورد نظر یافت نشد' });
    }

    // دریافت اطلاعات پکیج
    const packageData = await Package.findById(reservation.package._id)
      .populate('route')
      .populate({
        path: 'transportation.departureAirline',
        model: 'airline'
      })
      .populate({
        path: 'transportation.returnAirline',
        model: 'airline'
      });
    
    if (!packageData) {
      return res.status(404).json({ message: 'پکیج مربوط به این رزرواسیون یافت نشد' });
    }

    // دریافت مسافران این رزرواسیون
    const passengers = await Passenger.find({ reservation: reservationId });

    if (passengers.length === 0) {
      return res.status(404).json({ message: 'هیچ مسافری برای این رزرواسیون یافت نشد' });
    }

    // --- مسیر قالب و فونت --- 
    const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'package-ticket-template.pdf');
    const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'ttf', 'Vazirmatn-Regular.ttf');

    // --- خواندن فایل‌ها --- 
    let templateBytes, vazirFontBytes;
    try {
      // اگر فایل قالب وجود نداشت، از قالب بلیط شناور استفاده می‌کنیم
      if (!fs.existsSync(templatePath)) {
        const floatingTicketTemplatePath = path.join(__dirname, '..', 'assets', 'templates', 'template.pdf');
        templateBytes = fs.readFileSync(floatingTicketTemplatePath);
      } else {
        templateBytes = fs.readFileSync(templatePath);
      }
      console.log('PDF template read successfully.');
    } catch (err) {
        console.error("CRITICAL: Could not read PDF template file:", err);
        return res.status(500).json({ message: 'خطا در خواندن فایل قالب PDF.' });
    }
    
    try {
      vazirFontBytes = fs.readFileSync(fontPath);
      console.log('Vazir font file read successfully.');
    } catch (err) {
        console.warn("Could not read Vazir font file:", err, "Proceeding without custom font.");
        vazirFontBytes = null;
    }

    // ایجاد فایل PDF خروجی نهایی
    const finalPdfDoc = await PDFDocument.create();
    if (vazirFontBytes) {
      finalPdfDoc.registerFontkit(fontkit);
    }

    // مشخص کردن اطلاعات بلیط‌ها (رفت، برگشت یا هر دو)
    const ticketsToGenerate = [];
    
    // اطلاعات بلیط رفت
    if (ticketType === 'departure' || ticketType === 'both') {
      // دریافت اطلاعات فرودگاه‌ها برای این مسیر
      let fromair = '';
      let toair = '';
      let fromAirportCode = '';
      let toAirportCode = '';
      
      try {
        // استفاده از آدرس نسبی API داخلی
        const airportInfo = await axios.get(`http://185.94.99.35:5000/api/routes/airports/info/${packageData.route.origin}/${packageData.route.destination}`);
        if (airportInfo.data) {
          // استخراج اطلاعات فرودگاه‌ها
          fromair = airportInfo.data.originAirport?.name || '';
          toair = airportInfo.data.destinationAirport?.name || '';
          fromAirportCode = airportInfo.data.originAirport?.code || '';
          toAirportCode = airportInfo.data.destinationAirport?.code || '';
        }
      } catch (airportError) {
        console.error('Error fetching departure airport info:', airportError);
      }
      
      ticketsToGenerate.push({
        type: 'departure',
        origin: packageData.route.origin,
        destination: packageData.route.destination,
        fromair, // نام فرودگاه مبدا
        toair,   // نام فرودگاه مقصد
        fromAirportCode, // کد فرودگاه مبدا
        toAirportCode,   // کد فرودگاه مقصد
        date: packageData.startDate,
        time: packageData.startTime,
        airline: packageData.transportation.departureAirline,
        transportation: packageData.transportation.departure
      });
    }
    
    // اطلاعات بلیط برگشت
    if (ticketType === 'return' || ticketType === 'both') {
      // دریافت اطلاعات فرودگاه‌ها برای مسیر برگشت (مقصد به مبدا)
      let fromair = '';
      let toair = '';
      let fromAirportCode = '';
      let toAirportCode = '';
      
      try {
        // استفاده از آدرس نسبی API داخلی با معکوس کردن مبدا و مقصد
        const airportInfo = await axios.get(`http://185.94.99.35:5000/api/routes/airports/info/${packageData.route.destination}/${packageData.route.origin}`);
        if (airportInfo.data) {
          // استخراج اطلاعات فرودگاه‌ها
          fromair = airportInfo.data.originAirport?.name || '';
          toair = airportInfo.data.destinationAirport?.name || '';
          fromAirportCode = airportInfo.data.originAirport?.code || '';
          toAirportCode = airportInfo.data.destinationAirport?.code || '';
        }
      } catch (airportError) {
        console.error('Error fetching return airport info:', airportError);
      }
      
      ticketsToGenerate.push({
        type: 'return',
        origin: packageData.route.destination, // معکوس کردن مبدا و مقصد
        destination: packageData.route.origin,
        fromair, // نام فرودگاه مبدا (در مسیر برگشت)
        toair,   // نام فرودگاه مقصد (در مسیر برگشت)
        fromAirportCode, // کد فرودگاه مبدا (در مسیر برگشت)
        toAirportCode,   // کد فرودگاه مقصد (در مسیر برگشت)
        date: packageData.endDate,
        time: packageData.endTime,
        airline: packageData.transportation.returnAirline,
        transportation: packageData.transportation.return
      });
    }

    // پردازش هر مسافر و هر نوع بلیط (رفت/برگشت)
    for (const passenger of passengers) {
      for (const ticketInfo of ticketsToGenerate) {
        // بررسی نوع وسیله نقلیه - اگر هوایی نیست، شاید بخواهیم رفتار متفاوتی داشته باشیم
        const isAirTransportation = ticketInfo.transportation === 'havaii';
        
        // --- بارگذاری PDF و ثبت Fontkit برای هر مسافر --- 
        let pdfDoc;
        try {
          pdfDoc = await PDFDocument.load(templateBytes);
          pdfDoc.registerFontkit(fontkit); 
          console.log(`PDF Template loaded for passenger ${passenger.englishFirstName} ${passenger.englishLastName}`);
        } catch (loadError) {
          console.error('CRITICAL: Error loading PDF template or registering fontkit:', loadError);
          return res.status(500).json({ message: 'خطای حیاتی در بارگذاری قالب PDF.' });
        }
        
        // --- جاسازی فونت --- 
        let vazirFont = null;
        if (vazirFontBytes) {
          try {
            vazirFont = await pdfDoc.embedFont(vazirFontBytes);
          } catch (fontEmbedError) {
            console.error("ERROR: Could not embed Vazir font:", fontEmbedError);
          }
        }
          
        // --- دریافت فرم و فیلدها --- 
        let form;
        try {
          form = pdfDoc.getForm();
          console.log("Form fields retrieved successfully.");
        } catch (formError) {
          console.error('CRITICAL: Error getting form from PDF:', formError);
          if (formError.message.includes('does not contain a form')) {
            console.warn("The PDF template does not seem to contain an AcroForm.");
          }
          return res.status(500).json({ message: 'خطای حیاتی در پردازش فرم PDF.' });
        }
        
        // عنوان نوع بلیط به فارسی (فقط برای لاگ)
        const ticketTypeText = ticketInfo.type === 'departure' ? 'بلیط رفت' : 'بلیط برگشت';
        
        // تولید شماره بلیط تصادفی
        const randomTicketNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        
        // --- نگاشت داده‌ها به نام فیلدها --- 
        // اضافه کردن لاگ برای بررسی مقادیر شماره پرواز
        console.log('FLIGHT NUMBERS DEBUG:', {
          departureFlightNumber: packageData.transportation?.departureFlightNumber || 'Not set',
          returnFlightNumber: packageData.transportation?.returnFlightNumber || 'Not set',
          ticketType: ticketInfo.type
        });
        
        const fieldDataMap = {
          'from': ticketInfo.origin || '',
          'to': ticketInfo.destination || '',
          'date': ticketInfo.date || '',
          'time': ticketInfo.time || '',
          'name': passenger.englishFirstName || '',
          'familiy': passenger.englishLastName || '',
          'pnumber': passenger.passportNumber || passenger.nationalId || '',
          'flightn': ticketInfo.type === 'departure' 
                    ? (packageData.transportation?.departureFlightNumber || 'Departure') 
                    : (packageData.transportation?.returnFlightNumber || 'Return'),
          'aircraft': isAirTransportation && ticketInfo.airline?.aircraftModel ? 
                      ticketInfo.airline.aircraftModel : 
                      '',
          'price': '', 
          'tax': '',
          'total': '',
          'logo_af_image': isAirTransportation && ticketInfo.airline?.logo ? 
                          ticketInfo.airline.logo : 
                          '',
          'age': calculateAge(passenger.birthDate) || '',
          // اضافه کردن فیلدهای فرودگاه
          'fromair': ticketInfo.fromair || '',
          'toair': ticketInfo.toair || '',
          'fromAirportCode': ticketInfo.fromAirportCode || '',
          'toAirportCode': ticketInfo.toAirportCode || ''
        };
        
        // --- محاسبه قیمت براساس رده سنی مسافر ---
        let ticketPrice = 0;
        let ticketTax = 0;
        let ticketTotal = 0;

        // محاسبه قیمت براساس رده سنی مسافر
        if (passenger.ageCategory === 'infant') {
          // نوزاد
          ticketPrice = packageData.infantPrice;
        } else {
          // بزرگسال و کودک (قیمت یکسان)
          ticketPrice = packageData.basePrice;
        }
        
        // محاسبه مالیات (در این سیستم صفر است)
        ticketTax = 0;
        
        // محاسبه جمع کل
        ticketTotal = ticketPrice + ticketTax;
        
        // به‌روزرسانی مقادیر در فیلدها
        fieldDataMap['price'] = ticketPrice.toString();
        fieldDataMap['tax'] = ticketTax.toString();
        fieldDataMap['total'] = ticketTotal.toString();
        
        // بررسی نام‌های جایگزین برای فیلدها - ممکن است نام‌های فیلدها در قالب متفاوت باشند
        const alternativeFieldNames = {
          'from': ['from', 'From', 'origin', 'Origin', 'departure', 'Departure', 'مبدا'],
          'to': ['to', 'To', 'destination', 'Destination', 'arrival', 'Arrival', 'مقصد'],
          'date': ['date', 'Date', 'flightDate', 'FlightDate', 'تاریخ'],
          'time': ['time', 'Time', 'flightTime', 'FlightTime', 'ساعت'],
          'name': ['name', 'Name', 'firstName', 'FirstName', 'نام'],
          'familiy': ['familiy', 'Familiy', 'family', 'Family', 'lastName', 'LastName', 'نام_خانوادگی', 'نام خانوادگی'],
          'pnumber': ['pnumber', 'Pnumber', 'documentNumber', 'DocumentNumber', 'passportNumber', 'PassportNumber', 'شماره_سند', 'شماره سند'],
          'flightn': ['flightn', 'Flightn', 'flightNumber', 'FlightNumber', 'شماره_پرواز', 'شماره پرواز'],
          'aircraft': ['aircraft', 'Aircraft', 'aircraftModel', 'AircraftModel', 'مدل_هواپیما', 'مدل هواپیما'],
          'price': ['price', 'Price', 'ticketPrice', 'TicketPrice', 'قیمت'],
          'tax': ['tax', 'Tax', 'مالیات'],
          'total': ['total', 'Total', 'totalPrice', 'TotalPrice', 'قیمت_کل', 'قیمت کل'],
          'logo_af_image': ['logo_af_image', 'Logo', 'logo', 'airlineLogo', 'AirlineLogo', 'لوگو'],
          'age': ['age', 'Age', 'passengerAge', 'PassengerAge', 'سن'],
          'fromair': ['fromair', 'Fromair', 'originAirport', 'OriginAirport', 'departureAirport', 'DepartureAirport', 'مبدافرودگاه'],
          'toair': ['toair', 'Toair', 'destinationAirport', 'DestinationAirport', 'arrivalAirport', 'ArrivalAirport', 'مقصدفرودگاه'],
          'fromAirportCode': ['fromAirportCode', 'FromAirportCode', 'originAirportCode', 'OriginAirportCode', 'departureAirportCode', 'DepartureAirportCode', 'مبدافرودگاهکد'],
          'toAirportCode': ['toAirportCode', 'ToAirportCode', 'destinationAirportCode', 'DestinationAirportCode', 'arrivalAirportCode', 'ArrivalAirportCode', 'مقصدفرودگاهکد']
        };
        
        // پر کردن فیلدهای فرم
        for (const [mainFieldName, fieldValue] of Object.entries(fieldDataMap)) {
          let fieldFilled = false;
          
          // ابتدا تلاش می‌کنیم با نام اصلی
          try {
            const field = form.getTextField(mainFieldName);
            if (field) {
              // field.setText(fieldValue);
              setTextWithSkyBlueColor(field, fieldValue);
              
              // مطمئن شویم که از فونت وزیر استفاده می‌کنیم
              if (vazirFont) {
                try {
                  field.updateAppearances(vazirFont);
                } catch (fontError) {
                  console.warn(`Could not update appearance with Vazir font for field ${mainFieldName}:`, fontError);
                }
              }
              
              fieldFilled = true;
            }
          } catch (fieldError) {
            // ادامه با نام‌های جایگزین
          }
          
          // اگر با نام اصلی موفق نبودیم، نام‌های جایگزین را امتحان می‌کنیم
          if (!fieldFilled && alternativeFieldNames[mainFieldName]) {
            for (const altFieldName of alternativeFieldNames[mainFieldName]) {
              if (altFieldName === mainFieldName) continue; // نام اصلی را دوباره امتحان نکن
              
              try {
                const field = form.getTextField(altFieldName);
                if (field) {
                  // field.setText(fieldValue);
                  setTextWithSkyBlueColor(field, fieldValue);
                  
                  // مطمئن شویم که از فونت وزیر استفاده می‌کنیم
                  if (vazirFont) {
                    try {
                      field.updateAppearances(vazirFont);
                    } catch (fontError) {
                      console.warn(`Could not update appearance with Vazir font for field ${altFieldName}:`, fontError);
                    }
                  }
                  
                  fieldFilled = true;
                  break; // از حلقه خارج شو چون فیلد را پر کردیم
                }
              } catch (altFieldError) {
                // ادامه به نام جایگزین بعدی
              }
            }
          }
        }
        
        // پردازش ویژه برای لوگوی ایرلاین
        if (isAirTransportation && ticketInfo.airline?.logo) {
          try {
            console.log("RESERVATION: Processing airline logo:", ticketInfo.airline.logo);
            console.log("RESERVATION: Full airline data:", JSON.stringify(ticketInfo.airline, null, 2));
            let logoUrl = ticketInfo.airline.logo;
            let logoImage = null;
            
            // بررسی مسیر لوگو
            if (logoUrl.includes('/uploads/')) {
              // استخراج بخش آخر مسیر
              const parts = logoUrl.split('/uploads/');
              const relativePath = parts.length > 1 ? parts[1] : logoUrl;
              const filePath = path.join(__dirname, '..', 'uploads', relativePath);
              console.log(`RESERVATION: Looking for logo at: ${filePath}`);
              
              if (fs.existsSync(filePath)) {
                try {
                  // خواندن فایل از مسیر محلی
                  const logoBuffer = fs.readFileSync(filePath);
                  console.log("RESERVATION: Logo file read successfully");
                  
                  // تعیین فرمت تصویر بر اساس پسوند فایل
                  if (filePath.toLowerCase().endsWith('.png')) {
                    logoImage = await pdfDoc.embedPng(logoBuffer);
                  } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
                    logoImage = await pdfDoc.embedJpg(logoBuffer);
                  } else {
                    try {
                      logoImage = await pdfDoc.embedPng(logoBuffer);
                    } catch (e) {
                      logoImage = await pdfDoc.embedJpg(logoBuffer);
                    }
                  }
                  console.log("RESERVATION: Successfully loaded logo image");
                } catch (logoError) {
                  console.error("RESERVATION: Error loading logo:", logoError);
                }
              } else {
                // جستجو در پوشه‌های دیگر
                console.log("RESERVATION: Logo not found, searching in alternative directories");
                const airlineLogoPath = path.join(__dirname, '..', 'uploads', 'airlines');
                if (fs.existsSync(airlineLogoPath)) {
                  const fileName = path.basename(logoUrl);
                  const airlineFilePath = path.join(airlineLogoPath, fileName);
                  console.log(`RESERVATION: Looking for logo in airlines folder: ${airlineFilePath}`);
                  
                  if (fs.existsSync(airlineFilePath)) {
                    try {
                      const logoBuffer = fs.readFileSync(airlineFilePath);
                      if (airlineFilePath.toLowerCase().endsWith('.png')) {
                        logoImage = await pdfDoc.embedPng(logoBuffer);
                      } else {
                        logoImage = await pdfDoc.embedJpg(logoBuffer);
                      }
                      console.log("RESERVATION: Found logo in airlines directory");
                    } catch (err) {
                      console.error("RESERVATION: Error loading logo from airlines directory:", err);
                    }
                  }
                }
              }
            }
            
            // اگر لوگو بارگذاری شد، آن را به PDF اضافه کنیم
            if (logoImage) {
              // ابتدا تلاش می‌کنیم آن را در فیلد logo_af_image قرار دهیم
              try {
                const fields = form.getFields();
                const logoField = fields.find(field => field.getName() === 'logo_af_image');
                
                if (logoField) {
                  console.log(`RESERVATION: Found logo field with type: ${logoField.constructor.name}`);
                  
                  // بررسی نوع فیلد
                  if (logoField.constructor.name === 'PDFButton') {
                    console.log("RESERVATION: Logo field is a button, setting button image");
                    try {
                      const button = form.getButton('logo_af_image');
                      button.setImage(logoImage);
                      console.log("RESERVATION: Successfully set button image");
                    } catch (buttonErr) {
                      console.error("RESERVATION: Error setting button image:", buttonErr);
                    }
                  } else {
                    console.log("RESERVATION: Logo field is not a button, trying standard method");
                    try {
                      const textField = form.getTextField('logo_af_image');
                      textField.setImage(logoImage);
                      console.log("RESERVATION: Successfully set image on text field");
                    } catch (textFieldErr) {
                      console.error("RESERVATION: Error setting image on text field:", textFieldErr);
                    }
                  }
                } else {
                  console.log("RESERVATION: logo_af_image field not found, adding logo directly to page");
                  
                  // اگر فیلد پیدا نشد، لوگو را مستقیماً روی صفحه قرار می‌دهیم
                  const pages = pdfDoc.getPages();
                  const firstPage = pages[0];
                  const { width, height } = firstPage.getSize();
                  
                  firstPage.drawImage(logoImage, {
                    x: width - 100,
                    y: height - 50,
                    width: 80,
                    height: 40
                  });
                  
                  console.log("RESERVATION: Successfully added logo directly to page");
                }
              } catch (logoFieldError) {
                console.error("RESERVATION: Error processing logo field:", logoFieldError);
                
                // اگر هر خطایی رخ داد، لوگو را مستقیماً روی صفحه قرار می‌دهیم
                try {
                  const pages = pdfDoc.getPages();
                  const firstPage = pages[0];
                  const { width, height } = firstPage.getSize();
                  
                  firstPage.drawImage(logoImage, {
                    x: width - 100,
                    y: height - 50,
                    width: 80,
                    height: 40
                  });
                  
                  console.log("RESERVATION: Successfully added logo directly to page as fallback");
                } catch (drawError) {
                  console.error("RESERVATION: Final error when drawing logo:", drawError);
                }
              }
            } else {
              console.log("RESERVATION: No logo image loaded, skipping logo");
            }
          } catch (mainLogoError) {
            console.error("RESERVATION: Main logo processing error:", mainLogoError);
          }
        } else {
          console.log("RESERVATION: Skip logo processing - isAirTransportation:", isAirTransportation, "has logo:", !!ticketInfo.airline?.logo);
        }
        
        // نهایی کردن فرم
        try {
          form.flatten();
        } catch (flattenError) {
          console.error('Error flattening form:', flattenError);
        }

        // --- اضافه کردن صفحات این مسافر به PDF نهایی ---
        try {
          const pdfBytes = await pdfDoc.save();
          const loadedPdf = await PDFDocument.load(pdfBytes);
          const [passengerPage] = await finalPdfDoc.copyPages(loadedPdf, [0]);
          finalPdfDoc.addPage(passengerPage);
        } catch (pageError) {
          console.error('Error adding page to final PDF:', pageError);
        }
      }
    }

    // --- ذخیره PDF نهایی ---
    let finalPdfBytes;
    try {
      finalPdfBytes = await finalPdfDoc.save();
    } catch (saveError) {
      console.error('CRITICAL: Error saving final PDF:', saveError);
      return res.status(500).json({ message: 'خطای حیاتی در ذخیره‌سازی PDF نهایی.' });
    }

    // --- ذخیره فایل PDF در سرور ---
    const uploadDirectory = path.join(__dirname, '..', 'uploads', 'tickets');
    
    // اطمینان از وجود دایرکتوری
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }
    
    // ایجاد نام فایل منحصر به فرد
    const uniqueFilename = `reservation-tickets-${reservationId}-${uuidv4()}.pdf`;
    const filePath = path.join(uploadDirectory, uniqueFilename);
    
    try {
      fs.writeFileSync(filePath, finalPdfBytes);
      
      // ارسال پاسخ به کلاینت
      res.json({
        success: true,
        message: 'بلیط‌ها با موفقیت تولید شدند',
        fileName: uniqueFilename,
        downloadUrl: `/api/packages/download-ticket/${uniqueFilename}`,
        passengerCount: passengers.length,
        reservationCode: reservation.code || 'بدون کد'
      });
    } catch (writeError) {
      console.error(`CRITICAL: Error writing PDF file to ${filePath}:`, writeError);
      return res.status(500).json({ message: 'خطا در ذخیره فایل PDF در سرور.' });
    }
  } catch (err) {
    console.error('خطای کلی در تولید PDF:', err);
    res.status(500).json({ message: 'خطای داخلی سرور هنگام تولید PDF.' });
  }
});

/**
 * @route   GET /api/packages/stats/summary
 * @desc    دریافت آمار پکیج‌ها بر اساس وضعیت زمانی آنها
 * @access  خصوصی
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    console.log("شروع دریافت آمار پکیج‌ها");
    
    // دریافت همه پکیج‌ها
    const packages = await Package.find({}).select('name startDate endDate startTime endTime capacity');
    console.log(`تعداد کل پکیج‌ها: ${packages.length}`);
    
    // آمار وضعیت پکیج‌ها
    const packageStats = {
      notStarted: 0,
      inProgress: 0,
      completed: 0
    };
    
    // بررسی و دسته‌بندی پکیج‌ها
    packages.forEach(pkg => {
      try {
        // استخراج مقادیر تاریخ و زمان
        const startDate = pkg.startDate || ''; // مثال: "2025/03/17" (میلادی)
        const endDate = pkg.endDate || '';     // مثال: "2025/03/20" (میلادی)
        const startTime = pkg.startTime || '00:00'; // مثال: "08:30"
        const endTime = pkg.endTime || '00:00';     // مثال: "12:00"

        console.log(`پکیج ${pkg._id || 'نامشخص'}: تاریخ شروع=${startDate} ${startTime}, تاریخ پایان=${endDate} ${endTime}`);
        
        // تبدیل به timestamp برای مقایسه دقیق‌تر (فرض بر این است که تاریخ‌ها میلادی هستند)
        // به جای استفاده از jMoment.isBefore/isAfter، از مقایسه timestamp استفاده می‌کنیم
        
        const jMoment = require('moment-jalaali');
        
        // تاریخ شروع و پایان پکیج به timestamp (میلادی)
        const startTimestamp = new Date(`${startDate.replace(/\//g, '-')}T${startTime}`).getTime();
        const endTimestamp = new Date(`${endDate.replace(/\//g, '-')}T${endTime}`).getTime();
        
        // تاریخ و زمان فعلی به timestamp (میلادی)
        const nowTimestamp = new Date().getTime();
        
        // برای اطلاعات بیشتر در لاگ، تاریخ‌ها را فرمت می‌کنیم
        const formattedNow = new Date(nowTimestamp).toISOString().replace('T', ' ').substring(0, 19);
        const formattedStart = new Date(startTimestamp).toISOString().replace('T', ' ').substring(0, 19);
        const formattedEnd = new Date(endTimestamp).toISOString().replace('T', ' ').substring(0, 19);
        
        console.log(`مقایسه timestamp: الان=${formattedNow} (${nowTimestamp}), شروع=${formattedStart} (${startTimestamp}), پایان=${formattedEnd} (${endTimestamp})`);
        
        // بررسی وضعیت زمانی پکیج با مقایسه timestamp
        if (nowTimestamp < startTimestamp) {
          // تاریخ فعلی قبل از تاریخ شروع است - در انتظار شروع
          console.log(`پکیج ${pkg._id}: در انتظار شروع (nowTimestamp < startTimestamp)`);
          packageStats.notStarted++;
        } else if (nowTimestamp > endTimestamp) {
          // تاریخ فعلی بعد از تاریخ پایان است - پایان یافته
          console.log(`پکیج ${pkg._id}: پایان یافته (nowTimestamp > endTimestamp)`);
          packageStats.completed++;
        } else {
          // تاریخ فعلی بین تاریخ شروع و پایان است - در حال اجرا
          console.log(`پکیج ${pkg._id}: در حال اجرا (startTimestamp <= nowTimestamp <= endTimestamp)`);
          packageStats.inProgress++;
        }
      } catch (error) {
        console.error(`خطا در پردازش وضعیت پکیج ${pkg._id}:`, error);
        // در صورت خطا، ادامه دهید و به وضعیت نامشخص بیفزایید (یا می‌توانید وضعیت پیش‌فرض تعیین کنید)
      }
    });
    
    console.log("آمار پکیج‌ها:", packageStats);
    
    // دریافت آمار تعداد پکیج‌ها بر اساس مقصد
    const routeAggregation = await Package.aggregate([
      {
        $lookup: {
          from: 'routes',
          localField: 'route',
          foreignField: '_id',
          as: 'routeInfo'
        }
      },
      {
        $unwind: '$routeInfo'
      },
      {
        $group: {
          _id: '$routeInfo.destination',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          destination: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // دریافت آمار رزروها
    const totalReservations = await Reservation.countDocuments();
    const confirmedReservations = await Reservation.countDocuments({ status: 'confirmed' });
    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });
    
    // آمار هتل‌ها و ایرلاین‌ها
    const totalHotels = await Hotel.countDocuments();
    const totalAirlines = await Airline.countDocuments();
    
    // تعیین 5 پکیج محبوب بر اساس تعداد رزرو
    const popularPackages = await Reservation.aggregate([
      {
        $group: {
          _id: '$package',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'packages',
          localField: '_id',
          foreignField: '_id',
          as: 'packageInfo'
        }
      },
      {
        $unwind: '$packageInfo'
      },
      {
        $project: {
          _id: 0,
          name: '$packageInfo.name',
          count: 1
        }
      }
    ]);
    
    // بازگرداندن آمار کامل
    return res.json({
      packageStats: {
        notStarted: packageStats.notStarted,
        inProgress: packageStats.inProgress,
        completed: packageStats.completed,
        total: packages.length
      },
      destinationStats: routeAggregation,
      reservationStats: {
        total: totalReservations,
        confirmed: confirmedReservations,
        pending: pendingReservations
      },
      resourceStats: {
        totalHotels,
        totalAirlines
      },
      popularPackages
    });
  } catch (err) {
    console.error('خطا در دریافت آمار پکیج‌ها:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت آمار پکیج‌ها: ${err.message}` });
  }
});

// توابع کمکی

// تبدیل تاریخ به فرمت فارسی
function formatPersianDate(dateString) {
  try {
    // بررسی خالی بودن تاریخ
    if (!dateString) {
      return '';
    }
    
    // تشخیص نوع تاریخ (میلادی یا شمسی)
    const isGregorianDate = dateString.startsWith('20') || dateString.startsWith('19'); // اگر با 20 یا 19 شروع شود احتمالاً میلادی است
    
    // اگر تاریخ شمسی است، فقط آن را برگردان
    if (!isGregorianDate) {
      const dateParts = dateString.split('/');
      if (dateParts.length === 3) {
        return dateString;
      }
    }
    
    // استفاده از جلالی-مومنت برای تبدیل تاریخ میلادی به شمسی
    const jalaliMoment = require('jalali-moment');
    
    // تبدیل فرمت yyyy/mm/dd به فرمت قابل پردازش برای جاوااسکریپت
    const normalizedDate = dateString.replace(/\//g, '-');
    
    // تبدیل به تاریخ شمسی
    const jalaliDate = jalaliMoment(normalizedDate, 'YYYY-MM-DD').locale('fa').format('jYYYY/jMM/jDD');
    
    // لاگ برای اطمینان از تبدیل صحیح
    console.log(`تبدیل تاریخ: ${dateString} (میلادی) به ${jalaliDate} (شمسی)`);
    
    return jalaliDate;
  } catch (error) {
    console.error('خطا در تبدیل تاریخ:', error);
    return dateString; // در صورت بروز خطا، همان تاریخ اصلی را برگردان
  }
}

// تبدیل اعداد به فارسی - فقط برای نمایش استفاده شود، نه برای ذخیره در PDF
function persianize(text) {
  if (!text) return '';
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(text).replace(/[0-9]/g, function(digit) {
    return persianDigits[digit];
  });
}

// محاسبه سن بر اساس تاریخ تولد
function calculateAge(birthDate) {
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    // به جای برگرداندن عدد سن، دسته‌بندی سنی را به فارسی بر می‌گردانیم
    if (age < 2) {
      return 'نوزاد';
    } else if (age < 12) {
      return 'کودک';
    } else {
      return 'بزرگسال';
    }
  } catch (error) {
    console.error('Error calculating age:', error);
    return 'بزرگسال'; // مقدار پیش‌فرض در صورت خطا
  }
}

/**
 * محاسبه سن عددی بر اساس تاریخ تولد
 * @param {string} birthDate - تاریخ تولد
 * @returns {number} سن به عدد
 */
function getNumericAge(birthDate) {
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating numeric age:', error);
    return 0; // مقدار پیش‌فرض در صورت خطا
  }
}

/**
 * @route   POST /api/packages/reservation/:id/passenger/:passengerId/generate-ticket
 * @desc    تولید بلیط برای یک مسافر خاص
 * @access  خصوصی
 */
router.post('/reservation/:id/passenger/:passengerId/generate-ticket', auth, async (req, res) => {
  try {
    const reservationId = req.params.id;
    const passengerId = req.params.passengerId;
    const { ticketType } = req.body; // رفت (departure)، برگشت (return) یا هر دو (both)
    
    // بررسی نوع بلیط
    if (!['departure', 'return', 'both'].includes(ticketType)) {
      return res.status(400).json({ message: 'نوع بلیط نامعتبر است' });
    }

    // دریافت اطلاعات رزرواسیون
    const reservation = await Reservation.findById(reservationId)
      .populate('package');
    
    if (!reservation) {
      return res.status(404).json({ message: 'رزرواسیون مورد نظر یافت نشد' });
    }

    // دریافت اطلاعات پکیج
    const packageData = await Package.findById(reservation.package._id)
      .populate('route')
      .populate({
        path: 'transportation.departureAirline',
        model: 'airline'
      })
      .populate({
        path: 'transportation.returnAirline',
        model: 'airline'
      });
    
    if (!packageData) {
      return res.status(404).json({ message: 'پکیج مربوط به این رزرواسیون یافت نشد' });
    }

    // دریافت مسافر
    const passenger = await Passenger.findOne({ _id: passengerId, reservation: reservationId });

    if (!passenger) {
      return res.status(404).json({ message: 'مسافر مورد نظر یافت نشد' });
    }

    // --- مسیر قالب و فونت --- 
    const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'package-ticket-template.pdf');
    const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'ttf', 'Vazirmatn-Regular.ttf');

    // --- خواندن فایل‌ها --- 
    let templateBytes, vazirFontBytes;
    try {
      // اگر فایل قالب وجود نداشت، از قالب بلیط شناور استفاده می‌کنیم
      if (!fs.existsSync(templatePath)) {
        const floatingTicketTemplatePath = path.join(__dirname, '..', 'assets', 'templates', 'template.pdf');
        templateBytes = fs.readFileSync(floatingTicketTemplatePath);
      } else {
        templateBytes = fs.readFileSync(templatePath);
      }
      console.log('PDF template read successfully.');
    } catch (err) {
        console.error("CRITICAL: Could not read PDF template file:", err);
        return res.status(500).json({ message: 'خطا در خواندن فایل قالب PDF.' });
    }
    
    try {
      vazirFontBytes = fs.readFileSync(fontPath);
      console.log('Vazir font file read successfully.');
    } catch (err) {
        console.warn("Could not read Vazir font file:", err, "Proceeding without custom font.");
        vazirFontBytes = null;
    }

    // ایجاد فایل PDF خروجی نهایی
    const finalPdfDoc = await PDFDocument.create();
    if (vazirFontBytes) {
      finalPdfDoc.registerFontkit(fontkit);
    }

    // مشخص کردن اطلاعات بلیط‌ها (رفت، برگشت یا هر دو)
    const ticketsToGenerate = [];
    
    // اطلاعات بلیط رفت
    if (ticketType === 'departure' || ticketType === 'both') {
      // دریافت اطلاعات فرودگاه‌ها برای این مسیر
      let fromair = '';
      let toair = '';
      let fromAirportCode = '';
      let toAirportCode = '';
      
      try {
        // استفاده از آدرس نسبی API داخلی
        const airportInfo = await axios.get(`http://185.94.99.35:5000/api/routes/airports/info/${packageData.route.origin}/${packageData.route.destination}`);
        if (airportInfo.data) {
          // استخراج اطلاعات فرودگاه‌ها
          fromair = airportInfo.data.originAirport?.name || '';
          toair = airportInfo.data.destinationAirport?.name || '';
          fromAirportCode = airportInfo.data.originAirport?.code || '';
          toAirportCode = airportInfo.data.destinationAirport?.code || '';
        }
      } catch (airportError) {
        console.error('Error fetching departure airport info:', airportError);
      }
      
      ticketsToGenerate.push({
        type: 'departure',
        origin: packageData.route.origin,
        destination: packageData.route.destination,
        fromair, // نام فرودگاه مبدا
        toair,   // نام فرودگاه مقصد
        fromAirportCode, // کد فرودگاه مبدا
        toAirportCode,   // کد فرودگاه مقصد
        date: packageData.startDate,
        time: packageData.startTime,
        airline: packageData.transportation.departureAirline,
        transportation: packageData.transportation.departure
      });
    }
    
    // اطلاعات بلیط برگشت
    if (ticketType === 'return' || ticketType === 'both') {
      // دریافت اطلاعات فرودگاه‌ها برای مسیر برگشت (مقصد به مبدا)
      let fromair = '';
      let toair = '';
      let fromAirportCode = '';
      let toAirportCode = '';
      
      try {
        // استفاده از آدرس نسبی API داخلی با معکوس کردن مبدا و مقصد
        const airportInfo = await axios.get(`http://185.94.99.35:5000/api/routes/airports/info/${packageData.route.destination}/${packageData.route.origin}`);
        if (airportInfo.data) {
          // استخراج اطلاعات فرودگاه‌ها
          fromair = airportInfo.data.originAirport?.name || '';
          toair = airportInfo.data.destinationAirport?.name || '';
          fromAirportCode = airportInfo.data.originAirport?.code || '';
          toAirportCode = airportInfo.data.destinationAirport?.code || '';
        }
      } catch (airportError) {
        console.error('Error fetching return airport info:', airportError);
      }
      
      ticketsToGenerate.push({
        type: 'return',
        origin: packageData.route.destination, // معکوس کردن مبدا و مقصد
        destination: packageData.route.origin,
        fromair, // نام فرودگاه مبدا (در مسیر برگشت)
        toair,   // نام فرودگاه مقصد (در مسیر برگشت)
        fromAirportCode, // کد فرودگاه مبدا (در مسیر برگشت)
        toAirportCode,   // کد فرودگاه مقصد (در مسیر برگشت)
        date: packageData.endDate,
        time: packageData.endTime,
        airline: packageData.transportation.returnAirline,
        transportation: packageData.transportation.return
      });
    }

    // پردازش بلیط‌های مسافر
    for (const ticketInfo of ticketsToGenerate) {
      // بررسی نوع وسیله نقلیه - اگر هوایی نیست، شاید بخواهیم رفتار متفاوتی داشته باشیم
      const isAirTransportation = ticketInfo.transportation === 'havaii';
      
      // --- بارگذاری PDF و ثبت Fontkit برای هر مسافر --- 
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(templateBytes);
        pdfDoc.registerFontkit(fontkit); 
        console.log(`PDF Template loaded for passenger ${passenger.englishFirstName} ${passenger.englishLastName}`);
      } catch (loadError) {
        console.error('CRITICAL: Error loading PDF template or registering fontkit:', loadError);
        return res.status(500).json({ message: 'خطای حیاتی در بارگذاری قالب PDF.' });
      }
      
      // --- جاسازی فونت --- 
      let vazirFont = null;
      if (vazirFontBytes) {
        try {
          vazirFont = await pdfDoc.embedFont(vazirFontBytes);
        } catch (fontEmbedError) {
          console.error("ERROR: Could not embed Vazir font:", fontEmbedError);
        }
      }
        
      // --- دریافت فرم و فیلدها --- 
      let form;
      try {
        form = pdfDoc.getForm();
        console.log("Form fields retrieved successfully.");
      } catch (formError) {
        console.error('CRITICAL: Error getting form from PDF:', formError);
        if (formError.message.includes('does not contain a form')) {
          console.warn("The PDF template does not seem to contain an AcroForm.");
        }
        return res.status(500).json({ message: 'خطای حیاتی در پردازش فرم PDF.' });
      }
      
      // عنوان نوع بلیط به فارسی (فقط برای لاگ)
      const ticketTypeText = ticketInfo.type === 'departure' ? 'بلیط رفت' : 'بلیط برگشت';
      
      // تولید شماره بلیط تصادفی
      const randomTicketNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      
      // --- نگاشت داده‌ها به نام فیلدها --- 
      // اضافه کردن لاگ برای بررسی مقادیر شماره پرواز
      console.log('FLIGHT NUMBERS DEBUG:', {
        departureFlightNumber: packageData.transportation?.departureFlightNumber || 'Not set',
        returnFlightNumber: packageData.transportation?.returnFlightNumber || 'Not set',
        ticketType: ticketInfo.type
      });
      
      const fieldDataMap = {
        'from': ticketInfo.origin || '',
        'to': ticketInfo.destination || '',
        'date': ticketInfo.date || '',
        'time': ticketInfo.time || '',
        'name': passenger.englishFirstName || '',
        'familiy': passenger.englishLastName || '',
        'pnumber': passenger.passportNumber || passenger.nationalId || '',
        'flightn': ticketInfo.type === 'departure' 
                  ? (packageData.transportation?.departureFlightNumber || 'Departure') 
                  : (packageData.transportation?.returnFlightNumber || 'Return'),
        'aircraft': isAirTransportation && ticketInfo.airline?.aircraftModel ? 
                    ticketInfo.airline.aircraftModel : 
                    '',
        'price': '', 
        'tax': '',
        'total': '',
        'logo_af_image': isAirTransportation && ticketInfo.airline?.logo ? 
                        ticketInfo.airline.logo : 
                        '',
        'age': calculateAge(passenger.birthDate) || '',
        // اضافه کردن فیلدهای فرودگاه
        'fromair': ticketInfo.fromair || '',
        'toair': ticketInfo.toair || '',
        'fromAirportCode': ticketInfo.fromAirportCode || '',
        'toAirportCode': ticketInfo.toAirportCode || ''
      };
      
      // --- محاسبه قیمت براساس رده سنی مسافر ---
      let ticketPrice = 0;
      let ticketTax = 0;
      let ticketTotal = 0;

      // محاسبه قیمت براساس رده سنی مسافر
      if (passenger.ageCategory === 'infant') {
        // نوزاد
        ticketPrice = packageData.infantPrice;
      } else {
        // بزرگسال و کودک (قیمت یکسان)
        ticketPrice = packageData.basePrice;
      }
      
      // محاسبه مالیات (در این سیستم صفر است)
      ticketTax = 0;
      
      // محاسبه جمع کل
      ticketTotal = ticketPrice + ticketTax;
      
      // به‌روزرسانی مقادیر در فیلدها
      fieldDataMap['price'] = ticketPrice.toString();
      fieldDataMap['tax'] = ticketTax.toString();
      fieldDataMap['total'] = ticketTotal.toString();
      
      // بررسی نام‌های جایگزین برای فیلدها - ممکن است نام‌های فیلدها در قالب متفاوت باشند
      const alternativeFieldNames = {
        'from': ['from', 'From', 'origin', 'Origin', 'departure', 'Departure', 'مبدا'],
        'to': ['to', 'To', 'destination', 'Destination', 'arrival', 'Arrival', 'مقصد'],
        'date': ['date', 'Date', 'flightDate', 'FlightDate', 'تاریخ'],
        'time': ['time', 'Time', 'flightTime', 'FlightTime', 'ساعت'],
        'name': ['name', 'Name', 'firstName', 'FirstName', 'نام'],
        'familiy': ['familiy', 'Familiy', 'family', 'Family', 'lastName', 'LastName', 'نام_خانوادگی', 'نام خانوادگی'],
        'pnumber': ['pnumber', 'Pnumber', 'documentNumber', 'DocumentNumber', 'passportNumber', 'PassportNumber', 'شماره_سند', 'شماره سند'],
        'flightn': ['flightn', 'Flightn', 'flightNumber', 'FlightNumber', 'شماره_پرواز', 'شماره پرواز'],
        'aircraft': ['aircraft', 'Aircraft', 'aircraftModel', 'AircraftModel', 'مدل_هواپیما', 'مدل هواپیما'],
        'price': ['price', 'Price', 'ticketPrice', 'TicketPrice', 'قیمت'],
        'tax': ['tax', 'Tax', 'مالیات'],
        'total': ['total', 'Total', 'totalPrice', 'TotalPrice', 'قیمت_کل', 'قیمت کل'],
        'logo_af_image': ['logo_af_image', 'Logo', 'logo', 'airlineLogo', 'AirlineLogo', 'لوگو'],
        'age': ['age', 'Age', 'passengerAge', 'PassengerAge', 'سن'],
        'fromair': ['fromair', 'Fromair', 'originAirport', 'OriginAirport', 'departureAirport', 'DepartureAirport', 'مبدافرودگاه'],
        'toair': ['toair', 'Toair', 'destinationAirport', 'DestinationAirport', 'arrivalAirport', 'ArrivalAirport', 'مقصدفرودگاه'],
        'fromAirportCode': ['fromAirportCode', 'FromAirportCode', 'originAirportCode', 'OriginAirportCode', 'departureAirportCode', 'DepartureAirportCode', 'مبدافرودگاهکد'],
        'toAirportCode': ['toAirportCode', 'ToAirportCode', 'destinationAirportCode', 'DestinationAirportCode', 'arrivalAirportCode', 'ArrivalAirportCode', 'مقصدفرودگاهکد']
      };
      
      // پر کردن فیلدهای فرم
      for (const [mainFieldName, fieldValue] of Object.entries(fieldDataMap)) {
        let fieldFilled = false;
        
        // ابتدا تلاش می‌کنیم با نام اصلی
        try {
          const field = form.getTextField(mainFieldName);
          if (field) {
            // field.setText(fieldValue);
            setTextWithSkyBlueColor(field, fieldValue);
            
            // مطمئن شویم که از فونت وزیر استفاده می‌کنیم
            if (vazirFont) {
              try {
                field.updateAppearances(vazirFont);
              } catch (fontError) {
                console.warn(`Could not update appearance with Vazir font for field ${mainFieldName}:`, fontError);
              }
            }
            
            fieldFilled = true;
          }
        } catch (fieldError) {
          // ادامه با نام‌های جایگزین
        }
        
        // اگر با نام اصلی موفق نبودیم، نام‌های جایگزین را امتحان می‌کنیم
        if (!fieldFilled && alternativeFieldNames[mainFieldName]) {
          for (const altFieldName of alternativeFieldNames[mainFieldName]) {
            if (altFieldName === mainFieldName) continue; // نام اصلی را دوباره امتحان نکن
            
            try {
              const field = form.getTextField(altFieldName);
              if (field) {
                // field.setText(fieldValue);
                setTextWithSkyBlueColor(field, fieldValue);
                
                // مطمئن شویم که از فونت وزیر استفاده می‌کنیم
                if (vazirFont) {
                  try {
                    field.updateAppearances(vazirFont);
                  } catch (fontError) {
                    console.warn(`Could not update appearance with Vazir font for field ${altFieldName}:`, fontError);
                  }
                }
                
                fieldFilled = true;
                break; // از حلقه خارج شو چون فیلد را پر کردیم
              }
            } catch (altFieldError) {
              // ادامه به نام جایگزین بعدی
            }
          }
        }
      }
      
      // پردازش ویژه برای لوگوی ایرلاین
      if (isAirTransportation && ticketInfo.airline?.logo) {
        try {
          console.log("RESERVATION: Processing airline logo:", ticketInfo.airline.logo);
          console.log("RESERVATION: Full airline data:", JSON.stringify(ticketInfo.airline, null, 2));
          let logoUrl = ticketInfo.airline.logo;
          let logoImage = null;
          
          // بررسی مسیر لوگو
          if (logoUrl.includes('/uploads/')) {
            // استخراج بخش آخر مسیر
            const parts = logoUrl.split('/uploads/');
            const relativePath = parts.length > 1 ? parts[1] : logoUrl;
            const filePath = path.join(__dirname, '..', 'uploads', relativePath);
            console.log(`RESERVATION: Looking for logo at: ${filePath}`);
            
            if (fs.existsSync(filePath)) {
              try {
                // خواندن فایل از مسیر محلی
                const logoBuffer = fs.readFileSync(filePath);
                console.log("RESERVATION: Logo file read successfully");
                
                // تعیین فرمت تصویر بر اساس پسوند فایل
                if (filePath.toLowerCase().endsWith('.png')) {
                  logoImage = await pdfDoc.embedPng(logoBuffer);
                } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
                  logoImage = await pdfDoc.embedJpg(logoBuffer);
                } else {
                  try {
                    logoImage = await pdfDoc.embedPng(logoBuffer);
                  } catch (e) {
                    logoImage = await pdfDoc.embedJpg(logoBuffer);
                  }
                }
                console.log("RESERVATION: Successfully loaded logo image");
              } catch (logoError) {
                console.error("RESERVATION: Error loading logo:", logoError);
              }
            } else {
              // جستجو در پوشه‌های دیگر
              console.log("RESERVATION: Logo not found, searching in alternative directories");
              const airlineLogoPath = path.join(__dirname, '..', 'uploads', 'airlines');
              if (fs.existsSync(airlineLogoPath)) {
                const fileName = path.basename(logoUrl);
                const airlineFilePath = path.join(airlineLogoPath, fileName);
                console.log(`RESERVATION: Looking for logo in airlines folder: ${airlineFilePath}`);
                
                if (fs.existsSync(airlineFilePath)) {
                  try {
                    const logoBuffer = fs.readFileSync(airlineFilePath);
                    if (airlineFilePath.toLowerCase().endsWith('.png')) {
                      logoImage = await pdfDoc.embedPng(logoBuffer);
                    } else {
                      logoImage = await pdfDoc.embedJpg(logoBuffer);
                    }
                    console.log("RESERVATION: Found logo in airlines directory");
                  } catch (err) {
                    console.error("RESERVATION: Error loading logo from airlines directory:", err);
                  }
                }
              }
            }
          }
          
          // اگر لوگو بارگذاری شد، آن را به PDF اضافه کنیم
          if (logoImage) {
            // ابتدا تلاش می‌کنیم آن را در فیلد logo_af_image قرار دهیم
            try {
              const fields = form.getFields();
              const logoField = fields.find(field => field.getName() === 'logo_af_image');
              
              if (logoField) {
                console.log(`RESERVATION: Found logo field with type: ${logoField.constructor.name}`);
                
                // بررسی نوع فیلد
                if (logoField.constructor.name === 'PDFButton') {
                  console.log("RESERVATION: Logo field is a button, setting button image");
                  try {
                    const button = form.getButton('logo_af_image');
                    button.setImage(logoImage);
                    console.log("RESERVATION: Successfully set button image");
                  } catch (buttonErr) {
                    console.error("RESERVATION: Error setting button image:", buttonErr);
                  }
                } else {
                  console.log("RESERVATION: Logo field is not a button, trying standard method");
                  try {
                    const textField = form.getTextField('logo_af_image');
                    textField.setImage(logoImage);
                    console.log("RESERVATION: Successfully set image on text field");
                  } catch (textFieldErr) {
                    console.error("RESERVATION: Error setting image on text field:", textFieldErr);
                  }
                }
              } else {
                console.log("RESERVATION: logo_af_image field not found, adding logo directly to page");
                
                // اگر فیلد پیدا نشد، لوگو را مستقیماً روی صفحه قرار می‌دهیم
                const pages = pdfDoc.getPages();
                const firstPage = pages[0];
                const { width, height } = firstPage.getSize();
                
                firstPage.drawImage(logoImage, {
                  x: width - 100,
                  y: height - 50,
                  width: 80,
                  height: 40
                });
                
                console.log("RESERVATION: Successfully added logo directly to page");
              }
            } catch (logoFieldError) {
              console.error("RESERVATION: Error processing logo field:", logoFieldError);
              
              // اگر هر خطایی رخ داد، لوگو را مستقیماً روی صفحه قرار می‌دهیم
              try {
                const pages = pdfDoc.getPages();
                const firstPage = pages[0];
                const { width, height } = firstPage.getSize();
                
                firstPage.drawImage(logoImage, {
                  x: width - 100,
                  y: height - 50,
                  width: 80,
                  height: 40
                });
                
                console.log("RESERVATION: Successfully added logo directly to page as fallback");
              } catch (drawError) {
                console.error("RESERVATION: Final error when drawing logo:", drawError);
              }
            }
          } else {
            console.log("RESERVATION: No logo image loaded, skipping logo");
          }
        } catch (mainLogoError) {
          console.error("RESERVATION: Main logo processing error:", mainLogoError);
        }
      } else {
        console.log("RESERVATION: Skip logo processing - isAirTransportation:", isAirTransportation, "has logo:", !!ticketInfo.airline?.logo);
      }
      
      // نهایی کردن فرم
      try {
        form.flatten();
      } catch (flattenError) {
        console.error('Error flattening form:', flattenError);
      }

      // --- اضافه کردن صفحات این مسافر به PDF نهایی ---
      try {
        const pdfBytes = await pdfDoc.save();
        const loadedPdf = await PDFDocument.load(pdfBytes);
        const [passengerPage] = await finalPdfDoc.copyPages(loadedPdf, [0]);
        finalPdfDoc.addPage(passengerPage);
      } catch (pageError) {
        console.error('Error adding page to final PDF:', pageError);
      }
    }

    // --- ذخیره PDF نهایی ---
    let finalPdfBytes;
    try {
      finalPdfBytes = await finalPdfDoc.save();
    } catch (saveError) {
      console.error('CRITICAL: Error saving final PDF:', saveError);
      return res.status(500).json({ message: 'خطای حیاتی در ذخیره‌سازی PDF نهایی.' });
    }

    // --- ذخیره فایل PDF در سرور ---
    const uploadDirectory = path.join(__dirname, '..', 'uploads', 'tickets');
    
    // اطمینان از وجود دایرکتوری
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }
    
    // ایجاد نام فایل منحصر به فرد
    const uniqueFilename = `passenger-ticket-${passengerId}-${uuidv4()}.pdf`;
    const filePath = path.join(uploadDirectory, uniqueFilename);
    
    try {
      fs.writeFileSync(filePath, finalPdfBytes);
      
      // ارسال پاسخ به کلاینت
      res.json({
        success: true,
        message: 'بلیط با موفقیت تولید شد',
        fileName: uniqueFilename,
        downloadUrl: `/api/packages/download-ticket/${uniqueFilename}`,
        passengerName: `${passenger.firstName} ${passenger.lastName}`
      });
    } catch (writeError) {
      console.error(`CRITICAL: Error writing PDF file to ${filePath}:`, writeError);
      return res.status(500).json({ message: 'خطا در ذخیره فایل PDF در سرور.' });
    }
  } catch (err) {
    console.error('خطای کلی در تولید PDF:', err);
    res.status(500).json({ message: 'خطای داخلی سرور هنگام تولید PDF.' });
  }
});

/**
 * تابع کمکی برای تنظیم متن با رنگ آبی آسمانی و اندازه کوچکتر
 * @param {PDFTextField} field - فیلد متنی PDF
 * @param {string} text - متن مورد نظر
 * @param {number} fontSize - اندازه فونت (به صورت اختیاری)
 */
function setTextWithSkyBlueColor(field, text, fontSize = 9) {
  try {
    // تنظیم رنگ آبی آسمانی
    field.setFontColor(rgb(0.53, 0.81, 0.92));
    
    // تنظیم اندازه فونت کوچکتر
    field.setFontSize(fontSize);
    
    // تنظیم متن
    field.setText(text || '');
  } catch (error) {
    console.error(`Error setting text with custom formatting: ${error.message}`);
    // در صورت خطا، از روش معمولی استفاده می‌کنیم
    field.setText(text || '');
  }
}

module.exports = router; 
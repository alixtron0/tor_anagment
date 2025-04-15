const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Airline = require('../models/Airline');
const Aircraft = require('../models/Aircraft');
const Route = require('../models/Route');
const City = require('../models/City');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const multer = require('multer');

/**
 * @route   GET /api/floating-ticket/airlines
 * @desc    دریافت لیست شرکت‌های هواپیمایی
 * @access  خصوصی
 */
router.get('/airlines', auth, async (req, res) => {
  try {
    const airlines = await Airline.find().select('name englishName logo');
    res.json(airlines);
  } catch (err) {
    console.error('خطا در دریافت شرکت‌های هواپیمایی:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت شرکت‌های هواپیمایی: ${err.message}` });
  }
});

/**
 * @route   GET /api/floating-ticket/aircraft
 * @desc    دریافت لیست هواپیماها
 * @access  خصوصی
 */
router.get('/aircraft', auth, async (req, res) => {
  try {
    const aircraft = await Aircraft.find().select('model manufacturer');
    res.json(aircraft);
  } catch (err) {
    console.error('خطا در دریافت لیست هواپیماها:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت لیست هواپیماها: ${err.message}` });
  }
});

/**
 * @route   GET /api/floating-ticket/routes
 * @desc    دریافت لیست مسیرهای فعال
 * @access  خصوصی
 */
router.get('/routes', auth, async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).select('origin destination estimatedDuration');
    res.json(routes);
  } catch (err) {
    console.error('خطا در دریافت مسیرها:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت مسیرها: ${err.message}` });
  }
});

/**
 * @route   GET /api/floating-ticket/cities
 * @desc    دریافت لیست شهرهای فعال برای انتخاب مبدا و مقصد
 * @access  خصوصی
 */
router.get('/cities', auth, async (req, res) => {
  try {
    const cities = await City.find({ isActive: true }).select('name').sort({ name: 1 });
    res.json(cities);
  } catch (err) {
    console.error('خطا در دریافت شهرها:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت شهرها: ${err.message}` });
  }
});

/**
 * @route   POST /api/floating-ticket/generate
 * @desc    تولید بلیط PDF با استفاده از قالب و فیلدهای فرم
 * @access  خصوصی
 */
router.post('/generate', [
  auth,
  [
    check('passengers', 'اطلاعات مسافران الزامی است').isArray({ min: 1 }),
    check('passengers.*.englishFirstName', 'نام انگلیسی الزامی است').notEmpty(),
    check('passengers.*.englishLastName', 'نام خانوادگی انگلیسی الزامی است').notEmpty(),
    check('passengers.*.documentNumber', 'شماره سند الزامی است').notEmpty(),
    check('flightInfo', 'اطلاعات پرواز الزامی است').isObject(),
    check('flightInfo.date', 'تاریخ پرواز الزامی است').notEmpty(),
    // مبدأ و مقصد اجباری نیستند اگر route ارسال شده باشد
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { passengers, flightInfo, route, airline, aircraft, sourceType } = req.body;
    
    // بررسی مقادیر مبدأ و مقصد
    let origin = flightInfo.origin;
    let destination = flightInfo.destination;

    // اگر مسیر ارسال شده باشد و نوع منبع "route" باشد، از آن استفاده می‌کنیم
    if (sourceType === 'route' && route && route._id) {
      try {
        const routeData = await Route.findById(route._id);
        if (routeData) {
          origin = routeData.origin;
          destination = routeData.destination;
        }
      } catch (routeError) {
        console.error('خطا در دریافت اطلاعات مسیر:', routeError);
        // در صورت خطا، از مقادیر ارسالی استفاده می‌کنیم
      }
    } 
    // اگر نوع منبع "city" باشد، مقادیر ارسالی را استفاده می‌کنیم
    else if (sourceType === 'city') {
      // بررسی معتبر بودن شهرهای ارسالی
      if (flightInfo.originCityId) {
        try {
          const originCity = await City.findById(flightInfo.originCityId);
          if (originCity) {
            origin = originCity.name;
          }
        } catch (cityError) {
          console.error('خطا در دریافت اطلاعات شهر مبدا:', cityError);
        }
      }
      
      if (flightInfo.destinationCityId) {
        try {
          const destinationCity = await City.findById(flightInfo.destinationCityId);
          if (destinationCity) {
            destination = destinationCity.name;
          }
        } catch (cityError) {
          console.error('خطا در دریافت اطلاعات شهر مقصد:', cityError);
        }
      }
    }

    // اطمینان از وجود مبدأ و مقصد
    if (!origin || !destination) {
      return res.status(400).json({ message: 'مبدأ و مقصد پرواز الزامی است' });
    }

    // تنظیم هدرهای CORS قبل از هدرهای دیگر
    res.setHeader('Access-Control-Allow-Origin', 'http://185.94.99.35:3000'); // اجازه به فرانت‌اند شما
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // متدهای مجاز
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-auth-token,Authorization'); // هدرهای مجاز در درخواست
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); // اجازه به مرورگر برای خواندن Content-Disposition
    res.setHeader('Access-Control-Allow-Credentials', true);

    // --- مسیر قالب و فونت --- 
    const templatePath = path.join(__dirname, '..', 'assets', 'templates', 'template.pdf');
    const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'ttf', 'Vazirmatn-Regular.ttf');

    // --- خواندن فایل‌ها --- 
    let templateBytes, vazirFontBytes;
    try {
      templateBytes = fs.readFileSync(templatePath);
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
        vazirFontBytes = null; // ادامه بدون فونت وزیر
    }

    // ایجاد یک فایل PDF خروجی نهایی که همه صفحات مسافران را در آن قرار خواهیم داد
    const finalPdfDoc = await PDFDocument.create();
    if (vazirFontBytes) {
      finalPdfDoc.registerFontkit(fontkit);
    }

    // پردازش هر مسافر و ایجاد صفحه مربوط به آن
    for (const passenger of passengers) {
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
      let vazirFont = null; // مقداردهی اولیه
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
      } catch (formError) {
          console.error('CRITICAL: Error getting form from PDF:', formError);
          if (formError.message.includes('does not contain a form')) {
               console.warn("The PDF template does not seem to contain an AcroForm.");
          }
          return res.status(500).json({ message: 'خطای حیاتی در پردازش فرم PDF.' });
      }
      
      // --- نگاشت داده‌ها به نام فیلدها --- 
      const fieldDataMap = {
        'route1': origin || '',
        'route2': destination || '',
        'flightDate': flightInfo.date ? formatPersianDate(flightInfo.date) : '',
        'flightTime': flightInfo.time || '',
        'ticket code': `TC-${uuidv4().substring(0, 8)}`,
        'name': passenger.englishFirstName || '',
        'fname': passenger.englishLastName || '',
        'docnumber': passenger.documentNumber || ''
      };

      // --- پر کردن فیلدها و تنظیم فونت --- 
      console.log(`Filling fields for passenger ${passenger.englishFirstName} ${passenger.englishLastName}`);
      let fieldsFound = 0;
      for (const fieldName in fieldDataMap) {
        try {
          const field = form.getField(fieldName);
          if (field) {
            fieldsFound++;
            const valueToSet = String(fieldDataMap[fieldName]);

            if (field.constructor.name === 'PDFTextField') {
                field.setText(valueToSet);
                if (vazirFont) {
                   try {
                       field.updateAppearances(vazirFont);
                   } catch (appearanceError) {
                       console.error(`ERROR: Could not update appearances for field '${fieldName}' with Vazir font:`, appearanceError);
                   }
                }
            }
          } else {
            console.warn(`Field with name '${fieldName}' not found in PDF template.`);
          }
        } catch (fieldError) {
            console.error(`CRITICAL: Error processing field '${fieldName}':`, fieldError);
        }
      }
          
      // --- Flatten کردن فرم --- 
      try {
        form.flatten();
        console.log(`Form flattened for passenger ${passenger.englishFirstName} ${passenger.englishLastName}`);
      } catch (flattenError) {
         console.error('CRITICAL: Error flattening the PDF form:', flattenError);
         return res.status(500).json({ message: 'خطای حیاتی در نهایی‌سازی فرم PDF.' });
      }

      // --- اضافه کردن صفحات این مسافر به PDF نهایی ---
      try {
        const pdfBytes = await pdfDoc.save();
        const loadedPdf = await PDFDocument.load(pdfBytes);
        const [passengerPage] = await finalPdfDoc.copyPages(loadedPdf, [0]); // کپی صفحه اول (و تنها صفحه) از فایل مسافر
        finalPdfDoc.addPage(passengerPage);
        console.log(`Page added to final PDF for passenger ${passenger.englishFirstName} ${passenger.englishLastName}`);
      } catch (err) {
        console.error(`Error adding page for passenger ${passenger.englishFirstName}:`, err);
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
    const generatedDir = path.join(__dirname, '..', 'assets', 'generated');
    if (!fs.existsSync(generatedDir)){
        fs.mkdirSync(generatedDir, { recursive: true });
        console.log(`Created directory: ${generatedDir}`);
    }

    const uniqueFilename = `ticket-${uuidv4()}.pdf`;
    const filePath = path.join(generatedDir, uniqueFilename);

    try {
        fs.writeFileSync(filePath, finalPdfBytes);
        console.log(`Generated PDF with ${passengers.length} passengers saved to: ${filePath}`);

        // --- زمان‌بندی حذف فایل پس از 10 دقیقه ---
        const delayMinutes = 10;
        const delayMilliseconds = delayMinutes * 60 * 1000;
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted temporary file: ${filePath}`);
                } else {
                    console.log(`File already deleted or moved: ${filePath}`);
                }
            } catch (deleteError) {
                console.error(`Error deleting temporary file ${filePath}:`, deleteError);
            }
        }, delayMilliseconds);
        
        // --- ارسال لینک دانلود به فرانت‌اند ---
        const downloadUrl = `/api/floating-ticket/download/${uniqueFilename}`;
        res.json({ downloadUrl, passengerCount: passengers.length }); // ارسال پاسخ JSON حاوی URL و تعداد مسافران

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
 * @route   GET /api/floating-ticket/:ticketId
 * @desc    دریافت بلیط با شناسه
 * @access  عمومی
 */
// این مسیر دیگر مورد نیاز نیست و با مسیر /download/:filename تداخل دارد
// router.get('/:fileName', (req, res) => {
//   try {
//     const filePath = path.join(__dirname, '..', 'uploads', req.params.fileName);
//     
//     // بررسی وجود فایل
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ message: 'بلیط مورد نظر یافت نشد' });
//     }
//     
//     // ارسال فایل
//     res.sendFile(filePath);
//   } catch (err) {
//     console.error('خطا در دریافت بلیط:', err.message);
//     res.status(500).json({ message: `خطای سرور در دریافت بلیط: ${err.message}` });
//   }
// });

/**
 * تبدیل متن انگلیسی به فارسی
 * این تابع ساده برای نمایش بهتر مبدا و مقصد است
 */
function persianize(text) {
  if (!text) return '';
  
  const persianMapping = {
    'Tehran': 'تهران',
    'Mashhad': 'مشهد',
    'Isfahan': 'اصفهان',
    'Shiraz': 'شیراز',
    'Tabriz': 'تبریز',
    'Kish': 'کیش',
    'Qeshm': 'قشم',
    'Dubai': 'دبی',
    'Istanbul': 'استانبول',
    'Ankara': 'آنکارا',
    'IKA': 'فرودگاه امام خمینی',
    'THR': 'فرودگاه مهرآباد',
    'IST': 'فرودگاه استانبول',
    'London': 'لندن',
    'Paris': 'پاریس',
    'Rome': 'رم',
    'Moscow': 'مسکو',
    'Beijing': 'پکن',
    'Tokyo': 'توکیو',
    'Delhi': 'دهلی',
    'Madrid': 'مادرید',
    'Frankfurt': 'فرانکفورت',
    'Amsterdam': 'آمستردام',
    'Doha': 'دوحه',
    'Riyadh': 'ریاض',
    'Jeddah': 'جده',
    'Kuwait': 'کویت',
    'Muscat': 'مسقط',
    'Baku': 'باکو',
    'Tbilisi': 'تفلیس'
  };
  
  if (!isNaN(text) || !text.trim()) {
    return text;
  }
  
  for (const [english, persian] of Object.entries(persianMapping)) {
    const regex = new RegExp(`\b${english}\b`, 'gi');
    text = text.replace(regex, persian);
  }
  
  return text;
}

/**
 * تبدیل تاریخ میلادی به شمسی
 */
function formatPersianDate(dateString) {
  if (!dateString) return '';
  try {
    // پیاده‌سازی دقیق ممکن است متفاوت باشد
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // بازگرداندن مقدار اصلی در صورت خطا
  }
}

/**
 * @route   GET /api/floating-ticket/download/:filename
 * @desc    دانلود بلیط PDF ذخیره شده
 * @access  عمومی
 */
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // اعتبارسنجی اولیه نام فایل (جلوگیری از path traversal)
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'نام فایل نامعتبر است' });
  }

  const generatedDir = path.join(__dirname, '..', 'assets', 'generated');
  const filePath = path.join(generatedDir, filename);

  console.log(`Download request received for: ${filename}`);
  console.log(`Attempting to download from path: ${filePath}`);

  // بررسی وجود فایل
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return res.status(404).json({ message: 'فایل یافت نشد' });
  }

  // تنظیم هدرهای CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://185.94.99.35:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-auth-token,Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // ارسال فایل برای دانلود با نام مشخص
  res.download(filePath, `tickets-${Date.now()}.pdf`, (err) => {
    if (err) {
      console.error(`Error sending file ${filename} for download:`, err);
      return res.status(500).json({ message: 'خطا در دانلود فایل' });
    }
    console.log(`File ${filename} sent successfully for download.`);
  });
});

// تنظیمات multer برای آپلود فایل
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // محدودیت 5 مگابایت
  fileFilter: (req, file, cb) => {
    // فقط فایل‌های اکسل اجازه داده شوند
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل‌های اکسل پشتیبانی می‌شوند'), false);
    }
  }
});

/**
 * @route   POST /api/floating-ticket/export-passengers
 * @desc    صادر کردن اطلاعات مسافران به عنوان فایل اکسل
 * @access  خصوصی
 */
router.post('/export-passengers', [
  auth,
  [
    check('passengers', 'اطلاعات مسافران الزامی است').isArray({ min: 1 }),
    check('flightInfo', 'اطلاعات پرواز الزامی است').isObject(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { passengers, flightInfo, airline, aircraft, sourceType } = req.body;

    // ایجاد فایل اکسل
    const workbook = new ExcelJS.Workbook();
    
    // تنظیم ویژگی‌های فایل
    workbook.creator = 'Tour Management System';
    workbook.lastModifiedBy = 'Tour Management System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // افزودن شیت اطلاعات پرواز
    const flightSheet = workbook.addWorksheet('اطلاعات پرواز', {
      properties: { tabColor: { argb: '4167B2' }, rtl: true } // فعال‌سازی راست به چپ
    });
    
    // تنظیم ستون‌های صفحه اطلاعات پرواز
    flightSheet.columns = [
      { header: 'ویژگی', key: 'property', width: 25 },
      { header: 'مقدار', key: 'value', width: 40 }
    ];
    
    // استایل هدر
    flightSheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    flightSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4167B2' } };
    flightSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
    
    // افزودن داده‌های اطلاعات پرواز
    const flightData = [
      { property: 'نوع انتخاب مسیر', value: sourceType === 'route' ? 'مسیر آماده' : 'انتخاب شهر' },
      { property: 'مبدأ', value: flightInfo.origin },
      { property: 'مقصد', value: flightInfo.destination },
      { property: 'تاریخ پرواز', value: flightInfo.date },
      { property: 'ساعت پرواز', value: flightInfo.time || 'تعیین نشده' },
      { property: 'شماره پرواز', value: flightInfo.flightNumber || 'تعیین نشده' },
      { property: 'شرکت هواپیمایی', value: airline ? airline.name : 'تعیین نشده' },
      { property: 'مدل هواپیما', value: aircraft ? `${aircraft.manufacturer} ${aircraft.model}` : 'تعیین نشده' },
      { property: 'تعداد مسافران', value: passengers.length }
    ];
    
    flightData.forEach(item => {
      flightSheet.addRow(item);
    });
    
    // تنظیم استایل برای همه سلول‌ها
    flightSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // به جز هدر
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', rtl: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // خطوط متناوب
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F2F6FC' }
            };
          });
        }
      }
    });
    
    // افزودن شیت مسافران
    const passengersSheet = workbook.addWorksheet('مسافران', {
      properties: { tabColor: { argb: '4167B2' }, rtl: true } // فعال‌سازی راست به چپ
    });
    
    // تنظیم ستون‌های صفحه مسافران
    passengersSheet.columns = [
      { header: 'ردیف', key: 'rowNumber', width: 8 },
      { header: 'نام انگلیسی', key: 'englishFirstName', width: 20 },
      { header: 'نام خانوادگی انگلیسی', key: 'englishLastName', width: 20 },
      { header: 'نوع سند', key: 'documentType', width: 15 },
      { header: 'شماره سند', key: 'documentNumber', width: 20 },
      { header: 'ملیت', key: 'nationality', width: 15 },
      { header: 'شناسه', key: 'id', width: 30, hidden: true } // شناسه مخفی برای کمک به واردات
    ];
    
    // استایل هدر مسافران
    passengersSheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    passengersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4167B2' } };
    passengersSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
    
    // افزودن داده‌های مسافران
    passengers.forEach((passenger, index) => {
      passengersSheet.addRow({
        rowNumber: index + 1,
        englishFirstName: passenger.englishFirstName,
        englishLastName: passenger.englishLastName,
        documentType: passenger.documentType === 'passport' ? 'پاسپورت' : 'کد ملی',
        documentNumber: passenger.documentNumber,
        nationality: passenger.nationality || 'تعیین نشده',
        id: passenger.id
      });
    });
    
    // تنظیم استایل برای همه سلول‌های مسافران
    passengersSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // به جز هدر
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', rtl: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // تنظیم فونت
          cell.font = { name: 'Tahoma', size: 11 };
        });
        
        // خطوط متناوب
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F2F6FC' }
            };
          });
        }
      }
    });
    
    // اضافه کردن عنوان برای شیت مسافران (به عنوان سطر ثابت)
    passengersSheet.spliceRows(1, 0, []); // افزودن یک ردیف خالی در ابتدا
    
    // مرج سلول‌ها برای عنوان
    passengersSheet.mergeCells('A1:G1');
    const titleCell = passengersSheet.getCell('A1');
    titleCell.value = 'اطلاعات مسافران'; 
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3949AB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
    passengersSheet.getRow(1).height = 30; // ارتفاع ردیف عنوان
    
    // تنظیم فریز پنل برای ستون‌های هدر
    passengersSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3', zoomScale: 100 }
    ];
    
    // تنظیم اندازه صفحه برای چاپ
    passengersSheet.pageSetup.paperSize = 9; // A4
    passengersSheet.pageSetup.orientation = 'landscape';
    passengersSheet.pageSetup.fitToPage = true;
    
    // گرفتن بافر فایل اکسل
    const buffer = await workbook.xlsx.writeBuffer();
    
    // تنظیم هدرهای CORS
    res.setHeader('Access-Control-Allow-Origin', 'http://185.94.99.35:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-auth-token,Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    // تنظیم هدرهای پاسخ برای دانلود
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=passengers-${Date.now()}.xlsx`);
    res.setHeader('Content-Length', buffer.length);
    
    // ارسال بافر
    res.send(buffer);
    
  } catch (err) {
    console.error('خطا در صادرکردن اطلاعات مسافران به اکسل:', err);
    res.status(500).json({ message: 'خطا در ایجاد فایل اکسل' });
  }
});

/**
 * @route   POST /api/floating-ticket/import-passengers
 * @desc    وارد کردن اطلاعات مسافران از فایل اکسل
 * @access  خصوصی
 */
router.post('/import-passengers', [auth, upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لطفاً یک فایل اکسل آپلود کنید' });
    }
    
    // خواندن فایل اکسل از بافر
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    // دریافت شیت مسافران
    const passengersSheet = workbook.getWorksheet('مسافران');
    
    if (!passengersSheet) {
      return res.status(400).json({ message: 'فرمت فایل نامعتبر است. شیت مسافران یافت نشد' });
    }
    
    // استخراج داده‌های مسافران
    const passengers = [];
    
    // بررسی اینکه آیا فایل اکسل دارای عنوان است یا خیر
    let startRow = 2; // شروع از ردیف 2 (پس از هدر)
    
    // اگر ردیف اول یک عنوان باشد، از ردیف 3 شروع می‌کنیم
    const firstRowCell = passengersSheet.getCell(1, 1).value;
    if (firstRowCell === 'اطلاعات مسافران') {
      startRow = 3; // شروع از ردیف 3 (پس از عنوان و هدر)
    }
    
    // خواندن هدرها برای پیدا کردن ایندکس ستون‌ها
    const headerRow = passengersSheet.getRow(startRow - 1);
    const columnIndexes = {
      rowNumber: 0,
      englishFirstName: 0,
      englishLastName: 0,
      documentType: 0,
      documentNumber: 0,
      nationality: 0,
      id: 0
    };
    
    // پیدا کردن شماره ستون‌ها با بررسی مقادیر سلول‌ها
    headerRow.eachCell((cell, colNumber) => {
      const headerValue = cell.value;
      
      if (headerValue === 'ردیف') columnIndexes.rowNumber = colNumber;
      else if (headerValue === 'نام انگلیسی') columnIndexes.englishFirstName = colNumber;
      else if (headerValue === 'نام خانوادگی انگلیسی') columnIndexes.englishLastName = colNumber;
      else if (headerValue === 'نوع سند') columnIndexes.documentType = colNumber;
      else if (headerValue === 'شماره سند') columnIndexes.documentNumber = colNumber;
      else if (headerValue === 'ملیت') columnIndexes.nationality = colNumber;
      else if (headerValue === 'شناسه') columnIndexes.id = colNumber;
    });
    
    // استخراج اطلاعات مسافران
    for (let rowNumber = startRow; rowNumber <= passengersSheet.rowCount; rowNumber++) {
      const row = passengersSheet.getRow(rowNumber);
      if (!row.hasValues) continue; // اگر سطر خالی باشد، رد می‌کنیم
      
      // استخراج داده‌های هر ستون با استفاده از شماره ستون
      let id = uuidv4(); // ایجاد شناسه جدید به صورت پیش‌فرض
      if (columnIndexes.id > 0) {
        const cellValue = row.getCell(columnIndexes.id).value;
        if (cellValue) id = cellValue.toString();
      }
      
      const englishFirstName = columnIndexes.englishFirstName > 0
        ? (row.getCell(columnIndexes.englishFirstName).value || '').toString()
        : '';
        
      const englishLastName = columnIndexes.englishLastName > 0
        ? (row.getCell(columnIndexes.englishLastName).value || '').toString()
        : '';
      
      let documentType = 'passport';  // مقدار پیش‌فرض
      if (columnIndexes.documentType > 0) {
        const documentTypeValue = row.getCell(columnIndexes.documentType).value;
        if (documentTypeValue) {
          const documentTypeStr = documentTypeValue.toString();
          documentType = (documentTypeStr === 'پاسپورت' || documentTypeStr === 'passport')
            ? 'passport'
            : 'nationalId';
        }
      }
      
      const documentNumber = columnIndexes.documentNumber > 0
        ? (row.getCell(columnIndexes.documentNumber).value || '').toString()
        : '';
        
      let nationality = 'Iranian';  // مقدار پیش‌فرض
      if (columnIndexes.nationality > 0) {
        const nationalityValue = row.getCell(columnIndexes.nationality).value;
        if (nationalityValue) nationality = nationalityValue.toString();
      }
      
      // فقط مسافران با حداقل یک فیلد معتبر را اضافه کن
      if (englishFirstName || englishLastName || documentNumber) {
        const passenger = {
          id,
          englishFirstName,
          englishLastName,
          documentType,
          documentNumber,
          nationality: nationality === 'تعیین نشده' ? 'Iranian' : nationality,
          customNationality: nationality && nationality !== 'Iranian' && nationality !== 'تعیین نشده'
        };
        
        passengers.push(passenger);
      }
    }
    
    // بررسی اطلاعات پرواز
    let flightInfo = null;
    const flightSheet = workbook.getWorksheet('اطلاعات پرواز');
    
    if (flightSheet) {
      flightInfo = {};
      
      // ماپ برای نگاشت نام ویژگی‌ها به فیلدهای مدل
      const propertyMapping = {
        'مبدأ': 'origin',
        'مقصد': 'destination',
        'تاریخ پرواز': 'date',
        'ساعت پرواز': 'time',
        'شماره پرواز': 'flightNumber'
      };
      
      // دسترسی به سلول‌ها با استفاده از اندیس ستون
      for (let rowNumber = 2; rowNumber <= flightSheet.rowCount; rowNumber++) {
        const row = flightSheet.getRow(rowNumber);
        if (!row.hasValues) continue; // رد کردن سطرهای خالی
        
        const property = row.getCell(1).value;  // عنوان ویژگی در ستون اول
        const value = row.getCell(2).value;     // مقدار ویژگی در ستون دوم
        
        if (property && value && propertyMapping[property] && value !== 'تعیین نشده') {
          flightInfo[propertyMapping[property]] = value.toString();
        }
      }
    }
    
    // اگر هیچ مسافری پیدا نشد
    if (passengers.length === 0) {
      return res.status(400).json({ message: 'هیچ اطلاعات معتبری برای مسافران در فایل پیدا نشد' });
    }
    
    // پاسخ به درخواست
    res.json({ 
      message: `${passengers.length} مسافر با موفقیت بارگذاری شد`,
      passengers,
      flightInfo
    });
    
  } catch (err) {
    console.error('خطا در وارد کردن اطلاعات مسافران از اکسل:', err);
    res.status(500).json({ message: 'خطا در پردازش فایل اکسل' });
  }
});

module.exports = router; 
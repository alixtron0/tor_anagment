const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Airline = require('../models/Airline');
const Aircraft = require('../models/Aircraft');
const Route = require('../models/Route');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
    const { passengers, flightInfo, route } = req.body;
    
    // بررسی مقادیر مبدأ و مقصد
    let origin = flightInfo.origin;
    let destination = flightInfo.destination;

    // اگر مسیر ارسال شده باشد، از آن استفاده می‌کنیم
    if (route && route._id) {
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

module.exports = router; 
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Airline = require('../models/Airline');
const Aircraft = require('../models/Aircraft');
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
    check('flightInfo.origin', 'مبدأ پرواز الزامی است').notEmpty(),
    check('flightInfo.destination', 'مقصد پرواز الزامی است').notEmpty(),
    check('flightInfo.date', 'تاریخ پرواز الزامی است').notEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { passengers, flightInfo } = req.body;
    const passenger = passengers[0]; 

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

    // --- بارگذاری PDF و ثبت Fontkit --- 
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit); 
      console.log('PDF Template loaded and fontkit registered successfully.'); // لاگ موفقیت
    } catch (loadError) {
      console.error('CRITICAL: Error loading PDF template or registering fontkit:', loadError);
      return res.status(500).json({ message: 'خطای حیاتی در بارگذاری قالب PDF.' });
    }
    
    // --- جاسازی فونت --- 
    let vazirFont = null; // مقداردهی اولیه
    if (vazirFontBytes) {
      try {
        vazirFont = await pdfDoc.embedFont(vazirFontBytes);
        console.log('Vazir font embedded successfully.'); // لاگ موفقیت
      } catch (fontEmbedError) {
          console.error("ERROR: Could not embed Vazir font:", fontEmbedError);
      }
      } else {
        console.log("Vazir font bytes not available, using default font.");
      }
      
    // --- دریافت فرم و فیلدها --- 
    let form;
    try {
       form = pdfDoc.getForm();
       console.log('PDF form retrieved successfully.'); // لاگ موفقیت
    } catch (formError) {
        console.error('CRITICAL: Error getting form from PDF:', formError);
        if (formError.message.includes('does not contain a form')) {
             console.warn("The PDF template does not seem to contain an AcroForm. Check if fields were added correctly using 'Prepare Form' tool.");
        }
        return res.status(500).json({ message: 'خطای حیاتی در پردازش فرم PDF.' });
    }
    
    // --- نگاشت داده‌ها به نام فیلدها --- 
    const fieldDataMap = {
      'route1': flightInfo.origin || '',
      'route2': flightInfo.destination || '',
      'flightDate': flightInfo.date ? formatPersianDate(flightInfo.date) : '',
      'flightTime': flightInfo.time || '',
      'ticket code': `TC-${uuidv4().substring(0, 8)}`,
      'name': passenger.englishFirstName || '',
      'fname': passenger.englishLastName || '',
      'docnumber': passenger.documentNumber || ''
    };

    // --- پر کردن فیلدها و تنظیم فونت --- 
    console.log('Attempting to fill form fields...'); // لاگ شروع
    let fieldsFound = 0;
    for (const fieldName in fieldDataMap) {
      try {
        const field = form.getField(fieldName);
        if (field) {
          fieldsFound++;
          const valueToSet = String(fieldDataMap[fieldName]);
          console.log(`Setting field '${fieldName}' with value: "${valueToSet}"`);

          if (field.constructor.name === 'PDFTextField') {
              field.setText(valueToSet);
              if (vazirFont) {
                 try {
                     field.updateAppearances(vazirFont);
                 } catch (appearanceError) {
                     console.error(`ERROR: Could not update appearances for field '${fieldName}' with Vazir font:`, appearanceError);
        }
              } // else { maybe update with default font }
          }
          // else if (field.constructor.name === 'PDFCheckBox') { ... }

          } else {
           console.warn(`Field with name '${fieldName}' not found in PDF template.`);
          }
      } catch (fieldError) {
          console.error(`CRITICAL: Error processing field '${fieldName}':`, fieldError);
      }
    }
     if (fieldsFound === 0) {
         console.error("CRITICAL: No form fields were found or processed. Check field names in template and fieldDataMap.");
     }
    console.log(`Finished filling form fields. ${fieldsFound} fields processed.`);
        
    // --- Flatten کردن فرم --- 
    try {
      form.flatten();
      console.log('Form flattened successfully.'); // لاگ موفقیت
    } catch (flattenError) {
       console.error('CRITICAL: Error flattening the PDF form:', flattenError);
       return res.status(500).json({ message: 'خطای حیاتی در نهایی‌سازی فرم PDF.' });
    }

    // --- سریالایز کردن PDF و ارسال --- 
    let pdfBytes;
    try {
       pdfBytes = await pdfDoc.save();
       console.log('PDF saved to bytes successfully.'); // لاگ موفقیت
    } catch (saveError) {
        console.error('CRITICAL: Error saving PDF to bytes:', saveError);
        return res.status(500).json({ message: 'خطای حیاتی در ذخیره‌سازی PDF.' });
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
        fs.writeFileSync(filePath, pdfBytes);
        console.log(`Generated PDF saved to: ${filePath}`);

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
        res.json({ downloadUrl }); // ارسال پاسخ JSON حاوی URL

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
router.get('/:fileName', (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', req.params.fileName);
    
    // بررسی وجود فایل
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'بلیط مورد نظر یافت نشد' });
    }
    
    // ارسال فایل
    res.sendFile(filePath);
  } catch (err) {
    console.error('خطا در دریافت بلیط:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت بلیط: ${err.message}` });
  }
});

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

// مسیر GET برای دانلود فایل ذخیره شده
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    // اعتبارسنجی اولیه نام فایل (جلوگیری از path traversal)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).send('نام فایل نامعتبر است.');
    }

    const generatedDir = path.join(__dirname, '..', 'assets', 'generated');
    const filePath = path.join(generatedDir, filename);

    console.log(`Download request received for: ${filename}`);
    console.log(`Attempting to download from path: ${filePath}`);

    // بررسی وجود فایل
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error(`Error sending file ${filename} for download:`, err);
            } else {
                console.log(`File ${filename} sent successfully for download.`);
            }
        });
    } else {
        console.warn(`File not found for download request: ${filePath}`);
        res.status(404).send('فایل مورد نظر یافت نشد. ممکن است منقضی شده باشد.');
    }
});

module.exports = router; 
module.exports = router; 
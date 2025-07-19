const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Airline = require('../models/Airline');
const Route = require('../models/Route');
const City = require('../models/City');
const FloatingTicket = require('../models/FloatingTicket');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const multer = require('multer');
const axios = require('axios');
const moment = require('moment-jalaali'); // اضافه کردن کتابخانه moment-jalaali

/**
 * @route   GET /api/floating-ticket/airlines
 * @desc    دریافت لیست شرکت‌های هواپیمایی
 * @access  خصوصی
 */
router.get('/airlines', auth, async (req, res) => {
  try {
    const airlines = await Airline.find().select('name englishName logo aircraftModel');
    res.json(airlines);
  } catch (err) {
    console.error('خطا در دریافت شرکت‌های هواپیمایی:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت شرکت‌های هواپیمایی: ${err.message}` });
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
 * @route   GET /api/floating-ticket/airline/:id
 * @desc    دریافت اطلاعات کامل یک شرکت هواپیمایی
 * @access  خصوصی
 */
router.get('/airline/:id', auth, async (req, res) => {
  try {
    const airline = await Airline.findById(req.params.id);
    
    if (!airline) {
      return res.status(404).json({ message: 'شرکت هواپیمایی یافت نشد' });
    }
    
    res.json(airline);
  } catch (err) {
    console.error('خطا در دریافت اطلاعات شرکت هواپیمایی:', err.message);
    res.status(500).json({ message: `خطای سرور در دریافت اطلاعات شرکت هواپیمایی: ${err.message}` });
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
    const { passengers, flightInfo, route, airline, sourceType, exportType = 'system' } = req.body;
    
    // لاگ درخواست برای دیباگ
    console.log("================== REQUEST DATA DEBUG ==================");
    console.log("Airline from request:", JSON.stringify(airline, null, 2));
    console.log("AircraftModel from airline:", airline?.aircraftModel || "Not available");
    console.log("FlightInfo from request:", JSON.stringify(flightInfo, null, 2));
    console.log("======================================================");
    
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
          
          // دریافت اطلاعات فرودگاه‌ها از API جدید
          try {
            // استفاده از آدرس نسبی API داخلی
            const airportInfo = await axios.get(`http://localhost:5000/api/routes/ticket-airports/${route._id}`);
            if (airportInfo.data) {
              // افزودن فیلدهای فرودگاه به flightInfo
              flightInfo.fromair = airportInfo.data.fromair || '';
              flightInfo.toair = airportInfo.data.toair || '';
              flightInfo.fromAirportCode = airportInfo.data.fromAirportCode || '';
              flightInfo.toAirportCode = airportInfo.data.toAirportCode || '';
              console.log('Airport info retrieved from API:', flightInfo.fromair, flightInfo.toair);
            }
          } catch (airportError) {
            console.error('Error fetching airport info from API:', airportError);
            // خطا را نادیده می‌گیریم و بدون اطلاعات فرودگاه ادامه می‌دهیم
          }
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
            // اضافه کردن اطلاعات فرودگاه مبدا
            if (originCity.airport && originCity.airport.name) {
              flightInfo.fromair = originCity.airport.name;
              flightInfo.fromAirportCode = originCity.airport.code || '';
            }
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
            // اضافه کردن اطلاعات فرودگاه مقصد
            if (destinationCity.airport && destinationCity.airport.name) {
              flightInfo.toair = destinationCity.airport.name;
              flightInfo.toAirportCode = destinationCity.airport.code || '';
            }
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
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // اجازه به فرانت‌اند شما
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
        'from': origin || '',
        'to': destination || '',
        'date': flightInfo.date ? formatPersianDate(flightInfo.date) : '',
        'time': flightInfo.time ? formatTimeToHours24(flightInfo.time) : '',
        'name': passenger.englishFirstName || '',
        'familiy': passenger.englishLastName || '',
        'pnumber': passenger.documentNumber || '',
        'pexpiry': passenger.passportExpiry ? formatPersianDate(passenger.passportExpiry) : '',
        'flightn': flightInfo.flightNumber || '',
        'aircraft': airline && airline.aircraftModel ? 
                      airline.aircraftModel : 
                      flightInfo.aircraft || '',
        'price': flightInfo.price ? formatNumber(flightInfo.price) : '',
        'tax': flightInfo.tax ? formatNumber(flightInfo.tax) : '',
        'total': flightInfo.price && flightInfo.tax ? 
                 formatNumber(parseInt(flightInfo.price.toString().replace(/,/g, '')) + parseInt(flightInfo.tax.toString().replace(/,/g, ''))) : '',
        'logo_af_image': airline && airline.logo ? airline.logo : '',
        'age': passenger.birthDate ? calculateAgeCategory(passenger.birthDate) : '---',
        // اضافه کردن فیلدهای فرودگاه
        'fromair': flightInfo.fromair || '',
        'toair': flightInfo.toair || '',
        'fromAirportCode': flightInfo.fromAirportCode || '',
        'toAirportCode': flightInfo.toAirportCode || ''
      };

      // لاگ کردن همه فیلدهای موجود در فرم برای دیباگ
      console.log("------ لیست تمام فیلدهای PDF ------");
      const formFields = form.getFields();
      formFields.forEach(field => {
        console.log(`Field Name: "${field.getName()}", Type: "${field.constructor.name}"`);
      });
      console.log("----------------------------------");

      // لاگ مقادیر مهم
      console.log("Airline info:", airline ? `${airline.name} (${airline.englishName})` : "None");
      console.log("Airline logo path:", airline && airline.logo ? airline.logo : "None");
      console.log("Airline aircraftModel:", airline && airline.aircraftModel ? airline.aircraftModel : "Not found");
      console.log("Complete airline object:", JSON.stringify(airline, null, 2));

      // --- پر کردن فیلدها و تنظیم فونت --- 
      console.log(`Filling fields for passenger ${passenger.englishFirstName} ${passenger.englishLastName}`);
      let fieldsFound = 0;
      
      // متغیر لوگو باید قبل از حلقه تعریف شود
      let logoImage = null; // تعریف متغیر logoImage در سطح بالاتر
      
      // درج مستقیم لوگوی ایرلاین در PDF
      if (airline && airline.logo) {
        try {
          // دریافت لوگو از مسیر کامل
          let logoUrl = airline.logo;
          
          // بررسی فرمت آدرس لوگو و اصلاح آن
          if (logoUrl.includes('http://localhost:5000/uploads/')) {
            // اگر آدرس کامل است، فقط مسیر فایل را استخراج می‌کنیم
            const parts = logoUrl.split('/uploads/');
            if (parts.length > 1) {
              const filePath = path.join(__dirname, '..', 'uploads', parts[1]);
              console.log(`Reading logo from local path: ${filePath}`);
              
              if (fs.existsSync(filePath)) {
                // خواندن فایل از مسیر محلی
                const logoBuffer = fs.readFileSync(filePath);
                
                // تعیین فرمت تصویر بر اساس پسوند فایل
                if (filePath.toLowerCase().endsWith('.png')) {
                  logoImage = await pdfDoc.embedPng(logoBuffer);
                } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
                  logoImage = await pdfDoc.embedJpg(logoBuffer);
                } else {
                  // برای فرمت‌های دیگر تلاش کنیم با PNG
                  try {
                    logoImage = await pdfDoc.embedPng(logoBuffer);
                  } catch (e) {
                    try {
                      logoImage = await pdfDoc.embedJpg(logoBuffer);
                    } catch (e2) {
                      console.error("Could not embed image as PNG or JPG");
                      throw e2;
                    }
                  }
                }
                
                console.log("Successfully loaded logo image from local file");
              } else {
                console.error(`Logo file not found at: ${filePath}`);
              }
            }
          } else if (logoUrl.startsWith('/uploads/')) {
            // اگر مسیر نسبی است (شروع با /uploads/)
            const filePath = path.join(__dirname, '..', logoUrl);
            console.log(`Reading logo from path: ${filePath}`);
            
            if (fs.existsSync(filePath)) {
              // خواندن فایل از مسیر محلی
              const logoBuffer = fs.readFileSync(filePath);
              
              // تعیین فرمت تصویر بر اساس پسوند فایل
              if (filePath.toLowerCase().endsWith('.png')) {
                logoImage = await pdfDoc.embedPng(logoBuffer);
              } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
                logoImage = await pdfDoc.embedJpg(logoBuffer);
              } else {
                // برای فرمت‌های دیگر تلاش کنیم با PNG
                try {
                  logoImage = await pdfDoc.embedPng(logoBuffer);
                } catch (e) {
                  try {
                    logoImage = await pdfDoc.embedJpg(logoBuffer);
                  } catch (e2) {
                    console.error("Could not embed image as PNG or JPG");
                    throw e2;
                  }
                }
              }
              
              console.log("Successfully loaded logo image from relative path");
            } else {
              console.error(`Logo file not found at: ${filePath}`);
              
              // تلاش برای یافتن لوگو در مسیر پیش‌فرض uploads/airlines
              const defaultAirlinePath = path.join(__dirname, '..', 'uploads', 'airlines');
              if (fs.existsSync(defaultAirlinePath)) {
                // بررسی همه فایل‌های موجود در پوشه airlines
                const files = fs.readdirSync(defaultAirlinePath);
                const filename = path.basename(logoUrl);
                
                if (files.includes(filename)) {
                  // اگر فایل با همین نام یافت شد
                  const fullPath = path.join(defaultAirlinePath, filename);
                  console.log(`Found logo in default airlines folder: ${fullPath}`);
                  
                  // خواندن فایل از مسیر محلی
                  const logoBuffer = fs.readFileSync(fullPath);
                  
                  // تعیین فرمت تصویر بر اساس پسوند فایل
                  if (fullPath.toLowerCase().endsWith('.png')) {
                    logoImage = await pdfDoc.embedPng(logoBuffer);
                  } else if (fullPath.toLowerCase().endsWith('.jpg') || fullPath.toLowerCase().endsWith('.jpeg')) {
                    logoImage = await pdfDoc.embedJpg(logoBuffer);
                  } else {
                    try {
                      logoImage = await pdfDoc.embedPng(logoBuffer);
                    } catch (e) {
                      try {
                        logoImage = await pdfDoc.embedJpg(logoBuffer);
                      } catch (e2) {
                        console.error("Could not embed image as PNG or JPG");
                        throw e2;
                      }
                    }
                  }
                  
                  console.log("Successfully loaded logo image from default airlines folder");
                }
              }
            }
          } else {
            // اضافه کردن پروتکل و دامنه اگر نیاز باشد - روش قدیمی با دانلود
            if (!logoUrl.startsWith('http')) {
              const serverBaseUrl = 'http://localhost:5000';
              logoUrl = `${serverBaseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
            }
            console.log(`Downloading logo from URL: ${logoUrl}`);
            
            // دانلود تصویر از URL
            const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
            const logoBuffer = Buffer.from(logoResponse.data);
            
            // تعیین فرمت تصویر بر اساس پسوند URL
            if (logoUrl.toLowerCase().endsWith('.png')) {
              logoImage = await pdfDoc.embedPng(logoBuffer);
            } else if (logoUrl.toLowerCase().endsWith('.jpg') || logoUrl.toLowerCase().endsWith('.jpeg')) {
              logoImage = await pdfDoc.embedJpg(logoBuffer);
            } else {
              // برای فرمت‌های دیگر تلاش کنیم با PNG
              try {
                logoImage = await pdfDoc.embedPng(logoBuffer);
              } catch (e) {
                try {
                  logoImage = await pdfDoc.embedJpg(logoBuffer);
                } catch (e2) {
                  console.error("Could not embed image as PNG or JPG");
                  throw e2;
                }
              }
            }
            
            console.log("Successfully loaded logo image from URL");
          }
          
          // اگر هنوز لوگویی پیدا نشده، یک لوگوی پیش‌فرض اضافه کنیم
          if (!logoImage) {
            try {
              console.log("No logo found, using fallback approach to insert logo");
              
              // اگر هنوز لوگو را پیدا نکرده‌ایم و نام فایل در الگوی airline-TIMESTAMP.jpg است
              if (!logoImage && airline && airline.logo && /airline-\d+\.(?:jpg|jpeg|png)$/i.test(airline.logo)) {
                const airlineLogo = airline.logo;
                const filePattern = path.basename(airlineLogo);
                console.log(`Trying to find logo by pattern: ${filePattern}`);
                
                const airlineUploadDir = path.join(__dirname, '..', 'uploads', 'airlines');
                if (fs.existsSync(airlineUploadDir)) {
                  const files = fs.readdirSync(airlineUploadDir);
                  // جستجو برای فایلی که با این الگو مطابقت دارد
                  for (const file of files) {
                    if (file.toLowerCase().includes('airline-')) {
                      console.log(`Found potential logo match: ${file}`);
                      const fullPath = path.join(airlineUploadDir, file);
                      
                      try {
                        // خواندن فایل از مسیر محلی
                        const logoBuffer = fs.readFileSync(fullPath);
                        
                        // تعیین فرمت تصویر بر اساس پسوند فایل
                        if (file.toLowerCase().endsWith('.png')) {
                          logoImage = await pdfDoc.embedPng(logoBuffer);
                        } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
                          logoImage = await pdfDoc.embedJpg(logoBuffer);
                        } else {
                          continue; // به فایل بعدی برو
                        }
                        
                        // اگر موفق به بارگذاری تصویر شدیم، از حلقه خارج شو
                        if (logoImage) {
                          console.log(`Successfully loaded logo: ${file}`);
                          break;
                        }
                      } catch (error) {
                        console.error(`Error loading logo ${file}:`, error);
                      }
                    }
                  }
                }
              }
            } catch (patternMatchError) {
              console.error("Error in airline logo pattern matching:", patternMatchError);
            }
          }
        } catch (logoError) {
          console.error("Error processing airline logo:", logoError);
        }
      }
      
      // روش نهایی: اگر هنوز هیچ لوگویی پیدا نشده است، در کل پوشه airlines جستجو کنیم
      if (!logoImage) {
        try {
          console.log("No logo found yet, searching for any image in airlines directory");
          const airlineDir = path.join(__dirname, '..', 'uploads', 'airlines');
          
          if (fs.existsSync(airlineDir)) {
            const files = fs.readdirSync(airlineDir);
            
            for (const file of files) {
              if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
                console.log(`Trying generic logo: ${file}`);
                const fullPath = path.join(airlineDir, file);
                
                try {
                  const logoBuffer = fs.readFileSync(fullPath);
                  let embedLogo = null;
                  
                  if (file.toLowerCase().endsWith('.png')) {
                    embedLogo = await pdfDoc.embedPng(logoBuffer);
                  } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
                    embedLogo = await pdfDoc.embedJpg(logoBuffer);
                  }
                  
                  if (embedLogo) {
                    logoImage = embedLogo;
                    console.log(`Successfully loaded generic logo: ${file}`);
                    break;
                  }
                } catch (error) {
                  console.error(`Error processing generic logo ${file}:`, error);
                }
              }
            }
          }
        } catch (fallbackError) {
          console.error("Error in fallback logo detection:", fallbackError);
        }
      }
      
      for (const fieldName in fieldDataMap) {
        try {
          // پردازش ویژه برای فیلد logo_af_image
          if (fieldName === 'logo_af_image') {
            console.log("Processing logo_af_image field");
            try {
              // بررسی نوع فیلد logo_af_image (ممکن است دکمه باشد یا فیلد دیگری)
              const fields = form.getFields();
              const logoField = fields.find(field => field.getName() === 'logo_af_image');
              
              if (logoField) {
                console.log(`Found logo field with type: ${logoField.constructor.name}`);
                
                // اگر فیلد از نوع دکمه است
                if (logoField.constructor.name === 'PDFButton') {
                  console.log("Logo field is a button, trying to set image as button icon");
                  
                  try {
                    // تلاش برای تنظیم تصویر روی دکمه
                    const button = form.getButton('logo_af_image');
                    if (button && logoImage) {
                      // تنظیم آیکون دکمه با لوگو
                      button.setImage(logoImage);
                      console.log("Successfully set button image icon");
                    } else {
                      console.warn("Button not found via getButton method or logoImage is null");
                    }
                  } catch (buttonError) {
                    console.error("Error setting button image:", buttonError);
                  }
                } else {
                  console.log("Logo field is not a button, using standard method");
                  // استفاده از روش استاندارد برای فیلد تصویر
                  try {
                    if (logoImage) {
                      form.getTextField('logo_af_image').setImage(logoImage);
                    }
                  } catch (textFieldError) {
                    console.error("Error setting image to text field:", textFieldError);
                  }
                }
              } else {
                console.warn("logo_af_image field not found");
              }
            } catch (logoFieldError) {
              console.error("Error processing logo_af_image field:", logoFieldError);
            }
            
            continue; // پردازش فیلد logo_af_image تمام شد
          }
          
          const field = form.getTextField(fieldName);
          if (field) {
            fieldsFound++;
            const valueToSet = String(fieldDataMap[fieldName]);

            // اگر فیلد قیمت کل است، مطمئن شویم که به درستی محاسبه شده
            if (fieldName === 'total' && flightInfo.price && flightInfo.tax) {
                const price = parseInt(flightInfo.price.toString().replace(/,/g, '')) || 0;
                const tax = parseInt(flightInfo.tax.toString().replace(/,/g, '')) || 0;
                const total = price + tax;
                setTextWithSkyBlueColor(field, formatNumber(total));
                console.log(`Setting total field: price ${price} + tax ${tax} = total ${formatNumber(total)}`);
            } else if (fieldName === 'aircraft') {
                // اطمینان حاصل کنیم که نام هواپیما به درستی تنظیم می‌شود
                let aircraftText = "";
                console.log("DEBUG FIELD AIRCRAFT: Start setting aircraft field");
                console.log("- Check 1: airline exists?", airline ? "Yes" : "No");
                console.log("- Check 2: airline.aircraftModel exists?", airline && airline.aircraftModel ? "Yes" : "No");
                
                if (airline && airline.aircraftModel) {
                    // استفاده از مدل هواپیما از اطلاعات شرکت هواپیمایی - اولویت اول
                    aircraftText = airline.aircraftModel;
                    console.log(`Using airline.aircraftModel: "${aircraftText}"`);
                } else if (flightInfo.aircraft) {
                    // استفاده از اطلاعات در flightInfo (احتمالاً تنظیم دستی) - اولویت دوم
                    aircraftText = flightInfo.aircraft;
                    console.log(`Using flightInfo.aircraft: "${aircraftText}"`);
                }
                console.log(`Setting aircraft field to: "${aircraftText}"`);
                setTextWithSkyBlueColor(field, aircraftText);
            } else {
                setTextWithSkyBlueColor(field, valueToSet);
            }
            
            // قرار دادن متن در وسط فیلد
            try {
                field.setAlignment('Center'); // از 'Center' با حرف بزرگ استفاده می‌کنیم به جای 'center'
            } catch (alignmentError) {
                console.warn(`Could not set alignment for field '${fieldName}':`, alignmentError);
            }
            
            if (vazirFont) {
               try {
                   field.updateAppearances(vazirFont);
               } catch (appearanceError) {
                   console.error(`ERROR: Could not update appearances for field '${fieldName}' with Vazir font:`, appearanceError);
               }
            }
          } else {
            console.warn(`TextField with name '${fieldName}' not found in PDF template.`);
            
            // تلاش برای یافتن فیلد به عنوان نوع دیگری از فیلد
            try {
              const alternativeField = form.getField(fieldName);
              if (alternativeField) {
                console.log(`Found field '${fieldName}' as ${alternativeField.constructor.name} instead of TextField`);
              }
            } catch (altFieldError) {
              // فیلد به هیچ شکلی یافت نشد، نیازی به لاگ اضافی نیست
            }
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

        // --- ذخیره اطلاعات بلیط در دیتابیس ---
        try {
            const floatingTicket = new FloatingTicket({
                passengers,
                flightInfo: {
                    ...flightInfo,
                    origin,
                    destination,
                    routeId: sourceType === 'route' && route ? route._id : undefined
                },
                airline: airline ? {
                    _id: airline._id,
                    name: airline.name,
                    englishName: airline.englishName,
                    logo: airline.logo,
                    aircraftModel: airline.aircraftModel
                } : undefined,
                sourceType,
                pdfPath: filePath,
                createdBy: req.user.id
            });
            
            await floatingTicket.save();
            console.log(`Floating ticket data saved to database with ID: ${floatingTicket._id}`);
        } catch (dbError) {
            console.error('Error saving floating ticket data to database:', dbError);
            // ادامه روند اجرا حتی در صورت خطا در ذخیره‌سازی دیتابیس
        }

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
 * فرمت‌دهی اعداد با جداکننده هزارگان
 * @param {number|string} number - عدد یا رشته عددی برای فرمت‌دهی
 * @returns {string} عدد فرمت‌شده با جداکننده هزارگان
 */
function formatNumber(number) {
  if (!number) return '';
  
  // تبدیل به عدد اگر رشته است
  const num = typeof number === 'string' ? parseFloat(number.replace(/,/g, '')) : number;
  
  // بررسی معتبر بودن عدد
  if (isNaN(num)) return number;
  
  // فرمت‌دهی با جداکننده هزارگان
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

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
 * محاسبه دسته سنی بر اساس تاریخ تولد
 * @param {string} birthDateString - تاریخ تولد به فرمت YYYY/MM/DD
 * @returns {string} دسته سنی (بزرگسال، کودک، نوزاد)
 */
function calculateAgeCategory(birthDateString) {
  try {
    // تبدیل تاریخ تولد به آبجکت moment
    const birthDate = moment(birthDateString, 'YYYY/MM/DD');
    const now = moment();
    
    // محاسبه سن به سال
    const ageYears = now.diff(birthDate, 'years');
    
    // تعیین دسته سنی
    if (ageYears >= 12) {
      return 'بزرگسال';
    } else if (ageYears >= 2) {
      return 'کودک';
    } else {
      return 'نوزاد';
    }
  } catch (error) {
    console.error('خطا در محاسبه دسته سنی:', error);
    return '---';  // برگرداندن مقدار پیش‌فرض در صورت خطا
  }
}

/**
 * تبدیل تاریخ شمسی به قالب استاندارد
 */
function formatPersianDate(dateString) {
  if (!dateString) return '';
  try {
    // اگر تاریخ خالی است، مقدار خالی برگردان
    if (dateString.trim() === '') {
      return '';
    }
    
    // استفاده از جلالی-مومنت برای تبدیل تاریخ میلادی به شمسی
    const jalaliMoment = require('jalali-moment');
    
    // همه تاریخ‌ها را به عنوان میلادی در نظر بگیر و به شمسی تبدیل کن
    let mDate;
    
    // بررسی فرمت‌های مختلف تاریخ
    if (dateString.includes('-')) {
      // فرمت ISO (YYYY-MM-DD)
      mDate = jalaliMoment(dateString, 'YYYY-MM-DD');
    } 
    else if (dateString.includes('/')) {
      // فرمت YYYY/MM/DD یا MM/DD/YYYY
      const parts = dateString.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // تاریخ در فرمت YYYY/MM/DD است (احتمالاً میلادی)
          const normalizedDate = dateString.replace(/\//g, '-');
          mDate = jalaliMoment(normalizedDate, 'YYYY-MM-DD');
        } else {
          // فرمت MM/DD/YYYY
          mDate = jalaliMoment(dateString, 'MM/DD/YYYY');
        }
      }
    } 
    else {
      // سایر فرمت‌ها
      mDate = jalaliMoment(dateString);
    }
    
    // بررسی اعتبار تاریخ
    if (mDate && mDate.isValid()) {
      // تبدیل به شمسی با فرمت YYYY/MM/DD
      const jalaliDate = mDate.locale('fa').format('jYYYY/jMM/jDD');
      console.log(`تبدیل تاریخ: ${dateString} (میلادی) به ${jalaliDate} (شمسی)`);
      return jalaliDate;
    }
    
    console.warn(`تاریخ '${dateString}' با فرمت نامعتبر یا ناشناخته. برگرداندن همان تاریخ.`);
    return dateString; // اگر نتوانستیم تبدیل کنیم، همان مقدار اصلی را برمی‌گردانیم
  } catch (e) {
    console.error("خطا در تبدیل تاریخ:", e);
    return dateString; // بازگرداندن مقدار اصلی در صورت خطا
  }
}

/**
 * تابع تبدیل زمان به فرمت 24 ساعته
 */
function formatTimeToHours24(timeString) {
  if (!timeString) return '';
  
  try {
    // اگر زمان از قبل در فرمت 24 ساعته باشد، آن را برمی‌گردانیم
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(timeString)) {
      // اطمینان از اینکه فرمت دو رقمی باشد (مثلاً 9:30 را به 09:30 تبدیل می‌کنیم)
      const [hours, minutes] = timeString.split(':');
      const formattedHours = hours.padStart(2, '0');
      const formattedMinutes = minutes.padStart(2, '0');
      return `${formattedHours}:${formattedMinutes}`;
    }
    
    // اگر در فرمت 12 ساعته با AM/PM باشد، آن را به 24 ساعته تبدیل می‌کنیم
    const timeWithAMPM = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM|ق.ظ|ب.ظ)$/i;
    const match = timeString.match(timeWithAMPM);
    
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === 'PM' || period === 'ب.ظ') {
        if (hours < 12) hours += 12;
      } else if ((period === 'AM' || period === 'ق.ظ') && hours === 12) {
        hours = 0;
      }
      
      // فرمت‌بندی ساعت و دقیقه به صورت دو رقمی
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.padStart(2, '0');
      return `${formattedHours}:${formattedMinutes}`;
    }
    
    // اگر فرمت قابل تشخیص نبود، همان مقدار اصلی را برگردان
    return timeString;
  } catch (e) {
    console.error("Error formatting time:", e);
    return timeString; // بازگرداندن مقدار اصلی در صورت خطا
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
  res.setHeader('Access-Control-Allow-Origin', '*'); // اجازه دسترسی به همه دامنه‌ها
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-auth-token,Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // ارسال فایل برای دانلود با نام مشخص
  // از متد download استفاده می‌کنیم ولی در صورت خطا دیگر پاسخ HTTP جدید ارسال نمی‌کنیم
  // چون ممکن است هدرها قبلاً ارسال شده باشند
  res.download(filePath, `tickets-${Date.now()}.pdf`, (err) => {
    if (err) {
      // فقط لاگ خطا بدون ارسال پاسخ HTTP جدید
      console.error(`Error sending file ${filename} for download:`, err);
      // اگر هدرها هنوز ارسال نشده‌اند، می‌توانیم پاسخ خطا بفرستیم
      if (!res.headersSent) {
        return res.status(500).json({ message: 'خطا در دانلود فایل' });
      }
      // در غیر این صورت فقط لاگ می‌کنیم و کاری نمی‌کنیم
    } else {
      console.log(`File ${filename} sent successfully for download.`);
    }
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
    const { passengers, flightInfo, airline, aircraft, sourceType, exportType = 'system' } = req.body;

    // ایجاد فایل اکسل
    const workbook = new ExcelJS.Workbook();
    
    // تنظیم ویژگی‌های فایل
    workbook.creator = 'Tour Management System';
    workbook.lastModifiedBy = 'Tour Management System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // انتخاب نوع قالب اکسل
    if (exportType === 'airline') {
      // === قالب خطوط هوایی ===
      const passengerSheet = workbook.addWorksheet('Passengers', {
        properties: { tabColor: { argb: '4167B2' } }
      });
      
      // تنظیم ستون‌های اکسل خطوط هوایی (LTR)
      passengerSheet.columns = [
        { header: 'ردیف', key: 'row', width: 8, style: { alignment: { horizontal: 'center' } } },
        { header: 'نام لاتین', key: 'firstName', width: 15, style: { alignment: { horizontal: 'center' } } },
        { header: 'نام خانوادگی لاتین', key: 'lastName', width: 15, style: { alignment: { horizontal: 'center' } } },
        { header: 'جنسیت', key: 'gender', width: 10, style: { alignment: { horizontal: 'center' } } },
        { header: 'نوع', key: 'type', width: 10, style: { alignment: { horizontal: 'center' } } },
        { header: 'تاریخ تولد', key: 'birthDate', width: 15, style: { alignment: { horizontal: 'center' } } },
        { header: 'ملیت', key: 'nationality', width: 10, style: { alignment: { horizontal: 'center' } } },
        { header: 'شماره پاسپورت', key: 'passportNumber', width: 15, style: { alignment: { horizontal: 'center' } } },
        { header: 'کشور محل تولد', key: 'birthCountry', width: 15, style: { alignment: { horizontal: 'center' } } },
        { header: 'تاریخ اتمام اعتبار گذرنامه', key: 'passportExpiry', width: 15, style: { alignment: { horizontal: 'center' } } },
      ];
      
      // استایل‌بندی هدر
      passengerSheet.getRow(1).font = { bold: true, size: 12 };
      passengerSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D0CECE' } };
      passengerSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      passengerSheet.getRow(1).height = 30;
      
      // اضافه کردن داده مسافران
      passengers.forEach((passenger, index) => {
        // تبدیل دسته سنی به فرمت کوتاه برای خطوط هوایی
        let passengerType = 'Adu'; // پیش‌فرض بزرگسال
        
        if (passenger.birthDate) {
          const birthDate = moment(passenger.birthDate, 'YYYY/MM/DD');
          const now = moment();
          const ageYears = now.diff(birthDate, 'years');
          
          if (ageYears < 2) {
            passengerType = 'Inf'; // نوزاد
          } else if (ageYears < 12) {
            passengerType = 'Chd'; // کودک
          }
        } else if (passenger.age) {
          // اگر فقط سن ذخیره شده داریم
          if (passenger.age.includes('نوزاد')) {
            passengerType = 'Inf';
          } else if (passenger.age.includes('کودک')) {
            passengerType = 'Chd';
          }
        }
        
        // تعیین جنسیت برای اکسل
        const gender = passenger.gender === 'female' ? 'Female' : 'Male';
        
        passengerSheet.addRow({
          row: index + 1,
          firstName: passenger.englishFirstName,
          lastName: passenger.englishLastName,
          gender: gender,
          type: passengerType,
          birthDate: passenger.birthDate || '2003/01/1', // تاریخ تولد فرضی اگر وجود نداشت
          nationality: 'IRN', // فرض می‌کنیم ملیت ایرانی است
          passportNumber: passenger.documentNumber,
          birthCountry: 'IRN', // فرض می‌کنیم محل تولد ایران است
          passportExpiry: passenger.passportExpiry || '2025/01/10', // تاریخ انقضای فرضی اگر وجود نداشت
        });
      });
      
      // تنظیم استایل برای سلول‌ها
      passengerSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // به جز هدر
          // مرکزی کردن متن همه سلول‌ها
          row.eachCell((cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          });
          
          // استایل متناوب برای ردیف‌ها
          if (rowNumber % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F2F2F2' }
              };
            });
          }
        }
      });
    } else {
      // === قالب سیستمی (فرمت فعلی) ===
      const flightSheet = workbook.addWorksheet('اطلاعات پرواز', {
        properties: { tabColor: { argb: '4167B2' }, rtl: true } // فعال‌سازی راست به چپ
      });
      
      // تنظیم ستون‌های صفحه اطلاعات پرواز
      flightSheet.columns = [
        { header: 'ویژگی', key: 'property', width: 25, style: { alignment: { horizontal: 'center' } } },
        { header: 'مقدار', key: 'value', width: 40, style: { alignment: { horizontal: 'center' } } }
      ];
      
      // استایل هدر
      flightSheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
      flightSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4167B2' } };
      flightSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
      flightSheet.getRow(1).height = 25; // ارتفاع ردیف هدر
      
      // اضافه کردن حاشیه به هدر
      flightSheet.getRow(1).eachCell((cell) => {
        cell.border = {
          top: { style: 'medium', color: { argb: '3949AB' } },
          left: { style: 'thin', color: { argb: '3949AB' } },
          bottom: { style: 'medium', color: { argb: '3949AB' } },
          right: { style: 'thin', color: { argb: '3949AB' } }
        };
      });
      
      // اضافه کردن عنوان برای شیت اطلاعات پرواز
      flightSheet.spliceRows(1, 0, []); // افزودن یک ردیف خالی در ابتدا
      
      // مرج سلول‌ها برای عنوان
      flightSheet.mergeCells('A1:B1');
      const flightTitleCell = flightSheet.getCell('A1');
      flightTitleCell.value = 'اطلاعات پرواز'; 
      flightTitleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
      flightTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3949AB' } };
      flightTitleCell.alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
      flightSheet.getRow(1).height = 35; // ارتفاع ردیف عنوان
      
      // افزودن خط تزئینی زیر عنوان
      flightTitleCell.border = {
        bottom: { style: 'medium', color: { argb: '3949AB' } }
      };
      
      // افزودن داده‌های اطلاعات پرواز
      const flightData = [
        { property: 'نوع انتخاب مسیر', value: sourceType === 'route' ? 'مسیر آماده' : 'انتخاب شهر' },
        { property: 'مبدأ', value: flightInfo.origin },
        { property: 'مقصد', value: flightInfo.destination },
        { property: 'تاریخ پرواز', value: flightInfo.date },
        { property: 'ساعت پرواز', value: flightInfo.time ? formatTimeToHours24(flightInfo.time) : 'تعیین نشده' },
        { property: 'شماره پرواز', value: flightInfo.flightNumber || 'تعیین نشده' },
        { property: 'شرکت هواپیمایی', value: airline ? airline.name : 'تعیین نشده' },
        { property: 'مدل هواپیما', value: airline && airline.aircraftModel ? 
          airline.aircraftModel : 
          (flightInfo && flightInfo.aircraft ? flightInfo.aircraft : 'تعیین نشده') },
        { property: 'تعداد مسافران', value: passengers.length }
      ];
      
      flightData.forEach((item, index) => {
        const row = flightSheet.addRow(item);
        
        // مرکزی کردن متن سلول‌ها
        row.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
        });
        
        // استایل دهی به ردیف‌های با ایندکس فرد و زوج متفاوت
        if ((index + 1) % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F6FC' }
          };
        } else {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF' }
          };
        }
      });
      
      // تنظیم استایل برای همه سلول‌های اطلاعات پرواز
      flightSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) { // به جز هدر و عنوان
          row.height = 22; // ارتفاع یکسان برای همه ردیف‌ها
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'D0D0D0' } },
              left: { style: 'thin', color: { argb: 'D0D0D0' } },
              bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
              right: { style: 'thin', color: { argb: 'D0D0D0' } }
            };
            
            // تنظیم فونت
            cell.font = { name: 'Tahoma', size: 11 };
          });
        }
      });
      
      // تنظیم فریز پنل برای ستون‌های هدر
      flightSheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 2, topLeftCell: 'A3', activeCell: 'A3', zoomScale: 100 }
      ];
      
      // افزودن شیت مسافران
      const passengersSheet = workbook.addWorksheet('مسافران', {
        properties: { tabColor: { argb: '4167B2' }, rtl: true } // فعال‌سازی راست به چپ
      });
      
      // تنظیم ستون‌های صفحه مسافران
      passengersSheet.columns = [
        { header: 'ردیف', key: 'rowNumber', width: 8, style: { alignment: { horizontal: 'center' } } },
        { header: 'نام انگلیسی', key: 'englishFirstName', width: 20, style: { alignment: { horizontal: 'center' } } },
        { header: 'نام خانوادگی انگلیسی', key: 'englishLastName', width: 20, style: { alignment: { horizontal: 'center' } } },
        { header: 'نوع سند', key: 'documentType', width: 15, style: { alignment: { horizontal: 'center' } } },
        { header: 'شماره سند', key: 'documentNumber', width: 20, style: { alignment: { horizontal: 'center' } } },
        { header: 'تاریخ انقضای پاسپورت', key: 'passportExpiry', width: 20, style: { alignment: { horizontal: 'center' } } },
        { header: 'ملیت', key: 'nationality', width: 15, style: { alignment: { horizontal: 'center' } } },
        { header: 'سن', key: 'age', width: 10, style: { alignment: { horizontal: 'center' } } },
        { header: 'شناسه', key: 'id', width: 30, hidden: true } // شناسه مخفی برای کمک به واردات
      ];
      
      // استایل هدر مسافران
      passengersSheet.getRow(2).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
      passengersSheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4167B2' } };
      passengersSheet.getRow(2).alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
      passengersSheet.getRow(2).height = 25; // ارتفاع ردیف هدر

      // اضافه کردن حاشیه به ستون‌های هدر
      passengersSheet.getRow(2).eachCell((cell) => {
        cell.border = {
          top: { style: 'medium', color: { argb: '3949AB' } },
          left: { style: 'thin', color: { argb: '3949AB' } },
          bottom: { style: 'medium', color: { argb: '3949AB' } },
          right: { style: 'thin', color: { argb: '3949AB' } }
        };
      });
      
      // افزودن داده‌های مسافران
      passengers.forEach((passenger, index) => {
        const rowData = {
          rowNumber: index + 1,
          englishFirstName: passenger.englishFirstName,
          englishLastName: passenger.englishLastName,
          documentType: passenger.documentType === 'passport' ? 'پاسپورت' : 'کد ملی',
          documentNumber: passenger.documentNumber,
          passportExpiry: passenger.passportExpiry || '',
          nationality: passenger.nationality || 'تعیین نشده',
          age: passenger.birthDate ? calculateAgeCategory(passenger.birthDate) : '---',
          id: passenger.id
        };
        
        const newRow = passengersSheet.addRow(rowData);
        
        // استایل دهی به ردیف‌های با ایندکس فرد و زوج متفاوت
        if ((index + 1) % 2 === 0) {
          newRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F6FC' }
          };
        } else {
          newRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF' }
          };
        }
        
        // مرکزی کردن متن همه سلول‌ها
        newRow.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
        });
      });
      
      // تنظیم استایل برای همه سلول‌های مسافران
      passengersSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) { // به جز هدر و عنوان
          row.height = 22; // ارتفاع یکسان برای همه ردیف‌ها
          row.eachCell((cell) => {
            // حفظ تراز افقی مرکز
            cell.alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
            cell.border = {
              top: { style: 'thin', color: { argb: 'D0D0D0' } },
              left: { style: 'thin', color: { argb: 'D0D0D0' } },
              bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
              right: { style: 'thin', color: { argb: 'D0D0D0' } }
            };
            
            // تنظیم فونت
            cell.font = { name: 'Tahoma', size: 11 };
          });
        }
      });
      
      // اضافه کردن عنوان برای شیت مسافران (به عنوان سطر ثابت)
      passengersSheet.spliceRows(1, 0, []); // افزودن یک ردیف خالی در ابتدا
      
      // مرج سلول‌ها برای عنوان
      passengersSheet.mergeCells('A1:I1');
      const titleCell = passengersSheet.getCell('A1');
      titleCell.value = 'اطلاعات مسافران'; 
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3949AB' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle', rtl: true };
      passengersSheet.getRow(1).height = 35; // ارتفاع ردیف عنوان
      
      // افزودن خط تزئینی زیر عنوان
      titleCell.border = {
        bottom: { style: 'medium', color: { argb: '3949AB' } }
      };
      
      // تنظیم فریز پنل برای ستون‌های هدر و ثابت کردن عنوان
      passengersSheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 2, topLeftCell: 'A3', activeCell: 'A3', zoomScale: 100 }
      ];
    }
    
    // تنظیم اندازه صفحه برای چاپ
    workbook.eachSheet(sheet => {
      sheet.pageSetup.paperSize = 9; // A4
      sheet.pageSetup.orientation = 'landscape';
      sheet.pageSetup.fitToPage = true;
    });
    
    // گرفتن بافر فایل اکسل
    const buffer = await workbook.xlsx.writeBuffer();
    
    // تنظیم هدرهای CORS
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
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
      passportExpiry: 0,
      nationality: 0,
      age: 0,
      id: 0,
      gender: 0
    };
    
    // پیدا کردن شماره ستون‌ها با بررسی مقادیر سلول‌ها
    headerRow.eachCell((cell, colNumber) => {
      const headerValue = cell.value;
      
      if (headerValue === 'ردیف') columnIndexes.rowNumber = colNumber;
      else if (headerValue === 'نام انگلیسی' || headerValue === 'نام لاتین') columnIndexes.englishFirstName = colNumber;
      else if (headerValue === 'نام خانوادگی انگلیسی' || headerValue === 'نام خانوادگی لاتین') columnIndexes.englishLastName = colNumber;
      else if (headerValue === 'نوع سند') columnIndexes.documentType = colNumber;
      else if (headerValue === 'شماره سند' || headerValue === 'شماره پاسپورت') columnIndexes.documentNumber = colNumber;
      else if (headerValue === 'تاریخ انقضای پاسپورت' || headerValue === 'تاریخ اتمام اعتبار گذرنامه') columnIndexes.passportExpiry = colNumber;
      else if (headerValue === 'ملیت') columnIndexes.nationality = colNumber;
      else if (headerValue === 'سن') columnIndexes.age = colNumber;
      else if (headerValue === 'جنسیت') columnIndexes.gender = colNumber;
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
      
      let passportExpiry = '';
      if (columnIndexes.passportExpiry > 0) {
        const passportExpiryValue = row.getCell(columnIndexes.passportExpiry).value;
        if (passportExpiryValue) passportExpiry = passportExpiryValue.toString();
      }
      
      let age = '';
      if (columnIndexes.age > 0) {
        const ageValue = row.getCell(columnIndexes.age).value;
        if (ageValue) age = ageValue.toString();
      }
      
      // خواندن جنسیت از فایل اکسل
      let gender = 'male'; // مقدار پیش‌فرض
      if (columnIndexes.gender > 0) {
        const genderValue = row.getCell(columnIndexes.gender).value;
        if (genderValue) {
          const genderStr = genderValue.toString().toLowerCase();
          // بررسی مقادیر مختلف جنسیت
          if (genderStr.startsWith('f') || 
              genderStr.includes('زن') || 
              genderStr.includes('دختر') || 
              genderStr === 'fs' || 
              genderStr === 'female') {
            gender = 'female';
          }
        }
      }
      
      // فقط مسافران با حداقل یک فیلد معتبر را اضافه کن
      if (englishFirstName || englishLastName || documentNumber) {
        const passenger = {
          id,
          englishFirstName,
          englishLastName,
          documentType,
          documentNumber,
          passportExpiry,
          nationality: nationality === 'تعیین نشده' ? 'Iranian' : nationality,
          customNationality: nationality && nationality !== 'Iranian' && nationality !== 'تعیین نشده',
          age,
          // بررسی جنسیت از فیلد 'جنسیت' در اکسل
          gender: gender && (
            gender.toLowerCase().includes('f') || 
            gender.toLowerCase().includes('زن') || 
            gender.toLowerCase().includes('fs') || 
            gender.toLowerCase() === 'female'
          ) ? 'female' : 'male'
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
        'شماره پرواز': 'flightNumber',
        'تاریخ انقضای پاسپورت': 'passportExpiry'
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

/**
 * تابع کمکی برای درج لوگوی ایرلاین
 */
async function insertAirlineLogo(field, logoFilename, pdfDoc) {
  // تلاش برای یافتن لوگو در مسیر uploads/airlines
  const logoPath = path.join(__dirname, '..', 'uploads', 'airlines', logoFilename);
  console.log(`Looking for airline logo at: ${logoPath}`);
  
  if (fs.existsSync(logoPath)) {
      try {
          const logoBytes = fs.readFileSync(logoPath);
          const logoImage = await pdfDoc.embedPng(logoBytes);
          
          if (field.constructor.name === 'PDFButton') {
              field.setImage(logoImage);
          } else if (field.constructor.name === 'PDFTextField') {
              // برخی فیلدهای متنی ممکن است پشتیبانی از تصویر داشته باشند
              try {
                  field.setImage(logoImage);
              } catch (err) {
                  console.warn(`Cannot set image for text field: ${err.message}`);
              }
          }
          console.log(`Successfully embedded logo from ${logoPath}`);
          return true;
      } catch (err) {
          console.error(`Error embedding logo:`, err);
      }
  } else {
      console.warn(`Logo file not found at ${logoPath}`);
      
      // تلاش برای یافتن لوگو در مسیر پیش‌فرض uploads/airlines
      const defaultAirlinePath = path.join(__dirname, '..', 'uploads', 'airlines');
      if (fs.existsSync(defaultAirlinePath)) {
        // بررسی همه فایل‌های موجود در پوشه airlines
        const files = fs.readdirSync(defaultAirlinePath);
        const filename = path.basename(logoFilename);
      
        if (files.includes(filename)) {
          // اگر فایل با همین نام یافت شد
          const fullPath = path.join(defaultAirlinePath, filename);
          console.log(`Found logo in default airlines folder: ${fullPath}`);
          
          // خواندن فایل از مسیر محلی
          const logoBuffer = fs.readFileSync(fullPath);
          
          // تعیین فرمت تصویر بر اساس پسوند فایل
          let logoImage;
          if (fullPath.toLowerCase().endsWith('.png')) {
            logoImage = await pdfDoc.embedPng(logoBuffer);
          } else if (fullPath.toLowerCase().endsWith('.jpg') || fullPath.toLowerCase().endsWith('.jpeg')) {
            logoImage = await pdfDoc.embedJpg(logoBuffer);
          } else {
            try {
              logoImage = await pdfDoc.embedPng(logoBuffer);
            } catch (e) {
                  try {
                logoImage = await pdfDoc.embedJpg(logoBuffer);
              } catch (e2) {
                console.error("Could not embed image as PNG or JPG");
                throw e2;
              }
            }
          }
          
          // تلاش برای تنظیم آن در فیلد
          if (logoImage) {
            if (field.constructor.name === 'PDFButton') {
              field.setImage(logoImage);
            } else if (field.constructor.name === 'PDFTextField') {
              try {
                field.setImage(logoImage);
              } catch (err) {
                console.warn(`Cannot set image for text field: ${err.message}`);
              }
            }
            console.log("Successfully set logo image from default airlines folder");
            return true;
          }
        }
      }
  }
  return false;
}

/**
 * تابع کمکی برای درج لوگو به عنوان تصویر مستقل
 */
async function insertLogoAsImage(pdfDoc, logoFilename) {
  // بررسی مسیرهای احتمالی لوگو
  let logoPath = path.join(__dirname, '..', 'uploads', 'airlines', logoFilename);
  
  if (!fs.existsSync(logoPath)) {
      logoPath = path.join(__dirname, '..', 'assets', 'images', logoFilename);
      if (!fs.existsSync(logoPath)) {
          console.warn(`Logo file not found in any expected paths`);
          return false;
      }
  }
  
  try {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      
      // در این نسخه، لوگو را به عنوان تصویر به PDF اضافه نمی‌کنیم
      // فقط تصویر logo را برمی‌گردانیم تا در جایی دیگر استفاده شود
      
      return logoImage;
  } catch (err) {
      console.error(`Failed to load logo as image:`, err);
      return false;
  }
}

/**
 * @route   GET /api/floating-ticket/history
 * @desc    دریافت تاریخچه بلیط‌های شناور
 * @access  خصوصی
 */
router.get('/history', auth, async (req, res) => {
  try {
    // پارامترهای صفحه‌بندی
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // پارامترهای مرتب‌سازی
    const sort = req.query.sort || '-createdAt'; // پیش‌فرض: جدیدترین بلیط‌ها اول

    // فیلترهای جستجو
    const filters = {};
    
    // اگر کاربر admin+ نباشد، فقط بلیط‌های خودش را نشان بده
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin') {
      filters.createdBy = req.user.id;
    }
    
    // جستجو در اطلاعات پرواز
    if (req.query.origin) {
      filters['flightInfo.origin'] = { $regex: req.query.origin, $options: 'i' };
    }
    
    if (req.query.destination) {
      filters['flightInfo.destination'] = { $regex: req.query.destination, $options: 'i' };
    }
    
    if (req.query.date) {
      filters['flightInfo.date'] = req.query.date;
    }
    
    if (req.query.flightNumber) {
      filters['flightInfo.flightNumber'] = { $regex: req.query.flightNumber, $options: 'i' };
    }
    
    if (req.query.airline) {
      filters['airline.name'] = { $regex: req.query.airline, $options: 'i' };
    }

    // جستجو در اطلاعات مسافران
    if (req.query.passengerName) {
      const nameRegex = { $regex: req.query.passengerName, $options: 'i' };
      filters.$or = [
        { 'passengers.englishFirstName': nameRegex },
        { 'passengers.englishLastName': nameRegex }
      ];
    }
    
    if (req.query.documentNumber) {
      filters['passengers.documentNumber'] = { $regex: req.query.documentNumber, $options: 'i' };
    }

    // محدوده زمانی
    if (req.query.dateFrom) {
      const fromDate = new Date(req.query.dateFrom);
      filters.createdAt = { $gte: fromDate };
    }
    
    if (req.query.dateTo) {
      const toDate = new Date(req.query.dateTo);
      if (filters.createdAt) {
        filters.createdAt.$lte = toDate;
      } else {
        filters.createdAt = { $lte: toDate };
      }
    }

    // اجرای کوئری با populate کردن اطلاعات createdBy
    const tickets = await FloatingTicket.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'fullName role');
    
    // محاسبه کل رکوردها برای صفحه‌بندی
    const totalTickets = await FloatingTicket.countDocuments(filters);
    
    res.json({
      tickets,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalTickets / limit),
        totalRecords: totalTickets
      }
    });
  } catch (err) {
    console.error('خطا در دریافت تاریخچه بلیط‌های شناور:', err.message);
    res.status(500).json({ message: 'خطای سرور در دریافت تاریخچه بلیط‌های شناور' });
  }
});

/**
 * @route   GET /api/floating-ticket/history/:id
 * @desc    دریافت جزئیات یک بلیط شناور
 * @access  خصوصی
 */
router.get('/history/:id', auth, async (req, res) => {
  try {
    const ticket = await FloatingTicket.findById(req.params.id).populate('createdBy', 'fullName role');
    
    if (!ticket) {
      return res.status(404).json({ message: 'بلیط مورد نظر یافت نشد' });
    }
    
    // بررسی دسترسی: فقط super-admin، admin یا سازنده بلیط می‌توانند آن را مشاهده کنند
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin' && 
        ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'شما اجازه دسترسی به این بلیط را ندارید' });
    }
    
    res.json(ticket);
  } catch (err) {
    console.error('خطا در دریافت جزئیات بلیط شناور:', err.message);
    res.status(500).json({ message: 'خطای سرور در دریافت جزئیات بلیط شناور' });
  }
});

/**
 * @route   POST /api/floating-ticket/regenerate/:id
 * @desc    تولید مجدد یک بلیط شناور
 * @access  خصوصی
 */
router.post('/regenerate/:id', auth, async (req, res) => {
  try {
    const ticket = await FloatingTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'بلیط مورد نظر یافت نشد' });
    }
    
    // بررسی دسترسی
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin' && 
        ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'شما اجازه تولید مجدد این بلیط را ندارید' });
    }
    
    // به‌روزرسانی درخواست با داده‌های بلیط
    const regenerateData = {
      passengers: ticket.passengers,
      flightInfo: ticket.flightInfo,
      sourceType: ticket.sourceType,
      airline: ticket.airline,
      route: ticket.flightInfo.routeId ? { _id: ticket.flightInfo.routeId } : undefined
    };
    
    // تولید پی‌دی‌اف با استفاده از همان کدی که در مسیر /generate استفاده می‌شود
    
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
    for (const passenger of regenerateData.passengers) {
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
        'from': regenerateData.flightInfo.origin || '',
        'to': regenerateData.flightInfo.destination || '',
        'date': regenerateData.flightInfo.date ? formatPersianDate(regenerateData.flightInfo.date) : '',
        'time': regenerateData.flightInfo.time ? formatTimeToHours24(regenerateData.flightInfo.time) : '',
        'name': passenger.englishFirstName || '',
        'familiy': passenger.englishLastName || '',
        'pnumber': passenger.documentNumber || '',
        'pexpiry': passenger.passportExpiry ? formatPersianDate(passenger.passportExpiry) : '',
        'flightn': regenerateData.flightInfo.flightNumber || '',
        'aircraft': regenerateData.airline && regenerateData.airline.aircraftModel ? 
                      regenerateData.airline.aircraftModel : 
                      regenerateData.flightInfo.aircraft || '',
        'price': regenerateData.flightInfo.price || '',
        'tax': regenerateData.flightInfo.tax || '',
        'total': regenerateData.flightInfo.price && regenerateData.flightInfo.tax ? 
                 String(parseInt(regenerateData.flightInfo.price) + parseInt(regenerateData.flightInfo.tax)) : '',
        'logo_af_image': regenerateData.airline && regenerateData.airline.logo ? regenerateData.airline.logo : '',
        'age': passenger.birthDate ? calculateAgeCategory(passenger.birthDate) : '---',
        'fromair': regenerateData.flightInfo.fromair || '',
        'toair': regenerateData.flightInfo.toair || '',
        'fromAirportCode': regenerateData.flightInfo.fromAirportCode || '',
        'toAirportCode': regenerateData.flightInfo.toAirportCode || ''
      };

      // پر کردن فیلدها
      for (const fieldName in fieldDataMap) {
        try {
          // پردازش ویژه برای فیلد logo_af_image
          if (fieldName === 'logo_af_image') {
            console.log("Processing logo_af_image field in regenerate");
            // تلاش برای درج لوگوی ایرلاین
            if (regenerateData.airline && regenerateData.airline.logo) {
              // دریافت فیلد logo_af_image
              try {
                const fields = form.getFields();
                const logoField = fields.find(field => field.getName() === 'logo_af_image');
                
                if (logoField) {
                  console.log(`Found logo field with type: ${logoField.constructor.name}`);
                  
                  // خواندن فایل لوگو
                  const logoPath = path.join(__dirname, '..', 'uploads', 'airlines', path.basename(regenerateData.airline.logo));
                  let logoImage = null;
                  
                  if (fs.existsSync(logoPath)) {
                    try {
                      const logoBuffer = fs.readFileSync(logoPath);
                      
                      // بارگذاری تصویر با توجه به نوع فایل
                      if (logoPath.toLowerCase().endsWith('.png')) {
                        logoImage = await pdfDoc.embedPng(logoBuffer);
                      } else if (logoPath.toLowerCase().endsWith('.jpg') || logoPath.toLowerCase().endsWith('.jpeg')) {
                        logoImage = await pdfDoc.embedJpg(logoBuffer);
                      } else {
                        // تلاش برای بارگذاری با فرمت‌های مختلف
                        try {
                          logoImage = await pdfDoc.embedPng(logoBuffer);
                        } catch (e) {
                          try {
                            logoImage = await pdfDoc.embedJpg(logoBuffer);
                          } catch (e2) {
                            console.error("Could not embed image as PNG or JPG");
                          }
                        }
                      }
                      
                      if (logoImage) {
                        // تنظیم تصویر روی فیلد با توجه به نوع فیلد
                        if (logoField.constructor.name === 'PDFButton') {
                          try {
                            const button = form.getButton('logo_af_image');
                            if (button) {
                              button.setImage(logoImage);
                              console.log("Successfully set button image icon in regenerate");
                            }
                          } catch (buttonError) {
                            console.error("Error setting button image:", buttonError);
                          }
                        } else {
                          try {
                            form.getTextField('logo_af_image').setImage(logoImage);
                            console.log("Successfully set text field image in regenerate");
                          } catch (textFieldError) {
                            console.error("Error setting image to text field:", textFieldError);
                          }
                        }
                      }
                    } catch (logoError) {
                      console.error("Error processing logo:", logoError);
                    }
                  } else {
                    console.warn(`Logo file not found at ${logoPath}`);
                    
                    // جستجو در مسیرهای دیگر
                    const airlineDir = path.join(__dirname, '..', 'uploads', 'airlines');
                    if (fs.existsSync(airlineDir)) {
                      const files = fs.readdirSync(airlineDir);
                      
                      // یافتن اولین فایل تصویر
                      for (const file of files) {
                        if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
                          const fullPath = path.join(airlineDir, file);
                          
                          try {
                            const logoBuffer = fs.readFileSync(fullPath);
                            let embedLogo = null;
                            
                            if (file.toLowerCase().endsWith('.png')) {
                              embedLogo = await pdfDoc.embedPng(logoBuffer);
                            } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
                              embedLogo = await pdfDoc.embedJpg(logoBuffer);
                            }
                            
                            if (embedLogo) {
                              // تنظیم لوگو روی فیلد
                              if (logoField.constructor.name === 'PDFButton') {
                                try {
                                  const button = form.getButton('logo_af_image');
                                  if (button) {
                                    button.setImage(embedLogo);
                                    console.log(`Successfully set button image with generic logo: ${file}`);
                                    break;
                                  }
                                } catch (buttonError) {
                                  console.error("Error setting button image:", buttonError);
                                }
                              } else {
                                try {
                                  form.getTextField('logo_af_image').setImage(embedLogo);
                                  console.log(`Successfully set text field image with generic logo: ${file}`);
                                  break;
                                } catch (textFieldError) {
                                  console.error("Error setting image to text field:", textFieldError);
                                }
                              }
                            }
                          } catch (error) {
                            console.error(`Error processing generic logo ${file}:`, error);
                          }
                        }
                      }
                    }
                  }
                } else {
                  console.warn("logo_af_image field not found in regenerate function");
                }
              } catch (logoFieldError) {
                console.error("Error processing logo_af_image field:", logoFieldError);
              }
            }
            
            // ادامه به فیلد بعدی بعد از پردازش لوگو
            continue;
          }
          
          const field = form.getTextField(fieldName);
          if (field) {
            const valueToSet = String(fieldDataMap[fieldName]);
            setTextWithSkyBlueColor(field, valueToSet);
            
            // قرار دادن متن در وسط فیلد
            try {
                field.setAlignment('Center');
            } catch (alignmentError) {
                console.warn(`Could not set alignment for field '${fieldName}'`);
            }
            
            if (vazirFont) {
               try {
                   field.updateAppearances(vazirFont);
               } catch (appearanceError) {
                   console.error(`ERROR: Could not update appearances for field '${fieldName}'`);
               }
            }
          } 
        } catch (fieldError) {
            console.error(`Error processing field '${fieldName}':`, fieldError);
        }
      }
      
      // پس‌زمینه سازی فرم
      try {
        form.flatten();
      } catch (flattenError) {
         console.error('Error flattening the PDF form:', flattenError);
      }

      // اضافه کردن صفحه به PDF نهایی
      try {
        const pdfBytes = await pdfDoc.save();
        const loadedPdf = await PDFDocument.load(pdfBytes);
        const [passengerPage] = await finalPdfDoc.copyPages(loadedPdf, [0]);
        finalPdfDoc.addPage(passengerPage);
      } catch (err) {
        console.error(`Error adding page for passenger ${passenger.englishFirstName}:`, err);
      }
    }
    
    // ذخیره PDF نهایی
    let finalPdfBytes;
    try {
      finalPdfBytes = await finalPdfDoc.save();
    } catch (saveError) {
      console.error('Error saving final PDF:', saveError);
      return res.status(500).json({ message: 'خطا در ذخیره‌سازی PDF نهایی.' });
    }
    
    // ذخیره فایل PDF در سرور
    const generatedDir = path.join(__dirname, '..', 'assets', 'generated');
    if (!fs.existsSync(generatedDir)){
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    const uniqueFilename = `ticket-${uuidv4()}.pdf`;
    const filePath = path.join(generatedDir, uniqueFilename);

    try {
        fs.writeFileSync(filePath, finalPdfBytes);
        console.log(`Generated PDF with ${regenerateData.passengers.length} passengers saved to: ${filePath}`);

        // زمان‌بندی حذف فایل پس از 10 دقیقه
        const delayMinutes = 10;
        const delayMilliseconds = delayMinutes * 60 * 1000;
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted temporary file: ${filePath}`);
                }
            } catch (deleteError) {
                console.error(`Error deleting temporary file ${filePath}:`, deleteError);
            }
        }, delayMilliseconds);
        
        // ارسال لینک دانلود به فرانت‌اند
        const downloadUrl = `/api/floating-ticket/download/${uniqueFilename}`;
        res.json({ downloadUrl, passengerCount: regenerateData.passengers.length });

    } catch (writeError) {
        console.error(`Error writing PDF file to ${filePath}:`, writeError);
        return res.status(500).json({ message: 'خطا در ذخیره فایل PDF در سرور.' });
    }
  } catch (err) {
    console.error('خطا در تولید مجدد بلیط شناور:', err.message);
    res.status(500).json({ message: 'خطای سرور در تولید مجدد بلیط شناور' });
  }
});

/**
 * @route   DELETE /api/floating-ticket/history/:id
 * @desc    حذف یک بلیط شناور
 * @access  خصوصی
 */
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const ticket = await FloatingTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'بلیط مورد نظر یافت نشد' });
    }
    
    // بررسی دسترسی: فقط super-admin، admin یا سازنده بلیط می‌توانند آن را حذف کنند
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin' && 
        ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'شما اجازه حذف این بلیط را ندارید' });
    }
    
    // حذف فایل PDF در صورت وجود
    if (ticket.pdfPath && fs.existsSync(ticket.pdfPath)) {
      try {
        fs.unlinkSync(ticket.pdfPath);
        console.log(`PDF file deleted: ${ticket.pdfPath}`);
      } catch (fileError) {
        console.error(`Error deleting PDF file: ${ticket.pdfPath}`, fileError);
        // ادامه روند حذف حتی اگر فایل حذف نشود
      }
    }
    
    // حذف رکورد از دیتابیس
    await FloatingTicket.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'بلیط با موفقیت حذف شد' });
  } catch (err) {
    console.error('خطا در حذف بلیط شناور:', err.message);
    res.status(500).json({ message: 'خطای سرور در حذف بلیط شناور' });
  }
});

/**
 * @route   PUT /api/floating-ticket/history/:id
 * @desc    ویرایش یک بلیط شناور
 * @access  خصوصی
 */
router.put('/history/:id', [
  auth,
  [
    check('passengers', 'اطلاعات مسافران الزامی است').isArray({ min: 1 }),
    check('flightInfo', 'اطلاعات پرواز الزامی است').isObject(),
    check('flightInfo.date', 'تاریخ پرواز الزامی است').notEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // بررسی وجود بلیط
    const ticket = await FloatingTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'بلیط مورد نظر یافت نشد' });
    }
    
    // بررسی دسترسی
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin' && 
        ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'شما اجازه ویرایش این بلیط را ندارید' });
    }

    const { passengers, flightInfo, airline, sourceType } = req.body;
    
    // بررسی مقادیر مبدأ و مقصد
    let origin = flightInfo.origin;
    let destination = flightInfo.destination;
    let routeId = flightInfo.routeId;

    // اگر مسیر عوض شده باشد، باید اطلاعات جدید را از دیتابیس بگیریم
    if (sourceType === 'route' && routeId) {
      try {
        const routeData = await Route.findById(routeId);
        if (routeData) {
          origin = routeData.origin;
          destination = routeData.destination;
        }
      } catch (routeError) {
        console.error('خطا در دریافت اطلاعات مسیر:', routeError);
      }
    }
    // اگر نوع منبع "city" باشد، مقادیر ارسالی را استفاده می‌کنیم
    else if (sourceType === 'city') {
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

    // به‌روزرسانی اطلاعات بلیط
    const updatedTicket = {
      passengers,
      flightInfo: {
        ...flightInfo,
        origin,
        destination
      },
      airline: airline ? {
        _id: airline._id,
        name: airline.name,
        englishName: airline.englishName,
        logo: airline.logo,
        aircraftModel: airline.aircraftModel
      } : ticket.airline,
      sourceType,
      updatedAt: Date.now()
    };

    // ذخیره تغییرات
    const result = await FloatingTicket.findByIdAndUpdate(
      req.params.id, 
      updatedTicket,
      { new: true } // بازگرداندن مستند به‌روزرسانی شده
    );

    res.json({
      message: 'بلیط با موفقیت به‌روزرسانی شد',
      ticket: result
    });
  } catch (err) {
    console.error('خطا در به‌روزرسانی بلیط شناور:', err.message);
    res.status(500).json({ message: 'خطای سرور در به‌روزرسانی بلیط شناور' });
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
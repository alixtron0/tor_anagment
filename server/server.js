const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('Upload path:', path.join(__dirname, '../uploads'));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
    
    // حذف اسکریپت تنظیم رمزهای پیش‌فرض
    // const setupDefaultPasswords = require('./scripts/setupDefaultPasswords');
    // await setupDefaultPasswords();
    // console.log('Default passwords have been set up for admin users');
    
  } catch (err) {
    console.error('Database connection error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

connectDB();

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/cities', require('./routes/cityRoutes'));
app.use('/api/airlines', require('./routes/airlineRoutes'));
app.use('/api/aircraft', require('./routes/aircraftRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/passengers', require('./routes/passengerRoutes'));
app.use('/api/contactinfo', require('./routes/contactInfoRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/floating-ticket', require('./routes/floatingTicketRoutes'));
app.use('/api/image-library', require('./routes/imageLibraryRoutes'));


// Simple route for testing
app.get('/', (req, res) => {
  res.send('API Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`)); 
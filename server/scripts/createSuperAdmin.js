const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');
const path = require('path');
const User = require('../models/User');

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create input/output interface for getting user information
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Show error if environment variable doesn't exist
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not defined.');
  console.log('Please make sure the .env file exists in the project root and MONGODB_URI is defined in it.');
  process.exit(1);
}

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to the database.'))
  .catch(err => {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  });

// Main function for creating super admin
const createSuperAdmin = async (fullName, phoneNumber, password) => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    
    if (existingSuperAdmin) {
      console.log('A super admin has already been registered in the system. You cannot add another super admin.');
      return process.exit(0);
    }
    
    // Validate phone number
    if (!/^09\d{9}$/.test(phoneNumber)) {
      console.log('Invalid phone number. Please enter in format: 09XXXXXXXXX');
      return process.exit(1);
    }
    
    // Check password length
    if (password.length < 6) {
      console.log('Password must be at least 6 characters.');
      return process.exit(1);
    }
    
    // Create super admin
    const superAdmin = await User.create({
      fullName,
      phoneNumber,
      password,
      role: 'super-admin',
      isActive: true
    });
    
    console.log('Super admin successfully created:');
    console.log(`Full Name: ${superAdmin.fullName}`);
    console.log(`Phone Number: ${superAdmin.phoneNumber}`);
    console.log(`Role: ${superAdmin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error.message);
    process.exit(1);
  }
};

// Get user information
console.log('🔒 CREATE SUPER ADMIN USER 🔒');
console.log('-----------------------------');

rl.question('🧑 Full Name: ', (fullName) => {
  rl.question('📱 Phone Number (format: 09XXXXXXXXX): ', (phoneNumber) => {
    rl.question('🔑 Password (minimum 6 characters): ', (password) => {
      rl.close();
      createSuperAdmin(fullName, phoneNumber, password);
    });
  });
}); 
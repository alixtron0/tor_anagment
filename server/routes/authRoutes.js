const express = require('express');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// مسیر ورود کاربر
router.post('/login', authController.login);

// مسیر ایجاد سوپر ادمین - این مسیر فقط زمانی کار می‌کند که هیچ سوپر ادمینی در سیستم نباشد
router.post('/create-super-admin', authController.createSuperAdmin);

module.exports = router; 
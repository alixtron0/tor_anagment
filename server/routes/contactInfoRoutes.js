const express = require('express');
const router = express.Router();
const ContactInfo = require('../models/ContactInfo');
const Reservation = require('../models/Reservation');
const mongoose = require('mongoose');

// ثبت یا ویرایش اطلاعات تماس
router.post('/', async (req, res) => {
    try {
        const { 
            reservation, 
            contactName, 
            contactPhone, 
            contactEmail,
            address,
            city,
            postalCode,
            emergencyName,
            emergencyPhone,
            notes
        } = req.body;

        // بررسی وجود رزرو
        if (!mongoose.Types.ObjectId.isValid(reservation)) {
            return res.status(400).json({ message: 'شناسه رزرو نامعتبر است' });
        }

        const reservationExists = await Reservation.findById(reservation);
        if (!reservationExists) {
            return res.status(404).json({ message: 'رزرو مورد نظر یافت نشد' });
        }

        // بررسی وجود اطلاعات تماس قبلی برای این رزرو
        const existingContactInfo = await ContactInfo.findOne({ reservation });

        let result;
        if (existingContactInfo) {
            // ویرایش اطلاعات موجود
            result = await ContactInfo.findByIdAndUpdate(
                existingContactInfo._id,
                {
                    contactName,
                    contactPhone,
                    contactEmail,
                    address,
                    city,
                    postalCode,
                    emergencyName,
                    emergencyPhone,
                    notes,
                    updatedAt: Date.now()
                },
                { new: true }
            );
        } else {
            // ایجاد اطلاعات جدید
            const newContactInfo = new ContactInfo({
                reservation,
                contactName,
                contactPhone,
                contactEmail,
                address,
                city,
                postalCode,
                emergencyName,
                emergencyPhone,
                notes
            });

            result = await newContactInfo.save();
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('خطا در ثبت اطلاعات تماس:', error);
        res.status(500).json({ message: 'خطا در ثبت اطلاعات تماس', error: error.message });
    }
});

// دریافت اطلاعات تماس یک رزرو
router.get('/reservation/:reservationId', async (req, res) => {
    try {
        const { reservationId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(reservationId)) {
            return res.status(400).json({ message: 'شناسه رزرو نامعتبر است' });
        }

        const contactInfo = await ContactInfo.findOne({ reservation: reservationId });
        
        if (!contactInfo) {
            return res.status(404).json({ message: 'اطلاعات تماس برای این رزرو یافت نشد' });
        }

        res.json(contactInfo);
    } catch (error) {
        console.error('خطا در دریافت اطلاعات تماس:', error);
        res.status(500).json({ message: 'خطا در دریافت اطلاعات تماس', error: error.message });
    }
});

// حذف اطلاعات تماس
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'شناسه اطلاعات تماس نامعتبر است' });
        }

        const deletedContactInfo = await ContactInfo.findByIdAndDelete(id);
        
        if (!deletedContactInfo) {
            return res.status(404).json({ message: 'اطلاعات تماس مورد نظر یافت نشد' });
        }

        res.json({ message: 'اطلاعات تماس با موفقیت حذف شد', deletedContactInfo });
    } catch (error) {
        console.error('خطا در حذف اطلاعات تماس:', error);
        res.status(500).json({ message: 'خطا در حذف اطلاعات تماس', error: error.message });
    }
});

module.exports = router; 
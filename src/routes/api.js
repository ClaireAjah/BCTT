const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const appointmentController = require('../controllers/appointmentController');
const vitalsController = require('../controllers/vitalsController');
const recordsController = require('../controllers/recordsController');
const announcementController = require('../controllers/announcementController');
const { authenticateJWT: authenticate } = require('../middleware/auth');
const supabase = require('../config/db');

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

router.get('/me', authenticate, async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, full_name, email, role, specialization')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
});

router.get('/doctors', authenticate, async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, specialization')
            .eq('role', 'doctor');
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.post('/appointments', authenticate, appointmentController.createAppointment);
router.get('/appointments', authenticate, appointmentController.getAppointments);
router.put('/appointments/:id/status', authenticate, appointmentController.updateAppointmentStatus);

router.post('/vitals', authenticate, vitalsController.addVitals);
router.get('/vitals', authenticate, vitalsController.getVitals);

router.post('/records', authenticate, recordsController.addMedicalRecord);
router.get('/records', authenticate, recordsController.getMedicalRecords);

router.post('/announcements', authenticate, announcementController.createAnnouncement);
router.get('/announcements', authenticate, announcementController.getAnnouncements);

module.exports = router;

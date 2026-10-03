const express = require('express');
const router  = express.Router();
const AttendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Summary — per-student recap for a class_subject
router.get('/summary',  authorize('superuser', 'teacher', 'student'), AttendanceController.getSummary);

// Attendance by specific date
router.get('/by-date',  authorize('superuser', 'teacher', 'student'), AttendanceController.getByDate);

// Bulk upsert — fill attendance for entire class on one date
router.post('/bulk',    authorize('superuser', 'teacher'),            AttendanceController.bulkUpsert);

// Single upsert
router.post('/',        authorize('superuser', 'teacher'),            AttendanceController.upsert);

// List with filters
router.get('/',         authorize('superuser', 'teacher', 'student'), AttendanceController.getAll);

// Delete single record
router.delete('/:id',   authorize('superuser', 'teacher'),            AttendanceController.delete);

module.exports = router;

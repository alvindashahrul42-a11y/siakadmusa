const express = require('express');
const router  = express.Router();
const ScheduleController = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Student: jadwal kelas sendiri (harus SEBELUM /:id agar tidak bentrok)
router.get('/my', authorize('student'), ScheduleController.getMy);

// Standalone CRUD on individual schedule records
router.get('/:id',    authorize('superuser', 'teacher', 'student'), ScheduleController.getById);
router.put('/:id',    authorize('superuser', 'teacher'),            ScheduleController.update);
router.delete('/:id', authorize('superuser', 'teacher'),            ScheduleController.delete);

module.exports = router;

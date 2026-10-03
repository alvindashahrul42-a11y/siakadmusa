const express = require('express');
const router  = express.Router();
const ExamScheduleController = require('../controllers/examSchedule.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',      authorize('superuser', 'teacher'),            ExamScheduleController.create);
router.get('/',       authorize('superuser', 'teacher', 'student'), ExamScheduleController.getByExam);
router.get('/:id',    authorize('superuser', 'teacher', 'student'), ExamScheduleController.getById);
router.put('/:id',    authorize('superuser', 'teacher'),            ExamScheduleController.update);
router.delete('/:id', authorize('superuser', 'teacher'),            ExamScheduleController.delete);

module.exports = router;

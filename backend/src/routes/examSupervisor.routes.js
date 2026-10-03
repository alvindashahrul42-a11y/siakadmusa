const express = require('express');
const router  = express.Router();
const ExamSupervisorController = require('../controllers/examSupervisor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',      authorize('superuser', 'teacher'),            ExamSupervisorController.create);
router.get('/',       authorize('superuser', 'teacher', 'student'), ExamSupervisorController.getBySchedule);
router.get('/:id',    authorize('superuser', 'teacher', 'student'), ExamSupervisorController.getById);
router.delete('/:id', authorize('superuser', 'teacher'),            ExamSupervisorController.delete);

module.exports = router;

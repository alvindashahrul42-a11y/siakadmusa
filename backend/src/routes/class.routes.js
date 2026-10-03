const express = require('express');
const router = express.Router();
const ClassController        = require('../controllers/class.controller');
const ClassStudentController = require('../controllers/classStudent.controller');
const ClassSubjectController = require('../controllers/classSubject.controller');
const ScheduleController     = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// ── Class CRUD ───────────────────────────────────────────────────────────────

// GET all without pagination (dropdown)
router.get('/all', authorize('superuser', 'teacher', 'student'), ClassController.getAllNoPagination);

router.post('/',      authorize('superuser', 'teacher'),                     ClassController.create);
router.get('/',       authorize('superuser', 'teacher', 'student'),          ClassController.getAll);
router.get('/:id',    authorize('superuser', 'teacher', 'student'),          ClassController.getById);
router.put('/:id',    authorize('superuser', 'teacher'),                     ClassController.update);
router.delete('/:id', authorize('superuser'),                                ClassController.delete);

// ── Class Students ───────────────────────────────────────────────────────────

router.get('/:classId/students',                       authorize('superuser', 'teacher'),            ClassStudentController.getStudents);
router.get('/:classId/available-students',             authorize('superuser', 'teacher'),            ClassStudentController.getAvailableStudents);
router.post('/:classId/students',                      authorize('superuser', 'teacher'),            ClassStudentController.addStudent);
router.delete('/:classId/students/:studentId',         authorize('superuser', 'teacher'),            ClassStudentController.removeStudent);

// ── Class Subjects ────────────────────────────────────────────────────────────

// List all subjects assigned to a class
router.get('/:classId/subjects',             authorize('superuser', 'teacher', 'student'), ClassSubjectController.getByClass);
// Assign a subject to a class
router.post('/:classId/subjects',            authorize('superuser', 'teacher'),            ClassSubjectController.create);
// Get / update / remove a specific class-subject assignment
router.get('/:classId/subjects/:id',         authorize('superuser', 'teacher', 'student'), ClassSubjectController.getById);
router.put('/:classId/subjects/:id',         authorize('superuser', 'teacher'),            ClassSubjectController.update);
router.delete('/:classId/subjects/:id',      authorize('superuser', 'teacher'),            ClassSubjectController.delete);

// ── Schedules (nested under class-subject) ────────────────────────────────────

// All schedules for a class (any day)
router.get('/:classId/schedules',            authorize('superuser', 'teacher', 'student'), ScheduleController.getByClass);
// Schedules for a specific class-subject
router.get('/:classId/subjects/:classSubjectId/schedules',  authorize('superuser', 'teacher', 'student'), ScheduleController.getByClassSubject);
// Add a schedule slot to a class-subject
router.post('/:classId/subjects/:classSubjectId/schedules', authorize('superuser', 'teacher'),            ScheduleController.create);

module.exports = router;

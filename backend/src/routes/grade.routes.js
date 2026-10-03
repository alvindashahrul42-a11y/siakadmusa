const express = require('express');
const router  = express.Router();
const GradeController       = require('../controllers/grade.controller');
const GradeImportController = require('../controllers/gradeImport.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadExcel } = require('../middleware/upload.middleware');

router.use(authenticate);

// ── Import / Export ──────────────────────────────────────────────────────────
// GET  /api/grades/template?class_subject_id=xxx — download template nilai Excel
router.get('/template',
  authorize('superuser', 'teacher'),
  GradeImportController.downloadTemplate
);

// POST /api/grades/import?class_subject_id=xxx — upload Excel nilai siswa
router.post('/import',
  authorize('superuser', 'teacher'),
  uploadExcel.single('file'),
  GradeImportController.importGrades
);

// ── CRUD Nilai ───────────────────────────────────────────────────────────────
// Student's grades across a class
router.get('/student',  authorize('superuser', 'teacher', 'student'), GradeController.getByStudent);

// List grades for a class_subject
router.get('/',         authorize('superuser', 'teacher', 'student'), GradeController.getByClassSubject);

// Upsert (create or update) grade
router.post('/',        authorize('superuser', 'teacher'),            GradeController.upsert);

// Single grade operations
router.get('/:id',      authorize('superuser', 'teacher', 'student'), GradeController.getById);
router.put('/:id',      authorize('superuser', 'teacher'),            GradeController.update);
router.delete('/:id',   authorize('superuser', 'teacher'),            GradeController.delete);

module.exports = router;

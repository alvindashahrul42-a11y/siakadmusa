const express = require('express');
const router  = express.Router();
const QuestionController       = require('../controllers/question.controller');
const QuestionImportController = require('../controllers/questionImport.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadExcel } = require('../middleware/upload.middleware');

router.use(authenticate);

// ── Import / Export (harus sebelum /:id agar tidak bentrok) ──────────────────
// GET  /api/questions/template        — download template Excel soal
router.get('/template',
  authorize('superuser', 'teacher'),
  QuestionImportController.downloadTemplate
);

// POST /api/questions/import?question_set_id=xxx — upload Excel soal
router.post('/import',
  authorize('superuser', 'teacher'),
  uploadExcel.single('file'),
  QuestionImportController.importQuestions
);

// ── CRUD Soal ────────────────────────────────────────────────────────────────
router.post('/',                  authorize('superuser', 'teacher'),            QuestionController.create);
router.get('/',                   authorize('superuser', 'teacher', 'student'), QuestionController.getByQuestionSet);
router.patch('/reorder',          authorize('superuser', 'teacher'),            QuestionController.reorder);
router.get('/:id',                authorize('superuser', 'teacher', 'student'), QuestionController.getById);
router.put('/:id',                authorize('superuser', 'teacher'),            QuestionController.update);
router.put('/:id/options',        authorize('superuser', 'teacher'),            QuestionController.replaceOptions);
router.delete('/:id',             authorize('superuser', 'teacher'),            QuestionController.delete);

module.exports = router;

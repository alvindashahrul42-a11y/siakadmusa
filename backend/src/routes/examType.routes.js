const express = require('express');
const router  = express.Router();
const ExamTypeController = require('../controllers/examType.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',          authorize('superuser'),                              ExamTypeController.create);
router.get('/',           authorize('superuser', 'teacher', 'student'),        ExamTypeController.getAll);
router.get('/active',     authorize('superuser', 'teacher', 'student'),        ExamTypeController.getActive);
router.get('/:id',        authorize('superuser', 'teacher', 'student'),        ExamTypeController.getById);
router.put('/:id',        authorize('superuser'),                              ExamTypeController.update);
router.delete('/:id',     authorize('superuser'),                              ExamTypeController.delete);

module.exports = router;

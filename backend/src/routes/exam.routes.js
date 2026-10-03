const express = require('express');
const router  = express.Router();
const ExamController = require('../controllers/exam.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',                      authorize('superuser', 'teacher'),            ExamController.create);
router.get('/',                       authorize('superuser', 'teacher', 'student'), ExamController.getAll);
router.get('/:id',                    authorize('superuser', 'teacher', 'student'), ExamController.getById);
router.put('/:id',                    authorize('superuser', 'teacher'),            ExamController.update);
router.patch('/:id/toggle-publish',   authorize('superuser', 'teacher'),            ExamController.togglePublish);
router.delete('/:id',                 authorize('superuser', 'teacher'),            ExamController.delete);

module.exports = router;

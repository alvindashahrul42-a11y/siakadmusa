const express = require('express');
const router  = express.Router();
const ExamAnswerController = require('../controllers/examAnswer.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',                    authorize('student'),                         ExamAnswerController.save);
router.get('/',                     authorize('superuser', 'teacher', 'student'), ExamAnswerController.getByAttempt);
router.patch('/:id/grade',          authorize('superuser', 'teacher'),            ExamAnswerController.gradeEssay);

module.exports = router;

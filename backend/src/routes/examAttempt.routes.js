const express = require('express');
const router  = express.Router();
const ExamAttemptController = require('../controllers/examAttempt.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/start',                 authorize('student'),                      ExamAttemptController.start);
router.get('/my',                     authorize('student'),                      ExamAttemptController.getMy);
router.get('/',                       authorize('superuser', 'teacher'),         ExamAttemptController.getBySchedule);
router.get('/:id',                    authorize('superuser', 'teacher', 'student'), ExamAttemptController.getById);
router.post('/:id/submit',            authorize('student'),                      ExamAttemptController.submit);
router.post('/:id/timeout',           authorize('student'),                      ExamAttemptController.timeout);
router.patch('/:id/tab-switch',       authorize('student'),                      ExamAttemptController.tabSwitch);

module.exports = router;

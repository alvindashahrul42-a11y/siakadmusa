const express = require('express');
const router  = express.Router();
const QuestionSetController = require('../controllers/questionSet.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',          authorize('superuser', 'teacher'),            QuestionSetController.create);
router.get('/',           authorize('superuser', 'teacher', 'student'), QuestionSetController.getAll);
router.get('/ready',      authorize('superuser', 'teacher'),            QuestionSetController.getReady);
router.get('/:id',        authorize('superuser', 'teacher', 'student'), QuestionSetController.getById);
router.put('/:id',        authorize('superuser', 'teacher'),            QuestionSetController.update);
router.delete('/:id',     authorize('superuser', 'teacher'),            QuestionSetController.delete);

module.exports = router;

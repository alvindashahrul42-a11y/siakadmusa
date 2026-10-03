const express = require('express');
const router  = express.Router();
const SubjectController = require('../controllers/subject.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET all without pagination (for dropdowns)
router.get('/all', authorize('superuser', 'teacher', 'student'), SubjectController.getAllNoPagination);

router.post('/',    authorize('superuser'),                       SubjectController.create);
router.get('/',     authorize('superuser', 'teacher', 'student'), SubjectController.getAll);
router.get('/:id',  authorize('superuser', 'teacher', 'student'), SubjectController.getById);
router.put('/:id',  authorize('superuser'),                       SubjectController.update);
router.delete('/:id', authorize('superuser'),                     SubjectController.delete);

module.exports = router;

const express = require('express');
const router  = express.Router();
const AssignmentController = require('../controllers/assignment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/',        authorize('superuser', 'teacher'),            AssignmentController.create);
router.get('/',         authorize('superuser', 'teacher', 'student'), AssignmentController.getByClassSubject);
router.get('/:id',      authorize('superuser', 'teacher', 'student'), AssignmentController.getById);
router.put('/:id',      authorize('superuser', 'teacher'),            AssignmentController.update);
router.delete('/:id',   authorize('superuser', 'teacher'),            AssignmentController.delete);

module.exports = router;

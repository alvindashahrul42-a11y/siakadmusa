const express = require('express');
const router = express.Router();
const AcademicYearController = require('../controllers/academicYear.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET all without pagination (dropdown)
router.get('/all', authorize('superuser', 'teacher'), AcademicYearController.getAllNoPagination);

// CRUD
router.post('/',   authorize('superuser'), AcademicYearController.create);
router.get('/',    authorize('superuser', 'teacher'), AcademicYearController.getAll);
router.get('/:id', authorize('superuser', 'teacher'), AcademicYearController.getById);
router.put('/:id', authorize('superuser'), AcademicYearController.update);
router.patch('/:id/set-active', authorize('superuser'), AcademicYearController.setActive);
router.delete('/:id', authorize('superuser'), AcademicYearController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Semua route butuh login
router.use(authenticate);

/**
 * @route   GET /api/students
 * @access  Private (Superuser/Teacher)
 */
router.get('/', authorize('superuser', 'teacher'), StudentController.getAll);

/**
 * @route   GET /api/students/:id
 * @access  Private (Superuser/Teacher)
 */
router.get('/:id', authorize('superuser', 'teacher'), StudentController.getById);

/**
 * @route   PUT /api/students/:id
 * @access  Private (Superuser/Teacher)
 */
router.put('/:id', authorize('superuser', 'teacher'), StudentController.update);

/**
 * @route   DELETE /api/students/:id
 * @access  Private (Superuser only)
 */
router.delete('/:id', authorize('superuser'), StudentController.delete);

module.exports = router;

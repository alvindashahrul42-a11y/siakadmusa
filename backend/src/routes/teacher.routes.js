const express = require('express');
const router = express.Router();
const TeacherController = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Semua route butuh login
router.use(authenticate);

/**
 * @route   POST /api/teachers
 * @access  Private (Superuser only)
 */
router.post('/', authorize('superuser'), TeacherController.create);

/**
 * @route   GET /api/teachers
 * @access  Private (Superuser/Teacher)
 */
router.get('/', authorize('superuser', 'teacher'), TeacherController.getAll);

/**
 * @route   GET /api/teachers/:id
 * @access  Private (Superuser/Teacher)
 */
router.get('/:id', authorize('superuser', 'teacher'), TeacherController.getById);

/**
 * @route   PUT /api/teachers/:id
 * @access  Private (Superuser only)
 */
router.put('/:id', authorize('superuser'), TeacherController.update);

/**
 * @route   DELETE /api/teachers/:id
 * @access  Private (Superuser only)
 */
router.delete('/:id', authorize('superuser'), TeacherController.delete);

module.exports = router;

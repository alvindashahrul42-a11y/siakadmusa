const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Semua route butuh login
router.use(authenticate);

/**
 * @route   GET /api/users
 * @access  Private (Superuser/Teacher)
 */
router.get('/', authorize('superuser', 'teacher'), UserController.getAll);

/**
 * @route   GET /api/users/:id
 * @access  Private (Superuser/Teacher)
 */
router.get('/:id', authorize('superuser', 'teacher'), UserController.getById);

/**
 * @route   PUT /api/users/:id
 * @access  Private (Superuser/Teacher)
 */
router.put('/:id', authorize('superuser', 'teacher'), UserController.update);

/**
 * @route   PATCH /api/users/:id/toggle-active
 * @access  Private (Superuser/Teacher)
 */
router.patch('/:id/toggle-active', authorize('superuser', 'teacher'), UserController.toggleActive);

/**
 * @route   DELETE /api/users/:id
 * @access  Private (Superuser/Teacher)
 */
router.delete('/:id', authorize('superuser', 'teacher'), UserController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Semua route butuh login
router.use(authenticate);

/**
 * @route   GET /api/users
 * @access  Private (Superuser)
 */
router.get('/', authorize('superuser'), UserController.getAll);

/**
 * @route   GET /api/users/:id
 * @access  Private (Superuser)
 */
router.get('/:id', authorize('superuser'), UserController.getById);

/**
 * @route   PUT /api/users/:id
 * @access  Private (Superuser)
 */
router.put('/:id', authorize('superuser'), UserController.update);

/**
 * @route   PATCH /api/users/:id/toggle-active
 * @access  Private (Superuser)
 */
router.patch('/:id/toggle-active', authorize('superuser'), UserController.toggleActive);

/**
 * @route   DELETE /api/users/:id
 * @access  Private (Superuser)
 */
router.delete('/:id', authorize('superuser'), UserController.delete);

module.exports = router;

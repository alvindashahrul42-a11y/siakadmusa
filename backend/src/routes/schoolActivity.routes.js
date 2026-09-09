const express = require('express');
const router = express.Router();
const SchoolActivityController = require('../controllers/schoolActivity.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createUploadMiddleware } = require('../middleware/upload.middleware');

const uploadActivity = createUploadMiddleware('activities', 'activity');

/**
 * @route   GET /api/school-activities
 * @access  Public
 */
router.get('/', SchoolActivityController.getAll);

/**
 * @route   GET /api/school-activities/:id
 * @access  Public
 */
router.get('/:id', SchoolActivityController.getById);

/**
 * @route   POST /api/school-activities
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'superuser'),
  uploadActivity.single('image'),
  SchoolActivityController.create
);

/**
 * @route   PUT /api/school-activities/:id
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  uploadActivity.single('image'),
  SchoolActivityController.update
);

/**
 * @route   DELETE /api/school-activities/:id
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  SchoolActivityController.delete
);

module.exports = router;

const express = require('express');
const router = express.Router();
const ExtracurricularController = require('../controllers/extracurricular.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createUploadMiddleware } = require('../middleware/upload.middleware');

const uploadExtracurricular = createUploadMiddleware('extracurriculars', 'extracurricular');

/**
 * @route   GET /api/extracurriculars
 * @desc    Get all extracurriculars (paginated)
 * @access  Public
 */
router.get('/', ExtracurricularController.getAll);

/**
 * @route   GET /api/extracurriculars/:id
 * @desc    Get extracurricular by ID
 * @access  Public
 */
router.get('/:id', ExtracurricularController.getById);

/**
 * @route   POST /api/extracurriculars
 * @desc    Create new extracurricular
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'superuser'),
  uploadExtracurricular.single('image'),
  ExtracurricularController.create
);

/**
 * @route   PUT /api/extracurriculars/:id
 * @desc    Update extracurricular
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  uploadExtracurricular.single('image'),
  ExtracurricularController.update
);

/**
 * @route   DELETE /api/extracurriculars/:id
 * @desc    Delete extracurricular
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  ExtracurricularController.delete
);

module.exports = router;

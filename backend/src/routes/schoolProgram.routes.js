const express = require('express');
const router = express.Router();
const SchoolProgramController = require('../controllers/schoolProgram.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadProgram } = require('../middleware/upload.middleware');

/**
 * @route   GET /api/school-programs
 * @desc    Get all programs (paginated)
 * @access  Public
 */
router.get('/', SchoolProgramController.getAll);

/**
 * @route   GET /api/school-programs/:id
 * @desc    Get program by ID
 * @access  Public
 */
router.get('/:id', SchoolProgramController.getById);

/**
 * @route   POST /api/school-programs
 * @desc    Create new program
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'superuser'),
  uploadProgram.single('image'),
  SchoolProgramController.create
);

/**
 * @route   PUT /api/school-programs/:id
 * @desc    Update program
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  uploadProgram.single('image'),
  SchoolProgramController.update
);

/**
 * @route   DELETE /api/school-programs/:id
 * @desc    Delete program
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  SchoolProgramController.delete
);

module.exports = router;

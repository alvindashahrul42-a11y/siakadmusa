const express = require('express');
const router = express.Router();
const SchoolFacilityController = require('../controllers/schoolFacility.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadFacility } = require('../middleware/upload.middleware');

/**
 * @route   GET /api/school-facilities
 * @desc    Get all facilities (paginated)
 * @access  Public
 */
router.get('/', SchoolFacilityController.getAll);

/**
 * @route   GET /api/school-facilities/:id
 * @desc    Get facility by ID
 * @access  Public
 */
router.get('/:id', SchoolFacilityController.getById);

/**
 * @route   POST /api/school-facilities
 * @desc    Create new facility
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'superuser'),
  uploadFacility.single('image'),
  SchoolFacilityController.create
);

/**
 * @route   PUT /api/school-facilities/:id
 * @desc    Update facility
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  uploadFacility.single('image'),
  SchoolFacilityController.update
);

/**
 * @route   DELETE /api/school-facilities/:id
 * @desc    Delete facility
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  SchoolFacilityController.delete
);

module.exports = router;

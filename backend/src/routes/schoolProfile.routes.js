const express = require('express');
const router = express.Router();
const SchoolProfileController = require('../controllers/schoolProfile.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadLogo } = require('../middleware/upload.middleware');

/**
 * @route   GET /api/school-profile
 * @desc    Get school profile
 * @access  Public (no JWT required)
 */
router.get('/', SchoolProfileController.get);

/**
 * @route   POST /api/school-profile
 * @desc    Create school profile
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize('admin', 'superuser'), uploadLogo.single('logo'), SchoolProfileController.create);

/**
 * @route   PUT /api/school-profile/:id
 * @desc    Update school profile
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize('admin', 'superuser'), uploadLogo.single('logo'), SchoolProfileController.update);

/**
 * @route   DELETE /api/school-profile/:id
 * @desc    Delete school profile
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin', 'superuser'), SchoolProfileController.delete);

module.exports = router;

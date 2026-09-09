const express = require('express');
const router = express.Router();
const SchoolAchievementController = require('../controllers/schoolAchievement.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createUploadMiddleware } = require('../middleware/upload.middleware');

const uploadAchievement = createUploadMiddleware('achievements', 'achievement');

/**
 * @route   GET /api/school-achievements
 * @desc    Get all achievements (paginated)
 * @access  Public
 */
router.get('/', SchoolAchievementController.getAll);

/**
 * @route   GET /api/school-achievements/:id
 * @desc    Get achievement by ID
 * @access  Public
 */
router.get('/:id', SchoolAchievementController.getById);

/**
 * @route   POST /api/school-achievements
 * @desc    Create new achievement
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'superuser'),
  uploadAchievement.single('image'),
  SchoolAchievementController.create
);

/**
 * @route   PUT /api/school-achievements/:id
 * @desc    Update achievement
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  uploadAchievement.single('image'),
  SchoolAchievementController.update
);

/**
 * @route   DELETE /api/school-achievements/:id
 * @desc    Delete achievement
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  SchoolAchievementController.delete
);

module.exports = router;

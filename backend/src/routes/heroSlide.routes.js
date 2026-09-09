const express = require('express');
const router = express.Router();
const HeroSlideController = require('../controllers/heroSlide.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadHero } = require('../middleware/upload.middleware');

/**
 * @route   GET /api/hero-slides
 * @desc    Get all hero slides
 * @access  Public (no JWT required)
 */
router.get('/', HeroSlideController.getAll);

/**
 * @route   GET /api/hero-slides/:id
 * @desc    Get hero slide by ID
 * @access  Public (no JWT required)
 */
router.get('/:id', HeroSlideController.getById);

/**
 * @route   POST /api/hero-slides
 * @desc    Create new hero slide
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize('admin', 'superuser'), uploadHero.single('image'), HeroSlideController.create);

/**
 * @route   PUT /api/hero-slides/:id
 * @desc    Update hero slide
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, authorize('admin', 'superuser'), uploadHero.single('image'), HeroSlideController.update);

/**
 * @route   DELETE /api/hero-slides/:id
 * @desc    Delete hero slide
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin', 'superuser'), HeroSlideController.delete);

module.exports = router;

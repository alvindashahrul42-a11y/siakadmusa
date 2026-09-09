const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/article.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createUploadMiddleware } = require('../middleware/upload.middleware');

const uploadArticle = createUploadMiddleware('articles', 'article');

/**
 * @route   GET /api/articles
 * @desc    Get all articles (paginated, filterable)
 * @access  Public
 */
router.get('/', ArticleController.getAll);

/**
 * @route   GET /api/articles/slug/:slug
 * @desc    Get article by slug
 * @access  Public
 * NOTE: This route must come before /:id to avoid slug being parsed as id
 */
router.get('/slug/:slug', ArticleController.getBySlug);

/**
 * @route   GET /api/articles/:id
 * @desc    Get article by ID
 * @access  Public
 */
router.get('/:id', ArticleController.getById);

/**
 * @route   POST /api/articles
 * @desc    Create new article
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'superuser'),
  uploadArticle.single('thumbnail'),
  ArticleController.create
);

/**
 * @route   PUT /api/articles/:id
 * @desc    Update article
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  uploadArticle.single('thumbnail'),
  ArticleController.update
);

/**
 * @route   DELETE /api/articles/:id
 * @desc    Delete article
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superuser'),
  ArticleController.delete
);

module.exports = router;

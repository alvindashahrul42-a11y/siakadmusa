const ArticleModel = require('../models/Article.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateArticle } = require('../validators/article.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');
const path = require('path');
const fs = require('fs');

class ArticleController {
  /**
   * GET /api/articles
   * @access Public
   */
  static async getAll(req, res) {
    try {
      const { is_published, category, search } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (is_published !== undefined) {
        filters.is_published = is_published === 'true' || is_published === '1';
      }
      if (category) filters.category = category;
      if (search)   filters.search   = search;

      const articles = await ArticleModel.findAll(filters, { limit, offset });
      const total    = await ArticleModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Articles retrieved successfully',
        articles,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all articles error:', error);
      return errorResponse(res, 500, 'Failed to retrieve articles', error.message);
    }
  }

  /**
   * GET /api/articles/:id
   * @access Public
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const article = await ArticleModel.findById(id);

      if (!article) {
        return errorResponse(res, 404, 'Article not found');
      }

      return successResponse(res, 200, 'Article retrieved successfully', { article });
    } catch (error) {
      console.error('Get article by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve article', error.message);
    }
  }

  /**
   * GET /api/articles/slug/:slug
   * @access Public
   */
  static async getBySlug(req, res) {
    try {
      const { slug } = req.params;
      const article = await ArticleModel.findBySlug(slug);

      if (!article) {
        return errorResponse(res, 404, 'Article not found');
      }

      return successResponse(res, 200, 'Article retrieved successfully', { article });
    } catch (error) {
      console.error('Get article by slug error:', error);
      return errorResponse(res, 500, 'Failed to retrieve article', error.message);
    }
  }

  /**
   * POST /api/articles
   * @access Private (Admin only)
   */
  static async create(req, res) {
    try {
      let { title, excerpt, content, category, is_published } = req.body;

      // Normalize booleans & empty strings
      if (is_published !== undefined) {
        is_published = is_published === 'true' || is_published === true || is_published === '1' || is_published === 1;
      }
      if (!excerpt   || excerpt.trim()   === '') excerpt   = null;
      if (!category  || category.trim()  === '') category  = null;

      let thumbnail = null;
      if (req.file) {
        thumbnail = '/uploads/articles/' + req.file.filename;
      }

      const validation = validateArticle({ title, excerpt, content, category, is_published }, false);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const article = await ArticleModel.create({
        title,
        excerpt,
        content,
        thumbnail,
        category,
        author_id: req.user?.id || null,
        is_published,
      });

      return successResponse(res, 201, 'Article created successfully', { article });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Create article error:', error);
      return errorResponse(res, 500, 'Failed to create article', error.message);
    }
  }

  /**
   * PUT /api/articles/:id
   * @access Private (Admin only)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      let { title, excerpt, content, category, is_published } = req.body;

      // Normalize booleans & empty strings
      if (is_published !== undefined) {
        is_published = is_published === 'true' || is_published === true || is_published === '1' || is_published === 1;
      }
      if (excerpt  !== undefined && (!excerpt  || excerpt.trim()  === '')) excerpt  = null;
      if (category !== undefined && (!category || category.trim() === '')) category = null;
      if (content  !== undefined && (!content  || content.trim()  === '')) content  = null;

      const existing = await ArticleModel.findById(id);
      if (!existing) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, 'Article not found');
      }

      let thumbnail = existing.thumbnail;
      if (req.file) {
        thumbnail = '/uploads/articles/' + req.file.filename;
      }

      const validation = validateArticle({ title, excerpt, content, category, is_published }, true);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old thumbnail if new one uploaded
      if (req.file && existing.thumbnail) {
        const oldPath = path.join(__dirname, '../../', existing.thumbnail);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const updated = await ArticleModel.update(id, {
        title, excerpt, content, thumbnail, category, is_published,
      });

      return successResponse(res, 200, 'Article updated successfully', { article: updated });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Update article error:', error);
      return errorResponse(res, 500, 'Failed to update article', error.message);
    }
  }

  /**
   * DELETE /api/articles/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await ArticleModel.findById(id);
      if (!existing) {
        return errorResponse(res, 404, 'Article not found');
      }

      await ArticleModel.delete(id);

      // Delete thumbnail file if exists
      if (existing.thumbnail) {
        const thumbPath = path.join(__dirname, '../../', existing.thumbnail);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }

      return successResponse(res, 200, 'Article deleted successfully');
    } catch (error) {
      console.error('Delete article error:', error);
      return errorResponse(res, 500, 'Failed to delete article', error.message);
    }
  }
}

module.exports = ArticleController;

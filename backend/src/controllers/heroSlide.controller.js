const HeroSlideModel = require('../models/HeroSlide.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateHeroSlide } = require('../validators/heroSlide.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');
const path = require('path');
const fs = require('fs');

class HeroSlideController {
  /**
   * Get all hero slides
   * GET /api/hero-slides
   * @access Public (no JWT required)
   */
  static async getAll(req, res) {
    try {
      const { is_active } = req.query;

      // Parse pagination parameters (default: page=1, limit=10)
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      
      // Filter by is_active if provided
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true' || is_active === '1';
      }

      // Get paginated data from database
      const heroSlides = await HeroSlideModel.findAll(filters, { limit, offset });
      const total = await HeroSlideModel.count(filters);

      // Always return with pagination metadata
      return successResponseWithPagination(
        res, 
        200, 
        'Hero slides retrieved successfully',
        heroSlides,
        { page, limit, total }
      );

    } catch (error) {
      console.error('Get all hero slides error:', error);
      return errorResponse(res, 500, 'Failed to retrieve hero slides', error.message);
    }
  }

  /**
   * Get hero slide by ID
   * GET /api/hero-slides/:id
   * @access Public (no JWT required)
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const heroSlide = await HeroSlideModel.findById(id);

      if (!heroSlide) {
        return errorResponse(res, 404, 'Hero slide not found');
      }

      return successResponse(res, 200, 'Hero slide retrieved successfully', {
        hero_slide: heroSlide
      });

    } catch (error) {
      console.error('Get hero slide by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve hero slide', error.message);
    }
  }

  /**
   * Create new hero slide
   * POST /api/hero-slides
   * @access Private (Admin only)
   */
  static async create(req, res) {
    try {
      let { title, subtitle, description, sort_order, is_active } = req.body;

      // Convert FormData string values to proper types
      if (sort_order) sort_order = parseInt(sort_order);
      if (is_active !== undefined) {
        is_active = is_active === 'true' || is_active === true || is_active === 1 || is_active === '1';
      }

      // Get image path from uploaded file
      let image = null;
      if (req.file) {
        image = '/uploads/hero/' + req.file.filename;
      }

      // Validate input
      const validation = validateHeroSlide({ title, subtitle, description, image, sort_order, is_active }, false);
      if (!validation.isValid) {
        // Delete uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Create hero slide
      const heroSlide = await HeroSlideModel.create({
        title,
        subtitle,
        description,
        image,
        sort_order,
        is_active
      });

      return successResponse(res, 201, 'Hero slide created successfully', {
        hero_slide: heroSlide
      });

    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Create hero slide error:', error);
      return errorResponse(res, 500, 'Failed to create hero slide', error.message);
    }
  }

  /**
   * Update hero slide
   * PUT /api/hero-slides/:id
   * @access Private (Admin only)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      let { title, subtitle, description, sort_order, is_active } = req.body;

      // Convert FormData string values to proper types
      if (sort_order) sort_order = parseInt(sort_order);
      if (is_active !== undefined) {
        is_active = is_active === 'true' || is_active === true || is_active === 1 || is_active === '1';
      }

      // Check if hero slide exists
      const existingSlide = await HeroSlideModel.findById(id);
      if (!existingSlide) {
        // Delete uploaded file if hero slide not found
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 404, 'Hero slide not found');
      }

      // Get image path from uploaded file or keep existing
      let image = existingSlide.image;
      if (req.file) {
        image = '/uploads/hero/' + req.file.filename;
      }

      // Validate input
      const validation = validateHeroSlide({ title, subtitle, description, image, sort_order, is_active }, true);
      if (!validation.isValid) {
        // Delete uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old image if new image uploaded
      if (req.file && existingSlide.image) {
        const oldImagePath = path.join(__dirname, '../../', existingSlide.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update hero slide
      const updatedHeroSlide = await HeroSlideModel.update(id, {
        title,
        subtitle,
        description,
        image,
        sort_order,
        is_active
      });

      return successResponse(res, 200, 'Hero slide updated successfully', {
        hero_slide: updatedHeroSlide
      });

    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Update hero slide error:', error);
      return errorResponse(res, 500, 'Failed to update hero slide', error.message);
    }
  }

  /**
   * Delete hero slide
   * DELETE /api/hero-slides/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if hero slide exists and get image path
      const existingSlide = await HeroSlideModel.findById(id);
      if (!existingSlide) {
        return errorResponse(res, 404, 'Hero slide not found');
      }

      // Delete hero slide from database
      await HeroSlideModel.delete(id);

      // Delete image file if exists
      if (existingSlide.image) {
        const imagePath = path.join(__dirname, '../../', existingSlide.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      return successResponse(res, 200, 'Hero slide deleted successfully');

    } catch (error) {
      console.error('Delete hero slide error:', error);
      return errorResponse(res, 500, 'Failed to delete hero slide', error.message);
    }
  }
}

module.exports = HeroSlideController;

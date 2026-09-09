const ExtracurricularModel = require('../models/Extracurricular.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateExtracurricular } = require('../validators/extracurricular.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');
const path = require('path');
const fs = require('fs');

class ExtracurricularController {
  /**
   * Get all extracurriculars
   * GET /api/extracurriculars
   * @access Public
   */
  static async getAll(req, res) {
    try {
      const { is_active } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true' || is_active === '1';
      }

      const extracurriculars = await ExtracurricularModel.findAll(filters, { limit, offset });
      const total = await ExtracurricularModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Extracurriculars retrieved successfully',
        extracurriculars,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all extracurriculars error:', error);
      return errorResponse(res, 500, 'Failed to retrieve extracurriculars', error.message);
    }
  }

  /**
   * Get extracurricular by ID
   * GET /api/extracurriculars/:id
   * @access Public
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const extracurricular = await ExtracurricularModel.findById(id);

      if (!extracurricular) {
        return errorResponse(res, 404, 'Extracurricular not found');
      }

      return successResponse(res, 200, 'Extracurricular retrieved successfully', { extracurricular });
    } catch (error) {
      console.error('Get extracurricular by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve extracurricular', error.message);
    }
  }

  /**
   * Create new extracurricular
   * POST /api/extracurriculars
   * @access Private (Admin only)
   */
  static async create(req, res) {
    try {
      let { name, sort_order, is_active } = req.body;

      if (sort_order) sort_order = parseInt(sort_order);
      if (is_active !== undefined) {
        is_active = is_active === 'true' || is_active === true || is_active === 1 || is_active === '1';
      }

      let image = null;
      if (req.file) {
        image = '/uploads/extracurriculars/' + req.file.filename;
      }

      const validation = validateExtracurricular({ name, image, sort_order, is_active }, false);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const extracurricular = await ExtracurricularModel.create({
        name, image, sort_order, is_active
      });

      return successResponse(res, 201, 'Extracurricular created successfully', { extracurricular });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Create extracurricular error:', error);
      return errorResponse(res, 500, 'Failed to create extracurricular', error.message);
    }
  }

  /**
   * Update extracurricular
   * PUT /api/extracurriculars/:id
   * @access Private (Admin only)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      let { name, sort_order, is_active } = req.body;

      if (sort_order) sort_order = parseInt(sort_order);
      if (is_active !== undefined) {
        is_active = is_active === 'true' || is_active === true || is_active === 1 || is_active === '1';
      }

      const existing = await ExtracurricularModel.findById(id);
      if (!existing) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, 'Extracurricular not found');
      }

      let image = existing.image;
      if (req.file) {
        image = '/uploads/extracurriculars/' + req.file.filename;
      }

      const validation = validateExtracurricular({ name, image, sort_order, is_active }, true);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old image if a new one was uploaded
      if (req.file && existing.image) {
        const oldImagePath = path.join(__dirname, '../../', existing.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      const updated = await ExtracurricularModel.update(id, {
        name, image, sort_order, is_active
      });

      return successResponse(res, 200, 'Extracurricular updated successfully', { extracurricular: updated });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Update extracurricular error:', error);
      return errorResponse(res, 500, 'Failed to update extracurricular', error.message);
    }
  }

  /**
   * Delete extracurricular
   * DELETE /api/extracurriculars/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await ExtracurricularModel.findById(id);
      if (!existing) {
        return errorResponse(res, 404, 'Extracurricular not found');
      }

      await ExtracurricularModel.delete(id);

      // Delete image file if exists
      if (existing.image) {
        const imagePath = path.join(__dirname, '../../', existing.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      return successResponse(res, 200, 'Extracurricular deleted successfully');
    } catch (error) {
      console.error('Delete extracurricular error:', error);
      return errorResponse(res, 500, 'Failed to delete extracurricular', error.message);
    }
  }
}

module.exports = ExtracurricularController;

const SchoolProgramModel = require('../models/SchoolProgram.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateSchoolProgram } = require('../validators/schoolProgram.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');
const path = require('path');
const fs = require('fs');

class SchoolProgramController {
  /**
   * Get all programs
   * GET /api/school-programs
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

      const programs = await SchoolProgramModel.findAll(filters, { limit, offset });
      const total = await SchoolProgramModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Programs retrieved successfully',
        programs,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all programs error:', error);
      return errorResponse(res, 500, 'Failed to retrieve programs', error.message);
    }
  }

  /**
   * Get program by ID
   * GET /api/school-programs/:id
   * @access Public
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const program = await SchoolProgramModel.findById(id);

      if (!program) {
        return errorResponse(res, 404, 'Program not found');
      }

      return successResponse(res, 200, 'Program retrieved successfully', { program });
    } catch (error) {
      console.error('Get program by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve program', error.message);
    }
  }

  /**
   * Create new program
   * POST /api/school-programs
   * @access Private (Admin only)
   */
  static async create(req, res) {
    try {
      let { name, description, sort_order, is_active } = req.body;

      if (sort_order) sort_order = parseInt(sort_order);
      if (is_active !== undefined) {
        is_active = is_active === 'true' || is_active === true || is_active === 1 || is_active === '1';
      }

      let image = null;
      if (req.file) {
        image = '/uploads/programs/' + req.file.filename;
      }

      const validation = validateSchoolProgram({ name, description, image, sort_order, is_active }, false);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const program = await SchoolProgramModel.create({
        name, description, image, sort_order, is_active
      });

      return successResponse(res, 201, 'Program created successfully', { program });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Create program error:', error);
      return errorResponse(res, 500, 'Failed to create program', error.message);
    }
  }

  /**
   * Update program
   * PUT /api/school-programs/:id
   * @access Private (Admin only)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      let { name, description, sort_order, is_active } = req.body;

      if (sort_order) sort_order = parseInt(sort_order);
      if (is_active !== undefined) {
        is_active = is_active === 'true' || is_active === true || is_active === 1 || is_active === '1';
      }

      const existingProgram = await SchoolProgramModel.findById(id);
      if (!existingProgram) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, 'Program not found');
      }

      let image = existingProgram.image;
      if (req.file) {
        image = '/uploads/programs/' + req.file.filename;
      }

      const validation = validateSchoolProgram({ name, description, image, sort_order, is_active }, true);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old image if a new one was uploaded
      if (req.file && existingProgram.image) {
        const oldImagePath = path.join(__dirname, '../../', existingProgram.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      const updatedProgram = await SchoolProgramModel.update(id, {
        name, description, image, sort_order, is_active
      });

      return successResponse(res, 200, 'Program updated successfully', { program: updatedProgram });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Update program error:', error);
      return errorResponse(res, 500, 'Failed to update program', error.message);
    }
  }

  /**
   * Delete program
   * DELETE /api/school-programs/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existingProgram = await SchoolProgramModel.findById(id);
      if (!existingProgram) {
        return errorResponse(res, 404, 'Program not found');
      }

      await SchoolProgramModel.delete(id);

      // Delete image file if exists
      if (existingProgram.image) {
        const imagePath = path.join(__dirname, '../../', existingProgram.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      return successResponse(res, 200, 'Program deleted successfully');
    } catch (error) {
      console.error('Delete program error:', error);
      return errorResponse(res, 500, 'Failed to delete program', error.message);
    }
  }
}

module.exports = SchoolProgramController;

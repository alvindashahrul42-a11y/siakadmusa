const SchoolFacilityModel = require('../models/SchoolFacility.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateFacility } = require('../validators/facility.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');
const path = require('path');
const fs = require('fs');

class SchoolFacilityController {
  /**
   * Get all facilities
   * GET /api/school-facilities
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

      const facilities = await SchoolFacilityModel.findAll(filters, { limit, offset });
      const total = await SchoolFacilityModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Facilities retrieved successfully',
        facilities,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all facilities error:', error);
      return errorResponse(res, 500, 'Failed to retrieve facilities', error.message);
    }
  }

  /**
   * Get facility by ID
   * GET /api/school-facilities/:id
   * @access Public
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const facility = await SchoolFacilityModel.findById(id);

      if (!facility) {
        return errorResponse(res, 404, 'Facility not found');
      }

      return successResponse(res, 200, 'Facility retrieved successfully', { facility });
    } catch (error) {
      console.error('Get facility by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve facility', error.message);
    }
  }

  /**
   * Create new facility
   * POST /api/school-facilities
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
        image = '/uploads/facilities/' + req.file.filename;
      }

      const validation = validateFacility({ name, description, image, sort_order, is_active }, false);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const facility = await SchoolFacilityModel.create({
        name, description, image, sort_order, is_active
      });

      return successResponse(res, 201, 'Facility created successfully', { facility });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Create facility error:', error);
      return errorResponse(res, 500, 'Failed to create facility', error.message);
    }
  }

  /**
   * Update facility
   * PUT /api/school-facilities/:id
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

      const existingFacility = await SchoolFacilityModel.findById(id);
      if (!existingFacility) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, 'Facility not found');
      }

      let image = existingFacility.image;
      if (req.file) {
        image = '/uploads/facilities/' + req.file.filename;
      }

      const validation = validateFacility({ name, description, image, sort_order, is_active }, true);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old image if a new one was uploaded
      if (req.file && existingFacility.image) {
        const oldImagePath = path.join(__dirname, '../../', existingFacility.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      const updatedFacility = await SchoolFacilityModel.update(id, {
        name, description, image, sort_order, is_active
      });

      return successResponse(res, 200, 'Facility updated successfully', { facility: updatedFacility });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Update facility error:', error);
      return errorResponse(res, 500, 'Failed to update facility', error.message);
    }
  }

  /**
   * Delete facility
   * DELETE /api/school-facilities/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existingFacility = await SchoolFacilityModel.findById(id);
      if (!existingFacility) {
        return errorResponse(res, 404, 'Facility not found');
      }

      await SchoolFacilityModel.delete(id);

      // Delete image file if exists
      if (existingFacility.image) {
        const imagePath = path.join(__dirname, '../../', existingFacility.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      return successResponse(res, 200, 'Facility deleted successfully');
    } catch (error) {
      console.error('Delete facility error:', error);
      return errorResponse(res, 500, 'Failed to delete facility', error.message);
    }
  }
}

module.exports = SchoolFacilityController;

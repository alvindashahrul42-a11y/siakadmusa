const SchoolActivityModel = require('../models/SchoolActivity.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateSchoolActivity } = require('../validators/schoolActivity.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');
const path = require('path');
const fs = require('fs');

class SchoolActivityController {
  /**
   * GET /api/school-activities
   * @access Public
   */
  static async getAll(req, res) {
    try {
      const { is_published } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (is_published !== undefined) {
        filters.is_published = is_published === 'true' || is_published === '1';
      }

      const activities = await SchoolActivityModel.findAll(filters, { limit, offset });
      const total = await SchoolActivityModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Activities retrieved successfully',
        activities,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all activities error:', error);
      return errorResponse(res, 500, 'Failed to retrieve activities', error.message);
    }
  }

  /**
   * GET /api/school-activities/:id
   * @access Public
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const activity = await SchoolActivityModel.findById(id);

      if (!activity) {
        return errorResponse(res, 404, 'Activity not found');
      }

      return successResponse(res, 200, 'Activity retrieved successfully', { activity });
    } catch (error) {
      console.error('Get activity by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve activity', error.message);
    }
  }

  /**
   * POST /api/school-activities
   * @access Private (Admin only)
   */
  static async create(req, res) {
    try {
      let { title, description, activity_date, sort_order, is_published } = req.body;

      if (sort_order !== undefined) sort_order = parseInt(sort_order);
      if (is_published !== undefined) {
        is_published = is_published === 'true' || is_published === true || is_published === '1' || is_published === 1;
      }
      if (activity_date === '') activity_date = null;

      let image = null;
      if (req.file) {
        image = '/uploads/activities/' + req.file.filename;
      }

      const validation = validateSchoolActivity({ title, image, activity_date, sort_order, is_published }, false);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const activity = await SchoolActivityModel.create({
        title, description, image, activity_date, sort_order, is_published,
      });

      return successResponse(res, 201, 'Activity created successfully', { activity });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Create activity error:', error);
      return errorResponse(res, 500, 'Failed to create activity', error.message);
    }
  }

  /**
   * PUT /api/school-activities/:id
   * @access Private (Admin only)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      let { title, description, activity_date, sort_order, is_published } = req.body;

      if (sort_order !== undefined) sort_order = parseInt(sort_order);
      if (is_published !== undefined) {
        is_published = is_published === 'true' || is_published === true || is_published === '1' || is_published === 1;
      }
      if (activity_date === '') activity_date = null;

      const existing = await SchoolActivityModel.findById(id);
      if (!existing) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, 'Activity not found');
      }

      let image = existing.image;
      if (req.file) {
        image = '/uploads/activities/' + req.file.filename;
      }

      const validation = validateSchoolActivity({ title, image, activity_date, sort_order, is_published }, true);
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old image if new one uploaded
      if (req.file && existing.image) {
        const oldPath = path.join(__dirname, '../../', existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const updated = await SchoolActivityModel.update(id, {
        title, description, image, activity_date, sort_order, is_published,
      });

      return successResponse(res, 200, 'Activity updated successfully', { activity: updated });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Update activity error:', error);
      return errorResponse(res, 500, 'Failed to update activity', error.message);
    }
  }

  /**
   * DELETE /api/school-activities/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await SchoolActivityModel.findById(id);
      if (!existing) {
        return errorResponse(res, 404, 'Activity not found');
      }

      await SchoolActivityModel.delete(id);

      if (existing.image) {
        const imgPath = path.join(__dirname, '../../', existing.image);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }

      return successResponse(res, 200, 'Activity deleted successfully');
    } catch (error) {
      console.error('Delete activity error:', error);
      return errorResponse(res, 500, 'Failed to delete activity', error.message);
    }
  }
}

module.exports = SchoolActivityController;

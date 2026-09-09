const SchoolAchievementModel = require('../models/SchoolAchievement.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateAchievement } = require('../validators/schoolAchievement.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');
const path = require('path');
const fs = require('fs');

class SchoolAchievementController {
  /**
   * Get all achievements
   * GET /api/school-achievements
   * @access Public
   */
  static async getAll(req, res) {
    try {
      const { is_published, category, level } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (is_published !== undefined) {
        filters.is_published = is_published === 'true' || is_published === '1';
      }
      if (category) filters.category = category;
      if (level) filters.level = level;

      const achievements = await SchoolAchievementModel.findAll(filters, { limit, offset });
      const total = await SchoolAchievementModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Achievements retrieved successfully',
        achievements,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all achievements error:', error);
      return errorResponse(res, 500, 'Failed to retrieve achievements', error.message);
    }
  }

  /**
   * Get achievement by ID
   * GET /api/school-achievements/:id
   * @access Public
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const achievement = await SchoolAchievementModel.findById(id);

      if (!achievement) {
        return errorResponse(res, 404, 'Achievement not found');
      }

      return successResponse(res, 200, 'Achievement retrieved successfully', { achievement });
    } catch (error) {
      console.error('Get achievement by ID error:', error);
      return errorResponse(res, 500, 'Failed to retrieve achievement', error.message);
    }
  }

  /**
   * Create new achievement
   * POST /api/school-achievements
   * @access Private (Admin only)
   */
  static async create(req, res) {
    try {
      let { title, description, category, level, student_name, achievement_date, sort_order, is_published } = req.body;

      if (sort_order !== undefined) sort_order = parseInt(sort_order);
      if (is_published !== undefined) {
        is_published = is_published === 'true' || is_published === true || is_published === 1 || is_published === '1';
      }
      // Normalize optional string fields — empty string → null
      if (!level || level.trim() === '') level = null;
      if (!category || category.trim() === '') category = null;
      if (!student_name || student_name.trim() === '') student_name = null;
      if (!achievement_date || achievement_date.trim() === '') achievement_date = null;
      if (!description || description.trim() === '') description = null;

      let image = null;
      if (req.file) {
        image = '/uploads/achievements/' + req.file.filename;
      }

      const validation = validateAchievement(
        { title, description, category, level, student_name, achievement_date, image, sort_order, is_published },
        false
      );
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const achievement = await SchoolAchievementModel.create({
        title, description, category, level, student_name, achievement_date, image, sort_order, is_published
      });

      return successResponse(res, 201, 'Achievement created successfully', { achievement });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Create achievement error:', error);
      return errorResponse(res, 500, 'Failed to create achievement', error.message);
    }
  }

  /**
   * Update achievement
   * PUT /api/school-achievements/:id
   * @access Private (Admin only)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      let { title, description, category, level, student_name, achievement_date, sort_order, is_published } = req.body;

      if (sort_order !== undefined) sort_order = parseInt(sort_order);
      if (is_published !== undefined) {
        is_published = is_published === 'true' || is_published === true || is_published === 1 || is_published === '1';
      }
      // Normalize optional string fields — empty string → null
      if (level !== undefined && (!level || level.trim() === '')) level = null;
      if (category !== undefined && (!category || category.trim() === '')) category = null;
      if (student_name !== undefined && (!student_name || student_name.trim() === '')) student_name = null;
      if (achievement_date !== undefined && (!achievement_date || achievement_date.trim() === '')) achievement_date = null;
      if (description !== undefined && (!description || description.trim() === '')) description = null;

      const existingAchievement = await SchoolAchievementModel.findById(id);
      if (!existingAchievement) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 404, 'Achievement not found');
      }

      let image = existingAchievement.image;
      if (req.file) {
        image = '/uploads/achievements/' + req.file.filename;
      }

      const validation = validateAchievement(
        { title, description, category, level, student_name, achievement_date, image, sort_order, is_published },
        true
      );
      if (!validation.isValid) {
        if (req.file) fs.unlinkSync(req.file.path);
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      // Delete old image if a new one was uploaded
      if (req.file && existingAchievement.image) {
        const oldImagePath = path.join(__dirname, '../../', existingAchievement.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      const updatedAchievement = await SchoolAchievementModel.update(id, {
        title, description, category, level, student_name, achievement_date, image, sort_order, is_published
      });

      return successResponse(res, 200, 'Achievement updated successfully', { achievement: updatedAchievement });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error('Update achievement error:', error);
      return errorResponse(res, 500, 'Failed to update achievement', error.message);
    }
  }

  /**
   * Delete achievement
   * DELETE /api/school-achievements/:id
   * @access Private (Admin only)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existingAchievement = await SchoolAchievementModel.findById(id);
      if (!existingAchievement) {
        return errorResponse(res, 404, 'Achievement not found');
      }

      await SchoolAchievementModel.delete(id);

      // Delete image file if exists
      if (existingAchievement.image) {
        const imagePath = path.join(__dirname, '../../', existingAchievement.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      return successResponse(res, 200, 'Achievement deleted successfully');
    } catch (error) {
      console.error('Delete achievement error:', error);
      return errorResponse(res, 500, 'Failed to delete achievement', error.message);
    }
  }
}

module.exports = SchoolAchievementController;

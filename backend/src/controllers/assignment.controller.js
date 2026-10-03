const AssignmentModel   = require('../models/Assignment.model');
const ClassSubjectModel = require('../models/ClassSubject.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateAssignment, validateUpdateAssignment } = require('../validators/assignment.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class AssignmentController {
  /**
   * POST /api/assignments
   */
  static async create(req, res) {
    try {
      const validation = validateCreateAssignment(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { class_subject_id, title, description, due_date, is_active } = req.body;

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const assignment = await AssignmentModel.create({
        class_subject_id, title, description,
        due_date: due_date || null,
        is_active: is_active !== false && is_active !== 'false',
      });

      return successResponse(res, 201, 'Tugas berhasil dibuat', { assignment });
    } catch (error) {
      console.error('Create assignment error:', error);
      return errorResponse(res, 500, 'Gagal membuat tugas', error.message);
    }
  }

  /**
   * GET /api/assignments — list for a class_subject
   */
  static async getByClassSubject(req, res) {
    try {
      const { class_subject_id } = req.query;
      if (!class_subject_id) {
        return errorResponse(res, 400, 'Parameter class_subject_id wajib diisi');
      }

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const { page, limit, offset } = parsePaginationParams(req.query);
      const assignments = await AssignmentModel.findByClassSubject(class_subject_id, { limit, offset });
      const total       = await AssignmentModel.countByClassSubject(class_subject_id);

      return successResponseWithPagination(
        res, 200, 'Daftar tugas berhasil dimuat',
        assignments, { page, limit, total }
      );
    } catch (error) {
      console.error('Get assignments error:', error);
      return errorResponse(res, 500, 'Gagal memuat tugas', error.message);
    }
  }

  /**
   * GET /api/assignments/:id
   */
  static async getById(req, res) {
    try {
      const assignment = await AssignmentModel.findById(req.params.id);
      if (!assignment) return errorResponse(res, 404, 'Tugas tidak ditemukan');
      return successResponse(res, 200, 'Tugas berhasil dimuat', { assignment });
    } catch (error) {
      console.error('Get assignment by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat tugas', error.message);
    }
  }

  /**
   * PUT /api/assignments/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await AssignmentModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Tugas tidak ditemukan');

      const validation = validateUpdateAssignment(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { title, description, due_date, is_active } = req.body;

      const updateData = {};
      if (title       !== undefined) updateData.title       = title;
      if (description !== undefined) updateData.description = description || null;
      if (due_date    !== undefined) updateData.due_date    = due_date || null;
      if (is_active   !== undefined) updateData.is_active   = is_active === false || is_active === 'false' ? 0 : 1;

      const assignment = await AssignmentModel.update(id, updateData);
      return successResponse(res, 200, 'Tugas berhasil diperbarui', { assignment });
    } catch (error) {
      console.error('Update assignment error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui tugas', error.message);
    }
  }

  /**
   * DELETE /api/assignments/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await AssignmentModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Tugas tidak ditemukan');

      await AssignmentModel.delete(id);
      return successResponse(res, 200, 'Tugas berhasil dihapus');
    } catch (error) {
      console.error('Delete assignment error:', error);
      return errorResponse(res, 500, 'Gagal menghapus tugas', error.message);
    }
  }
}

module.exports = AssignmentController;

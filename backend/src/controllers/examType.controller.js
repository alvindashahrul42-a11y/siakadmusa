const ExamTypeModel = require('../models/ExamType.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateExamType, validateUpdateExamType } = require('../validators/exam.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class ExamTypeController {
  /**
   * POST /api/exam-types
   */
  static async create(req, res) {
    try {
      const validation = validateCreateExamType(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { code, name, description, is_active } = req.body;

      // Check duplicate code
      const existing = await ExamTypeModel.findByCode(code);
      if (existing) {
        return errorResponse(res, 409, `Kode jenis ujian "${code.toUpperCase()}" sudah digunakan`);
      }

      const examType = await ExamTypeModel.create({
        code,
        name,
        description: description || null,
        is_active: is_active !== false && is_active !== 'false',
      });

      return successResponse(res, 201, 'Jenis ujian berhasil dibuat', { examType });
    } catch (error) {
      console.error('Create examType error:', error);
      return errorResponse(res, 500, 'Gagal membuat jenis ujian', error.message);
    }
  }

  /**
   * GET /api/exam-types
   */
  static async getAll(req, res) {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { search = '' } = req.query;

      const examTypes = await ExamTypeModel.findAll({ limit, offset, search });
      const total     = await ExamTypeModel.countAll({ search });

      return successResponseWithPagination(
        res, 200, 'Daftar jenis ujian berhasil dimuat',
        examTypes, { page, limit, total }
      );
    } catch (error) {
      console.error('Get examTypes error:', error);
      return errorResponse(res, 500, 'Gagal memuat jenis ujian', error.message);
    }
  }

  /**
   * GET /api/exam-types/active  — dropdown list
   */
  static async getActive(req, res) {
    try {
      const examTypes = await ExamTypeModel.findAllActive();
      return successResponse(res, 200, 'Jenis ujian aktif berhasil dimuat', { examTypes });
    } catch (error) {
      console.error('Get active examTypes error:', error);
      return errorResponse(res, 500, 'Gagal memuat jenis ujian', error.message);
    }
  }

  /**
   * GET /api/exam-types/:id
   */
  static async getById(req, res) {
    try {
      const examType = await ExamTypeModel.findById(req.params.id);
      if (!examType) return errorResponse(res, 404, 'Jenis ujian tidak ditemukan');
      return successResponse(res, 200, 'Jenis ujian berhasil dimuat', { examType });
    } catch (error) {
      console.error('Get examType by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat jenis ujian', error.message);
    }
  }

  /**
   * PUT /api/exam-types/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamTypeModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jenis ujian tidak ditemukan');

      const validation = validateUpdateExamType(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { code, name, description, is_active } = req.body;

      // Check duplicate code (skip self)
      if (code) {
        const dup = await ExamTypeModel.findByCode(code);
        if (dup && dup.id !== id) {
          return errorResponse(res, 409, `Kode jenis ujian "${code.toUpperCase()}" sudah digunakan`);
        }
      }

      const updateData = {};
      if (code        !== undefined) updateData.code        = code;
      if (name        !== undefined) updateData.name        = name;
      if (description !== undefined) updateData.description = description || null;
      if (is_active   !== undefined) updateData.is_active   = is_active === false || is_active === 'false' ? 0 : 1;

      const examType = await ExamTypeModel.update(id, updateData);
      return successResponse(res, 200, 'Jenis ujian berhasil diperbarui', { examType });
    } catch (error) {
      console.error('Update examType error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui jenis ujian', error.message);
    }
  }

  /**
   * DELETE /api/exam-types/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamTypeModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jenis ujian tidak ditemukan');

      await ExamTypeModel.delete(id);
      return successResponse(res, 200, 'Jenis ujian berhasil dihapus');
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return errorResponse(res, 409, 'Jenis ujian tidak dapat dihapus karena masih digunakan');
      }
      console.error('Delete examType error:', error);
      return errorResponse(res, 500, 'Gagal menghapus jenis ujian', error.message);
    }
  }
}

module.exports = ExamTypeController;

const SubjectModel = require('../models/Subject.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateSubject, validateUpdateSubject } = require('../validators/subject.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class SubjectController {
  /**
   * POST /api/subjects
   */
  static async create(req, res) {
    try {
      const validation = validateCreateSubject(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { code, name, description, is_active } = req.body;

      const existing = await SubjectModel.findByCode(code);
      if (existing) {
        return errorResponse(res, 409, 'Kode mata pelajaran sudah digunakan');
      }

      const subject = await SubjectModel.create({ code, name, description, is_active });
      return successResponse(res, 201, 'Mata pelajaran berhasil dibuat', { subject });
    } catch (error) {
      console.error('Create subject error:', error);
      return errorResponse(res, 500, 'Gagal membuat mata pelajaran', error.message);
    }
  }

  /**
   * GET /api/subjects/all — no pagination, for dropdowns
   */
  static async getAllNoPagination(req, res) {
    try {
      const subjects = await SubjectModel.findAllActive();
      return successResponse(res, 200, 'Daftar mata pelajaran berhasil dimuat', { subjects });
    } catch (error) {
      console.error('Get all subjects error:', error);
      return errorResponse(res, 500, 'Gagal memuat mata pelajaran', error.message);
    }
  }

  /**
   * GET /api/subjects
   */
  static async getAll(req, res) {
    try {
      const { search, is_active } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (search) filters.search = search;
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true' ? 1 : is_active === 'false' ? 0 : undefined;
      }

      const subjects = await SubjectModel.findAll(filters, { limit, offset });
      const total    = await SubjectModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Daftar mata pelajaran berhasil dimuat',
        subjects, { page, limit, total }
      );
    } catch (error) {
      console.error('Get all subjects error:', error);
      return errorResponse(res, 500, 'Gagal memuat mata pelajaran', error.message);
    }
  }

  /**
   * GET /api/subjects/:id
   */
  static async getById(req, res) {
    try {
      const subject = await SubjectModel.findById(req.params.id);
      if (!subject) return errorResponse(res, 404, 'Mata pelajaran tidak ditemukan');
      return successResponse(res, 200, 'Mata pelajaran berhasil dimuat', { subject });
    } catch (error) {
      console.error('Get subject by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat mata pelajaran', error.message);
    }
  }

  /**
   * PUT /api/subjects/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await SubjectModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Mata pelajaran tidak ditemukan');

      const validation = validateUpdateSubject(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { code, name, description, is_active } = req.body;

      // Check code uniqueness if changing
      if (code && code.trim().toUpperCase() !== existing.code) {
        const taken = await SubjectModel.findByCode(code);
        if (taken) return errorResponse(res, 409, 'Kode mata pelajaran sudah digunakan');
      }

      const updateData = {};
      if (code        !== undefined) updateData.code        = code;
      if (name        !== undefined) updateData.name        = name;
      if (description !== undefined) updateData.description = description;
      if (is_active   !== undefined) updateData.is_active   = is_active === false || is_active === 'false' ? 0 : 1;

      const subject = await SubjectModel.update(id, updateData);
      return successResponse(res, 200, 'Mata pelajaran berhasil diperbarui', { subject });
    } catch (error) {
      console.error('Update subject error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui mata pelajaran', error.message);
    }
  }

  /**
   * DELETE /api/subjects/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await SubjectModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Mata pelajaran tidak ditemukan');

      await SubjectModel.delete(id);
      return successResponse(res, 200, 'Mata pelajaran berhasil dihapus');
    } catch (error) {
      console.error('Delete subject error:', error);
      // FK RESTRICT will cause an error if subject is in use
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return errorResponse(res, 409, 'Mata pelajaran tidak dapat dihapus karena masih digunakan di kelas');
      }
      return errorResponse(res, 500, 'Gagal menghapus mata pelajaran', error.message);
    }
  }
}

module.exports = SubjectController;

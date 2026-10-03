const MajorModel = require('../models/Major.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateMajor, validateUpdateMajor } = require('../validators/major.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class MajorController {
  /**
   * POST /api/majors
   */
  static async create(req, res) {
    try {
      const validation = validateCreateMajor(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { code, name, description, is_active } = req.body;

      const existing = await MajorModel.findByCode(code.trim().toUpperCase());
      if (existing) {
        return errorResponse(res, 409, 'Kode jurusan sudah digunakan');
      }

      const major = await MajorModel.create({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description || null,
        is_active: is_active === false || is_active === 'false' ? 0 : 1,
      });

      return successResponse(res, 201, 'Jurusan berhasil dibuat', { major });
    } catch (error) {
      console.error('Create major error:', error);
      return errorResponse(res, 500, 'Gagal membuat jurusan', error.message);
    }
  }

  /**
   * GET /api/majors/all — tanpa pagination (untuk dropdown)
   */
  static async getAllNoPagination(req, res) {
    try {
      const majors = await MajorModel.findAll({ is_active: 1 }, { limit: 999, offset: 0 });
      return successResponse(res, 200, 'Daftar jurusan berhasil dimuat', { majors });
    } catch (error) {
      console.error('Get all majors (no pagination) error:', error);
      return errorResponse(res, 500, 'Gagal memuat jurusan', error.message);
    }
  }

  /**
   * GET /api/majors
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

      const majors = await MajorModel.findAll(filters, { limit, offset });
      const total  = await MajorModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Daftar jurusan berhasil dimuat',
        majors,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all majors error:', error);
      return errorResponse(res, 500, 'Gagal memuat jurusan', error.message);
    }
  }

  /**
   * GET /api/majors/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const major = await MajorModel.findById(id);
      if (!major) return errorResponse(res, 404, 'Jurusan tidak ditemukan');
      return successResponse(res, 200, 'Jurusan berhasil dimuat', { major });
    } catch (error) {
      console.error('Get major by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat jurusan', error.message);
    }
  }

  /**
   * PUT /api/majors/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await MajorModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jurusan tidak ditemukan');

      const validation = validateUpdateMajor(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { code, name, description, is_active } = req.body;

      if (code) {
        const upperCode = code.trim().toUpperCase();
        if (upperCode !== existing.code) {
          const taken = await MajorModel.findByCode(upperCode);
          if (taken) return errorResponse(res, 409, 'Kode jurusan sudah digunakan');
        }
      }

      const updateData = {};
      if (code !== undefined)        updateData.code = code.trim().toUpperCase();
      if (name !== undefined)        updateData.name = name.trim();
      if (description !== undefined) updateData.description = description || null;
      if (is_active !== undefined)   updateData.is_active = is_active === false || is_active === 'false' ? 0 : 1;

      const major = await MajorModel.update(id, updateData);
      return successResponse(res, 200, 'Jurusan berhasil diperbarui', { major });
    } catch (error) {
      console.error('Update major error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui jurusan', error.message);
    }
  }

  /**
   * DELETE /api/majors/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await MajorModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jurusan tidak ditemukan');

      await MajorModel.delete(id);
      return successResponse(res, 200, 'Jurusan berhasil dihapus');
    } catch (error) {
      console.error('Delete major error:', error);
      return errorResponse(res, 500, 'Gagal menghapus jurusan', error.message);
    }
  }
}

module.exports = MajorController;

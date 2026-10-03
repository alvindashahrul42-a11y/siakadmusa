const AcademicYearModel = require('../models/AcademicYear.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateAcademicYear, validateUpdateAcademicYear } = require('../validators/academicYear.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class AcademicYearController {
  /**
   * POST /api/academic-years
   */
  static async create(req, res) {
    try {
      const validation = validateCreateAcademicYear(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { name, start_date, end_date, is_active } = req.body;

      const existing = await AcademicYearModel.findByName(name.trim());
      if (existing) {
        return errorResponse(res, 409, 'Nama tahun ajaran sudah digunakan');
      }

      const academicYear = await AcademicYearModel.create({
        name: name.trim(),
        start_date,
        end_date,
        is_active: is_active === true || is_active === 'true' ? 1 : 0,
      });

      return successResponse(res, 201, 'Tahun ajaran berhasil dibuat', { academicYear });
    } catch (error) {
      console.error('Create academic year error:', error);
      return errorResponse(res, 500, 'Gagal membuat tahun ajaran', error.message);
    }
  }

  /**
   * GET /api/academic-years
   */
  static async getAll(req, res) {
    try {
      const { search, is_active } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (search) filters.search = search;
      if (is_active !== undefined) filters.is_active = is_active === 'true' ? 1 : is_active === 'false' ? 0 : undefined;

      const academicYears = await AcademicYearModel.findAll(filters, { limit, offset });
      const total = await AcademicYearModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Daftar tahun ajaran berhasil dimuat',
        academicYears,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all academic years error:', error);
      return errorResponse(res, 500, 'Gagal memuat tahun ajaran', error.message);
    }
  }

  /**
   * GET /api/academic-years/all — tanpa pagination (untuk dropdown)
   */
  static async getAllNoPagination(req, res) {
    try {
      const academicYears = await AcademicYearModel.findAll({}, { limit: 999, offset: 0 });
      return successResponse(res, 200, 'Daftar tahun ajaran berhasil dimuat', { academicYears });
    } catch (error) {
      console.error('Get all academic years (no pagination) error:', error);
      return errorResponse(res, 500, 'Gagal memuat tahun ajaran', error.message);
    }
  }

  /**
   * GET /api/academic-years/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const academicYear = await AcademicYearModel.findById(id);
      if (!academicYear) return errorResponse(res, 404, 'Tahun ajaran tidak ditemukan');
      return successResponse(res, 200, 'Tahun ajaran berhasil dimuat', { academicYear });
    } catch (error) {
      console.error('Get academic year by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat tahun ajaran', error.message);
    }
  }

  /**
   * PUT /api/academic-years/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await AcademicYearModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Tahun ajaran tidak ditemukan');

      const validation = validateUpdateAcademicYear(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { name, start_date, end_date, is_active } = req.body;

      if (name && name.trim() !== existing.name) {
        const taken = await AcademicYearModel.findByName(name.trim());
        if (taken) return errorResponse(res, 409, 'Nama tahun ajaran sudah digunakan');
      }

      const updateData = {};
      if (name !== undefined)       updateData.name = name.trim();
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined)   updateData.end_date = end_date;
      if (is_active !== undefined)  updateData.is_active = is_active === true || is_active === 'true' ? 1 : 0;

      const academicYear = await AcademicYearModel.update(id, updateData);
      return successResponse(res, 200, 'Tahun ajaran berhasil diperbarui', { academicYear });
    } catch (error) {
      console.error('Update academic year error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui tahun ajaran', error.message);
    }
  }

  /**
   * PATCH /api/academic-years/:id/set-active
   * Sets this year as the only active one
   */
  static async setActive(req, res) {
    try {
      const { id } = req.params;
      const existing = await AcademicYearModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Tahun ajaran tidak ditemukan');

      const academicYear = await AcademicYearModel.setActive(id);
      return successResponse(res, 200, 'Tahun ajaran aktif berhasil diset', { academicYear });
    } catch (error) {
      console.error('Set active academic year error:', error);
      return errorResponse(res, 500, 'Gagal mengaktifkan tahun ajaran', error.message);
    }
  }

  /**
   * DELETE /api/academic-years/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await AcademicYearModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Tahun ajaran tidak ditemukan');

      await AcademicYearModel.delete(id);
      return successResponse(res, 200, 'Tahun ajaran berhasil dihapus');
    } catch (error) {
      console.error('Delete academic year error:', error);
      return errorResponse(res, 500, 'Gagal menghapus tahun ajaran', error.message);
    }
  }
}

module.exports = AcademicYearController;

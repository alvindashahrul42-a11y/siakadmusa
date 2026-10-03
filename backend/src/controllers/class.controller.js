const ClassModel = require('../models/Class.model');
const AcademicYearModel = require('../models/AcademicYear.model');
const MajorModel = require('../models/Major.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateClass, validateUpdateClass } = require('../validators/class.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class ClassController {
  /**
   * POST /api/classes
   */
  static async create(req, res) {
    try {
      const validation = validateCreateClass(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const {
        academic_year_id, major_id, homeroom_teacher_id,
        name, grade_level, capacity, is_active
      } = req.body;

      // Check academic year exists
      const year = await AcademicYearModel.findById(academic_year_id);
      if (!year) return errorResponse(res, 404, 'Tahun ajaran tidak ditemukan');

      // Check major exists (if provided)
      if (major_id) {
        const major = await MajorModel.findById(major_id);
        if (!major) return errorResponse(res, 404, 'Jurusan tidak ditemukan');
      }

      // Unique constraint: year + name
      const duplicate = await ClassModel.findByYearAndName(academic_year_id, name.trim());
      if (duplicate) {
        return errorResponse(res, 409, 'Nama kelas sudah digunakan di tahun ajaran ini');
      }

      const classData = await ClassModel.create({
        academic_year_id,
        major_id: major_id || null,
        homeroom_teacher_id: homeroom_teacher_id || null,
        name: name.trim(),
        grade_level: parseInt(grade_level),
        capacity: capacity ? parseInt(capacity) : null,
        is_active: is_active === false || is_active === 'false' ? 0 : 1,
      });

      return successResponse(res, 201, 'Kelas berhasil dibuat', { class: classData });
    } catch (error) {
      console.error('Create class error:', error);
      return errorResponse(res, 500, 'Gagal membuat kelas', error.message);
    }
  }

  /**
   * GET /api/classes/all — tanpa pagination (untuk dropdown)
   */
  static async getAllNoPagination(req, res) {
    try {
      const { academic_year_id } = req.query;
      const filters = {};
      if (academic_year_id) filters.academic_year_id = academic_year_id;

      const classes = await ClassModel.findAll(filters, { limit: 999, offset: 0 });
      return successResponse(res, 200, 'Daftar kelas berhasil dimuat', { classes });
    } catch (error) {
      console.error('Get all classes (no pagination) error:', error);
      return errorResponse(res, 500, 'Gagal memuat kelas', error.message);
    }
  }

  /**
   * GET /api/classes
   */
  static async getAll(req, res) {
    try {
      const { search, academic_year_id, major_id, grade_level, is_active } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (search)           filters.search = search;
      if (academic_year_id) filters.academic_year_id = academic_year_id;
      if (major_id)         filters.major_id = major_id;
      if (grade_level)      filters.grade_level = parseInt(grade_level);
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true' ? 1 : is_active === 'false' ? 0 : undefined;
      }

      const classes = await ClassModel.findAll(filters, { limit, offset });
      const total   = await ClassModel.count(filters);

      return successResponseWithPagination(
        res, 200, 'Daftar kelas berhasil dimuat',
        classes,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get all classes error:', error);
      return errorResponse(res, 500, 'Gagal memuat kelas', error.message);
    }
  }

  /**
   * GET /api/classes/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const classData = await ClassModel.findById(id);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');
      return successResponse(res, 200, 'Kelas berhasil dimuat', { class: classData });
    } catch (error) {
      console.error('Get class by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat kelas', error.message);
    }
  }

  /**
   * PUT /api/classes/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await ClassModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      const validation = validateUpdateClass(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const {
        academic_year_id, major_id, homeroom_teacher_id,
        name, grade_level, capacity, is_active
      } = req.body;

      // Validate FK references
      if (academic_year_id) {
        const year = await AcademicYearModel.findById(academic_year_id);
        if (!year) return errorResponse(res, 404, 'Tahun ajaran tidak ditemukan');
      }
      if (major_id) {
        const major = await MajorModel.findById(major_id);
        if (!major) return errorResponse(res, 404, 'Jurusan tidak ditemukan');
      }

      // Check unique constraint if name or year changes
      const effectiveYearId  = academic_year_id || existing.academic_year_id;
      const effectiveName    = name ? name.trim() : existing.name;

      if (name || academic_year_id) {
        const duplicate = await ClassModel.findByYearAndName(effectiveYearId, effectiveName);
        if (duplicate && duplicate.id !== id) {
          return errorResponse(res, 409, 'Nama kelas sudah digunakan di tahun ajaran ini');
        }
      }

      const updateData = {};
      if (academic_year_id !== undefined)     updateData.academic_year_id = academic_year_id;
      if (major_id !== undefined)             updateData.major_id = major_id || null;
      if (homeroom_teacher_id !== undefined)  updateData.homeroom_teacher_id = homeroom_teacher_id || null;
      if (name !== undefined)                 updateData.name = name.trim();
      if (grade_level !== undefined)          updateData.grade_level = parseInt(grade_level);
      if (capacity !== undefined)             updateData.capacity = capacity ? parseInt(capacity) : null;
      if (is_active !== undefined)            updateData.is_active = is_active === false || is_active === 'false' ? 0 : 1;

      const classData = await ClassModel.update(id, updateData);
      return successResponse(res, 200, 'Kelas berhasil diperbarui', { class: classData });
    } catch (error) {
      console.error('Update class error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui kelas', error.message);
    }
  }

  /**
   * DELETE /api/classes/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await ClassModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      await ClassModel.delete(id);
      return successResponse(res, 200, 'Kelas berhasil dihapus');
    } catch (error) {
      console.error('Delete class error:', error);
      return errorResponse(res, 500, 'Gagal menghapus kelas', error.message);
    }
  }
}

module.exports = ClassController;

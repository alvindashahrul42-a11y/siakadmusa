const ExamModel       = require('../models/Exam.model');
const ExamTypeModel   = require('../models/ExamType.model');
const AcademicYearModel = require('../models/AcademicYear.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateExam, validateUpdateExam } = require('../validators/exam.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class ExamController {
  /**
   * POST /api/exams
   */
  static async create(req, res) {
    try {
      const validation = validateCreateExam(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { academic_year_id, exam_type_id, name, semester, start_date, end_date, is_published, notes } = req.body;

      const ay = await AcademicYearModel.findById(academic_year_id);
      if (!ay) return errorResponse(res, 404, 'Tahun ajaran tidak ditemukan');

      const et = await ExamTypeModel.findById(exam_type_id);
      if (!et) return errorResponse(res, 404, 'Jenis ujian tidak ditemukan');

      const exam = await ExamModel.create({
        academic_year_id, exam_type_id, name, semester,
        start_date, end_date,
        is_published: is_published === true || is_published === 'true',
        notes: notes || null,
      });

      return successResponse(res, 201, 'Ujian berhasil dibuat', { exam });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 409, 'Kombinasi tahun ajaran, jenis ujian, dan semester sudah ada');
      }
      console.error('Create exam error:', error);
      return errorResponse(res, 500, 'Gagal membuat ujian', error.message);
    }
  }

  /**
   * GET /api/exams
   */
  static async getAll(req, res) {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { search = '', academic_year_id = '', semester = '' } = req.query;

      const exams = await ExamModel.findAll({ limit, offset, search, academic_year_id, semester });
      const total = await ExamModel.countAll({ search, academic_year_id, semester });

      return successResponseWithPagination(
        res, 200, 'Daftar ujian berhasil dimuat',
        exams, { page, limit, total }
      );
    } catch (error) {
      console.error('Get exams error:', error);
      return errorResponse(res, 500, 'Gagal memuat daftar ujian', error.message);
    }
  }

  /**
   * GET /api/exams/:id
   */
  static async getById(req, res) {
    try {
      const exam = await ExamModel.findById(req.params.id);
      if (!exam) return errorResponse(res, 404, 'Ujian tidak ditemukan');
      return successResponse(res, 200, 'Ujian berhasil dimuat', { exam });
    } catch (error) {
      console.error('Get exam by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat ujian', error.message);
    }
  }

  /**
   * PUT /api/exams/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Ujian tidak ditemukan');

      const validation = validateUpdateExam(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { name, semester, start_date, end_date, is_published, notes, academic_year_id, exam_type_id } = req.body;

      const updateData = {};
      if (name             !== undefined) updateData.name             = name;
      if (semester         !== undefined) updateData.semester         = semester;
      if (start_date       !== undefined) updateData.start_date       = start_date;
      if (end_date         !== undefined) updateData.end_date         = end_date;
      if (is_published     !== undefined) updateData.is_published     = is_published === true || is_published === 'true' ? 1 : 0;
      if (notes            !== undefined) updateData.notes            = notes || null;
      if (academic_year_id !== undefined) updateData.academic_year_id = academic_year_id;
      if (exam_type_id     !== undefined) updateData.exam_type_id     = exam_type_id;

      const exam = await ExamModel.update(id, updateData);
      return successResponse(res, 200, 'Ujian berhasil diperbarui', { exam });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 409, 'Kombinasi tahun ajaran, jenis ujian, dan semester sudah ada');
      }
      console.error('Update exam error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui ujian', error.message);
    }
  }

  /**
   * PATCH /api/exams/:id/toggle-publish
   */
  static async togglePublish(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Ujian tidak ditemukan');

      const exam = await ExamModel.togglePublished(id);
      const msg  = exam.is_published ? 'Ujian berhasil dipublikasikan' : 'Ujian berhasil disembunyikan';
      return successResponse(res, 200, msg, { exam });
    } catch (error) {
      console.error('Toggle publish exam error:', error);
      return errorResponse(res, 500, 'Gagal mengubah status publikasi ujian', error.message);
    }
  }

  /**
   * DELETE /api/exams/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Ujian tidak ditemukan');

      await ExamModel.delete(id);
      return successResponse(res, 200, 'Ujian berhasil dihapus');
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return errorResponse(res, 409, 'Ujian tidak dapat dihapus karena masih memiliki jadwal');
      }
      console.error('Delete exam error:', error);
      return errorResponse(res, 500, 'Gagal menghapus ujian', error.message);
    }
  }
}

module.exports = ExamController;

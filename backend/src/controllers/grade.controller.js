const GradeModel        = require('../models/Grade.model');
const ClassSubjectModel = require('../models/ClassSubject.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateGrade, validateUpdateGrade } = require('../validators/grade.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class GradeController {
  /**
   * POST /api/grades — upsert grade for one student
   */
  static async upsert(req, res) {
    try {
      const validation = validateGrade(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const {
        class_subject_id, student_id,
        assignment_score, midterm_score, final_exam_score, final_score, notes,
      } = req.body;

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const grade = await GradeModel.upsert({
        class_subject_id, student_id,
        assignment_score:  assignment_score  !== undefined ? parseFloat(assignment_score)  : null,
        midterm_score:     midterm_score     !== undefined ? parseFloat(midterm_score)     : null,
        final_exam_score:  final_exam_score  !== undefined ? parseFloat(final_exam_score)  : null,
        final_score:       final_score       !== undefined ? parseFloat(final_score)       : null,
        notes: notes || null,
      });

      return successResponse(res, 200, 'Nilai berhasil disimpan', { grade });
    } catch (error) {
      console.error('Upsert grade error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan nilai', error.message);
    }
  }

  /**
   * GET /api/grades — list grades for a class_subject
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
      const grades = await GradeModel.findByClassSubject(class_subject_id, { limit, offset });
      const total  = await GradeModel.countByClassSubject(class_subject_id);

      return successResponseWithPagination(
        res, 200, 'Data nilai berhasil dimuat',
        grades, { page, limit, total }
      );
    } catch (error) {
      console.error('Get grades error:', error);
      return errorResponse(res, 500, 'Gagal memuat nilai', error.message);
    }
  }

  /**
   * GET /api/grades/student — grades for a student across a class
   */
  static async getByStudent(req, res) {
    try {
      const { student_id, class_id } = req.query;
      if (!student_id || !class_id) {
        return errorResponse(res, 400, 'Parameter student_id dan class_id wajib diisi');
      }

      const grades = await GradeModel.findByStudentAndClass(student_id, class_id);
      return successResponse(res, 200, 'Data nilai siswa berhasil dimuat', { grades });
    } catch (error) {
      console.error('Get grades by student error:', error);
      return errorResponse(res, 500, 'Gagal memuat nilai siswa', error.message);
    }
  }

  /**
   * GET /api/grades/:id
   */
  static async getById(req, res) {
    try {
      const grade = await GradeModel.findById(req.params.id);
      if (!grade) return errorResponse(res, 404, 'Data nilai tidak ditemukan');
      return successResponse(res, 200, 'Data nilai berhasil dimuat', { grade });
    } catch (error) {
      console.error('Get grade by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat nilai', error.message);
    }
  }

  /**
   * PUT /api/grades/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await GradeModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Data nilai tidak ditemukan');

      const validation = validateUpdateGrade(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { assignment_score, midterm_score, final_exam_score, final_score, notes } = req.body;

      const updateData = {};
      if (assignment_score !== undefined) updateData.assignment_score = assignment_score !== '' ? parseFloat(assignment_score) : null;
      if (midterm_score    !== undefined) updateData.midterm_score    = midterm_score    !== '' ? parseFloat(midterm_score)    : null;
      if (final_exam_score !== undefined) updateData.final_exam_score = final_exam_score !== '' ? parseFloat(final_exam_score) : null;
      if (final_score      !== undefined) updateData.final_score      = final_score      !== '' ? parseFloat(final_score)      : null;
      if (notes            !== undefined) updateData.notes            = notes || null;

      const grade = await GradeModel.update(id, updateData);
      return successResponse(res, 200, 'Nilai berhasil diperbarui', { grade });
    } catch (error) {
      console.error('Update grade error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui nilai', error.message);
    }
  }

  /**
   * DELETE /api/grades/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await GradeModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Data nilai tidak ditemukan');

      await GradeModel.delete(id);
      return successResponse(res, 200, 'Nilai berhasil dihapus');
    } catch (error) {
      console.error('Delete grade error:', error);
      return errorResponse(res, 500, 'Gagal menghapus nilai', error.message);
    }
  }
}

module.exports = GradeController;

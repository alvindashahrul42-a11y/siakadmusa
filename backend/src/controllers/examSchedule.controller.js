const ExamScheduleModel  = require('../models/ExamSchedule.model');
const ExamModel          = require('../models/Exam.model');
const ClassSubjectModel  = require('../models/ClassSubject.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateExamSchedule, validateUpdateExamSchedule } = require('../validators/exam.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class ExamScheduleController {
  /**
   * POST /api/exam-schedules
   */
  static async create(req, res) {
    try {
      const validation = validateCreateExamSchedule(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { exam_id, class_subject_id, exam_date, start_time, end_time, room, notes } = req.body;

      const exam = await ExamModel.findById(exam_id);
      if (!exam) return errorResponse(res, 404, 'Ujian tidak ditemukan');

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const schedule = await ExamScheduleModel.create({
        exam_id, class_subject_id,
        exam_date, start_time, end_time,
        room: room || null,
        notes: notes || null,
      });

      return successResponse(res, 201, 'Jadwal ujian berhasil dibuat', { schedule });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 409, 'Jadwal ujian untuk kelas-mata pelajaran ini sudah ada pada ujian tersebut');
      }
      console.error('Create examSchedule error:', error);
      return errorResponse(res, 500, 'Gagal membuat jadwal ujian', error.message);
    }
  }

  /**
   * GET /api/exam-schedules?exam_id=xxx
   */
  static async getByExam(req, res) {
    try {
      const { exam_id, search = '' } = req.query;
      if (!exam_id) {
        return errorResponse(res, 400, 'Parameter exam_id wajib diisi');
      }

      const exam = await ExamModel.findById(exam_id);
      if (!exam) return errorResponse(res, 404, 'Ujian tidak ditemukan');

      const { page, limit, offset } = parsePaginationParams(req.query);
      const schedules = await ExamScheduleModel.findByExam(exam_id, { limit, offset, search });
      const total     = await ExamScheduleModel.countByExam(exam_id, { search });

      return successResponseWithPagination(
        res, 200, 'Jadwal ujian berhasil dimuat',
        schedules, { page, limit, total }
      );
    } catch (error) {
      console.error('Get examSchedules error:', error);
      return errorResponse(res, 500, 'Gagal memuat jadwal ujian', error.message);
    }
  }

  /**
   * GET /api/exam-schedules/:id
   */
  static async getById(req, res) {
    try {
      const schedule = await ExamScheduleModel.findById(req.params.id);
      if (!schedule) return errorResponse(res, 404, 'Jadwal ujian tidak ditemukan');
      return successResponse(res, 200, 'Jadwal ujian berhasil dimuat', { schedule });
    } catch (error) {
      console.error('Get examSchedule by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat jadwal ujian', error.message);
    }
  }

  /**
   * PUT /api/exam-schedules/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamScheduleModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jadwal ujian tidak ditemukan');

      const validation = validateUpdateExamSchedule(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { exam_date, start_time, end_time, room, notes, class_subject_id } = req.body;

      const updateData = {};
      if (exam_date        !== undefined) updateData.exam_date        = exam_date;
      if (start_time       !== undefined) updateData.start_time       = start_time;
      if (end_time         !== undefined) updateData.end_time         = end_time;
      if (room             !== undefined) updateData.room             = room || null;
      if (notes            !== undefined) updateData.notes            = notes || null;
      if (class_subject_id !== undefined) updateData.class_subject_id = class_subject_id;

      const schedule = await ExamScheduleModel.update(id, updateData);
      return successResponse(res, 200, 'Jadwal ujian berhasil diperbarui', { schedule });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 409, 'Jadwal ujian untuk kelas-mata pelajaran ini sudah ada pada ujian tersebut');
      }
      console.error('Update examSchedule error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui jadwal ujian', error.message);
    }
  }

  /**
   * DELETE /api/exam-schedules/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamScheduleModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jadwal ujian tidak ditemukan');

      await ExamScheduleModel.delete(id);
      return successResponse(res, 200, 'Jadwal ujian berhasil dihapus');
    } catch (error) {
      console.error('Delete examSchedule error:', error);
      return errorResponse(res, 500, 'Gagal menghapus jadwal ujian', error.message);
    }
  }
}

module.exports = ExamScheduleController;

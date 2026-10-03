const ExamSupervisorModel = require('../models/ExamSupervisor.model');
const ExamScheduleModel  = require('../models/ExamSchedule.model');
const TeacherModel       = require('../models/Teacher.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { validateCreateExamSupervisor } = require('../validators/exam.validator');

class ExamSupervisorController {
  /**
   * POST /api/exam-supervisors
   */
  static async create(req, res) {
    try {
      const validation = validateCreateExamSupervisor(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { exam_schedule_id, teacher_id } = req.body;

      const schedule = await ExamScheduleModel.findById(exam_schedule_id);
      if (!schedule) return errorResponse(res, 404, 'Jadwal ujian tidak ditemukan');

      const teacher = await TeacherModel.findById(teacher_id);
      if (!teacher) return errorResponse(res, 404, 'Guru tidak ditemukan');

      const supervisor = await ExamSupervisorModel.create({ exam_schedule_id, teacher_id });
      return successResponse(res, 201, 'Pengawas ujian berhasil ditambahkan', { supervisor });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 409, 'Guru ini sudah terdaftar sebagai pengawas pada jadwal tersebut');
      }
      console.error('Create examSupervisor error:', error);
      return errorResponse(res, 500, 'Gagal menambahkan pengawas ujian', error.message);
    }
  }

  /**
   * GET /api/exam-supervisors?exam_schedule_id=xxx
   */
  static async getBySchedule(req, res) {
    try {
      const { exam_schedule_id } = req.query;
      if (!exam_schedule_id) {
        return errorResponse(res, 400, 'Parameter exam_schedule_id wajib diisi');
      }

      const schedule = await ExamScheduleModel.findById(exam_schedule_id);
      if (!schedule) return errorResponse(res, 404, 'Jadwal ujian tidak ditemukan');

      const supervisors = await ExamSupervisorModel.findBySchedule(exam_schedule_id);
      return successResponse(res, 200, 'Daftar pengawas berhasil dimuat', { supervisors });
    } catch (error) {
      console.error('Get examSupervisors error:', error);
      return errorResponse(res, 500, 'Gagal memuat daftar pengawas', error.message);
    }
  }

  /**
   * GET /api/exam-supervisors/:id
   */
  static async getById(req, res) {
    try {
      const supervisor = await ExamSupervisorModel.findById(req.params.id);
      if (!supervisor) return errorResponse(res, 404, 'Pengawas ujian tidak ditemukan');
      return successResponse(res, 200, 'Pengawas ujian berhasil dimuat', { supervisor });
    } catch (error) {
      console.error('Get examSupervisor by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat pengawas ujian', error.message);
    }
  }

  /**
   * DELETE /api/exam-supervisors/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await ExamSupervisorModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Pengawas ujian tidak ditemukan');

      await ExamSupervisorModel.delete(id);
      return successResponse(res, 200, 'Pengawas ujian berhasil dihapus');
    } catch (error) {
      console.error('Delete examSupervisor error:', error);
      return errorResponse(res, 500, 'Gagal menghapus pengawas ujian', error.message);
    }
  }
}

module.exports = ExamSupervisorController;

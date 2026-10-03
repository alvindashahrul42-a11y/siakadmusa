const ScheduleModel      = require('../models/Schedule.model');
const ClassSubjectModel  = require('../models/ClassSubject.model');
const ClassModel         = require('../models/Class.model');
const StudentModel       = require('../models/Student.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { validateCreateSchedule, validateUpdateSchedule } = require('../validators/schedule.validator');

class ScheduleController {
  /**
   * POST /api/classes/:classId/subjects/:classSubjectId/schedules
   */
  static async create(req, res) {
    try {
      const { classSubjectId } = req.params;

      const cs = await ClassSubjectModel.findById(classSubjectId);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      // Inject class_subject_id so validator can check it
      req.body.class_subject_id = classSubjectId;

      const validation = validateCreateSchedule(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { day_of_week, start_time, end_time, room } = req.body;

      const schedule = await ScheduleModel.create({
        class_subject_id: classSubjectId,
        day_of_week: parseInt(day_of_week),
        start_time: start_time.trim(),
        end_time: end_time.trim(),
        room: room || null,
      });

      return successResponse(res, 201, 'Jadwal berhasil dibuat', { schedule });
    } catch (error) {
      console.error('Create schedule error:', error);
      return errorResponse(res, 500, 'Gagal membuat jadwal', error.message);
    }
  }

  /**
   * GET /api/classes/:classId/schedules — all schedules for a class
   */
  static async getByClass(req, res) {
    try {
      const { classId } = req.params;

      const classData = await ClassModel.findById(classId);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      const { day_of_week } = req.query;
      const filters = {};
      if (day_of_week) filters.day_of_week = parseInt(day_of_week);

      const schedules = await ScheduleModel.findByClass(classId, filters);
      return successResponse(res, 200, 'Jadwal berhasil dimuat', { schedules });
    } catch (error) {
      console.error('Get schedules by class error:', error);
      return errorResponse(res, 500, 'Gagal memuat jadwal', error.message);
    }
  }

  /**
   * GET /api/schedules/my — jadwal kelas siswa yang sedang login
   */
  static async getMy(req, res) {
    try {
      const student = await StudentModel.findByUserId(req.user.id);
      if (!student) return errorResponse(res, 403, 'Akun ini tidak terhubung ke data siswa');

      const { day_of_week } = req.query;
      const filters = {};
      if (day_of_week) filters.day_of_week = parseInt(day_of_week);

      const schedules = await ScheduleModel.findByStudent(student.id, filters);
      return successResponse(res, 200, 'Jadwal berhasil dimuat', { schedules, student });
    } catch (error) {
      console.error('Get my schedules error:', error);
      return errorResponse(res, 500, 'Gagal memuat jadwal', error.message);
    }
  }

  /**
   * GET /api/classes/:classId/subjects/:classSubjectId/schedules
   */
  static async getByClassSubject(req, res) {
    try {
      const { classSubjectId } = req.params;
      const cs = await ClassSubjectModel.findById(classSubjectId);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const schedules = await ScheduleModel.findByClassSubject(classSubjectId);
      return successResponse(res, 200, 'Jadwal berhasil dimuat', { schedules });
    } catch (error) {
      console.error('Get schedules by class subject error:', error);
      return errorResponse(res, 500, 'Gagal memuat jadwal', error.message);
    }
  }

  /**
   * GET /api/schedules/:id
   */
  static async getById(req, res) {
    try {
      const schedule = await ScheduleModel.findById(req.params.id);
      if (!schedule) return errorResponse(res, 404, 'Jadwal tidak ditemukan');
      return successResponse(res, 200, 'Jadwal berhasil dimuat', { schedule });
    } catch (error) {
      console.error('Get schedule by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat jadwal', error.message);
    }
  }

  /**
   * PUT /api/schedules/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await ScheduleModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jadwal tidak ditemukan');

      const validation = validateUpdateSchedule(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { day_of_week, start_time, end_time, room } = req.body;

      const updateData = {};
      if (day_of_week !== undefined) updateData.day_of_week = parseInt(day_of_week);
      if (start_time  !== undefined) updateData.start_time  = start_time.trim();
      if (end_time    !== undefined) updateData.end_time    = end_time.trim();
      if (room        !== undefined) updateData.room        = room || null;

      const schedule = await ScheduleModel.update(id, updateData);
      return successResponse(res, 200, 'Jadwal berhasil diperbarui', { schedule });
    } catch (error) {
      console.error('Update schedule error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui jadwal', error.message);
    }
  }

  /**
   * DELETE /api/schedules/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await ScheduleModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Jadwal tidak ditemukan');

      await ScheduleModel.delete(id);
      return successResponse(res, 200, 'Jadwal berhasil dihapus');
    } catch (error) {
      console.error('Delete schedule error:', error);
      return errorResponse(res, 500, 'Gagal menghapus jadwal', error.message);
    }
  }
}

module.exports = ScheduleController;

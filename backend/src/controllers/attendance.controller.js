const AttendanceModel   = require('../models/Attendance.model');
const ClassSubjectModel = require('../models/ClassSubject.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateAttendance, validateBulkAttendance } = require('../validators/attendance.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class AttendanceController {
  /**
   * POST /api/attendance — upsert single record
   */
  static async upsert(req, res) {
    try {
      const validation = validateAttendance(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { class_subject_id, student_id, attendance_date, status, notes } = req.body;

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const attendance = await AttendanceModel.upsert({
        class_subject_id, student_id, attendance_date, status, notes,
      });

      return successResponse(res, 200, 'Absensi berhasil disimpan', { attendance });
    } catch (error) {
      console.error('Upsert attendance error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan absensi', error.message);
    }
  }

  /**
   * POST /api/attendance/bulk — upsert multiple records for one date
   */
  static async bulkUpsert(req, res) {
    try {
      const validation = validateBulkAttendance(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { class_subject_id, attendance_date, records } = req.body;

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const results = [];
      for (const record of records) {
        const row = await AttendanceModel.upsert({
          class_subject_id,
          student_id:      record.student_id,
          attendance_date,
          status:          record.status,
          notes:           record.notes || null,
        });
        results.push(row);
      }

      return successResponse(res, 200, 'Absensi berhasil disimpan', {
        saved: results.length,
        attendance: results,
      });
    } catch (error) {
      console.error('Bulk upsert attendance error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan absensi massal', error.message);
    }
  }

  /**
   * GET /api/attendance — query by class_subject_id + optional date/status/student
   */
  static async getAll(req, res) {
    try {
      const { class_subject_id, attendance_date, student_id, status } = req.query;

      if (!class_subject_id) {
        return errorResponse(res, 400, 'Parameter class_subject_id wajib diisi');
      }

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const { page, limit, offset } = parsePaginationParams(req.query);
      const filters = {};
      if (attendance_date) filters.attendance_date = attendance_date;
      if (student_id)      filters.student_id      = student_id;
      if (status)          filters.status          = status;

      const attendance = await AttendanceModel.findByClassSubject(class_subject_id, filters, { limit, offset });
      const total      = await AttendanceModel.countByClassSubject(class_subject_id, filters);

      return successResponseWithPagination(
        res, 200, 'Data absensi berhasil dimuat',
        attendance, { page, limit, total }
      );
    } catch (error) {
      console.error('Get attendance error:', error);
      return errorResponse(res, 500, 'Gagal memuat absensi', error.message);
    }
  }

  /**
   * GET /api/attendance/by-date — get all students' attendance on a specific date
   */
  static async getByDate(req, res) {
    try {
      const { class_subject_id, attendance_date } = req.query;
      if (!class_subject_id || !attendance_date) {
        return errorResponse(res, 400, 'Parameter class_subject_id dan attendance_date wajib diisi');
      }

      const attendance = await AttendanceModel.findByClassSubjectAndDate(class_subject_id, attendance_date);
      return successResponse(res, 200, 'Data absensi berhasil dimuat', { attendance });
    } catch (error) {
      console.error('Get attendance by date error:', error);
      return errorResponse(res, 500, 'Gagal memuat absensi', error.message);
    }
  }

  /**
   * GET /api/attendance/summary — per-student summary for a class_subject
   */
  static async getSummary(req, res) {
    try {
      const { class_subject_id } = req.query;
      if (!class_subject_id) {
        return errorResponse(res, 400, 'Parameter class_subject_id wajib diisi');
      }

      const cs = await ClassSubjectModel.findById(class_subject_id);
      if (!cs) return errorResponse(res, 404, 'Kelas-mata pelajaran tidak ditemukan');

      const summary = await AttendanceModel.summaryByClassSubject(class_subject_id);
      return successResponse(res, 200, 'Rekap absensi berhasil dimuat', { summary });
    } catch (error) {
      console.error('Get attendance summary error:', error);
      return errorResponse(res, 500, 'Gagal memuat rekap absensi', error.message);
    }
  }

  /**
   * DELETE /api/attendance/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await AttendanceModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Data absensi tidak ditemukan');

      await AttendanceModel.delete(id);
      return successResponse(res, 200, 'Data absensi berhasil dihapus');
    } catch (error) {
      console.error('Delete attendance error:', error);
      return errorResponse(res, 500, 'Gagal menghapus absensi', error.message);
    }
  }
}

module.exports = AttendanceController;

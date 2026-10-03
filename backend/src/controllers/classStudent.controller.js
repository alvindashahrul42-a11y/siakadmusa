const ClassStudentModel = require('../models/ClassStudent.model');
const ClassModel = require('../models/Class.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { parsePaginationParams } = require('../utils/paginationHelper');

class ClassStudentController {
  /**
   * GET /api/classes/:classId/students
   * List students in a class
   */
  static async getStudents(req, res) {
    try {
      const { classId } = req.params;
      const { search } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const classData = await ClassModel.findById(classId);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      const filters = {};
      if (search) filters.search = search;

      const students = await ClassStudentModel.findStudentsByClass(classId, filters, { limit, offset });
      const total    = await ClassStudentModel.countStudentsByClass(classId, filters);

      return successResponseWithPagination(
        res, 200, 'Daftar siswa kelas berhasil dimuat',
        students,
        { page, limit, total }
      );
    } catch (error) {
      console.error('Get class students error:', error);
      return errorResponse(res, 500, 'Gagal memuat siswa kelas', error.message);
    }
  }

  /**
   * GET /api/classes/:classId/available-students
   * Students not yet in this class
   */
  static async getAvailableStudents(req, res) {
    try {
      const { classId } = req.params;
      const { search } = req.query;

      const classData = await ClassModel.findById(classId);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      const students = await ClassStudentModel.findAvailableStudents(classId, search || '');
      return successResponse(res, 200, 'Daftar siswa tersedia berhasil dimuat', { students });
    } catch (error) {
      console.error('Get available students error:', error);
      return errorResponse(res, 500, 'Gagal memuat siswa', error.message);
    }
  }

  /**
   * POST /api/classes/:classId/students
   * Add a student to the class
   */
  static async addStudent(req, res) {
    try {
      const { classId } = req.params;
      const { student_id } = req.body;

      if (!student_id) {
        return errorResponse(res, 400, 'ID siswa wajib diisi');
      }

      const classData = await ClassModel.findById(classId);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      // Check capacity
      if (classData.capacity) {
        const currentCount = await ClassStudentModel.countStudentsByClass(classId);
        if (currentCount >= classData.capacity) {
          return errorResponse(res, 409, `Kelas sudah penuh (kapasitas: ${classData.capacity})`);
        }
      }

      const existing = await ClassStudentModel.findByClassAndStudent(classId, student_id);
      if (existing) {
        return errorResponse(res, 409, 'Siswa sudah terdaftar di kelas ini');
      }

      const record = await ClassStudentModel.addStudent(classId, student_id);
      return successResponse(res, 201, 'Siswa berhasil ditambahkan ke kelas', { classStudent: record });
    } catch (error) {
      console.error('Add student to class error:', error);
      return errorResponse(res, 500, 'Gagal menambahkan siswa ke kelas', error.message);
    }
  }

  /**
   * DELETE /api/classes/:classId/students/:studentId
   * Remove a student from the class
   */
  static async removeStudent(req, res) {
    try {
      const { classId, studentId } = req.params;

      const classData = await ClassModel.findById(classId);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      const existing = await ClassStudentModel.findByClassAndStudent(classId, studentId);
      if (!existing) return errorResponse(res, 404, 'Siswa tidak terdaftar di kelas ini');

      await ClassStudentModel.removeByClassAndStudent(classId, studentId);
      return successResponse(res, 200, 'Siswa berhasil dikeluarkan dari kelas');
    } catch (error) {
      console.error('Remove student from class error:', error);
      return errorResponse(res, 500, 'Gagal mengeluarkan siswa dari kelas', error.message);
    }
  }

  /**
   * GET /api/students/:studentId/classes
   * Classes a student is enrolled in
   */
  static async getClassesByStudent(req, res) {
    try {
      const { studentId } = req.params;
      const classes = await ClassStudentModel.findClassesByStudent(studentId);
      return successResponse(res, 200, 'Riwayat kelas siswa berhasil dimuat', { classes });
    } catch (error) {
      console.error('Get classes by student error:', error);
      return errorResponse(res, 500, 'Gagal memuat riwayat kelas', error.message);
    }
  }
}

module.exports = ClassStudentController;

const ClassSubjectModel = require('../models/ClassSubject.model');
const ClassModel        = require('../models/Class.model');
const SubjectModel      = require('../models/Subject.model');
const TeacherModel      = require('../models/Teacher.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateClassSubject, validateUpdateClassSubject } = require('../validators/classSubject.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class ClassSubjectController {
  /**
   * POST /api/classes/:classId/subjects
   */
  static async create(req, res) {
    try {
      const { classId } = req.params;

      const classData = await ClassModel.findById(classId);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      const validation = validateCreateClassSubject(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { subject_id, teacher_id } = req.body;

      const subject = await SubjectModel.findById(subject_id);
      if (!subject) return errorResponse(res, 404, 'Mata pelajaran tidak ditemukan');

      if (teacher_id) {
        const teacher = await TeacherModel.findById(teacher_id);
        if (!teacher) return errorResponse(res, 404, 'Guru tidak ditemukan');
      }

      const duplicate = await ClassSubjectModel.findByClassAndSubject(classId, subject_id);
      if (duplicate) {
        return errorResponse(res, 409, 'Mata pelajaran sudah terdaftar di kelas ini');
      }

      const classSubject = await ClassSubjectModel.create({
        class_id: classId,
        subject_id,
        teacher_id: teacher_id || null,
      });

      return successResponse(res, 201, 'Mata pelajaran berhasil ditambahkan ke kelas', { classSubject });
    } catch (error) {
      console.error('Create class subject error:', error);
      return errorResponse(res, 500, 'Gagal menambahkan mata pelajaran ke kelas', error.message);
    }
  }

  /**
   * GET /api/classes/:classId/subjects
   */
  static async getByClass(req, res) {
    try {
      const { classId } = req.params;

      const classData = await ClassModel.findById(classId);
      if (!classData) return errorResponse(res, 404, 'Kelas tidak ditemukan');

      const { search } = req.query;
      const { page, limit, offset } = parsePaginationParams(req.query);

      const filters = {};
      if (search) filters.search = search;

      const classSubjects = await ClassSubjectModel.findAllByClass(classId, filters, { limit, offset });
      const total         = await ClassSubjectModel.countByClass(classId, filters);

      return successResponseWithPagination(
        res, 200, 'Daftar mata pelajaran kelas berhasil dimuat',
        classSubjects, { page, limit, total }
      );
    } catch (error) {
      console.error('Get class subjects error:', error);
      return errorResponse(res, 500, 'Gagal memuat mata pelajaran kelas', error.message);
    }
  }

  /**
   * GET /api/classes/:classId/subjects/:id
   */
  static async getById(req, res) {
    try {
      const classSubject = await ClassSubjectModel.findById(req.params.id);
      if (!classSubject) return errorResponse(res, 404, 'Data tidak ditemukan');
      return successResponse(res, 200, 'Data berhasil dimuat', { classSubject });
    } catch (error) {
      console.error('Get class subject by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat data', error.message);
    }
  }

  /**
   * PUT /api/classes/:classId/subjects/:id — update assigned teacher
   */
  static async update(req, res) {
    try {
      const { id } = req.params;

      const existing = await ClassSubjectModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Data tidak ditemukan');

      const validation = validateUpdateClassSubject(req.body);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validation failed', validation.errors);
      }

      const { teacher_id } = req.body;

      if (teacher_id) {
        const teacher = await TeacherModel.findById(teacher_id);
        if (!teacher) return errorResponse(res, 404, 'Guru tidak ditemukan');
      }

      const classSubject = await ClassSubjectModel.update(id, {
        teacher_id: teacher_id || null,
      });

      return successResponse(res, 200, 'Data berhasil diperbarui', { classSubject });
    } catch (error) {
      console.error('Update class subject error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui data', error.message);
    }
  }

  /**
   * DELETE /api/classes/:classId/subjects/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await ClassSubjectModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Data tidak ditemukan');

      await ClassSubjectModel.delete(id);
      return successResponse(res, 200, 'Mata pelajaran berhasil dihapus dari kelas');
    } catch (error) {
      console.error('Delete class subject error:', error);
      return errorResponse(res, 500, 'Gagal menghapus mata pelajaran dari kelas', error.message);
    }
  }
}

module.exports = ClassSubjectController;

const QuestionSetModel = require('../models/QuestionSet.model');
const SubjectModel     = require('../models/Subject.model');
const TeacherModel     = require('../models/Teacher.model');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { validateCreateQuestionSet, validateUpdateQuestionSet } = require('../validators/examOnline.validator');
const { parsePaginationParams } = require('../utils/paginationHelper');

class QuestionSetController {
  /**
   * POST /api/question-sets
   */
  static async create(req, res) {
    try {
      const validation = validateCreateQuestionSet(req.body);
      if (!validation.isValid)
        return errorResponse(res, 400, 'Validation failed', validation.errors);

      const {
        subject_id, title, description, instructions,
        duration_minutes, passing_score,
        shuffle_questions, shuffle_options, show_result, status,
      } = req.body;

      // Resolve teacher_id from logged-in user
      const teacher = await TeacherModel.findByUserId(req.user.id);
      const teacher_id = teacher?.id ?? req.body.teacher_id;
      if (!teacher_id) return errorResponse(res, 400, 'Akun ini tidak terhubung ke data guru');

      const subject = await SubjectModel.findById(subject_id);
      if (!subject) return errorResponse(res, 404, 'Mata pelajaran tidak ditemukan');

      const questionSet = await QuestionSetModel.create({
        subject_id, teacher_id, title, description, instructions,
        duration_minutes: parseInt(duration_minutes),
        passing_score: passing_score || null,
        shuffle_questions: shuffle_questions === true || shuffle_questions === 'true',
        shuffle_options:   shuffle_options   === true || shuffle_options   === 'true',
        show_result:       show_result       === true || show_result       === 'true',
        status: status || 'draft',
      });

      return successResponse(res, 201, 'Paket soal berhasil dibuat', { questionSet });
    } catch (error) {
      console.error('Create questionSet error:', error);
      return errorResponse(res, 500, 'Gagal membuat paket soal', error.message);
    }
  }

  /**
   * GET /api/question-sets
   */
  static async getAll(req, res) {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { search = '', subject_id = '', status = '' } = req.query;

      // Teachers only see their own sets; superuser sees all
      let teacher_id = '';
      if (req.user.role === 'teacher') {
        const teacher = await TeacherModel.findByUserId(req.user.id);
        teacher_id = teacher?.id ?? '';
      }

      const sets  = await QuestionSetModel.findAll({ limit, offset, search, subject_id, teacher_id, status });
      const total = await QuestionSetModel.countAll({ search, subject_id, teacher_id, status });

      return successResponseWithPagination(
        res, 200, 'Daftar paket soal berhasil dimuat',
        sets, { page, limit, total }
      );
    } catch (error) {
      console.error('Get questionSets error:', error);
      return errorResponse(res, 500, 'Gagal memuat paket soal', error.message);
    }
  }

  /**
   * GET /api/question-sets/ready?subject_id=xxx  — for schedule dropdown
   */
  static async getReady(req, res) {
    try {
      const { subject_id } = req.query;
      if (!subject_id) return errorResponse(res, 400, 'Parameter subject_id wajib diisi');
      const questionSets = await QuestionSetModel.findReadyBySubject(subject_id);
      return successResponse(res, 200, 'Paket soal siap berhasil dimuat', { questionSets });
    } catch (error) {
      console.error('Get ready questionSets error:', error);
      return errorResponse(res, 500, 'Gagal memuat paket soal', error.message);
    }
  }

  /**
   * GET /api/question-sets/:id
   */
  static async getById(req, res) {
    try {
      const qs = await QuestionSetModel.findById(req.params.id);
      if (!qs) return errorResponse(res, 404, 'Paket soal tidak ditemukan');
      return successResponse(res, 200, 'Paket soal berhasil dimuat', { questionSet: qs });
    } catch (error) {
      console.error('Get questionSet by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat paket soal', error.message);
    }
  }

  /**
   * PUT /api/question-sets/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await QuestionSetModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Paket soal tidak ditemukan');

      const validation = validateUpdateQuestionSet(req.body);
      if (!validation.isValid)
        return errorResponse(res, 400, 'Validation failed', validation.errors);

      const {
        title, description, instructions, duration_minutes,
        passing_score, shuffle_questions, shuffle_options,
        show_result, status, subject_id,
      } = req.body;

      const updateData = {};
      if (title             !== undefined) updateData.title             = title;
      if (description       !== undefined) updateData.description       = description || null;
      if (instructions      !== undefined) updateData.instructions      = instructions || null;
      if (duration_minutes  !== undefined) updateData.duration_minutes  = parseInt(duration_minutes);
      if (passing_score     !== undefined) updateData.passing_score     = passing_score || null;
      if (shuffle_questions !== undefined) updateData.shuffle_questions = shuffle_questions ? 1 : 0;
      if (shuffle_options   !== undefined) updateData.shuffle_options   = shuffle_options   ? 1 : 0;
      if (show_result       !== undefined) updateData.show_result       = show_result       ? 1 : 0;
      if (status            !== undefined) updateData.status            = status;
      if (subject_id        !== undefined) updateData.subject_id        = subject_id;

      const questionSet = await QuestionSetModel.update(id, updateData);
      return successResponse(res, 200, 'Paket soal berhasil diperbarui', { questionSet });
    } catch (error) {
      console.error('Update questionSet error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui paket soal', error.message);
    }
  }

  /**
   * DELETE /api/question-sets/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await QuestionSetModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Paket soal tidak ditemukan');

      await QuestionSetModel.delete(id);
      return successResponse(res, 200, 'Paket soal berhasil dihapus');
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2')
        return errorResponse(res, 409, 'Paket soal tidak dapat dihapus karena sudah digunakan di jadwal ujian');
      console.error('Delete questionSet error:', error);
      return errorResponse(res, 500, 'Gagal menghapus paket soal', error.message);
    }
  }
}

module.exports = QuestionSetController;

const QuestionModel       = require('../models/Question.model');
const QuestionOptionModel = require('../models/QuestionOption.model');
const QuestionSetModel    = require('../models/QuestionSet.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const {
  validateCreateQuestion, validateUpdateQuestion, validateBulkOptions,
} = require('../validators/examOnline.validator');

class QuestionController {
  // ── Questions ──────────────────────────────────────────────────────────────

  /**
   * POST /api/questions
   * Body may include `options` array for multiple_choice
   */
  static async create(req, res) {
    try {
      const validation = validateCreateQuestion(req.body);
      if (!validation.isValid)
        return errorResponse(res, 400, 'Validation failed', validation.errors);

      const { question_set_id, type = 'multiple_choice', question_text,
              image, points, explanation, sort_order, options } = req.body;

      const qs = await QuestionSetModel.findById(question_set_id);
      if (!qs) return errorResponse(res, 404, 'Paket soal tidak ditemukan');

      // Validate options if MC or complex MC
      if (type === 'multiple_choice' || type === 'multiple_choice_complex') {
        if (options && Array.isArray(options)) {
          const isComplex = type === 'multiple_choice_complex';
          const optVal = validateBulkOptions(options, isComplex);
          if (!optVal.isValid) return errorResponse(res, 400, 'Opsi jawaban tidak valid', optVal.errors);
        }
      }

      const question = await QuestionModel.create({
        question_set_id, type, question_text, image, points, explanation, sort_order,
      });

      // Save options if provided
      if (options && Array.isArray(options) && question.type === 'multiple_choice') {
        await QuestionOptionModel.bulkReplace(question.id, options);
        question.options = await QuestionOptionModel.findByQuestion(question.id);
      }

      return successResponse(res, 201, 'Soal berhasil dibuat', { question });
    } catch (error) {
      console.error('Create question error:', error);
      return errorResponse(res, 500, 'Gagal membuat soal', error.message);
    }
  }

  /**
   * GET /api/questions?question_set_id=xxx
   * Teachers/superuser get correct answers; students do not.
   */
  static async getByQuestionSet(req, res) {
    try {
      const { question_set_id } = req.query;
      if (!question_set_id) return errorResponse(res, 400, 'Parameter question_set_id wajib diisi');

      const qs = await QuestionSetModel.findById(question_set_id);
      if (!qs) return errorResponse(res, 404, 'Paket soal tidak ditemukan');

      const includeCorrect = req.user.role !== 'student';
      const questions = includeCorrect
        ? await QuestionModel.findByQuestionSet(question_set_id, true)
        : await QuestionModel.findByQuestionSetForStudent(question_set_id);

      return successResponse(res, 200, 'Daftar soal berhasil dimuat', { questions, question_set: qs });
    } catch (error) {
      console.error('Get questions error:', error);
      return errorResponse(res, 500, 'Gagal memuat soal', error.message);
    }
  }

  /**
   * GET /api/questions/:id
   */
  static async getById(req, res) {
    try {
      const includeCorrect = req.user.role !== 'student';
      const question = await QuestionModel.findById(req.params.id, includeCorrect);
      if (!question) return errorResponse(res, 404, 'Soal tidak ditemukan');
      return successResponse(res, 200, 'Soal berhasil dimuat', { question });
    } catch (error) {
      console.error('Get question by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat soal', error.message);
    }
  }

  /**
   * PUT /api/questions/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await QuestionModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Soal tidak ditemukan');

      const validation = validateUpdateQuestion(req.body);
      if (!validation.isValid)
        return errorResponse(res, 400, 'Validation failed', validation.errors);

      const { type, question_text, image, points, explanation, sort_order, options } = req.body;

      const updateData = {};
      if (type          !== undefined) updateData.type          = type;
      if (question_text !== undefined) updateData.question_text = question_text;
      if (image         !== undefined) updateData.image         = image || null;
      if (points        !== undefined) updateData.points        = parseFloat(points);
      if (explanation   !== undefined) updateData.explanation   = explanation || null;
      if (sort_order    !== undefined) updateData.sort_order    = parseInt(sort_order);

      const question = await QuestionModel.update(id, updateData);

      // Replace options if provided
      if (options && Array.isArray(options)) {
        const effectiveType = type ?? existing.type;
        if (effectiveType === 'multiple_choice' || effectiveType === 'multiple_choice_complex') {
          const isComplex = effectiveType === 'multiple_choice_complex';
          const optVal = validateBulkOptions(options, isComplex);
          if (!optVal.isValid) return errorResponse(res, 400, 'Opsi jawaban tidak valid', optVal.errors);
          await QuestionOptionModel.bulkReplace(id, options);
          question.options = await QuestionOptionModel.findByQuestion(id);
        }
      }

      return successResponse(res, 200, 'Soal berhasil diperbarui', { question });
    } catch (error) {
      console.error('Update question error:', error);
      return errorResponse(res, 500, 'Gagal memperbarui soal', error.message);
    }
  }

  /**
   * DELETE /api/questions/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await QuestionModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Soal tidak ditemukan');

      await QuestionModel.delete(id);
      return successResponse(res, 200, 'Soal berhasil dihapus');
    } catch (error) {
      console.error('Delete question error:', error);
      return errorResponse(res, 500, 'Gagal menghapus soal', error.message);
    }
  }

  /**
   * PATCH /api/questions/reorder  — bulk reorder
   * Body: { question_set_id, orders: [{id, sort_order}] }
   */
  static async reorder(req, res) {
    try {
      const { question_set_id, orders } = req.body;
      if (!question_set_id || !Array.isArray(orders))
        return errorResponse(res, 400, 'question_set_id dan orders wajib diisi');

      await QuestionModel.reorder(question_set_id, orders);
      return successResponse(res, 200, 'Urutan soal berhasil disimpan');
    } catch (error) {
      console.error('Reorder questions error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan urutan soal', error.message);
    }
  }

  // ── Options (standalone) ───────────────────────────────────────────────────

  /**
   * PUT /api/questions/:id/options  — replace all options for a question
   */
  static async replaceOptions(req, res) {
    try {
      const { id } = req.params;
      const existing = await QuestionModel.findById(id);
      if (!existing) return errorResponse(res, 404, 'Soal tidak ditemukan');
      if (!['multiple_choice', 'multiple_choice_complex'].includes(existing.type))
        return errorResponse(res, 400, 'Opsi hanya berlaku untuk soal pilihan ganda');

      const { options } = req.body;
      const isComplex = existing.type === 'multiple_choice_complex';
      const optVal = validateBulkOptions(options, isComplex);
      if (!optVal.isValid) return errorResponse(res, 400, 'Opsi jawaban tidak valid', optVal.errors);

      const savedOptions = await QuestionOptionModel.bulkReplace(id, options);
      return successResponse(res, 200, 'Opsi jawaban berhasil disimpan', { options: savedOptions });
    } catch (error) {
      console.error('Replace options error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan opsi jawaban', error.message);
    }
  }
}

module.exports = QuestionController;

const ExamAnswerModel  = require('../models/ExamAnswer.model');
const ExamAttemptModel = require('../models/ExamAttempt.model');
const QuestionModel    = require('../models/Question.model');
const ExamScheduleModel = require('../models/ExamSchedule.model');
const TeacherModel     = require('../models/Teacher.model');
const StudentModel     = require('../models/Student.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { validateSaveAnswer, validateGradeEssay } = require('../validators/examOnline.validator');

class ExamAnswerController {
  /**
   * POST /api/exam-answers  — student saves/updates one answer
   */
  static async save(req, res) {
    try {
      const validation = validateSaveAnswer(req.body);
      if (!validation.isValid)
        return errorResponse(res, 400, 'Validation failed', validation.errors);

      const { attempt_id, question_id, selected_option_id, selected_option_ids, answer_text } = req.body;

      const attempt = await ExamAttemptModel.findById(attempt_id);
      if (!attempt) return errorResponse(res, 404, 'Data pengerjaan tidak ditemukan');
      if (attempt.status !== 'in_progress')
        return errorResponse(res, 400, 'Ujian sudah selesai, jawaban tidak dapat diubah');

      // Check deadline — bandingkan waktu lokal server dengan deadline yang disimpan lokal
      const deadlineMs = new Date(attempt.deadline_at).getTime();
      if (!isNaN(deadlineMs) && Date.now() > deadlineMs)
        return errorResponse(res, 400, 'Waktu ujian sudah habis');

      // Verify ownership
      const student = await StudentModel.findByUserId(req.user.id);
      if (!student || attempt.student_id !== student.id)
        return errorResponse(res, 403, 'Anda tidak berhak mengubah data ini');

      const question = await QuestionModel.findById(question_id, false);
      if (!question) return errorResponse(res, 404, 'Soal tidak ditemukan');

      const answer = await ExamAnswerModel.upsert({
        attempt_id,
        question_id,
        selected_option_id:
          question.type === 'multiple_choice' ? (selected_option_id || null) : null,
        selected_option_ids:
          question.type === 'multiple_choice_complex'
            ? (Array.isArray(selected_option_ids) ? selected_option_ids : [])
            : null,
        answer_text:
          question.type === 'essay' ? (answer_text || null) : null,
      });

      return successResponse(res, 200, 'Jawaban berhasil disimpan', { answer });
    } catch (error) {
      console.error('Save answer error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan jawaban', error.message);
    }
  }

  /**
   * GET /api/exam-answers?attempt_id=xxx  — fetch all answers for an attempt
   */
  static async getByAttempt(req, res) {
    try {
      const { attempt_id } = req.query;
      if (!attempt_id) return errorResponse(res, 400, 'Parameter attempt_id wajib diisi');

      const attempt = await ExamAttemptModel.findById(attempt_id);
      if (!attempt) return errorResponse(res, 404, 'Data pengerjaan tidak ditemukan');

      // Student may only see own answers
      if (req.user.role === 'student') {
        const student = await StudentModel.findByUserId(req.user.id);
        if (!student || attempt.student_id !== student.id)
          return errorResponse(res, 403, 'Anda tidak berhak melihat data ini');
      }

      const answers = await ExamAnswerModel.findByAttempt(attempt_id);
      return successResponse(res, 200, 'Jawaban berhasil dimuat', { answers, attempt });
    } catch (error) {
      console.error('Get answers error:', error);
      return errorResponse(res, 500, 'Gagal memuat jawaban', error.message);
    }
  }

  /**
   * PATCH /api/exam-answers/:id/grade  — teacher grades one essay answer
   */
  static async gradeEssay(req, res) {
    try {
      const { id } = req.params;

      const validation = validateGradeEssay(req.body);
      if (!validation.isValid)
        return errorResponse(res, 400, 'Validation failed', validation.errors);

      const { score, feedback } = req.body;

      // Resolve teacher
      const teacher = await TeacherModel.findByUserId(req.user.id);
      const graded_by = teacher?.id ?? null;

      const answer = await ExamAnswerModel.gradeEssay(id, {
        score: parseFloat(score),
        feedback: feedback || null,
        graded_by,
      });

      if (!answer) return errorResponse(res, 404, 'Jawaban tidak ditemukan');

      // Recalculate attempt total if all essays graded
      await ExamAnswerController._tryFinalizeGrading(answer.attempt_id);

      return successResponse(res, 200, 'Essay berhasil dinilai', { answer });
    } catch (error) {
      console.error('Grade essay error:', error);
      return errorResponse(res, 500, 'Gagal menilai essay', error.message);
    }
  }

  /**
   * Internal: finalize total_score when all essays are graded
   */
  static async _tryFinalizeGrading(attempt_id) {
    try {
      const attempt  = await ExamAttemptModel.findById(attempt_id);
      if (!attempt || !attempt.question_set_id) return;

      const allAnswers = await ExamAnswerModel.findByAttempt(attempt_id);
      const allQ       = await QuestionModel.findByQuestionSet(attempt.question_set_id, true);
      const essayQs    = allQ.filter(q => q.type === 'essay');

      // Check all essay answers are graded
      const allGraded = essayQs.every(q => {
        const ans = allAnswers.find(a => a.question_id === q.id);
        return ans && ans.score !== null;
      });

      if (allGraded) {
        const essayScore     = await ExamAnswerModel.sumEssayScore(attempt_id);
        const objectiveScore = parseFloat(attempt.objective_score ?? 0);
        const totalPoints    = allQ.reduce((s, q) => s + parseFloat(q.points), 0);
        const rawTotal       = objectiveScore + essayScore;
        const total_score    = totalPoints > 0
          ? Math.round((rawTotal / totalPoints) * 100 * 100) / 100
          : rawTotal;

        await ExamAttemptModel.updateScores(attempt_id, {
          objective_score: objectiveScore,
          essay_score:     essayScore,
          total_score,
        });
      }
    } catch (e) {
      console.error('Finalize grading error:', e);
    }
  }
}

module.exports = ExamAnswerController;

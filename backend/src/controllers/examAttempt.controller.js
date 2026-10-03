const ExamAttemptModel  = require('../models/ExamAttempt.model');
const ExamScheduleModel = require('../models/ExamSchedule.model');
const QuestionModel     = require('../models/Question.model');
const StudentModel      = require('../models/Student.model');
const ExamAnswerModel   = require('../models/ExamAnswer.model');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { validateStartAttempt } = require('../validators/examOnline.validator');

class ExamAttemptController {
  /**
   * POST /api/exam-attempts/start
   * Student starts an exam. Creates attempt and returns question list.
   */
  static async start(req, res) {
    try {
      const validation = validateStartAttempt(req.body);
      if (!validation.isValid)
        return errorResponse(res, 400, 'Validation failed', validation.errors);

      const { exam_schedule_id } = req.body;

      // Resolve student from auth
      const student = await StudentModel.findByUserId(req.user.id);
      if (!student) return errorResponse(res, 403, 'Akun ini tidak terhubung ke data siswa');

      const schedule = await ExamScheduleModel.findById(exam_schedule_id);
      if (!schedule) return errorResponse(res, 404, 'Jadwal ujian tidak ditemukan');
      if (!schedule.question_set_id) return errorResponse(res, 400, 'Jadwal ujian belum memiliki paket soal');
      if (schedule.question_set_status !== 'ready')
        return errorResponse(res, 400, 'Paket soal belum dalam status siap (ready)');

      // Check exam date / time window — gunakan waktu lokal server, bukan UTC
      const now = new Date();

      // Tanggal lokal server (format YYYY-MM-DD)
      const pad = n => String(n).padStart(2, '0');
      const todayLocal = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

      if (schedule.exam_date.slice(0, 10) !== todayLocal)
        return errorResponse(res, 400, `Ujian hanya dapat dikerjakan pada tanggal ${schedule.exam_date.slice(0, 10)}`);

      const [sh, sm] = schedule.start_time.split(':').map(Number);
      const [eh, em] = schedule.end_time.split(':').map(Number);
      const nowMinutes   = now.getHours() * 60 + now.getMinutes();
      const startMinutes = sh * 60 + sm;
      const endMinutes   = eh * 60 + em;

      if (nowMinutes < startMinutes)
        return errorResponse(res, 400, `Ujian belum dimulai. Mulai pukul ${schedule.start_time.slice(0, 5)}`);
      if (nowMinutes >= endMinutes)
        return errorResponse(res, 400, 'Jadwal ujian sudah berakhir');

      // Check existing attempt — hanya cek attempt in_progress atau yang selesai hari ini
      const existing = await ExamAttemptModel.findRelevantByScheduleAndStudent(exam_schedule_id, student.id);
      if (existing) {
        if (existing.status === 'in_progress') {
          // Resume — return existing attempt + questions
          const questions = await QuestionModel.findByQuestionSetForStudent(schedule.question_set_id);
          const answers   = await ExamAnswerModel.findByAttempt(existing.id);
          return successResponse(res, 200, 'Melanjutkan ujian', { attempt: existing, questions, answers });
        }
        // submitted atau graded hari ini — tidak boleh ulang
        return errorResponse(res, 409, 'Anda sudah menyelesaikan ujian ini hari ini');
      }

      // Calculate deadline = min(started_at + duration, schedule end time)
      // Gunakan UTC offset server untuk menghindari timezone mismatch
      const durationMs = schedule.duration_minutes * 60 * 1000;
      const byDuration = new Date(now.getTime() + durationMs);

      // Hitung scheduleEnd dalam timezone yang sama dengan `now`
      // start_time dan end_time dari DB sudah dalam format 'HH:MM'
      // Gunakan exam_date + end_time sebagai batas akhir absolut
      const examDateStr = String(schedule.exam_date).slice(0, 10); // YYYY-MM-DD
      const endTimeStr  = String(schedule.end_time).slice(0, 5);   // HH:MM
      // Buat date string dalam format ISO agar tidak ambiguous timezone
      // Ambil offset timezone lokal server
      const tzOffset = -now.getTimezoneOffset(); // dalam menit, positif = ahead of UTC
      const tzSign   = tzOffset >= 0 ? '+' : '-';
      const tzH      = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
      const tzM      = String(Math.abs(tzOffset) % 60).padStart(2, '0');
      const scheduleEndISO = `${examDateStr}T${endTimeStr}:00${tzSign}${tzH}:${tzM}`;
      const scheduleEnd    = new Date(scheduleEndISO);

      // Pilih yang lebih kecil: durasi atau batas akhir jadwal
      const deadline = byDuration < scheduleEnd ? byDuration : scheduleEnd;

      // Simpan sebagai waktu LOKAL server (bukan UTC) agar konsisten dengan
      // cara MariaDB DATETIME menyimpan dan membaca nilai
      const pad2 = n => String(n).padStart(2, '0');
      const deadline_at = `${deadline.getFullYear()}-${pad2(deadline.getMonth()+1)}-${pad2(deadline.getDate())} ${pad2(deadline.getHours())}:${pad2(deadline.getMinutes())}:${pad2(deadline.getSeconds())}`;

      // Fetch questions — shuffle if enabled
      let questions = await QuestionModel.findByQuestionSetForStudent(schedule.question_set_id);
      let questionOrder = null;

      if (schedule.shuffle_questions) {
        questions = [...questions].sort(() => Math.random() - 0.5);
        questionOrder = questions.map(q => q.id);
      }
      if (schedule.shuffle_options) {
        questions = questions.map(q => ({
          ...q,
          options: [...(q.options || [])].sort(() => Math.random() - 0.5),
        }));
      }

      const attempt = await ExamAttemptModel.start({
        exam_schedule_id,
        student_id: student.id,
        deadline_at,
        question_order: questionOrder,
        ip_address: req.ip || null,
        user_agent: req.headers['user-agent'] || null,
      });

      return successResponse(res, 201, 'Ujian dimulai', { attempt, questions, answers: [] });
    } catch (error) {
      console.error('Start exam attempt error:', error);
      return errorResponse(res, 500, 'Gagal memulai ujian', error.message);
    }
  }

  /**
   * POST /api/exam-attempts/:id/submit
   * Student submits — auto-grades MC, sets status submitted.
   */
  static async submit(req, res) {
    try {
      const { id } = req.params;
      const attempt = await ExamAttemptModel.findById(id);
      if (!attempt) return errorResponse(res, 404, 'Data pengerjaan tidak ditemukan');
      if (attempt.status !== 'in_progress')
        return errorResponse(res, 400, 'Ujian sudah disubmit atau sudah berakhir');

      // Verify ownership
      const student = await StudentModel.findByUserId(req.user.id);
      if (!student || attempt.student_id !== student.id)
        return errorResponse(res, 403, 'Anda tidak berhak mengubah data ini');

      // Auto-grade MC
      const { objective_score } = await ExamAnswerModel.autoGradeObjective(id);

      // Submit
      await ExamAttemptModel.submit(id);

      // Check if has essay — if not, set total score immediately
      const schedule = await ExamScheduleModel.findById(attempt.exam_schedule_id);
      const allQuestions = await QuestionModel.findByQuestionSet(schedule.question_set_id, true);
      const hasEssay = allQuestions.some(q => q.type === 'essay');

      let total_score = null;
      if (!hasEssay) {
        // Normalize: total_points might be > 100, so scale to 100
        const totalPoints = allQuestions.reduce((s, q) => s + parseFloat(q.points), 0);
        total_score = totalPoints > 0
          ? Math.round((objective_score / totalPoints) * 100 * 100) / 100
          : 0;
        await ExamAttemptModel.updateScores(id, {
          objective_score,
          essay_score: null,
          total_score,
        });
      } else {
        await ExamAttemptModel.updateScores(id, {
          objective_score,
          essay_score: null,
          total_score: null,
        });
      }

      const updated = await ExamAttemptModel.findById(id);
      return successResponse(res, 200, 'Ujian berhasil disubmit', { attempt: updated });
    } catch (error) {
      console.error('Submit attempt error:', error);
      return errorResponse(res, 500, 'Gagal mengsubmit ujian', error.message);
    }
  }

  /**
   * POST /api/exam-attempts/:id/timeout
   * Called by client when deadline passes.
   */
  static async timeout(req, res) {
    try {
      const { id } = req.params;
      const attempt = await ExamAttemptModel.findById(id);
      if (!attempt) return errorResponse(res, 404, 'Data pengerjaan tidak ditemukan');
      if (attempt.status !== 'in_progress')
        return successResponse(res, 200, 'Tidak ada perubahan', { attempt });

      await ExamAnswerModel.autoGradeObjective(id);
      const updated = await ExamAttemptModel.timeout(id);
      return successResponse(res, 200, 'Waktu ujian habis', { attempt: updated });
    } catch (error) {
      console.error('Timeout attempt error:', error);
      return errorResponse(res, 500, 'Gagal memproses timeout ujian', error.message);
    }
  }

  /**
   * PATCH /api/exam-attempts/:id/tab-switch
   * Increment anti-cheat counter.
   */
  static async tabSwitch(req, res) {
    try {
      const { id } = req.params;
      await ExamAttemptModel.incrementTabSwitch(id);
      return successResponse(res, 200, 'Tab switch tercatat');
    } catch (error) {
      return errorResponse(res, 500, 'Gagal mencatat tab switch', error.message);
    }
  }

  /**
   * GET /api/exam-attempts?exam_schedule_id=xxx  — teacher view
   */
  static async getBySchedule(req, res) {
    try {
      const { exam_schedule_id } = req.query;
      if (!exam_schedule_id) return errorResponse(res, 400, 'Parameter exam_schedule_id wajib diisi');

      const schedule = await ExamScheduleModel.findById(exam_schedule_id);
      if (!schedule) return errorResponse(res, 404, 'Jadwal ujian tidak ditemukan');

      const attempts = await ExamAttemptModel.findBySchedule(exam_schedule_id);
      return successResponse(res, 200, 'Data pengerjaan berhasil dimuat', { attempts, schedule });
    } catch (error) {
      console.error('Get attempts error:', error);
      return errorResponse(res, 500, 'Gagal memuat data pengerjaan', error.message);
    }
  }

  /**
   * GET /api/exam-attempts/:id
   */
  static async getById(req, res) {
    try {
      const attempt = await ExamAttemptModel.findById(req.params.id);
      if (!attempt) return errorResponse(res, 404, 'Data pengerjaan tidak ditemukan');
      return successResponse(res, 200, 'Data pengerjaan berhasil dimuat', { attempt });
    } catch (error) {
      console.error('Get attempt by ID error:', error);
      return errorResponse(res, 500, 'Gagal memuat data pengerjaan', error.message);
    }
  }

  /**
   * GET /api/exam-attempts/my — student's own schedules
   */
  static async getMy(req, res) {
    try {
      const student = await StudentModel.findByUserId(req.user.id);
      if (!student) return errorResponse(res, 403, 'Akun ini tidak terhubung ke data siswa');

      const ExamScheduleModel2 = require('../models/ExamSchedule.model');
      const schedules = await ExamScheduleModel2.findForStudent(student.id);
      return successResponse(res, 200, 'Daftar ujian berhasil dimuat', { schedules });
    } catch (error) {
      console.error('Get my exams error:', error);
      return errorResponse(res, 500, 'Gagal memuat daftar ujian', error.message);
    }
  }
}

module.exports = ExamAttemptController;

// ── QuestionSet ───────────────────────────────────────────────────────────────

const validateCreateQuestionSet = (data) => {
  const errors = [];

  if (!data.subject_id || typeof data.subject_id !== 'string' || !data.subject_id.trim())
    errors.push('Mata pelajaran wajib dipilih');

  if (!data.title || typeof data.title !== 'string' || !data.title.trim())
    errors.push('Judul paket soal wajib diisi');
  else if (data.title.trim().length > 200)
    errors.push('Judul paket soal maksimal 200 karakter');

  if (data.duration_minutes === undefined || data.duration_minutes === null || data.duration_minutes === '')
    errors.push('Durasi pengerjaan wajib diisi');
  else {
    const d = parseInt(data.duration_minutes);
    if (isNaN(d) || d < 1) errors.push('Durasi harus minimal 1 menit');
    else if (d > 480) errors.push('Durasi maksimal 480 menit (8 jam)');
  }

  if (data.passing_score !== undefined && data.passing_score !== null && data.passing_score !== '') {
    const ps = parseFloat(data.passing_score);
    if (isNaN(ps) || ps < 0 || ps > 100) errors.push('KKM harus antara 0–100');
  }

  if (data.status !== undefined && !['draft', 'ready'].includes(data.status))
    errors.push('Status harus "draft" atau "ready"');

  return { isValid: errors.length === 0, errors };
};

const validateUpdateQuestionSet = (data) => {
  const errors = [];

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim())
      errors.push('Judul paket soal tidak boleh kosong');
    else if (data.title.trim().length > 200)
      errors.push('Judul paket soal maksimal 200 karakter');
  }

  if (data.duration_minutes !== undefined) {
    const d = parseInt(data.duration_minutes);
    if (isNaN(d) || d < 1) errors.push('Durasi harus minimal 1 menit');
    else if (d > 480) errors.push('Durasi maksimal 480 menit');
  }

  if (data.passing_score !== undefined && data.passing_score !== null && data.passing_score !== '') {
    const ps = parseFloat(data.passing_score);
    if (isNaN(ps) || ps < 0 || ps > 100) errors.push('KKM harus antara 0–100');
  }

  if (data.status !== undefined && !['draft', 'ready'].includes(data.status))
    errors.push('Status harus "draft" atau "ready"');

  return { isValid: errors.length === 0, errors };
};

// ── Question ──────────────────────────────────────────────────────────────────

const VALID_TYPES = ['multiple_choice', 'multiple_choice_complex', 'essay'];

const validateCreateQuestion = (data) => {
  const errors = [];

  if (!data.question_set_id || typeof data.question_set_id !== 'string' || !data.question_set_id.trim())
    errors.push('ID paket soal wajib diisi');

  if (!data.question_text || typeof data.question_text !== 'string' || !data.question_text.trim())
    errors.push('Teks soal wajib diisi');

  if (data.type !== undefined && !VALID_TYPES.includes(data.type))
    errors.push('Tipe soal harus "multiple_choice", "multiple_choice_complex", atau "essay"');

  if (data.points !== undefined) {
    const p = parseFloat(data.points);
    if (isNaN(p) || p <= 0) errors.push('Poin soal harus lebih dari 0');
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateQuestion = (data) => {
  const errors = [];

  if (data.question_text !== undefined && (!data.question_text || !data.question_text.trim()))
    errors.push('Teks soal tidak boleh kosong');

  if (data.type !== undefined && !VALID_TYPES.includes(data.type))
    errors.push('Tipe soal harus "multiple_choice", "multiple_choice_complex", atau "essay"');

  if (data.points !== undefined) {
    const p = parseFloat(data.points);
    if (isNaN(p) || p <= 0) errors.push('Poin soal harus lebih dari 0');
  }

  return { isValid: errors.length === 0, errors };
};

// ── QuestionOption ────────────────────────────────────────────────────────────

const validateOption = (opt, index) => {
  const errors = [];
  const prefix = `Opsi ${index + 1}`;

  if (!opt.label || !/^[A-Ea-e]$/.test(opt.label))
    errors.push(`${prefix}: label harus A–E`);

  if (!opt.option_text || typeof opt.option_text !== 'string' || !opt.option_text.trim())
    errors.push(`${prefix}: teks jawaban wajib diisi`);

  return errors;
};

const validateBulkOptions = (options, isComplex = false) => {
  const errors = [];

  if (!Array.isArray(options) || options.length < 2)
    return { isValid: false, errors: ['Minimal 2 opsi jawaban diperlukan'] };

  if (options.length > 5)
    return { isValid: false, errors: ['Maksimal 5 opsi jawaban'] };

  const correctCount = options.filter(o => o.is_correct).length;
  if (!isComplex && correctCount !== 1)
    errors.push('Tepat 1 opsi harus ditandai sebagai jawaban benar');
  if (isComplex && correctCount < 2)
    errors.push('Pilihan ganda kompleks harus memiliki minimal 2 jawaban benar');

  const labels = options.map(o => (o.label || '').toUpperCase());
  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size !== labels.length)
    errors.push('Label opsi tidak boleh duplikat');

  options.forEach((opt, i) => {
    errors.push(...validateOption(opt, i));
  });

  return { isValid: errors.length === 0, errors };
};

// ── ExamAttempt ───────────────────────────────────────────────────────────────

const validateStartAttempt = (data) => {
  const errors = [];

  if (!data.exam_schedule_id || typeof data.exam_schedule_id !== 'string' || !data.exam_schedule_id.trim())
    errors.push('ID jadwal ujian wajib diisi');

  return { isValid: errors.length === 0, errors };
};

// ── ExamAnswer ────────────────────────────────────────────────────────────────

const validateSaveAnswer = (data) => {
  const errors = [];

  if (!data.attempt_id || typeof data.attempt_id !== 'string' || !data.attempt_id.trim())
    errors.push('ID pengerjaan wajib diisi');

  if (!data.question_id || typeof data.question_id !== 'string' || !data.question_id.trim())
    errors.push('ID soal wajib diisi');

  // For complex MC, selected_option_ids array must be present (can be empty = unanswered)
  // For single MC, selected_option_id or null
  // For essay, answer_text or null
  // Allow saving empty/null answers (student can skip)

  return { isValid: errors.length === 0, errors };
};

const validateGradeEssay = (data) => {
  const errors = [];

  if (data.score === undefined || data.score === null || data.score === '')
    errors.push('Nilai wajib diisi');
  else {
    const s = parseFloat(data.score);
    if (isNaN(s) || s < 0) errors.push('Nilai tidak boleh negatif');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateCreateQuestionSet,
  validateUpdateQuestionSet,
  validateCreateQuestion,
  validateUpdateQuestion,
  validateBulkOptions,
  validateStartAttempt,
  validateSaveAnswer,
  validateGradeEssay,
};

// ── ExamType ──────────────────────────────────────────────────────────────────

const validateCreateExamType = (data) => {
  const errors = [];

  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    errors.push('Kode jenis ujian wajib diisi');
  } else if (data.code.trim().length > 20) {
    errors.push('Kode jenis ujian maksimal 20 karakter');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Nama jenis ujian wajib diisi');
  } else if (data.name.trim().length > 100) {
    errors.push('Nama jenis ujian maksimal 100 karakter');
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateExamType = (data) => {
  const errors = [];

  if (data.code !== undefined) {
    if (typeof data.code !== 'string' || data.code.trim() === '') {
      errors.push('Kode jenis ujian tidak boleh kosong');
    } else if (data.code.trim().length > 20) {
      errors.push('Kode jenis ujian maksimal 20 karakter');
    }
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama jenis ujian tidak boleh kosong');
    } else if (data.name.trim().length > 100) {
      errors.push('Nama jenis ujian maksimal 100 karakter');
    }
  }

  return { isValid: errors.length === 0, errors };
};

// ── Exam ──────────────────────────────────────────────────────────────────────

const validateCreateExam = (data) => {
  const errors = [];

  if (!data.academic_year_id || typeof data.academic_year_id !== 'string' || data.academic_year_id.trim() === '') {
    errors.push('Tahun ajaran wajib dipilih');
  }

  if (!data.exam_type_id || typeof data.exam_type_id !== 'string' || data.exam_type_id.trim() === '') {
    errors.push('Jenis ujian wajib dipilih');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Nama ujian wajib diisi');
  } else if (data.name.trim().length > 200) {
    errors.push('Nama ujian maksimal 200 karakter');
  }

  if (!data.semester || !['ganjil', 'genap'].includes(data.semester)) {
    errors.push('Semester harus bernilai "ganjil" atau "genap"');
  }

  if (!data.start_date) {
    errors.push('Tanggal mulai wajib diisi');
  } else if (isNaN(new Date(data.start_date).getTime())) {
    errors.push('Format tanggal mulai tidak valid');
  }

  if (!data.end_date) {
    errors.push('Tanggal selesai wajib diisi');
  } else if (isNaN(new Date(data.end_date).getTime())) {
    errors.push('Format tanggal selesai tidak valid');
  }

  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) < new Date(data.start_date)) {
      errors.push('Tanggal selesai tidak boleh sebelum tanggal mulai');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateExam = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama ujian tidak boleh kosong');
    } else if (data.name.trim().length > 200) {
      errors.push('Nama ujian maksimal 200 karakter');
    }
  }

  if (data.semester !== undefined && !['ganjil', 'genap'].includes(data.semester)) {
    errors.push('Semester harus bernilai "ganjil" atau "genap"');
  }

  if (data.start_date !== undefined && isNaN(new Date(data.start_date).getTime())) {
    errors.push('Format tanggal mulai tidak valid');
  }

  if (data.end_date !== undefined && isNaN(new Date(data.end_date).getTime())) {
    errors.push('Format tanggal selesai tidak valid');
  }

  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) < new Date(data.start_date)) {
      errors.push('Tanggal selesai tidak boleh sebelum tanggal mulai');
    }
  }

  return { isValid: errors.length === 0, errors };
};

// ── ExamSchedule ──────────────────────────────────────────────────────────────

const isValidTime = (val) => /^\d{2}:\d{2}(:\d{2})?$/.test(val);

const validateCreateExamSchedule = (data) => {
  const errors = [];

  if (!data.exam_id || typeof data.exam_id !== 'string' || data.exam_id.trim() === '') {
    errors.push('ID ujian wajib diisi');
  }

  if (!data.class_subject_id || typeof data.class_subject_id !== 'string' || data.class_subject_id.trim() === '') {
    errors.push('Kelas-mata pelajaran wajib dipilih');
  }

  if (!data.exam_date) {
    errors.push('Tanggal ujian wajib diisi');
  } else if (isNaN(new Date(data.exam_date).getTime())) {
    errors.push('Format tanggal ujian tidak valid');
  }

  if (!data.start_time) {
    errors.push('Jam mulai wajib diisi');
  } else if (!isValidTime(data.start_time)) {
    errors.push('Format jam mulai tidak valid (HH:MM)');
  }

  if (!data.end_time) {
    errors.push('Jam selesai wajib diisi');
  } else if (!isValidTime(data.end_time)) {
    errors.push('Format jam selesai tidak valid (HH:MM)');
  }

  if (data.start_time && data.end_time && isValidTime(data.start_time) && isValidTime(data.end_time)) {
    if (data.end_time <= data.start_time) {
      errors.push('Jam selesai harus setelah jam mulai');
    }
  }

  if (data.room && data.room.length > 100) {
    errors.push('Nama ruangan maksimal 100 karakter');
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateExamSchedule = (data) => {
  const errors = [];

  if (data.exam_date !== undefined && isNaN(new Date(data.exam_date).getTime())) {
    errors.push('Format tanggal ujian tidak valid');
  }

  if (data.start_time !== undefined && !isValidTime(data.start_time)) {
    errors.push('Format jam mulai tidak valid (HH:MM)');
  }

  if (data.end_time !== undefined && !isValidTime(data.end_time)) {
    errors.push('Format jam selesai tidak valid (HH:MM)');
  }

  if (data.start_time && data.end_time && isValidTime(data.start_time) && isValidTime(data.end_time)) {
    if (data.end_time <= data.start_time) {
      errors.push('Jam selesai harus setelah jam mulai');
    }
  }

  if (data.room !== undefined && data.room && data.room.length > 100) {
    errors.push('Nama ruangan maksimal 100 karakter');
  }

  return { isValid: errors.length === 0, errors };
};

// ── ExamSupervisor ────────────────────────────────────────────────────────────

const validateCreateExamSupervisor = (data) => {
  const errors = [];

  if (!data.exam_schedule_id || typeof data.exam_schedule_id !== 'string' || data.exam_schedule_id.trim() === '') {
    errors.push('ID jadwal ujian wajib diisi');
  }

  if (!data.teacher_id || typeof data.teacher_id !== 'string' || data.teacher_id.trim() === '') {
    errors.push('Guru pengawas wajib dipilih');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateCreateExamType,
  validateUpdateExamType,
  validateCreateExam,
  validateUpdateExam,
  validateCreateExamSchedule,
  validateUpdateExamSchedule,
  validateCreateExamSupervisor,
};

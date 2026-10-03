const VALID_DAYS = [1, 2, 3, 4, 5, 6]; // 1=Senin ... 6=Sabtu
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM

const validateCreateSchedule = (data) => {
  const errors = [];

  if (!data.class_subject_id || typeof data.class_subject_id !== 'string' || data.class_subject_id.trim() === '') {
    errors.push('ID kelas-mata pelajaran wajib diisi');
  }

  const day = parseInt(data.day_of_week);
  if (!data.day_of_week || isNaN(day)) {
    errors.push('Hari wajib diisi');
  } else if (!VALID_DAYS.includes(day)) {
    errors.push('Hari harus antara 1 (Senin) sampai 6 (Sabtu)');
  }

  if (!data.start_time || typeof data.start_time !== 'string') {
    errors.push('Jam mulai wajib diisi');
  } else if (!TIME_REGEX.test(data.start_time.trim())) {
    errors.push('Format jam mulai harus HH:MM');
  }

  if (!data.end_time || typeof data.end_time !== 'string') {
    errors.push('Jam selesai wajib diisi');
  } else if (!TIME_REGEX.test(data.end_time.trim())) {
    errors.push('Format jam selesai harus HH:MM');
  }

  if (
    data.start_time && data.end_time &&
    TIME_REGEX.test(data.start_time) && TIME_REGEX.test(data.end_time) &&
    data.start_time >= data.end_time
  ) {
    errors.push('Jam selesai harus lebih dari jam mulai');
  }

  if (data.room !== undefined && data.room !== null) {
    if (typeof data.room !== 'string' || data.room.trim().length > 100) {
      errors.push('Nama ruangan maksimal 100 karakter');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateSchedule = (data) => {
  const errors = [];

  if (data.day_of_week !== undefined) {
    const day = parseInt(data.day_of_week);
    if (isNaN(day) || !VALID_DAYS.includes(day)) {
      errors.push('Hari harus antara 1 (Senin) sampai 6 (Sabtu)');
    }
  }

  if (data.start_time !== undefined) {
    if (typeof data.start_time !== 'string' || !TIME_REGEX.test(data.start_time.trim())) {
      errors.push('Format jam mulai harus HH:MM');
    }
  }

  if (data.end_time !== undefined) {
    if (typeof data.end_time !== 'string' || !TIME_REGEX.test(data.end_time.trim())) {
      errors.push('Format jam selesai harus HH:MM');
    }
  }

  if (data.start_time && data.end_time && data.start_time >= data.end_time) {
    errors.push('Jam selesai harus lebih dari jam mulai');
  }

  if (data.room !== undefined && data.room !== null) {
    if (typeof data.room !== 'string' || data.room.trim().length > 100) {
      errors.push('Nama ruangan maksimal 100 karakter');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateSchedule, validateUpdateSchedule };

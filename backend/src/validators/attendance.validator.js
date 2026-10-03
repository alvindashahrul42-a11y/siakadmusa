const VALID_STATUSES = ['present', 'late', 'sick', 'permission', 'absent'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateAttendance = (data) => {
  const errors = [];

  if (!data.class_subject_id || typeof data.class_subject_id !== 'string' || data.class_subject_id.trim() === '') {
    errors.push('ID kelas-mata pelajaran wajib diisi');
  }

  if (!data.student_id || typeof data.student_id !== 'string' || data.student_id.trim() === '') {
    errors.push('ID siswa wajib diisi');
  }

  if (!data.attendance_date || typeof data.attendance_date !== 'string') {
    errors.push('Tanggal absensi wajib diisi');
  } else if (!DATE_REGEX.test(data.attendance_date.trim())) {
    errors.push('Format tanggal harus YYYY-MM-DD');
  } else {
    const d = new Date(data.attendance_date);
    if (isNaN(d.getTime())) {
      errors.push('Tanggal absensi tidak valid');
    }
  }

  if (!data.status || typeof data.status !== 'string') {
    errors.push('Status absensi wajib diisi');
  } else if (!VALID_STATUSES.includes(data.status)) {
    errors.push(`Status harus salah satu: ${VALID_STATUSES.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Bulk attendance validation — array of attendance records
 */
const validateBulkAttendance = (data) => {
  const errors = [];

  if (!data.class_subject_id || typeof data.class_subject_id !== 'string') {
    errors.push('ID kelas-mata pelajaran wajib diisi');
  }

  if (!data.attendance_date || !DATE_REGEX.test(data.attendance_date)) {
    errors.push('Format tanggal harus YYYY-MM-DD');
  }

  if (!Array.isArray(data.records) || data.records.length === 0) {
    errors.push('Data absensi (records) wajib berupa array dan tidak boleh kosong');
  } else {
    data.records.forEach((r, i) => {
      if (!r.student_id) {
        errors.push(`records[${i}]: student_id wajib diisi`);
      }
      if (!r.status || !VALID_STATUSES.includes(r.status)) {
        errors.push(`records[${i}]: status tidak valid`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateAttendance, validateBulkAttendance };

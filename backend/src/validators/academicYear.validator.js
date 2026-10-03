const validateCreateAcademicYear = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Nama tahun ajaran wajib diisi');
  } else if (data.name.trim().length > 20) {
    errors.push('Nama tahun ajaran maksimal 20 karakter (contoh: 2026/2027)');
  }

  if (!data.start_date) {
    errors.push('Tanggal mulai wajib diisi');
  } else if (isNaN(new Date(data.start_date).getTime())) {
    errors.push('Tanggal mulai tidak valid (YYYY-MM-DD)');
  }

  if (!data.end_date) {
    errors.push('Tanggal selesai wajib diisi');
  } else if (isNaN(new Date(data.end_date).getTime())) {
    errors.push('Tanggal selesai tidak valid (YYYY-MM-DD)');
  }

  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) <= new Date(data.start_date)) {
      errors.push('Tanggal selesai harus setelah tanggal mulai');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateAcademicYear = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama tahun ajaran tidak boleh kosong');
    } else if (data.name.trim().length > 20) {
      errors.push('Nama tahun ajaran maksimal 20 karakter');
    }
  }

  if (data.start_date !== undefined && isNaN(new Date(data.start_date).getTime())) {
    errors.push('Tanggal mulai tidak valid (YYYY-MM-DD)');
  }

  if (data.end_date !== undefined && isNaN(new Date(data.end_date).getTime())) {
    errors.push('Tanggal selesai tidak valid (YYYY-MM-DD)');
  }

  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) <= new Date(data.start_date)) {
      errors.push('Tanggal selesai harus setelah tanggal mulai');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateAcademicYear, validateUpdateAcademicYear };

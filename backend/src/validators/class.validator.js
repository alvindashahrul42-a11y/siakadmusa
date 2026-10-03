const VALID_GRADE_LEVELS = [10, 11, 12];

const validateCreateClass = (data) => {
  const errors = [];

  if (!data.academic_year_id || typeof data.academic_year_id !== 'string' || data.academic_year_id.trim() === '') {
    errors.push('ID tahun ajaran wajib diisi');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Nama kelas wajib diisi');
  } else if (data.name.trim().length > 100) {
    errors.push('Nama kelas maksimal 100 karakter');
  }

  const gradeLevel = parseInt(data.grade_level);
  if (!data.grade_level || isNaN(gradeLevel)) {
    errors.push('Tingkat kelas wajib diisi');
  } else if (!VALID_GRADE_LEVELS.includes(gradeLevel)) {
    errors.push('Tingkat kelas harus 10, 11, atau 12');
  }

  if (data.capacity !== undefined && data.capacity !== null && data.capacity !== '') {
    const cap = parseInt(data.capacity);
    if (isNaN(cap) || cap <= 0) {
      errors.push('Kapasitas harus berupa angka positif');
    } else if (cap > 60) {
      errors.push('Kapasitas kelas maksimal 60 siswa');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateClass = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama kelas tidak boleh kosong');
    } else if (data.name.trim().length > 100) {
      errors.push('Nama kelas maksimal 100 karakter');
    }
  }

  if (data.grade_level !== undefined) {
    const gradeLevel = parseInt(data.grade_level);
    if (isNaN(gradeLevel) || !VALID_GRADE_LEVELS.includes(gradeLevel)) {
      errors.push('Tingkat kelas harus 10, 11, atau 12');
    }
  }

  if (data.capacity !== undefined && data.capacity !== null && data.capacity !== '') {
    const cap = parseInt(data.capacity);
    if (isNaN(cap) || cap <= 0) {
      errors.push('Kapasitas harus berupa angka positif');
    } else if (cap > 60) {
      errors.push('Kapasitas kelas maksimal 60 siswa');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateClass, validateUpdateClass };

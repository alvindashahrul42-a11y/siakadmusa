const validateCreateClassSubject = (data) => {
  const errors = [];

  if (!data.subject_id || typeof data.subject_id !== 'string' || data.subject_id.trim() === '') {
    errors.push('ID mata pelajaran wajib diisi');
  }

  // teacher_id is optional (nullable)
  if (data.teacher_id !== undefined && data.teacher_id !== null && data.teacher_id !== '') {
    if (typeof data.teacher_id !== 'string') {
      errors.push('ID guru tidak valid');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateClassSubject = (data) => {
  const errors = [];

  // Only teacher_id can be updated
  if (data.teacher_id !== undefined && data.teacher_id !== null && data.teacher_id !== '') {
    if (typeof data.teacher_id !== 'string') {
      errors.push('ID guru tidak valid');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateClassSubject, validateUpdateClassSubject };

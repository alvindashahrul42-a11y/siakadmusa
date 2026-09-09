/**
 * Validator untuk Teacher
 */

const validateCreateTeacher = (data) => {
  const errors = [];

  // email — required
  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push('Email format is invalid');
  } else if (data.email.trim().length > 150) {
    errors.push('Email must not exceed 150 characters');
  }

  // password — required
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }

  // teacher_number — required
  if (!data.teacher_number || typeof data.teacher_number !== 'string' || data.teacher_number.trim() === '') {
    errors.push('Teacher number is required');
  } else if (data.teacher_number.trim().length > 50) {
    errors.push('Teacher number must not exceed 50 characters');
  }

  // full_name — required
  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim() === '') {
    errors.push('Full name is required');
  } else if (data.full_name.trim().length > 150) {
    errors.push('Full name must not exceed 150 characters');
  }

  // optional fields
  if (data.username !== undefined && data.username !== null) {
    if (typeof data.username !== 'string' || data.username.trim().length > 100) {
      errors.push('Username must not exceed 100 characters');
    }
  }

  if (data.birth_date !== undefined && data.birth_date !== null) {
    const date = new Date(data.birth_date);
    if (isNaN(date.getTime())) {
      errors.push('Birth date must be a valid date (YYYY-MM-DD)');
    }
  }

  if (data.phone !== undefined && data.phone !== null) {
    if (typeof data.phone !== 'string' || data.phone.trim().length > 30) {
      errors.push('Phone must not exceed 30 characters');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateTeacher = (data) => {
  const errors = [];

  if (data.teacher_number !== undefined) {
    if (typeof data.teacher_number !== 'string' || data.teacher_number.trim() === '') {
      errors.push('Teacher number must be a non-empty string');
    } else if (data.teacher_number.trim().length > 50) {
      errors.push('Teacher number must not exceed 50 characters');
    }
  }

  if (data.full_name !== undefined) {
    if (typeof data.full_name !== 'string' || data.full_name.trim() === '') {
      errors.push('Full name must be a non-empty string');
    } else if (data.full_name.trim().length > 150) {
      errors.push('Full name must not exceed 150 characters');
    }
  }

  if (data.birth_date !== undefined && data.birth_date !== null) {
    const date = new Date(data.birth_date);
    if (isNaN(date.getTime())) {
      errors.push('Birth date must be a valid date (YYYY-MM-DD)');
    }
  }

  if (data.phone !== undefined && data.phone !== null) {
    if (typeof data.phone !== 'string' || data.phone.trim().length > 30) {
      errors.push('Phone must not exceed 30 characters');
    }
  }

  if (data.subject !== undefined && data.subject !== null) {
    if (typeof data.subject !== 'string' || data.subject.trim().length > 150) {
      errors.push('Subject must not exceed 150 characters');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateTeacher, validateUpdateTeacher };

/**
 * Validator untuk User (update only — create ada di auth.validator)
 */

const validateUpdateUser = (data) => {
  const errors = [];

  // email
  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || data.email.trim() === '') {
      errors.push('Email must be a non-empty string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.push('Email format is invalid');
    } else if (data.email.trim().length > 150) {
      errors.push('Email must not exceed 150 characters');
    }
  }

  // username
  if (data.username !== undefined && data.username !== null) {
    if (typeof data.username !== 'string' || data.username.trim() === '') {
      errors.push('Username must be a non-empty string');
    } else if (data.username.trim().length > 100) {
      errors.push('Username must not exceed 100 characters');
    }
  }

  // password
  if (data.password !== undefined) {
    if (typeof data.password !== 'string' || data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
  }

  // role
  const validRoles = ['superuser', 'admin', 'teacher', 'student', 'candidate'];
  if (data.role !== undefined) {
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }

  // is_active
  if (data.is_active !== undefined) {
    const val = data.is_active;
    const valid = [true, false, 'true', 'false', 1, 0, '1', '0'];
    if (!valid.includes(val)) {
      errors.push('is_active must be a boolean');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateUpdateUser };

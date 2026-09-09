/**
 * Validation helper functions untuk authentication
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimal 6 karakter
  return password && password.length >= 6;
};

const validateRegister = (data) => {
  const errors = [];

  // Validate email
  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Email format is invalid');
  }

  // Validate password
  if (!data.password) {
    errors.push('Password is required');
  } else if (!validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  // Validate username (optional, tapi kalau ada harus valid)
  if (data.username && data.username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  // Validate role
  if (!data.role) {
    errors.push('Role is required');
  } else {
    const validRoles = ['student', 'teacher', 'admin', 'candidate'];
    if (!validRoles.includes(data.role)) {
      errors.push('Invalid role. Must be one of: student, teacher, admin, candidate');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLogin = (data) => {
  const errors = [];

  // Validate email
  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Email format is invalid');
  }

  // Validate password
  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateEmail,
  validatePassword
};

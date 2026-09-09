/**
 * Validator untuk Student
 */

const validateUpdateStudent = (data) => {
  const errors = [];

  if (data.student_number !== undefined) {
    if (typeof data.student_number !== 'string' || data.student_number.trim() === '') {
      errors.push('Student number must be a non-empty string');
    } else if (data.student_number.trim().length > 50) {
      errors.push('Student number must not exceed 50 characters');
    }
  }

  if (data.full_name !== undefined) {
    if (typeof data.full_name !== 'string' || data.full_name.trim() === '') {
      errors.push('Full name must be a non-empty string');
    } else if (data.full_name.trim().length > 150) {
      errors.push('Full name must not exceed 150 characters');
    }
  }

  const validGenders = ['male', 'female', 'Male', 'Female', 'L', 'P'];
  if (data.gender !== undefined && data.gender !== null) {
    if (!validGenders.includes(data.gender)) {
      errors.push('Gender must be male or female');
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

  if (data.enrollment_year !== undefined && data.enrollment_year !== null) {
    const year = parseInt(data.enrollment_year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      errors.push('Enrollment year must be a valid year');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateUpdateStudent };

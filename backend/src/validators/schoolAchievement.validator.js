/**
 * Validator untuk School Achievement
 */

const VALID_LEVELS = ['Internasional', 'Nasional', 'Provinsi', 'Kabupaten/Kota', 'Kecamatan', 'Sekolah'];

/**
 * Validate achievement data
 * @param {Object} data - Achievement data
 * @param {boolean} isUpdate - Whether this is an update (makes fields optional)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateAchievement = (data, isUpdate = false) => {
  const errors = [];

  // title — required on create
  if (!isUpdate) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      errors.push('Title is required');
    }
  }

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim() === '') {
      errors.push('Title must be a non-empty string');
    } else if (data.title.trim().length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
  }

  // category
  if (data.category !== undefined && data.category !== null) {
    if (typeof data.category !== 'string' || data.category.trim().length > 100) {
      errors.push('Category must be a string with max 100 characters');
    }
  }

  // level
  if (data.level !== undefined && data.level !== null && data.level !== '') {
    if (!VALID_LEVELS.includes(data.level)) {
      errors.push(`Level must be one of: ${VALID_LEVELS.join(', ')}`);
    }
  }

  // student_name
  if (data.student_name !== undefined && data.student_name !== null) {
    if (typeof data.student_name !== 'string' || data.student_name.trim().length > 150) {
      errors.push('Student name must be a string with max 150 characters');
    }
  }

  // achievement_date
  if (data.achievement_date !== undefined && data.achievement_date !== null && data.achievement_date !== '') {
    const date = new Date(data.achievement_date);
    if (isNaN(date.getTime())) {
      errors.push('Achievement date must be a valid date (YYYY-MM-DD)');
    }
  }

  // sort_order
  if (data.sort_order !== undefined && data.sort_order !== null) {
    const order = parseInt(data.sort_order);
    if (isNaN(order) || order < 0) {
      errors.push('Sort order must be a non-negative integer');
    }
  }

  // is_published
  if (data.is_published !== undefined && typeof data.is_published !== 'boolean') {
    errors.push('is_published must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validateAchievement, VALID_LEVELS };

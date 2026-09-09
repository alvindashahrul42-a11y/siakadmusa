/**
 * Validator untuk School Activity
 */

/**
 * @param {Object} data
 * @param {boolean} isUpdate
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateSchoolActivity = (data, isUpdate = false) => {
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

  // activity_date — optional, must be valid date if provided
  if (data.activity_date !== undefined && data.activity_date !== null && data.activity_date !== '') {
    const date = new Date(data.activity_date);
    if (isNaN(date.getTime())) {
      errors.push('activity_date must be a valid date (YYYY-MM-DD)');
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
    errors,
  };
};

module.exports = { validateSchoolActivity };

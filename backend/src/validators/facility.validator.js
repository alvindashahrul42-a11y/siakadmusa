/**
 * Validator untuk School Facility
 */

/**
 * Validate facility data
 * @param {Object} data - Facility data
 * @param {boolean} isUpdate - Whether this is an update (makes fields optional)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateFacility = (data, isUpdate = false) => {
  const errors = [];

  // name — required on create
  if (!isUpdate) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name is required');
    }
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Name must be a non-empty string');
    } else if (data.name.trim().length > 150) {
      errors.push('Name must not exceed 150 characters');
    }
  }

  // image — required on create
  if (!isUpdate && !data.image) {
    errors.push('Image is required');
  }

  // sort_order
  if (data.sort_order !== undefined && data.sort_order !== null) {
    const order = parseInt(data.sort_order);
    if (isNaN(order) || order < 0) {
      errors.push('Sort order must be a non-negative integer');
    }
  }

  // is_active
  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validateFacility };

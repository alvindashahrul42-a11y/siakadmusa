/**
 * Validate hero slide create/update data
 */
const validateHeroSlide = (data, isUpdate = false) => {
  const errors = [];

  // Title validation (required for create, optional for update)
  if (!isUpdate && !data.title) {
    errors.push('Title is required');
  } else if (data.title && typeof data.title !== 'string') {
    errors.push('Title must be a string');
  } else if (data.title && data.title.trim().length === 0) {
    errors.push('Title cannot be empty');
  } else if (data.title && data.title.length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }

  // Subtitle validation (optional)
  if (data.subtitle !== undefined && data.subtitle !== null) {
    if (typeof data.subtitle !== 'string') {
      errors.push('Subtitle must be a string');
    } else if (data.subtitle.length > 255) {
      errors.push('Subtitle cannot exceed 255 characters');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    }
  }

  // Image validation (required for create, optional for update)
  if (!isUpdate && !data.image) {
    errors.push('Image is required');
  } else if (data.image && typeof data.image !== 'string') {
    errors.push('Image must be a string');
  } else if (data.image && data.image.trim().length === 0) {
    errors.push('Image cannot be empty');
  } else if (data.image && data.image.length > 500) {
    errors.push('Image URL cannot exceed 500 characters');
  }

  // Sort order validation (optional)
  if (data.sort_order !== undefined && data.sort_order !== null) {
    const sortOrder = parseInt(data.sort_order);
    if (isNaN(sortOrder)) {
      errors.push('Sort order must be a number');
    } else if (sortOrder < 0) {
      errors.push('Sort order cannot be negative');
    }
  }

  // is_active validation (optional)
  if (data.is_active !== undefined && data.is_active !== null) {
    if (typeof data.is_active !== 'boolean' && data.is_active !== 0 && data.is_active !== 1) {
      errors.push('is_active must be a boolean');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateHeroSlide
};

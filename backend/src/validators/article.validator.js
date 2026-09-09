/**
 * Validator untuk Article
 */

/**
 * @param {Object} data
 * @param {boolean} isUpdate
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateArticle = (data, isUpdate = false) => {
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
    } else if (data.title.trim().length > 255) {
      errors.push('Title must not exceed 255 characters');
    }
  }

  // excerpt
  if (data.excerpt !== undefined && data.excerpt !== null && data.excerpt !== '') {
    if (typeof data.excerpt !== 'string') {
      errors.push('Excerpt must be a string');
    }
  }

  // content — required on create
  if (!isUpdate) {
    if (!data.content || typeof data.content !== 'string' || data.content.trim() === '') {
      errors.push('Content is required');
    }
  }

  if (data.content !== undefined && data.content !== null && data.content !== '') {
    if (typeof data.content !== 'string') {
      errors.push('Content must be a string');
    }
  }

  // category
  if (data.category !== undefined && data.category !== null && data.category !== '') {
    if (typeof data.category !== 'string' || data.category.trim().length > 100) {
      errors.push('Category must be a string with max 100 characters');
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

module.exports = { validateArticle };

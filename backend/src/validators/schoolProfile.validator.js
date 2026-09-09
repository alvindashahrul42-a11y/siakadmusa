/**
 * Validate school profile data
 * @param {Object} data - School profile data to validate
 * @param {Boolean} isUpdate - Whether this is an update operation
 * @returns {Object} { isValid: Boolean, errors: Object }
 */
function validateSchoolProfile(data, isUpdate = false) {
  const errors = {};

  // School name is required for create, optional for update
  if (!isUpdate) {
    if (!data.school_name || data.school_name.trim().length === 0) {
      errors.school_name = 'School name is required';
    } else if (data.school_name.length > 200) {
      errors.school_name = 'School name must not exceed 200 characters';
    }
  } else {
    if (data.school_name !== undefined) {
      if (!data.school_name || data.school_name.trim().length === 0) {
        errors.school_name = 'School name cannot be empty';
      } else if (data.school_name.length > 200) {
        errors.school_name = 'School name must not exceed 200 characters';
      }
    }
  }

  // Tagline validation (optional)
  if (data.tagline !== undefined && data.tagline !== null) {
    if (data.tagline.length > 255) {
      errors.tagline = 'Tagline must not exceed 255 characters';
    }
  }

  // Email validation (optional)
  if (data.email !== undefined && data.email !== null && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Invalid email format';
    } else if (data.email.length > 150) {
      errors.email = 'Email must not exceed 150 characters';
    }
  }

  // Phone validation (optional)
  if (data.phone !== undefined && data.phone !== null && data.phone.trim().length > 0) {
    if (data.phone.length > 30) {
      errors.phone = 'Phone must not exceed 30 characters';
    }
  }

  // Website validation (optional)
  if (data.website !== undefined && data.website !== null && data.website.trim().length > 0) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlRegex.test(data.website)) {
      errors.website = 'Invalid website URL format';
    } else if (data.website.length > 255) {
      errors.website = 'Website URL must not exceed 255 characters';
    }
  }

  // Instagram validation (optional)
  if (data.instagram !== undefined && data.instagram !== null && data.instagram.trim().length > 0) {
    if (data.instagram.length > 255) {
      errors.instagram = 'Instagram URL must not exceed 255 characters';
    }
  }

  // Facebook validation (optional)
  if (data.facebook !== undefined && data.facebook !== null && data.facebook.trim().length > 0) {
    if (data.facebook.length > 255) {
      errors.facebook = 'Facebook URL must not exceed 255 characters';
    }
  }

  // YouTube validation (optional)
  if (data.youtube !== undefined && data.youtube !== null && data.youtube.trim().length > 0) {
    if (data.youtube.length > 255) {
      errors.youtube = 'YouTube URL must not exceed 255 characters';
    }
  }

  // Logo validation (optional)
  if (data.logo !== undefined && data.logo !== null && data.logo.trim().length > 0) {
    if (data.logo.length > 500) {
      errors.logo = 'Logo path must not exceed 500 characters';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  validateSchoolProfile
};

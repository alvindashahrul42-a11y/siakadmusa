/**
 * Validator untuk School Program (Program Unggulan)
 */

/**
 * Validate program data
 * @param {Object} data - Program data
 * @param {boolean} isUpdate - Whether this is an update (makes fields optional)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateSchoolProgram = (data, isUpdate = false) => {
  const errors = [];

  // name — required on create
  if (!isUpdate) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama program wajib diisi');
    }
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama program harus berupa teks yang tidak kosong');
    } else if (data.name.trim().length > 150) {
      errors.push('Nama program maksimal 150 karakter');
    }
  }

  // image — required on create
  if (!isUpdate && !data.image) {
    errors.push('Gambar program wajib diunggah');
  }

  // sort_order
  if (data.sort_order !== undefined && data.sort_order !== null) {
    const order = parseInt(data.sort_order);
    if (isNaN(order) || order < 0) {
      errors.push('Urutan tampil harus berupa angka non-negatif');
    }
  }

  // is_active
  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active harus berupa boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validateSchoolProgram };

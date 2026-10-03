const validateCreateSubject = (data) => {
  const errors = [];

  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    errors.push('Kode mata pelajaran wajib diisi');
  } else if (data.code.trim().length > 20) {
    errors.push('Kode mata pelajaran maksimal 20 karakter');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Nama mata pelajaran wajib diisi');
  } else if (data.name.trim().length > 150) {
    errors.push('Nama mata pelajaran maksimal 150 karakter');
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Deskripsi harus berupa teks');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateSubject = (data) => {
  const errors = [];

  if (data.code !== undefined) {
    if (typeof data.code !== 'string' || data.code.trim() === '') {
      errors.push('Kode mata pelajaran tidak boleh kosong');
    } else if (data.code.trim().length > 20) {
      errors.push('Kode mata pelajaran maksimal 20 karakter');
    }
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama mata pelajaran tidak boleh kosong');
    } else if (data.name.trim().length > 150) {
      errors.push('Nama mata pelajaran maksimal 150 karakter');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateSubject, validateUpdateSubject };

const validateCreateMajor = (data) => {
  const errors = [];

  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    errors.push('Kode jurusan wajib diisi');
  } else if (data.code.trim().length > 20) {
    errors.push('Kode jurusan maksimal 20 karakter');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Nama jurusan wajib diisi');
  } else if (data.name.trim().length > 150) {
    errors.push('Nama jurusan maksimal 150 karakter');
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Deskripsi harus berupa teks');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateMajor = (data) => {
  const errors = [];

  if (data.code !== undefined) {
    if (typeof data.code !== 'string' || data.code.trim() === '') {
      errors.push('Kode jurusan tidak boleh kosong');
    } else if (data.code.trim().length > 20) {
      errors.push('Kode jurusan maksimal 20 karakter');
    }
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nama jurusan tidak boleh kosong');
    } else if (data.name.trim().length > 150) {
      errors.push('Nama jurusan maksimal 150 karakter');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateMajor, validateUpdateMajor };

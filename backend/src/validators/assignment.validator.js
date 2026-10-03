const validateCreateAssignment = (data) => {
  const errors = [];

  if (!data.class_subject_id || typeof data.class_subject_id !== 'string' || data.class_subject_id.trim() === '') {
    errors.push('ID kelas-mata pelajaran wajib diisi');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('Judul tugas wajib diisi');
  } else if (data.title.trim().length > 200) {
    errors.push('Judul tugas maksimal 200 karakter');
  }

  if (data.due_date !== undefined && data.due_date !== null && data.due_date !== '') {
    const d = new Date(data.due_date);
    if (isNaN(d.getTime())) {
      errors.push('Format tanggal deadline tidak valid');
    }
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateAssignment = (data) => {
  const errors = [];

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim() === '') {
      errors.push('Judul tugas tidak boleh kosong');
    } else if (data.title.trim().length > 200) {
      errors.push('Judul tugas maksimal 200 karakter');
    }
  }

  if (data.due_date !== undefined && data.due_date !== null && data.due_date !== '') {
    const d = new Date(data.due_date);
    if (isNaN(d.getTime())) {
      errors.push('Format tanggal deadline tidak valid');
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateCreateAssignment, validateUpdateAssignment };

const isValidScore = (val) => {
  if (val === null || val === undefined || val === '') return true; // optional
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0 && n <= 100;
};

const validateGrade = (data) => {
  const errors = [];

  if (!data.class_subject_id || typeof data.class_subject_id !== 'string' || data.class_subject_id.trim() === '') {
    errors.push('ID kelas-mata pelajaran wajib diisi');
  }

  if (!data.student_id || typeof data.student_id !== 'string' || data.student_id.trim() === '') {
    errors.push('ID siswa wajib diisi');
  }

  if (data.assignment_score !== undefined && !isValidScore(data.assignment_score)) {
    errors.push('Nilai tugas harus antara 0 – 100');
  }
  if (data.midterm_score !== undefined && !isValidScore(data.midterm_score)) {
    errors.push('Nilai UTS harus antara 0 – 100');
  }
  if (data.final_exam_score !== undefined && !isValidScore(data.final_exam_score)) {
    errors.push('Nilai UAS harus antara 0 – 100');
  }
  if (data.final_score !== undefined && !isValidScore(data.final_score)) {
    errors.push('Nilai akhir harus antara 0 – 100');
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateGrade = (data) => {
  const errors = [];

  if (data.assignment_score !== undefined && !isValidScore(data.assignment_score)) {
    errors.push('Nilai tugas harus antara 0 – 100');
  }
  if (data.midterm_score !== undefined && !isValidScore(data.midterm_score)) {
    errors.push('Nilai UTS harus antara 0 – 100');
  }
  if (data.final_exam_score !== undefined && !isValidScore(data.final_exam_score)) {
    errors.push('Nilai UAS harus antara 0 – 100');
  }
  if (data.final_score !== undefined && !isValidScore(data.final_score)) {
    errors.push('Nilai akhir harus antara 0 – 100');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validateGrade, validateUpdateGrade };

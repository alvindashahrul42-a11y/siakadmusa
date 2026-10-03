/**
 * Validators untuk setiap step PPDB
 */

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^08\d{8,13}$/.test(phone);
const validateNIK = (nik) => /^\d{16}$/.test(nik);
const validateNISN = (nisn) => /^\d{10}$/.test(nisn);

// =========================================================
// Step 1 — Akun (public register)
// =========================================================
const validateStep1 = (data) => {
  const errors = [];

  if (!data.full_name || data.full_name.trim().length < 3) {
    errors.push('Nama lengkap wajib diisi (minimal 3 karakter)');
  }
  if (!data.email) {
    errors.push('Email wajib diisi');
  } else if (!validateEmail(data.email)) {
    errors.push('Format email tidak valid');
  }
  if (!data.password) {
    errors.push('Kata sandi wajib diisi');
  } else if (data.password.length < 8) {
    errors.push('Kata sandi minimal 8 karakter');
  }
  if (!data.confirm_password) {
    errors.push('Konfirmasi kata sandi wajib diisi');
  } else if (data.password !== data.confirm_password) {
    errors.push('Konfirmasi kata sandi tidak cocok');
  }

  return { isValid: errors.length === 0, errors };
};

// =========================================================
// Step 2 & 3 — Didaftarkan Oleh + Pendidikan
// =========================================================
const validateStep2And3 = (data) => {
  const errors = [];

  const validRegisteredBy = ['diri_sendiri', 'ayah', 'ibu', 'saudara', 'guru'];
  if (!data.registered_by) {
    errors.push('Didaftarkan oleh wajib diisi');
  } else if (!validRegisteredBy.includes(data.registered_by)) {
    errors.push(`Didaftarkan oleh harus salah satu dari: ${validRegisteredBy.join(', ')}`);
  }

  const validMajor = ['TKJ', 'teknik_otomotif'];
  if (!data.major) {
    errors.push('Jurusan wajib diisi');
  } else if (!validMajor.includes(data.major)) {
    errors.push('Jurusan harus salah satu dari: TKJ, teknik_otomotif');
  }

  const validEduSystem = ['reguler', 'pondok', 'panti'];
  if (!data.education_system) {
    errors.push('Sistem pendidikan wajib diisi');
  } else if (!validEduSystem.includes(data.education_system)) {
    errors.push('Sistem pendidikan harus salah satu dari: reguler, pondok, panti');
  }

  return { isValid: errors.length === 0, errors };
};

// =========================================================
// Step 4 — Data Diri (field wajib)
// =========================================================
const validateStep4 = (data) => {
  const errors = [];

  // Identitas
  if (!data.nik) {
    errors.push('NIK/KIA wajib diisi');
  } else if (!validateNIK(data.nik)) {
    errors.push('NIK/KIA harus 16 digit angka');
  }

  if (!data.nisn) {
    errors.push('NISN wajib diisi');
  } else if (!validateNISN(data.nisn)) {
    errors.push('NISN harus 10 digit angka');
  }

  if (!data.full_name || data.full_name.trim().length < 3) {
    errors.push('Nama lengkap (sesuai ijazah) wajib diisi');
  }

  if (!data.nationality) errors.push('Kewarganegaraan wajib diisi');
  if (!data.birth_place) errors.push('Tempat lahir wajib diisi');
  if (!data.birth_date) errors.push('Tanggal lahir wajib diisi');

  const validGender = ['laki-laki', 'perempuan'];
  if (!data.gender) {
    errors.push('Jenis kelamin wajib diisi');
  } else if (!validGender.includes(data.gender)) {
    errors.push('Jenis kelamin harus: laki-laki atau perempuan');
  }

  const validReligion = ['islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu'];
  if (!data.religion) {
    errors.push('Agama wajib diisi');
  } else if (!validReligion.includes(data.religion)) {
    errors.push(`Agama harus salah satu dari: ${validReligion.join(', ')}`);
  }

  const validFamilyStatus = ['yatim', 'piatu', 'yatim_piatu', 'lengkap', 'lainnya'];
  if (!data.family_status) {
    errors.push('Status keluarga wajib diisi');
  } else if (!validFamilyStatus.includes(data.family_status)) {
    errors.push(`Status keluarga harus salah satu dari: ${validFamilyStatus.join(', ')}`);
  }

  // Status dalam keluarga
  if (data.child_order === undefined || data.child_order === null || data.child_order === '') {
    errors.push('Anak ke- wajib diisi');
  } else if (parseInt(data.child_order) < 1) {
    errors.push('Anak ke- minimal 1');
  }

  if (data.total_siblings === undefined || data.total_siblings === null || data.total_siblings === '') {
    errors.push('Dari berapa saudara wajib diisi');
  }

  if (data.total_biological_siblings === undefined || data.total_biological_siblings === null || data.total_biological_siblings === '') {
    errors.push('Total saudara kandung wajib diisi');
  }

  // Asal sekolah
  if (!data.school_origin) errors.push('Asal sekolah wajib diisi');
  if (!data.study_duration) errors.push('Lama belajar wajib diisi');
  if (!data.diploma_number) errors.push('Nomor ijazah wajib diisi');
  if (!data.diploma_date) errors.push('Tanggal ijazah wajib diisi');
  if (!data.npsn) errors.push('NPSN wajib diisi');

  // Informasi lainnya
  if (!data.living_status) errors.push('Status tinggal wajib diisi');
  if (!data.daily_language) errors.push('Bahasa sehari-hari wajib diisi');
  if (!data.transportation) errors.push('Moda transportasi wajib diisi');

  if (data.distance_to_school === undefined || data.distance_to_school === null || data.distance_to_school === '') {
    errors.push('Jarak menuju sekolah wajib diisi');
  } else if (parseFloat(data.distance_to_school) < 0) {
    errors.push('Jarak tidak boleh negatif');
  }

  if (data.travel_time === undefined || data.travel_time === null || data.travel_time === '') {
    errors.push('Waktu tempuh wajib diisi');
  } else if (parseFloat(data.travel_time) < 0) {
    errors.push('Waktu tempuh tidak boleh negatif');
  }

  // Foto dikirim via multer, validasi di controller
  // (jika tidak ada file upload baru, boleh skip jika sudah ada)

  // Kontak & alamat
  if (!data.phone) {
    errors.push('No HP wajib diisi');
  } else if (!validatePhone(data.phone)) {
    errors.push('No HP harus diawali 08 dan 10-15 digit');
  }

  if (!data.province) errors.push('Provinsi wajib diisi');
  if (!data.city) errors.push('Kabupaten/Kota wajib diisi');
  if (!data.district) errors.push('Kecamatan wajib diisi');
  if (!data.village) errors.push('Desa/Kelurahan wajib diisi');
  if (!data.rt) errors.push('RT wajib diisi');
  if (!data.rw) errors.push('RW wajib diisi');
  if (!data.full_address) errors.push('Alamat lengkap wajib diisi');

  // KIP kondisional
  if (data.has_kip === 'true' || data.has_kip === true) {
    if (!data.kip_number) errors.push('Nomor KIP wajib diisi jika penerima KIP');
  }

  return { isValid: errors.length === 0, errors };
};

// =========================================================
// Step 5 — Kesehatan (semua opsional, hanya validasi tipe)
// =========================================================
const validateStep5 = (data) => {
  const errors = [];

  if (data.height !== undefined && data.height !== null && data.height !== '') {
    const h = parseFloat(data.height);
    if (isNaN(h) || h <= 0 || h > 300) {
      errors.push('Tinggi badan tidak valid (cm)');
    }
  }

  if (data.weight !== undefined && data.weight !== null && data.weight !== '') {
    const w = parseFloat(data.weight);
    if (isNaN(w) || w <= 0 || w > 500) {
      errors.push('Berat badan tidak valid (kg)');
    }
  }

  return { isValid: errors.length === 0, errors };
};

// =========================================================
// Step 6 — Dokumen (wajib saat pertama upload)
// =========================================================
const validateStep6Files = (files, existingDocs) => {
  const errors = [];

  const hasKK = (files && files.kk_document) || (existingDocs && existingDocs.kk_document);
  const hasDiploma = (files && files.diploma_document) || (existingDocs && existingDocs.diploma_document);

  if (!hasKK) errors.push('Dokumen Kartu Keluarga (KK) wajib diupload');
  if (!hasDiploma) errors.push('Dokumen Ijazah/SKL wajib diupload');

  return { isValid: errors.length === 0, errors };
};

// =========================================================
// Step 7 — Prestasi (opsional, validasi per item)
// =========================================================
const validateAchievementItem = (data) => {
  const errors = [];

  if (!data.achievement_name || data.achievement_name.trim().length < 3) {
    errors.push('Nama prestasi wajib diisi (minimal 3 karakter)');
  }

  return { isValid: errors.length === 0, errors };
};

// =========================================================
// Step 8 — Data Orang Tua
// =========================================================
const validateParent = (data, parentLabel = 'Orang tua') => {
  const errors = [];

  if (!data.full_name || data.full_name.trim().length < 3) {
    errors.push(`${parentLabel}: Nama wajib diisi`);
  }

  if (!data.nik) {
    errors.push(`${parentLabel}: NIK wajib diisi`);
  } else if (!validateNIK(data.nik)) {
    errors.push(`${parentLabel}: NIK harus 16 digit angka`);
  }

  if (!data.education) errors.push(`${parentLabel}: Pendidikan wajib diisi`);
  if (!data.occupation) errors.push(`${parentLabel}: Pekerjaan wajib diisi`);

  const validMarital = ['menikah', 'cerai_hidup', 'cerai_mati', 'lainnya'];
  if (!data.marital_status) {
    errors.push(`${parentLabel}: Status pernikahan wajib diisi`);
  } else if (!validMarital.includes(data.marital_status)) {
    errors.push(`${parentLabel}: Status pernikahan harus salah satu dari: ${validMarital.join(', ')}`);
  }

  if (!data.phone) {
    errors.push(`${parentLabel}: No HP wajib diisi`);
  } else if (!validatePhone(data.phone)) {
    errors.push(`${parentLabel}: No HP harus diawali 08 dan 10-15 digit`);
  }

  if (!data.birth_place) errors.push(`${parentLabel}: Tempat lahir wajib diisi`);
  if (!data.birth_date) errors.push(`${parentLabel}: Tanggal lahir wajib diisi`);
  if (!data.nationality) errors.push(`${parentLabel}: Kewarganegaraan wajib diisi`);

  const validReligion = ['islam', 'kristen', 'katolik', 'hindu', 'buddha', 'konghucu'];
  if (!data.religion) {
    errors.push(`${parentLabel}: Agama wajib diisi`);
  } else if (!validReligion.includes(data.religion)) {
    errors.push(`${parentLabel}: Agama harus salah satu dari: ${validReligion.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateStep1,
  validateStep2And3,
  validateStep4,
  validateStep5,
  validateStep6Files,
  validateAchievementItem,
  validateParent
};

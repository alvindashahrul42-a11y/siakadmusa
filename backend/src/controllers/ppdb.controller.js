const UserModel = require('../models/User.model');
const PpdbModel = require('../models/Ppdb.model');
const StudentModel = require('../models/Student.model');
const { generateToken } = require('../utils/jwtHelper');
const { successResponse, successResponseWithPagination, errorResponse } = require('../utils/responseHelper');
const { parsePaginationParams } = require('../utils/paginationHelper');
const {
  validateStep1,
  validateStep2And3,
  validateStep4,
  validateStep5,
  validateStep6Files,
  validateAchievementItem,
  validateParent
} = require('../validators/ppdb.validator');
const fs = require('fs');
const path = require('path');

/**
 * Helper: hapus file upload lama dari disk
 */
function deleteFile(relativePath) {
  if (!relativePath) return;
  try {
    const fullPath = path.join(__dirname, '../../', relativePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (_) { /* silent */ }
}

/**
 * Helper: format path file upload ke URL relatif
 * e.g. uploads/ppdb/photo/xxx.jpg
 */
function fileUrl(file) {
  if (!file) return null;
  // Normalise backslash -> forward slash
  return file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
}

class PpdbController {
  // =========================================================
  // STEP 1 — Daftar Akun (PUBLIC)
  // POST /api/ppdb/register
  // =========================================================
  static async register(req, res) {
    try {
      const { full_name, email, password, confirm_password } = req.body;

      // Validate
      const validation = validateStep1({ full_name, email, password, confirm_password });
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validasi gagal', validation.errors);
      }

      // Cek email duplikat
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return errorResponse(res, 409, 'Email sudah terdaftar');
      }

      // Ambil role kandidat
      const role = await UserModel.findRoleByName('candidate');
      if (!role) {
        return errorResponse(res, 500, 'Role kandidat tidak ditemukan');
      }

      // Generate username dari nama depan + 4 digit random
      const firstName = full_name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername = `${firstName}${randomSuffix}`;

      // Buat user
      const userId = await UserModel.create({
        role_id: role.id,
        username: generatedUsername,
        email,
        password
      });

      // Generate token
      const token = generateToken({ userId, email, role: 'candidate' });

      return successResponse(res, 201, 'Akun berhasil dibuat. Lanjutkan ke step berikutnya.', {
        token,
        user_id: userId,
        username: generatedUsername,
        step_completed: 1,
        next_step: 2
      });
    } catch (error) {
      console.error('PPDB register error:', error);
      return errorResponse(res, 500, 'Pendaftaran akun gagal', error.message);
    }
  }

  // =========================================================
  // STEP 2 & 3 — Didaftarkan Oleh + Pendidikan (PRIVATE: candidate)
  // POST /api/ppdb/step/2-3
  // =========================================================
  static async saveStep2And3(req, res) {
    try {
      const userId = req.user.id;
      const { registered_by, major, education_system } = req.body;

      const validation = validateStep2And3({ registered_by, major, education_system });
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validasi gagal', validation.errors);
      }

      // Cek sudah ada draft atau belum
      let registration = await PpdbModel.findByUserId(userId);

      if (!registration) {
        // Buat draft baru
        await PpdbModel.createDraft(userId, { registered_by, major, education_system });
        registration = await PpdbModel.findByUserId(userId);
      } else {
        // Update step 2&3 di draft yang ada
        if (registration.registration_status !== 'draft') {
          return errorResponse(res, 400, 'Pendaftaran sudah disubmit, tidak bisa diubah');
        }
        await PpdbModel.advanceStep(registration.id, 3);
        // Update fields manually via update
        const pool = require('../config/database');
        await pool.execute(
          `UPDATE ppdb_registrations SET 
            registered_by = ?, major = ?, education_system = ?,
            current_step = GREATEST(current_step, 3),
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [registered_by, major, education_system, registration.id]
        );
        registration = await PpdbModel.findByUserId(userId);
      }

      return successResponse(res, 200, 'Step 2 & 3 berhasil disimpan', {
        registration_id: registration.id,
        step_completed: 3,
        next_step: 4
      });
    } catch (error) {
      console.error('PPDB step 2&3 error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan data', error.message);
    }
  }

  // =========================================================
  // STEP 4 — Data Diri (PRIVATE: candidate)
  // POST /api/ppdb/step/4
  // Multipart: field 'photo' untuk pas foto
  // =========================================================
  static async saveStep4(req, res) {
    try {
      const userId = req.user.id;

      // Cek registrasi ada
      const registration = await PpdbModel.findByUserId(userId);
      if (!registration) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan. Selesaikan step 2 & 3 terlebih dahulu');
      }
      if (registration.registration_status !== 'draft') {
        return errorResponse(res, 400, 'Pendaftaran sudah disubmit, tidak bisa diubah');
      }

      // Foto dari multer
      const photoFile = req.file;
      const photoPath = photoFile ? fileUrl(photoFile) : (registration.photo || null);

      if (!photoPath) {
        return errorResponse(res, 400, 'Pas foto wajib diupload');
      }

      // Hapus foto lama jika ada foto baru
      if (photoFile && registration.photo) {
        deleteFile(registration.photo);
      }

      const data = { ...req.body, photo: photoPath };

      const validation = validateStep4(data);
      if (!validation.isValid) {
        // Hapus foto baru jika validasi gagal
        if (photoFile) deleteFile(photoPath);
        return errorResponse(res, 400, 'Validasi gagal', validation.errors);
      }

      await PpdbModel.updateStep4(registration.id, data);

      return successResponse(res, 200, 'Step 4 berhasil disimpan', {
        registration_id: registration.id,
        step_completed: 4,
        next_step: 5
      });
    } catch (error) {
      console.error('PPDB step 4 error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan data diri', error.message);
    }
  }

  // =========================================================
  // STEP 5 — Kesehatan (PRIVATE: candidate)
  // POST /api/ppdb/step/5
  // =========================================================
  static async saveStep5(req, res) {
    try {
      const userId = req.user.id;

      const registration = await PpdbModel.findByUserId(userId);
      if (!registration) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }
      if (registration.registration_status !== 'draft') {
        return errorResponse(res, 400, 'Pendaftaran sudah disubmit, tidak bisa diubah');
      }

      const { health_history, disability, height, weight } = req.body;

      const validation = validateStep5({ health_history, disability, height, weight });
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validasi gagal', validation.errors);
      }

      await PpdbModel.upsertHealth(registration.id, { health_history, disability, height, weight });
      await PpdbModel.advanceStep(registration.id, 5);

      return successResponse(res, 200, 'Step 5 berhasil disimpan', {
        registration_id: registration.id,
        step_completed: 5,
        next_step: 6
      });
    } catch (error) {
      console.error('PPDB step 5 error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan data kesehatan', error.message);
    }
  }

  // =========================================================
  // STEP 6 — Dokumen (PRIVATE: candidate)
  // POST /api/ppdb/step/6
  // Multipart: 'kk_document', 'diploma_document'
  // =========================================================
  static async saveStep6(req, res) {
    try {
      const userId = req.user.id;

      const registration = await PpdbModel.findByUserId(userId);
      if (!registration) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }
      if (registration.registration_status !== 'draft') {
        return errorResponse(res, 400, 'Pendaftaran sudah disubmit, tidak bisa diubah');
      }

      const existingDocs = await PpdbModel.findDocumentsByRegistrationId(registration.id);

      const kkFile = req.files && req.files['kk_document'] ? req.files['kk_document'][0] : null;
      const diplomaFile = req.files && req.files['diploma_document'] ? req.files['diploma_document'][0] : null;

      // Validasi: wajib ada dokumen (baik baru maupun sudah tersimpan)
      const fileCheck = {
        kk_document: kkFile,
        diploma_document: diplomaFile
      };
      const validation = validateStep6Files(fileCheck, existingDocs);
      if (!validation.isValid) {
        if (kkFile) deleteFile(fileUrl(kkFile));
        if (diplomaFile) deleteFile(fileUrl(diplomaFile));
        return errorResponse(res, 400, 'Validasi gagal', validation.errors);
      }

      // Hapus file lama jika ada upload baru
      if (kkFile && existingDocs && existingDocs.kk_document) {
        deleteFile(existingDocs.kk_document);
      }
      if (diplomaFile && existingDocs && existingDocs.diploma_document) {
        deleteFile(existingDocs.diploma_document);
      }

      const docData = {
        kk_document: kkFile ? fileUrl(kkFile) : null,
        diploma_document: diplomaFile ? fileUrl(diplomaFile) : null
      };

      await PpdbModel.upsertDocuments(registration.id, docData);
      await PpdbModel.advanceStep(registration.id, 6);

      return successResponse(res, 200, 'Step 6 berhasil disimpan', {
        registration_id: registration.id,
        step_completed: 6,
        next_step: 7
      });
    } catch (error) {
      console.error('PPDB step 6 error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan dokumen', error.message);
    }
  }

  // =========================================================
  // STEP 7 — Prestasi: Tambah (PRIVATE: candidate)
  // POST /api/ppdb/step/7/achievements
  // Multipart: 'document' (opsional)
  // =========================================================
  static async addAchievement(req, res) {
    try {
      const userId = req.user.id;

      const registration = await PpdbModel.findByUserId(userId);
      if (!registration) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }
      if (registration.registration_status !== 'draft') {
        return errorResponse(res, 400, 'Pendaftaran sudah disubmit, tidak bisa diubah');
      }

      const { achievement_name } = req.body;
      const docFile = req.file;

      const validation = validateAchievementItem({ achievement_name });
      if (!validation.isValid) {
        if (docFile) deleteFile(fileUrl(docFile));
        return errorResponse(res, 400, 'Validasi gagal', validation.errors);
      }

      const achievement = await PpdbModel.addAchievement(registration.id, {
        achievement_name,
        document: docFile ? fileUrl(docFile) : null
      });
      await PpdbModel.advanceStep(registration.id, 7);

      return successResponse(res, 201, 'Prestasi berhasil ditambahkan', { achievement });
    } catch (error) {
      console.error('PPDB add achievement error:', error);
      return errorResponse(res, 500, 'Gagal menambah prestasi', error.message);
    }
  }

  // =========================================================
  // STEP 7 — Prestasi: Hapus (PRIVATE: candidate)
  // DELETE /api/ppdb/step/7/achievements/:achievementId
  // =========================================================
  static async deleteAchievement(req, res) {
    try {
      const userId = req.user.id;
      const { achievementId } = req.params;

      const registration = await PpdbModel.findByUserId(userId);
      if (!registration) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }
      if (registration.registration_status !== 'draft') {
        return errorResponse(res, 400, 'Pendaftaran sudah disubmit, tidak bisa diubah');
      }

      const deleted = await PpdbModel.deleteAchievement(achievementId, registration.id);
      if (!deleted) {
        return errorResponse(res, 404, 'Prestasi tidak ditemukan');
      }

      return successResponse(res, 200, 'Prestasi berhasil dihapus');
    } catch (error) {
      console.error('PPDB delete achievement error:', error);
      return errorResponse(res, 500, 'Gagal menghapus prestasi', error.message);
    }
  }

  // =========================================================
  // STEP 8 — Data Orang Tua (PRIVATE: candidate)
  // POST /api/ppdb/step/8/:parentType  (parentType: ayah | ibu)
  // =========================================================
  static async saveParent(req, res) {
    try {
      const userId = req.user.id;
      const { parentType } = req.params;

      if (!['ayah', 'ibu'].includes(parentType)) {
        return errorResponse(res, 400, 'parentType harus ayah atau ibu');
      }

      const registration = await PpdbModel.findByUserId(userId);
      if (!registration) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }
      if (registration.registration_status !== 'draft') {
        return errorResponse(res, 400, 'Pendaftaran sudah disubmit, tidak bisa diubah');
      }

      const label = parentType === 'ayah' ? 'Ayah' : 'Ibu';
      const validation = validateParent(req.body, label);
      if (!validation.isValid) {
        return errorResponse(res, 400, 'Validasi gagal', validation.errors);
      }

      await PpdbModel.upsertParent(registration.id, parentType, req.body);
      await PpdbModel.advanceStep(registration.id, 8);

      return successResponse(res, 200, `Data ${label} berhasil disimpan`, {
        registration_id: registration.id,
        parent_type: parentType,
        step_completed: 8
      });
    } catch (error) {
      console.error('PPDB save parent error:', error);
      return errorResponse(res, 500, 'Gagal menyimpan data orang tua', error.message);
    }
  }

  // =========================================================
  // SUBMIT — Finalkan pendaftaran (PRIVATE: candidate)
  // POST /api/ppdb/submit
  // =========================================================
  static async submit(req, res) {
    try {
      const userId = req.user.id;

      const detail = await PpdbModel.findByUserId(userId);
      if (!detail) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }
      if (detail.registration_status !== 'draft') {
        return errorResponse(res, 400, 'Pendaftaran sudah pernah disubmit');
      }

      // Cek kelengkapan minimal
      const missing = [];
      if (!detail.nik) missing.push('Data diri (Step 4) belum lengkap');

      const docs = await PpdbModel.findDocumentsByRegistrationId(detail.id);
      if (!docs || !docs.kk_document || !docs.diploma_document) {
        missing.push('Dokumen (Step 6) belum diupload');
      }

      const parents = await PpdbModel.findParentsByRegistrationId(detail.id);
      const hasAyah = parents.some(p => p.parent_type === 'ayah');
      const hasIbu = parents.some(p => p.parent_type === 'ibu');
      if (!hasAyah) missing.push('Data Ayah (Step 8) belum diisi');
      if (!hasIbu) missing.push('Data Ibu (Step 8) belum diisi');

      if (missing.length > 0) {
        return errorResponse(res, 400, 'Pendaftaran belum lengkap', missing);
      }

      await PpdbModel.updateStatus(detail.id, 'submitted');

      return successResponse(res, 200, 'Pendaftaran berhasil disubmit. Silakan tunggu verifikasi dari admin.', {
        registration_id: detail.id,
        registration_status: 'submitted'
      });
    } catch (error) {
      console.error('PPDB submit error:', error);
      return errorResponse(res, 500, 'Gagal submit pendaftaran', error.message);
    }
  }

  // =========================================================
  // GET MY REGISTRATION — Status & detail (PRIVATE: candidate)
  // GET /api/ppdb/my-registration
  // =========================================================
  static async getMyRegistration(req, res) {
    try {
      const userId = req.user.id;

      const registration = await PpdbModel.findByUserId(userId);
      if (!registration) {
        return successResponse(res, 200, 'Belum ada data pendaftaran', { registration: null });
      }

      const detail = await PpdbModel.findFullDetail(registration.id);

      return successResponse(res, 200, 'Data pendaftaran berhasil diambil', { registration: detail });
    } catch (error) {
      console.error('PPDB get my registration error:', error);
      return errorResponse(res, 500, 'Gagal mengambil data pendaftaran', error.message);
    }
  }

  // =========================================================
  // ADMIN: GET ALL (PRIVATE: admin, superuser)
  // GET /api/ppdb/admin/registrations
  // =========================================================
  static async adminGetAll(req, res) {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      const { status, major, search } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (major) filters.major = major;
      if (search) filters.search = search;
      // Default: semua status kecuali accepted (sudah jadi siswa)
      if (!status) filters.excludeAccepted = true;

      const [rows, total] = await Promise.all([
        PpdbModel.findAll(filters, { limit, offset }),
        PpdbModel.count(filters)
      ]);

      return successResponseWithPagination(res, 200, 'Data pendaftaran berhasil diambil', rows, {
        page, limit, total
      });
    } catch (error) {
      console.error('PPDB admin get all error:', error);
      return errorResponse(res, 500, 'Gagal mengambil data pendaftaran', error.message);
    }
  }

  // =========================================================
  // ADMIN: GET DETAIL (PRIVATE: admin, superuser)
  // GET /api/ppdb/admin/registrations/:id
  // =========================================================
  static async adminGetDetail(req, res) {
    try {
      const { id } = req.params;

      const detail = await PpdbModel.findFullDetail(id);
      if (!detail) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }

      return successResponse(res, 200, 'Detail pendaftaran berhasil diambil', { registration: detail });
    } catch (error) {
      console.error('PPDB admin get detail error:', error);
      return errorResponse(res, 500, 'Gagal mengambil detail pendaftaran', error.message);
    }
  }

  // =========================================================
  // ADMIN: VERIFIKASI / TERIMA / TOLAK (PRIVATE: admin, superuser)
  // PATCH /api/ppdb/admin/registrations/:id/status
  // Body: { status: 'verified'|'accepted'|'rejected', notes }
  // =========================================================
  static async adminUpdateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ['accepted', 'rejected'];
      if (!status || !validStatuses.includes(status)) {
        return errorResponse(res, 400, `Status harus salah satu dari: ${validStatuses.join(', ')}`);
      }

      const registration = await PpdbModel.findById(id);
      if (!registration) {
        return errorResponse(res, 404, 'Pendaftaran tidak ditemukan');
      }

      if (registration.registration_status === 'draft') {
        return errorResponse(res, 400, 'Pendaftaran belum disubmit oleh kandidat');
      }

      await PpdbModel.updateStatus(id, status, req.user.id, notes || null);

      if (status === 'accepted') {
        // Diterima → role jadi student, is_active true
        const studentRole = await UserModel.findRoleByName('student');
        if (studentRole) {
          await UserModel.update(registration.user_id, { role_id: studentRole.id, is_active: true });
        }

        // Buat record di tabel students jika belum ada
        const existingStudent = await StudentModel.findByUserId(registration.user_id);
        if (!existingStudent) {
          // Generate nomor siswa: YYYYNNNNN (tahun + 5 digit urut random)
          const year = new Date().getFullYear();
          const randomNum = String(Math.floor(10000 + Math.random() * 90000));
          const studentNumber = `${year}${randomNum}`;

          const majorMap = {
            'TKJ': 'TKJ',
            'teknik_otomotif': 'Teknik Otomotif'
          };

          await StudentModel.create({
            user_id: registration.user_id,
            student_number: studentNumber,
            full_name: registration.full_name,
            gender: registration.gender || null,
            birth_place: registration.birth_place || null,
            birth_date: registration.birth_date || null,
            phone: registration.phone || null,
            address: registration.full_address || null,
            class_name: null,
            major: majorMap[registration.major] || registration.major || null,
            enrollment_year: year
          });
        }
      }

      if (status === 'rejected') {
        // Ditolak → role tetap candidate, is_active false
        const candidateRole = await UserModel.findRoleByName('candidate');
        if (candidateRole) {
          await UserModel.update(registration.user_id, { role_id: candidateRole.id, is_active: false });
        }
      }

      return successResponse(res, 200, `Status pendaftaran berhasil diubah menjadi ${status}`, {
        registration_id: id,
        registration_status: status
      });
    } catch (error) {
      console.error('PPDB admin update status error:', error);
      return errorResponse(res, 500, 'Gagal mengubah status pendaftaran', error.message);
    }
  }
}

module.exports = PpdbController;

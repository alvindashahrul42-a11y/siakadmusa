const express = require('express');
const router = express.Router();
const PpdbController = require('../controllers/ppdb.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadPpdbPhoto, uploadPpdbDocs, uploadPpdbAchievement } = require('../middleware/upload.middleware');

// =========================================================
// PUBLIC
// =========================================================

/**
 * @route   POST /api/ppdb/register
 * @desc    Step 1 — Daftar akun kandidat (auto role: candidate)
 * @access  Public
 */
router.post('/register', PpdbController.register);

// =========================================================
// PRIVATE — Kandidat (lanjutkan step form)
// =========================================================

/**
 * @route   POST /api/ppdb/step/2-3
 * @desc    Step 2 & 3 — Didaftarkan oleh + jurusan + sistem pendidikan
 * @access  Private (candidate)
 */
router.post(
  '/step/2-3',
  authenticate,
  authorize('candidate'),
  PpdbController.saveStep2And3
);

/**
 * @route   POST /api/ppdb/step/4
 * @desc    Step 4 — Data diri lengkap (dengan upload pas foto)
 * @access  Private (candidate)
 */
router.post(
  '/step/4',
  authenticate,
  authorize('candidate'),
  uploadPpdbPhoto.single('photo'),
  PpdbController.saveStep4
);

/**
 * @route   POST /api/ppdb/step/5
 * @desc    Step 5 — Data kesehatan (semua opsional)
 * @access  Private (candidate)
 */
router.post(
  '/step/5',
  authenticate,
  authorize('candidate'),
  PpdbController.saveStep5
);

/**
 * @route   POST /api/ppdb/step/6
 * @desc    Step 6 — Upload dokumen KK & ijazah
 * @access  Private (candidate)
 */
router.post(
  '/step/6',
  authenticate,
  authorize('candidate'),
  uploadPpdbDocs.fields([
    { name: 'kk_document', maxCount: 1 },
    { name: 'diploma_document', maxCount: 1 }
  ]),
  PpdbController.saveStep6
);

/**
 * @route   POST /api/ppdb/step/7/achievements
 * @desc    Step 7 — Tambah prestasi (multiple, opsional)
 * @access  Private (candidate)
 */
router.post(
  '/step/7/achievements',
  authenticate,
  authorize('candidate'),
  uploadPpdbAchievement.single('document'),
  PpdbController.addAchievement
);

/**
 * @route   DELETE /api/ppdb/step/7/achievements/:achievementId
 * @desc    Step 7 — Hapus prestasi
 * @access  Private (candidate)
 */
router.delete(
  '/step/7/achievements/:achievementId',
  authenticate,
  authorize('candidate'),
  PpdbController.deleteAchievement
);

/**
 * @route   POST /api/ppdb/step/8/:parentType
 * @desc    Step 8 — Data orang tua (ayah | ibu)
 * @access  Private (candidate)
 */
router.post(
  '/step/8/:parentType',
  authenticate,
  authorize('candidate'),
  PpdbController.saveParent
);

/**
 * @route   POST /api/ppdb/submit
 * @desc    Submit pendaftaran final (semua step wajib harus lengkap)
 * @access  Private (candidate)
 */
router.post(
  '/submit',
  authenticate,
  authorize('candidate'),
  PpdbController.submit
);

/**
 * @route   GET /api/ppdb/my-registration
 * @desc    Lihat status & detail pendaftaran sendiri
 * @access  Private (candidate)
 */
router.get(
  '/my-registration',
  authenticate,
  authorize('candidate'),
  PpdbController.getMyRegistration
);

// =========================================================
// PRIVATE — Admin / Superuser
// =========================================================

/**
 * @route   GET /api/ppdb/admin/registrations
 * @desc    Ambil semua pendaftaran dengan filter & pagination
 * @access  Private (admin, superuser, teacher)
 * @query   ?status=submitted&major=TKJ&search=xxx&page=1&limit=10
 */
router.get(
  '/admin/registrations',
  authenticate,
  authorize('admin', 'superuser', 'teacher'),
  PpdbController.adminGetAll
);

/**
 * @route   GET /api/ppdb/admin/registrations/:id
 * @desc    Detail lengkap satu pendaftaran
 * @access  Private (admin, superuser, teacher)
 */
router.get(
  '/admin/registrations/:id',
  authenticate,
  authorize('admin', 'superuser', 'teacher'),
  PpdbController.adminGetDetail
);

/**
 * @route   PATCH /api/ppdb/admin/registrations/:id/status
 * @desc    Update status pendaftaran (accepted / rejected)
 * @access  Private (admin, superuser, teacher)
 * @body    { status: string, notes?: string }
 */
router.patch(
  '/admin/registrations/:id/status',
  authenticate,
  authorize('admin', 'superuser', 'teacher'),
  PpdbController.adminUpdateStatus
);

module.exports = router;

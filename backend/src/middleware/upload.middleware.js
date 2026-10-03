const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Create multer upload middleware for specific folder
 * @param {string} folderName - Folder name inside uploads directory (e.g., 'hero', 'logo')
 * @param {string} filePrefix - Prefix for uploaded files (e.g., 'hero', 'logo')
 * @returns {Object} Multer middleware
 */
function createUploadMiddleware(folderName, filePrefix) {
  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '../../uploads', folderName);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename: {prefix}-{timestamp}-{random}.{ext}
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, filePrefix + '-' + uniqueSuffix + ext);
    }
  });

  // File filter - only allow images
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  };

  // Configure multer
  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: fileFilter
  });
}

/**
 * Create multer upload middleware yang support PDF + Image (untuk dokumen)
 */
function createDocumentUploadMiddleware(folderName, filePrefix) {
  const uploadDir = path.join(__dirname, '../../uploads', folderName);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, filePrefix + '-' + uniqueSuffix + ext);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMime = /image\/(jpeg|jpg|png)|application\/pdf/;
    const mimetype = allowedMime.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file JPG, PNG, atau PDF yang diperbolehkan'));
    }
  };

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter
  });
}

/**
 * Create multer upload middleware untuk file Excel (.xlsx / .xls)
 * Digunakan untuk import soal dan nilai secara bulk
 */
function createExcelUploadMiddleware() {
  // Simpan di memori (buffer), tidak perlu disimpan ke disk
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    const allowedExt = /\.(xlsx|xls)$/i;
    const allowedMime = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    const extOk  = allowedExt.test(path.extname(file.originalname));
    const mimeOk = allowedMime.includes(file.mimetype);

    if (extOk || mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file Excel (.xlsx atau .xls) yang diperbolehkan'));
    }
  };

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter,
  });
}

const uploadExcel = createExcelUploadMiddleware();

// Export specific upload middlewares
const uploadHero = createUploadMiddleware('hero', 'hero');
const uploadLogo = createUploadMiddleware('logo', 'logo');
const uploadFacility = createUploadMiddleware('facilities', 'facility');
const uploadExtracurricular = createUploadMiddleware('extracurriculars', 'extracurricular');
const uploadProgram = createUploadMiddleware('programs', 'program');
const uploadActivity = createUploadMiddleware('activities', 'activity');
const uploadAchievement = createUploadMiddleware('achievements', 'achievement');
const uploadArticle = createUploadMiddleware('articles', 'article');

// PPDB uploads
const uploadPpdbPhoto = createUploadMiddleware('ppdb/photos', 'photo');      // pas foto (image only)
const uploadPpdbDocs = createDocumentUploadMiddleware('ppdb/documents', 'doc'); // KK & ijazah (PDF/img)
const uploadPpdbAchievement = createDocumentUploadMiddleware('ppdb/achievements', 'prestasi'); // bukti prestasi

module.exports = {
  uploadHero,
  uploadLogo,
  uploadFacility,
  uploadExtracurricular,
  uploadProgram,
  uploadActivity,
  uploadAchievement,
  uploadArticle,
  uploadPpdbPhoto,
  uploadPpdbDocs,
  uploadPpdbAchievement,
  uploadExcel,
  createUploadMiddleware,
  createDocumentUploadMiddleware,
  createExcelUploadMiddleware,
};

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

// Export specific upload middlewares
const uploadHero = createUploadMiddleware('hero', 'hero');
const uploadLogo = createUploadMiddleware('logo', 'logo');
const uploadFacility = createUploadMiddleware('facilities', 'facility');
const uploadExtracurricular = createUploadMiddleware('extracurriculars', 'extracurricular');
const uploadProgram = createUploadMiddleware('programs', 'program');

module.exports = {
  uploadHero,
  uploadLogo,
  uploadFacility,
  uploadExtracurricular,
  uploadProgram,
  createUploadMiddleware
};

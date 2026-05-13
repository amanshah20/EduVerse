const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../uploads/${folder}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const allowed = allowedTypes || ['pdf', 'doc', 'docx', 'mp4', 'png', 'jpg', 'jpeg'];
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type not allowed. Allowed: ${allowed.join(', ')}`), false);
};

const uploadCourse = multer({
  storage: createStorage('courses'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: fileFilter(['pdf', 'doc', 'docx', 'mp4', 'png', 'jpg', 'jpeg'])
});

const uploadAssignment = multer({
  storage: createStorage('assignments'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter(['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip'])
});

const uploadProfile = multer({
  storage: createStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['png', 'jpg', 'jpeg'])
});

module.exports = { uploadCourse, uploadAssignment, uploadProfile };

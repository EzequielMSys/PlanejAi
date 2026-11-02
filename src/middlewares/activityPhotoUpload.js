const multer = require('multer');
const { MAX_BYTES } = require('../services/activityPhotoService');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1, fields: 0, parts: 1 } }).single('foto');

module.exports = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  upload(req, res, error => {
    if (!error) return next();
    res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'A foto preparada deve ter até 3 MB. Recorte uma questão por vez.' : 'Envie uma única foto no campo foto.' });
  });
};

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/perfis');
  },

  filename: (req, file, cb) => {
    const usuarioId = req.usuario?.id_usuario || req.usuario?.id || 'user';
    const ext = path.extname(file.originalname);
    const nomeArquivo = `perfil-${usuarioId}-${Date.now()}${ext}`;

    cb(null, nomeArquivo);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas.'), false);
  }
};

const uploadPerfil = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

module.exports = {
  uploadPerfil
};
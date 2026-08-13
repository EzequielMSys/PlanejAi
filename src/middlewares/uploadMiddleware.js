const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tipo = req.baseUrl?.includes('atividade') ? 'atividades' : 'perfis';
    cb(null, path.join('uploads', tipo));
  },

  filename: (req, file, cb) => {
    const usuarioId = req.usuario?.id_usuario || req.usuario?.id || 'user';
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const nomeArquivo = `${base}-${usuarioId}-${Date.now()}${ext}`;
    cb(null, nomeArquivo);
  }
});

const fileFilter = (req, file, cb) => {
  const permitidos = /jpeg|jpg|png|gif|webp|pdf|doc|docx|ppt|pptx|txt|mp4|webm/;
  const mimeOk = permitidos.test(file.mimetype);
  const extOk = permitidos.test(path.extname(file.originalname).toLowerCase());
  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido.'), false);
  }
};

const uploadGeral = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const uploadAtividade = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join('uploads', 'atividades')),
    filename: (req, file, cb) => {
      const usuarioId = req.usuario?.id_usuario || req.usuario?.id || 'user';
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
      cb(null, `atividade-${base}-${usuarioId}-${Date.now()}${ext}`);
    }
  }),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadMaterial = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join('uploads', 'materiais')),
    filename: (req, file, cb) => {
      const usuarioId = req.usuario?.id_usuario || req.usuario?.id || 'user';
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
      cb(null, `material-${base}-${usuarioId}-${Date.now()}${ext}`);
    }
  }),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  uploadPerfil: multer({ storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join('uploads', 'perfis')),
    filename: (req, file, cb) => {
      const usuarioId = req.usuario?.id_usuario || req.usuario?.id || 'user';
      const ext = path.extname(file.originalname);
      cb(null, `perfil-${usuarioId}-${Date.now()}${ext}`);
    }
  }), fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }),
  uploadAtividade,
  uploadMaterial,
  uploadGeral
};
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tipo = req.baseUrl?.includes("atividade") ? "atividades" : "perfis";
    cb(null, path.join("uploads", tipo));
  },

  filename: (req, file, cb) => {
    const usuarioId = req.usuario?.id_usuario || req.usuario?.id || "user";
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_");
    const nomeArquivo = `${base.slice(0, 80)}-${usuarioId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    cb(null, nomeArquivo);
  },
});

const allowedTypes = new Map([
  [".jpg", ["image/jpeg"]],
  [".jpeg", ["image/jpeg"]],
  [".png", ["image/png"]],
  [".gif", ["image/gif"]],
  [".webp", ["image/webp"]],
  [".pdf", ["application/pdf"]],
  [".doc", ["application/msword"]],
  [
    ".docx",
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ],
  [".ppt", ["application/vnd.ms-powerpoint"]],
  [
    ".pptx",
    [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  ],
  [".txt", ["text/plain"]],
  [".mp4", ["video/mp4"]],
  [".webm", ["video/webm"]],
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeTypes = allowedTypes.get(ext);
  if (mimeTypes?.includes(file.mimetype)) return cb(null, true);
  return cb(
    new Error("Tipo de arquivo não permitido ou extensão incompatível."),
    false,
  );
};

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") &&
    [".jpg", ".jpeg", ".png", ".webp"].includes(
      path.extname(file.originalname).toLowerCase(),
    )
  )
    return cb(null, true);
  return cb(new Error("A foto de perfil deve ser JPG, PNG ou WEBP."), false);
};

const uploadGeral = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadAtividade = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) =>
      cb(null, path.join("uploads", "atividades")),
    filename: (req, file, cb) => {
      const usuarioId = req.usuario?.id_usuario || req.usuario?.id || "user";
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_]/g, "_");
      cb(
        null,
        `atividade-${base.slice(0, 80)}-${usuarioId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`,
      );
    },
  }),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadMaterial = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join("uploads", "materiais")),
    filename: (req, file, cb) => {
      const usuarioId = req.usuario?.id_usuario || req.usuario?.id || "user";
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_]/g, "_");
      cb(
        null,
        `material-${base.slice(0, 80)}-${usuarioId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`,
      );
    },
  }),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  uploadPerfil: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join("uploads", "perfis")),
      filename: (req, file, cb) => {
        const usuarioId = req.usuario?.id_usuario || req.usuario?.id || "user";
        const ext = path.extname(file.originalname).toLowerCase();
        cb(
          null,
          `perfil-${usuarioId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`,
        );
      },
    }),
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  }),
  uploadAtividade,
  uploadMaterial,
  uploadGeral,
};

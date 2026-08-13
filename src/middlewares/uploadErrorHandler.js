const multer = require('multer');

function uploadErrorHandler(err, req, res, next) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Arquivo muito grande. O tamanho máximo permitido é 10MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Campo de arquivo inesperado. Use o campo "file" para envio.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Número máximo de arquivos excedido.' });
    }
    if (err.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({ message: 'Nome de campo inválido.' });
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({ message: 'Valor de campo muito longo.' });
    }
    if (err.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({ message: 'Número máximo de campos excedido.' });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({ message: 'Requisição multipart muito complexa.' });
    }
    if (err.code === 'MISSING_FIELD_NAME') {
      return res.status(400).json({ message: 'Campo de arquivo não informado.' });
    }
    if (err.code === 'MISSING_FILE') {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }
  }

  if (err.message && String(err.message).includes('Tipo de arquivo não permitido')) {
    return res.status(415).json({ message: err.message });
  }

  console.error('[UPLOAD ERROR]', err);
  return res.status(500).json({ message: 'Erro inesperado no upload. Tente novamente.' });
}

module.exports = uploadErrorHandler;
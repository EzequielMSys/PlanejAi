const { createFileToken, verifyFileToken, canAccessFile } = require('../services/fileAccessService')
const { enviarArquivoArmazenado } = require('../services/uploadStorageService')

async function sign(req, res) {
  try {
    if (!await canAccessFile(req.query.path, req.usuario)) {
      return res.status(403).json({ error: 'Você não tem acesso a este arquivo.' })
    }
    const token = createFileToken(req.query.path)
    return res.json({ url: `/api/files/open/${token}`, expires_in: 300 })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

async function open(req, res) {
  try {
    const { relative } = verifyFileToken(req.params.token)
    return await enviarArquivoArmazenado(req, res, relative)
  } catch (error) {
    return res.status(401).json({ error: error.message })
  }
}

module.exports = { sign, open }

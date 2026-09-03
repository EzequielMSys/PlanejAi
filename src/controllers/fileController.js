const fs = require('fs')
const { createFileToken, verifyFileToken, canAccessFile } = require('../services/fileAccessService')

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

function open(req, res) {
  try {
    const { absolute } = verifyFileToken(req.params.token)
    if (!fs.existsSync(absolute)) return res.status(404).json({ error: 'Arquivo não encontrado.' })
    res.setHeader('Cache-Control', 'private, max-age=240')
    return res.sendFile(absolute)
  } catch (error) {
    return res.status(401).json({ error: error.message })
  }
}

module.exports = { sign, open }

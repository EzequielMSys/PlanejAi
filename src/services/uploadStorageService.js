const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { Readable } = require('stream')

function usarBlobPrivado() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function nomeSeguro(file, categoria, userId) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  const base = path.basename(file.originalname || 'arquivo', ext)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 80) || 'arquivo'
  const prefixo = categoria === 'perfis' ? 'perfil' : categoria.slice(0, -1)
  return `${prefixo}-${base}-${userId || 'user'}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`
}

function caminhoRelativo(categoria, filename) {
  return `${categoria}/${filename}`.replaceAll('\\', '/')
}

async function armazenarArquivo(file, categoria, userId) {
  const filename = file.filename || nomeSeguro(file, categoria, userId)
  const relative = caminhoRelativo(categoria, filename)

  if (!usarBlobPrivado()) {
    return { filename, relative, url: `/uploads/${relative}` }
  }

  if (!file.buffer?.length) {
    const error = new Error('O armazenamento da Vercel exige o conteúdo do arquivo em memória.')
    error.status = 500
    throw error
  }

  const { put } = require('@vercel/blob')
  await put(`planejai/${relative}`, file.buffer, {
    access: 'private',
    addRandomSuffix: false,
    contentType: file.mimetype || 'application/octet-stream',
    cacheControlMaxAge: 0,
  })
  return { filename, relative, url: `/uploads/${relative}` }
}

async function enviarArquivoArmazenado(req, res, relative, { protegido = true } = {}) {
  if (!usarBlobPrivado()) {
    const absolute = path.resolve(__dirname, '..', '..', 'uploads', relative)
    if (!absolute.startsWith(`${path.resolve(__dirname, '..', '..', 'uploads')}${path.sep}`) || !fs.existsSync(absolute)) {
      return res.status(404).json({ error: 'Arquivo não encontrado.' })
    }
    res.setHeader('Cache-Control', protegido ? 'private, max-age=240' : 'public, max-age=86400')
    return res.sendFile(absolute)
  }

  const { get } = require('@vercel/blob')
  const result = await get(`planejai/${relative}`, {
    access: 'private',
    ifNoneMatch: req.headers['if-none-match'],
  })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' })
  }

  res.status(200)
  res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', protegido ? 'private, no-cache' : 'public, max-age=86400')
  if (result.blob.contentDisposition) res.setHeader('Content-Disposition', result.blob.contentDisposition)
  Readable.fromWeb(result.stream).on('error', () => res.destroy()).pipe(res)
  return undefined
}

module.exports = { usarBlobPrivado, nomeSeguro, armazenarArquivo, enviarArquivoArmazenado }

const crypto = require('crypto')
const path = require('path')
const { getJwtSecret } = require('../config/jwtConfig')

const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads')

function resolveUploadPath(value) {
  const relative = String(value || '').replace(/^[/\\]*uploads[/\\]/i, '').replaceAll('\\', '/')
  if (!relative || relative.startsWith('perfis/') || relative.includes('\0')) throw new Error('Arquivo protegido inválido.')
  const absolute = path.resolve(uploadsRoot, relative)
  if (!absolute.startsWith(`${uploadsRoot}${path.sep}`)) throw new Error('Caminho de arquivo inválido.')
  return { absolute, relative }
}

function signature(payload) {
  return crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('base64url')
}

function createFileToken(value, ttlSeconds = 300) {
  const { relative } = resolveUploadPath(value)
  const payload = Buffer.from(JSON.stringify({ path: relative, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url')
  return `${payload}.${signature(payload)}`
}

function verifyFileToken(token) {
  const [payload, provided] = String(token || '').split('.')
  if (!payload || !provided) throw new Error('Token de arquivo inválido.')
  const expected = signature(payload)
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Token de arquivo inválido.')
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) throw new Error('Token de arquivo expirado.')
  return resolveUploadPath(`/uploads/${data.path}`)
}

module.exports = { createFileToken, verifyFileToken, resolveUploadPath }

const crypto = require('crypto')
const path = require('path')
const { getJwtSecret } = require('../config/jwtConfig')
const pool = require('../config/db')

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

function parseJson(value) {
  if (Array.isArray(value)) return value
  try { return JSON.parse(value || '[]') } catch { return [] }
}

function containsFile(items, relative) {
  const expected = `/uploads/${relative}`.replaceAll('\\', '/')
  return parseJson(items).some((item) => {
    const value = typeof item === 'string' ? item : item?.url
    return String(value || '').replaceAll('\\', '/') === expected
  })
}

async function canAccessFile(value, user) {
  const { relative } = resolveUploadPath(value)
  const userId = user?.id_usuario || user?.id
  const type = user?.tipo
  if (!userId) return false

  if (relative.startsWith('atividades/')) {
    const [rows] = await pool.execute(
      `SELECT id_atividade, criado_por, status, atribuicao, destinatarios, anexos
       FROM atividades WHERE anexos IS NOT NULL`
    )
    const activity = rows.find((row) => containsFile(row.anexos, relative))
    if (!activity) return false
    if (['dono', 'admin', 'adm'].includes(type)) return true
    if (type === 'docente') return Number(activity.criado_por) === Number(userId)
    if (activity.status !== 'PUBLICADA') return false
    if (!activity.atribuicao || activity.atribuicao === 'TODOS') return true
    return parseJson(activity.destinatarios).map(String).includes(String(userId))
  }

  if (relative.startsWith('materiais/')) {
    if (['dono', 'admin', 'adm', 'docente'].includes(type)) return true
    const [rows] = await pool.execute(
      `SELECT c.materiais
       FROM conteudos c
       INNER JOIN cronograma_conteudos cc ON cc.id_conteudo = c.id_conteudo
       INNER JOIN cronograma_dias cd ON cd.id_dia = cc.id_dia
       INNER JOIN cronogramas cr ON cr.id_cronograma = cd.id_cronograma
       INNER JOIN perfil_estudo p ON p.id_perfil = cr.id_perfil
       WHERE p.id_usuario = ? AND c.materiais IS NOT NULL`,
      [userId]
    )
    return rows.some((row) => containsFile(row.materiais, relative))
  }

  return false
}

module.exports = { createFileToken, verifyFileToken, resolveUploadPath, canAccessFile }

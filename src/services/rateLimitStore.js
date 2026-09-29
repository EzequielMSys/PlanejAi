const crypto = require('crypto')
const pool = require('../config/db')

function hash(value) {
  return crypto.createHash('sha256').update(`${process.env.AUDIT_HASH_SALT || 'planejai-local'}:${value}`).digest('hex')
}

async function consume(scope, value, windowMs) {
  const startedAt = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  const key = hash(value)
  await pool.execute(
    `INSERT INTO limites_requisicao (escopo, chave_hash, janela_inicio, tentativas)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE tentativas = tentativas + 1`,
    [scope, key, startedAt]
  )
  const [[record]] = await pool.execute(
    'SELECT tentativas FROM limites_requisicao WHERE escopo=? AND chave_hash=? AND janela_inicio=?',
    [scope, key, startedAt]
  )
  return Number(record?.tentativas || 1)
}

function cleanup() {
  return pool.execute('DELETE FROM limites_requisicao WHERE janela_inicio < DATE_SUB(NOW(), INTERVAL 2 DAY)')
}

module.exports = { consume, cleanup }

const pool = require('../config/db')
const { executeUsage, pendingActivityFor, recentUsageStart } = require('../services/accountUsageService')

let bannerColumnAvailable = true

function semColunaBanner(sql) {
  return sql
    .replace(/,\s*banner_url\s*,/g, ',')
    .replace(/,\s*banner_url\b/g, '')
}

async function selectUsuario(sql, params) {
  try {
    return await pool.execute(bannerColumnAvailable ? sql : semColunaBanner(sql), params)
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR' || !/banner_url/i.test(error.message)) throw error
    // A publicação da API pode preceder a migração do banco. Nesse intervalo,
    // login e leitura do perfil continuam funcionando sem o banner.
    bannerColumnAvailable = false
    return pool.execute(semColunaBanner(sql), params)
  }
}

async function garantirColunaBanner() {
  if (bannerColumnAvailable) {
    try {
      await pool.query('SELECT banner_url FROM usuarios LIMIT 0')
      return
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR' || !/banner_url/i.test(error.message)) throw error
    }
  }
  try {
    await pool.query('ALTER TABLE usuarios ADD COLUMN banner_url TEXT NULL')
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error
  }
  bannerColumnAvailable = true
}

async function criarUsuario({
  nome,
  email,
  senhaHash,
  tipo = 'aluno',
  senha_temporaria = 1,
  ativo = 1
}) {
  const [result] = await pool.execute(
    `INSERT INTO usuarios 
      (nome, email, senha, tipo, senha_temporaria, ativo) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nome, email, senhaHash, tipo, senha_temporaria, ativo]
  )

  // Confirma a persistência no MySQL antes de informar sucesso à camada HTTP.
  const usuarioPersistido = await buscarPorId(result.insertId)
  if (!usuarioPersistido) {
    throw new Error('Usuário não foi confirmado no banco de dados.')
  }

  return usuarioPersistido
}

async function buscarPorEmail(email) {
  const [rows] = await selectUsuario(
    `SELECT 
      id_usuario AS id,
      id_usuario,
      nome,
      email,
      senha,
      tipo,
      ativo,
      senha_temporaria,
      versao_sessao,
      ultimo_login,
      atualizado_em,
      apelido,
      foto_url,
      banner_url,
      pronome
    FROM usuarios
    WHERE email = ?`,
    [email]
  )

  return rows[0] || null
}

async function buscarPorEmailSimples(email) {
  const [rows] = await pool.execute(
    `SELECT 
      id_usuario AS id,
      id_usuario,
      nome,
      email,
      tipo,
      data_cadastro,
      ativo,
      apelido,
      foto_url
    FROM usuarios
    WHERE email = ?`,
    [email]
  )

  return rows[0] || null
}

async function buscarPorIdCompleto(id) {
  const [rows] = await selectUsuario(
    `SELECT 
      id_usuario AS id,
      id_usuario,
      nome,
      email,
      senha,
      tipo,
      data_cadastro,
      ativo,
      senha_temporaria,
      versao_sessao,
      ultimo_login,
      atualizado_em,
      apelido,
      foto_url,
      banner_url,
      pronome
    FROM usuarios
    WHERE id_usuario = ?`,
    [id]
  )

  return rows[0] || null
}

async function buscarPorId(id) {
  const [rows] = await selectUsuario(
    `SELECT 
      id_usuario AS id,
      id_usuario,
      nome,
      email,
      tipo,
      data_cadastro,
      ativo,
      senha_temporaria,
      versao_sessao,
      ultimo_login,
      atualizado_em,
      apelido,
      foto_url,
      banner_url,
      pronome
    FROM usuarios
    WHERE id_usuario = ?`,
    [id]
  )

  return rows[0] || null
}

async function listarUsuarios({ page = 1, limit = 10, search = '', tipo = '', acompanhamento = '', requester = '' } = {}) {
  const safePage = Number.isSafeInteger(Number(page)) && Number(page) > 0 ? Math.min(Number(page), 1000000) : 1
  const safeLimit = Number.isSafeInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 10
  const offset = (safePage - 1) * safeLimit
  const where = []
  const values = []

  if (search) {
    where.push('(nome LIKE ? OR email LIKE ?)')
    const term = `%${String(search).trim().slice(0, 100)}%`
    values.push(term, term)
  }
  if (['dono', 'admin', 'docente', 'aluno'].includes(tipo)) {
    where.push('tipo = ?')
    values.push(tipo)
  }
  if (acompanhamento === 'atrasadas') {
    where.push(`tipo = 'aluno' AND EXISTS (
      SELECT 1 FROM atividades a WHERE a.prazo < CURRENT_TIMESTAMP AND ${pendingActivityFor('usuarios.id_usuario')}
    )`)
  }
  if (acompanhamento === 'sem-uso') {
    if (requester !== 'dono') where.push("tipo = 'aluno'")
    where.push(`ativo = 1 AND DATE(data_cadastro) <= ?
      AND EXISTS (SELECT 1 FROM uso_diario_conta WHERE dia <= ?)
      AND NOT EXISTS (SELECT 1 FROM uso_diario_conta uso WHERE uso.id_usuario = usuarios.id_usuario AND uso.dia >= ?)`)
    const since = recentUsageStart()
    values.push(since, since, since)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const countSql = `SELECT COUNT(*) AS total FROM usuarios ${whereSql}`
  const [[count]] = acompanhamento === 'sem-uso'
    ? await executeUsage(pool, countSql, values)
    : await pool.execute(countSql, values)
  const [[stats]] = await pool.query(`SELECT
    COUNT(*) AS total,
    SUM(ativo = 1) AS ativos,
    SUM(tipo = 'aluno') AS alunos,
    SUM(tipo IN ('admin', 'adm')) AS admins,
    SUM(ativo = 0) AS inativos,
    SUM(tipo = 'docente') AS docentes,
    SUM(tipo = 'dono') AS donos
    FROM usuarios`)
  // MySQL 8.4 rejeita os parâmetros numéricos DOUBLE de execute em LIMIT.
  const [rows] = await pool.query(
    `SELECT 
      id_usuario AS id,
      id_usuario,
      nome,
      email,
      tipo,
      data_cadastro,
      ativo,
      senha_temporaria,
      ultimo_login,
      atualizado_em,
      apelido,
      foto_url
    FROM usuarios
    ${whereSql}
    ORDER BY nome, id_usuario
    LIMIT ? OFFSET ?`,
    [...values, safeLimit, offset]
  )

  const total = Number(count.total || 0)
  return {
    usuarios: rows,
    pagina: safePage,
    limite: safeLimit,
    total_registros: total,
    total_paginas: Math.max(1, Math.ceil(total / safeLimit)),
    stats: Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [key, Number(value || 0)])
    )
  }
}

async function atualizarUsuario(id, dados) {
  if (dados.banner_url !== undefined) await garantirColunaBanner()
  const camposPermitidos = ['nome', 'email', 'tipo', 'apelido', 'foto_url', 'banner_url', 'pronome']
  const campos = []
  const valores = []

  for (const campo of camposPermitidos) {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`)
      valores.push(dados[campo] === '' ? null : dados[campo])
    }
  }

  if (campos.length === 0) {
    return buscarPorId(id)
  }

  campos.push('atualizado_em = CURRENT_TIMESTAMP')
  valores.push(id)

  await pool.execute(
    `UPDATE usuarios 
     SET ${campos.join(', ')}
     WHERE id_usuario = ?`,
    valores
  )

  return buscarPorId(id)
}

async function ativarDesativarUsuario(id, ativo) {
  await pool.execute(
    `UPDATE usuarios 
     SET ativo = ?, atualizado_em = CURRENT_TIMESTAMP 
     WHERE id_usuario = ?`,
    [ativo, id]
  )

  return buscarPorId(id)
}

async function atualizarUltimoLogin(id) {
  await pool.execute(
    `UPDATE usuarios 
     SET ultimo_login = CURRENT_TIMESTAMP 
     WHERE id_usuario = ?`,
    [id]
  )
}

async function resetarSenhaTemporaria(id, senhaHash) {
  await pool.execute(
    `UPDATE usuarios
     SET senha = ?,
         senha_temporaria = 1,
         token_recuperacao = NULL,
         token_expiracao = NULL,
         versao_sessao = versao_sessao + 1,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE id_usuario = ?`,
    [senhaHash, id]
  )

  return buscarPorId(id)
}

async function definirSenhaUsuario(id, senhaHash) {
  await pool.execute(
    `UPDATE usuarios
     SET senha = ?,
         senha_temporaria = 0,
         token_recuperacao = NULL,
         token_expiracao = NULL,
         versao_sessao = versao_sessao + 1,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE id_usuario = ?`,
    [senhaHash, id]
  )

  return buscarPorId(id)
}

async function trocarSenha(id, senhaHash) {
  await pool.execute(
    `UPDATE usuarios
     SET senha = ?,
         senha_temporaria = 0,
         versao_sessao = versao_sessao + 1,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE id_usuario = ?`,
    [senhaHash, id]
  )

  return buscarPorId(id)
}

async function alterarSenha(id, senhaHash) {
  await pool.execute(
    `UPDATE usuarios
     SET senha = ?,
         versao_sessao = versao_sessao + 1,
         atualizado_em = CURRENT_TIMESTAMP
     WHERE id_usuario = ?`,
    [senhaHash, id]
  )

  return buscarPorId(id)
}

async function salvarTokenRecuperacao(id, tokenHash, expiracao) {
  await pool.execute(
    `UPDATE usuarios SET token_recuperacao = ?, token_expiracao = ?, atualizado_em = CURRENT_TIMESTAMP
     WHERE id_usuario = ?`,
    [tokenHash, expiracao, id]
  )
}

async function buscarPorTokenRecuperacao(tokenHash) {
  const [rows] = await pool.execute(
    `SELECT id_usuario AS id, id_usuario, email, ativo FROM usuarios
     WHERE token_recuperacao = ? AND token_expiracao > CURRENT_TIMESTAMP LIMIT 1`,
    [tokenHash]
  )
  return rows[0] || null
}

async function redefinirSenhaComToken(id, tokenHash, senhaHash) {
  const [result] = await pool.execute(
    `UPDATE usuarios SET senha = ?, senha_temporaria = 0,versao_sessao = versao_sessao + 1, token_recuperacao = NULL,
       token_expiracao = NULL, atualizado_em = CURRENT_TIMESTAMP
     WHERE id_usuario = ? AND token_recuperacao = ? AND token_expiracao > CURRENT_TIMESTAMP`,
    [senhaHash, id, tokenHash]
  )
  return result.affectedRows === 1
}

module.exports = {
  criarUsuario,
  buscarPorEmail,
  buscarPorEmailSimples,
  buscarPorId,
  buscarPorIdCompleto,
  listarUsuarios,
  atualizarUsuario,
  ativarDesativarUsuario,
  atualizarUltimoLogin,
  resetarSenhaTemporaria,
  definirSenhaUsuario,
  trocarSenha,
  alterarSenha,
  salvarTokenRecuperacao,
  buscarPorTokenRecuperacao,
  redefinirSenhaComToken
}

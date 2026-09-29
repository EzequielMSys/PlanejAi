const pool = require('../config/db')

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
  const [rows] = await pool.execute(
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
      foto_url
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
  const [rows] = await pool.execute(
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
      foto_url
    FROM usuarios
    WHERE id_usuario = ?`,
    [id]
  )

  return rows[0] || null
}

async function buscarPorId(id) {
  const [rows] = await pool.execute(
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
      foto_url
    FROM usuarios
    WHERE id_usuario = ?`,
    [id]
  )

  return rows[0] || null
}

async function listarUsuarios({ page = 1, limit = 10, search = '', tipo = '' } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10))
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
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const [[count]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM usuarios ${whereSql}`,
    values
  )
  const [[stats]] = await pool.query(`SELECT
    COUNT(*) AS total,
    SUM(ativo = 1) AS ativos,
    SUM(tipo = 'aluno') AS alunos,
    SUM(tipo = 'admin') AS admins
    FROM usuarios`)
  const [rows] = await pool.execute(
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
  const camposPermitidos = ['nome', 'email', 'tipo', 'apelido', 'foto_url']
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
    `UPDATE usuarios SET senha = ?, senha_temporaria = 0, versao_sessao = versao_sessao + 1, token_recuperacao = NULL,
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

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

  return {
    id: result.insertId,
    id_usuario: result.insertId,
    nome,
    email,
    tipo,
    senha_temporaria,
    ativo
  }
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

async function listarUsuarios() {
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
    ORDER BY nome`
  )

  return rows
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
         atualizado_em = CURRENT_TIMESTAMP 
     WHERE id_usuario = ?`,
    [senhaHash, id]
  )

  return buscarPorId(id)
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
  alterarSenha
}
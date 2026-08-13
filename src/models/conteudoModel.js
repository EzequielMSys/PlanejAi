const pool = require('../config/db');

/**
 * Cria um novo conteúdo
 */
async function criarConteudo({ area, disciplina, titulo, tipo, link = null, nivel }) {
  const [result] = await pool.execute(
    `INSERT INTO conteudos (area, disciplina, titulo, tipo, link, nivel)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [area, disciplina, titulo, tipo, link, nivel]
  );
  return {
    id_conteudo: result.insertId,
    area,
    disciplina,
    titulo,
    tipo,
    link,
    nivel
  };
}

/**
 * Obtém conteúdo por ID
 */
async function obterConteudoPorId(idConteudo) {
  const [rows] = await pool.execute(
    'SELECT * FROM conteudos WHERE id_conteudo = ?',
    [idConteudo]
  );
  return rows[0];
}

/**
 * Lista conteúdos por disciplina
 */
async function listarPorDisciplina(disciplina) {
  const [rows] = await pool.execute(
    'SELECT * FROM conteudos WHERE disciplina = ? ORDER BY titulo ASC',
    [disciplina]
  );
  return rows;
}

/**
 * Lista conteúdos por área
 */
async function listarPorArea(area) {
  const [rows] = await pool.execute(
    'SELECT * FROM conteudos WHERE area = ? ORDER BY disciplina ASC, titulo ASC',
    [area]
  );
  return rows;
}

/**
 * Lista conteúdos por nível
 */
async function listarPorNivel(nivel) {
  const [rows] = await pool.execute(
    'SELECT * FROM conteudos WHERE nivel = ? ORDER BY area ASC, disciplina ASC',
    [nivel]
  );
  return rows;
}

/**
 * Busca conteúdos por disciplina e nível (para gerador de cronograma)
 */
async function buscarRelevantes(termo, nivel = null) {
  let query = `
    SELECT * FROM conteudos
    WHERE (
      disciplina LIKE ?
      OR area LIKE ?
      OR titulo LIKE ?
    )
  `

  const termoBusca = `%${termo}%`
  const params = [termoBusca, termoBusca, termoBusca]

  if (nivel) {
    query += ' AND nivel = ?'
    params.push(nivel)
  }

  query += ' ORDER BY id_conteudo ASC'

  const [rows] = await pool.execute(query, params)
  return rows
}

/**
 * Lista todos os conteúdos
 */
async function listarTodos() {
  const [rows] = await pool.execute(
    'SELECT * FROM conteudos ORDER BY area ASC, disciplina ASC, titulo ASC'
  );
  return rows;
}

/**
 * Atualiza conteúdo
 */
async function atualizarConteudo(idConteudo, dados) {
  const { area, disciplina, titulo, tipo, link, nivel, materiais = [], atualizado_por = null } = dados;
  await pool.execute(
    `UPDATE conteudos 
     SET area = ?, disciplina = ?, titulo = ?, tipo = ?, link = ?, nivel = ?, materiais = ?, atualizado_por = ?
     WHERE id_conteudo = ?`,
    [area, disciplina, titulo, tipo, link || null, nivel, JSON.stringify(materiais), atualizado_por, idConteudo]
  );
  return { id_conteudo: idConteudo, ...dados };
}

/**
 * Deleta conteúdo
 */
async function deletarConteudo(idConteudo) {
  await pool.execute(
    'DELETE FROM conteudos WHERE id_conteudo = ?',
    [idConteudo]
  );
}

module.exports = {
  criarConteudo,
  obterConteudoPorId,
  listarPorDisciplina,
  listarPorArea,
  listarPorNivel,
  buscarRelevantes,
  listarTodos,
  atualizarConteudo,
  deletarConteudo
};

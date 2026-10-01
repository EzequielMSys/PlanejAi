const pool = require('../config/db');

async function criarAviso({ titulo, mensagem, criadoPor, destinatarios = 'todos', idTurma = null }) {
  // Aviso de turma sempre vale para todos daquela turma: `destinatarios` fica
  // neutro para não fazer o filtro de papel esconder a mensagem dos próprios
  // alunos. Aviso sem turma mantém o comportamento antigo por destinatário.
  const grupo = idTurma ? 'todos' : destinatarios;
  const [result] = await pool.execute(
    `INSERT INTO avisos (titulo, mensagem, criado_por, destinatarios, id_turma)
     VALUES (?, ?, ?, ?, ?)`,
    [titulo, mensagem, criadoPor, grupo, idTurma || null]
  );
  return obterPorId(result.insertId);
}

async function obterPorId(idAviso) {
  const [rows] = await pool.execute('SELECT * FROM avisos WHERE id_aviso = ?', [idAviso]);
  return rows[0] || null;
}

// Um aluno enxerga: avisos globais destinados a ele e os avisos das turmas em
// que participa. Sem o segundo grupo, a aba "Avisos" da turma e a tela global
// mostrariam conteúdos diferentes para a mesma pessoa.
async function listarAvisos(tipoUsuario, limit = 50, idUsuario = null) {
  const grupos = tipoUsuario === 'aluno'
    ? ['todos', 'alunos']
    : tipoUsuario === 'docente'
      ? ['todos', 'docentes']
      : ['todos', 'alunos', 'docentes']
  const daTurma = tipoUsuario === 'aluno' && idUsuario
    ? 'OR (a.id_turma IS NOT NULL AND EXISTS (SELECT 1 FROM turma_alunos m WHERE m.id_turma=a.id_turma AND m.id_aluno=? AND m.ativo=1))'
    : ''
  const params = daTurma ? [idUsuario, ...grupos, limit] : [...grupos, limit]
  const [rows] = await pool.execute(
    `SELECT a.*, u.nome AS criador_nome FROM avisos a
     LEFT JOIN usuarios u ON u.id_usuario = a.criado_por
     WHERE (a.destinatarios IN (${grupos.map(() => '?').join(',')}) ${daTurma})
     ORDER BY a.criado_em DESC LIMIT ?`,
    params
  );
  return rows;
}

async function deletarAviso(idAviso) {
  await pool.execute('DELETE FROM avisos WHERE id_aviso = ?', [idAviso]);
}

module.exports = {
  criarAviso,
  obterPorId,
  listarAvisos,
  deletarAviso
};

const pool = require('../config/db')

const directTables = [
  'respostas_usuario', 'redacoes', 'sessoes_estudo', 'metas_semanais_estudo',
  'tentativas_questoes', 'revisoes_estudo', 'caderno_erros', 'redacao_versoes',
  'diagnosticos_estudo', 'metas_por_materia', 'privacidade_aprendizagem',
  'flashcards_estudo', 'provas_planejadas', 'checkins_estudo', 'rotinas_estudo',
  'missoes_estudo', 'dominio_competencias'
]

async function safeRows(sql, params) {
  try { const [rows] = await pool.execute(sql, params); return rows } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR') return []
    throw error
  }
}

async function exportUserData(userId) {
  const [profile] = await safeRows('SELECT id_usuario, nome, email, tipo, data_cadastro, ativo, ultimo_login, apelido, foto_url FROM usuarios WHERE id_usuario = ?', [userId])
  const data = { generated_at: new Date().toISOString(), user: profile || null, records: {} }
  for (const table of directTables) data.records[table] = await safeRows(`SELECT * FROM \`${table}\` WHERE id_usuario = ?`, [userId])
  data.records.perfil_estudo = await safeRows('SELECT * FROM perfil_estudo WHERE id_usuario = ?', [userId])
  data.records.cronogramas = await safeRows('SELECT c.* FROM cronogramas c JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.turmas = await safeRows('SELECT t.id_turma, t.nome, t.ano_letivo, ta.matriculado_em, ta.ativo FROM turma_alunos ta JOIN turmas t ON t.id_turma = ta.id_turma WHERE ta.id_aluno = ?', [userId])
  return data
}

module.exports = { exportUserData }

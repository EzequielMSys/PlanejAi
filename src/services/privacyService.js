const pool = require('../config/db')

const directTables = [
  'respostas_usuario', 'redacoes', 'sessoes_estudo', 'metas_semanais_estudo',
  'tentativas_questoes', 'revisoes_estudo', 'caderno_erros', 'redacao_versoes',
  'diagnosticos_estudo', 'metas_por_materia', 'privacidade_aprendizagem',
  'flashcards_estudo', 'provas_planejadas', 'checkins_estudo', 'rotinas_estudo',
  'missoes_estudo', 'dominio_competencias', 'mensagens_chat_ia', 'suporte_solicitacoes',
  'anotacoes_estudo', 'estudo_em_andamento', 'diario_aprendizagem', 'diario_passos', 'diario_lumi_uso', 'fechamentos_estudo', 'mesa_estudo',
  'leitura_destaques', 'lumi_conversas'
]

async function safeRows(sql, params) {
  try { const [rows] = await pool.execute(sql, params); return rows } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR') return []
    throw error
  }
}

async function exportUserData(userId) {
  const [profile] = await safeRows('SELECT id_usuario, nome, email, tipo, data_cadastro, ativo, ultimo_login, apelido, foto_url, pronome FROM usuarios WHERE id_usuario = ?', [userId])
  const data = { generated_at: new Date().toISOString(), user: profile || null, records: {} }
  for (const table of directTables) data.records[table] = await safeRows(`SELECT * FROM \`${table}\` WHERE id_usuario = ?`, [userId])
  data.records.perfil_estudo = await safeRows('SELECT * FROM perfil_estudo WHERE id_usuario = ?', [userId])
  data.records.cronogramas = await safeRows('SELECT c.* FROM cronogramas c JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.disponibilidade = await safeRows('SELECT d.* FROM disponibilidade_semana d JOIN perfil_estudo p ON p.id_perfil = d.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.cronograma_dias = await safeRows('SELECT d.* FROM cronograma_dias d JOIN cronogramas c ON c.id_cronograma = d.id_cronograma JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.cronograma_conteudos = await safeRows('SELECT cc.* FROM cronograma_conteudos cc JOIN cronograma_dias d ON d.id_dia = cc.id_dia JOIN cronogramas c ON c.id_cronograma = d.id_cronograma JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.turmas = await safeRows('SELECT t.id_turma, t.nome, t.ano_letivo, ta.matriculado_em, ta.ativo FROM turma_alunos ta JOIN turmas t ON t.id_turma = ta.id_turma WHERE ta.id_aluno = ?', [userId])
  return data
}

module.exports = { exportUserData }

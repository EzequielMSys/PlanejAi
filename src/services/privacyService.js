const pool = require('../config/db')

const directTables = [
  'respostas_usuario', 'redacoes', 'sessoes_estudo', 'metas_semanais_estudo',
  'tentativas_questoes', 'revisoes_estudo', 'caderno_erros', 'redacao_versoes',
  'diagnosticos_estudo', 'metas_por_materia', 'privacidade_aprendizagem',
  'flashcards_estudo', 'provas_planejadas', 'checkins_estudo', 'rotinas_estudo',
  'missoes_estudo', 'dominio_competencias', 'mensagens_chat_ia', 'suporte_solicitacoes',
  'anotacoes_estudo', 'estudo_em_andamento', 'diario_aprendizagem', 'diario_passos', 'diario_lumi_uso', 'fechamentos_estudo', 'mesa_estudo',
  'leitura_destaques', 'lumi_conversas', 'revisoes_destaques', 'flashcard_revisoes',
  'flashcard_colecoes', 'flashcard_colecao_itens', 'percursos_estudo',
  'uso_diario_conta', 'sessoes_guiadas', 'simulados_catalogo', 'projetos_redacao',
  'cronograma_avaliacoes', 'trilhas_aprendizagem'
]

async function safeRows(sql, params, unavailable) {
  try { const [rows] = await pool.execute(sql, params); return rows } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR') {
      unavailable.push(sql.match(/(?:FROM|JOIN)\s+`?([a-z_]+)`?/i)?.[1] || 'unknown')
      return []
    }
    throw error
  }
}

async function exportUserData(userId) {
  const unavailable = []
  const read = (sql, params) => safeRows(sql, params, unavailable)
  const [profile] = await read('SELECT id_usuario, nome, email, tipo, data_cadastro, ativo, ultimo_login, apelido, foto_url, banner_url, pronome FROM usuarios WHERE id_usuario = ?', [userId])
  const data = { generated_at: new Date().toISOString(), user: profile || null, records: {}, unavailable_sections: unavailable }
  for (const table of directTables) data.records[table] = await read(`SELECT * FROM \`${table}\` WHERE id_usuario = ?`, [userId])
  data.records.perfil_estudo = await read('SELECT * FROM perfil_estudo WHERE id_usuario = ?', [userId])
  data.records.cronogramas = await read('SELECT c.* FROM cronogramas c JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.disponibilidade = await read('SELECT d.* FROM disponibilidade_semana d JOIN perfil_estudo p ON p.id_perfil = d.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.cronograma_dias = await read('SELECT d.* FROM cronograma_dias d JOIN cronogramas c ON c.id_cronograma = d.id_cronograma JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.cronograma_conteudos = await read('SELECT cc.* FROM cronograma_conteudos cc JOIN cronograma_dias d ON d.id_dia = cc.id_dia JOIN cronogramas c ON c.id_cronograma = d.id_cronograma JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [userId])
  data.records.turmas = await read('SELECT t.id_turma, t.nome, t.ano_letivo, ta.matriculado_em, ta.ativo FROM turma_alunos ta JOIN turmas t ON t.id_turma = ta.id_turma WHERE ta.id_aluno = ?', [userId])
  data.records.suporte_contexto = await read('SELECT f.id_solicitacao, f.tipo, f.pagina, f.detalhes, f.captura_mime, TO_BASE64(f.captura) AS captura_base64 FROM suporte_contexto f JOIN suporte_solicitacoes s ON s.id = f.id_solicitacao WHERE s.id_usuario = ?', [userId])
  data.records.trilha_etapas = await read('SELECT e.* FROM trilha_etapas e JOIN trilhas_aprendizagem t ON t.id_trilha = e.id_trilha WHERE t.id_usuario = ?', [userId])
  data.records.cronograma_avaliacao_respostas = await read('SELECT r.* FROM cronograma_avaliacao_respostas r JOIN cronograma_avaliacoes a ON a.id_avaliacao = r.id_avaliacao WHERE a.id_usuario = ?', [userId])
  return data
}

module.exports = { exportUserData }

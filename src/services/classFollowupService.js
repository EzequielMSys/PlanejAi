const pool = require('../config/db')
const { executeUsage, pendingActivityFor, publishedActivityFor, recentUsageStart } = require('./accountUsageService')

async function priority(studentId) {
  const [[activity]] = await pool.execute(`
    SELECT a.id_atividade, COALESCE(a.titulo, a.pergunta) AS titulo, a.prazo,
      COALESCE(c.disciplina, (SELECT MIN(td.disciplina) FROM turma_disciplinas td
        WHERE td.id_turma = a.id_turma HAVING COUNT(*) = 1)) AS disciplina,
      t.nome AS turma, IF(a.prazo < CURRENT_TIMESTAMP, 1, 0) AS atrasada
    FROM atividades a
    JOIN usuarios u ON u.id_usuario = ? AND u.ativo = 1 AND u.tipo = 'aluno'
    LEFT JOIN conteudos c ON c.id_conteudo = a.id_conteudo
    LEFT JOIN turmas t ON t.id_turma = a.id_turma
    WHERE ${pendingActivityFor('u.id_usuario')}
    ORDER BY a.prazo IS NULL, a.prazo, a.id_atividade
    LIMIT 1`, [studentId])
  return activity || null
}

async function canManage(classId, requesterId, role) {
  const [[allowed]] = await pool.execute(`
    SELECT t.id_turma FROM turmas t
    WHERE t.id_turma = ? AND t.ativa = 1 AND (? IN ('dono','admin','adm') OR EXISTS (
      SELECT 1 FROM turma_docentes d WHERE d.id_turma = t.id_turma AND d.id_docente = ?
    ))`, [classId, role, requesterId])
  return Boolean(allowed)
}

async function overview(classId, requesterId, role) {
  if (!await canManage(classId, requesterId, role)) return null

  const since = recentUsageStart()
  const [students] = await executeUsage(pool, `
    SELECT u.id_usuario, u.nome,
      (SELECT COUNT(*) FROM atividades a WHERE a.id_turma = ta.id_turma
        AND ${publishedActivityFor('u.id_usuario')} AND EXISTS (
          SELECT 1 FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade
            AND r.id_usuario = u.id_usuario AND r.status IN ('ENTREGUE','CORRIGIDA')
        )) AS entregues,
      (SELECT COUNT(*) FROM atividades a WHERE a.id_turma = ta.id_turma
        AND a.prazo < CURRENT_TIMESTAMP AND ${pendingActivityFor('u.id_usuario')}) AS atrasadas,
      CASE WHEN DATE(u.data_cadastro) <= ? AND DATE(ta.matriculado_em) <= ?
        AND EXISTS (SELECT 1 FROM uso_diario_conta WHERE dia <= ?)
        THEN NOT EXISTS (SELECT 1 FROM uso_diario_conta uso WHERE uso.id_usuario = u.id_usuario AND uso.dia >= ?)
        ELSE NULL END AS sem_uso
    FROM turma_alunos ta JOIN usuarios u ON u.id_usuario = ta.id_aluno
    WHERE ta.id_turma = ? AND ta.ativo = 1 AND u.ativo = 1 AND u.tipo = 'aluno'
    ORDER BY u.nome, u.id_usuario`, [since, since, since, since, classId])
  return { desde: since, alunos: students }
}

module.exports = { priority, overview, canManage }

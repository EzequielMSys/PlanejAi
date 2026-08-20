const pool = require('../config/db')
const { garantirBancoQuestoes } = require('./aprendizagemModel')
const { embaralharQuestao, embaralharQuestaoComOrdem, validarEmbaralhamento } = require('../utils/questionShuffle')

function desserializar(row) {
  return { ...row, alternativas: typeof row.alternativas === 'string' ? JSON.parse(row.alternativas) : row.alternativas }
}

async function obterCronogramaDoUsuario(idCronograma, idUsuario) {
  const [rows] = await pool.execute(
    `SELECT c.* FROM cronogramas c JOIN perfil_estudo p ON p.id_perfil = c.id_perfil
     WHERE c.id_cronograma = ? AND p.id_usuario = ?`, [idCronograma, idUsuario]
  )
  return rows[0] || null
}

async function obterDiaDoUsuario(idDia, idUsuario) {
  const [rows] = await pool.execute(
    `SELECT d.*, c.id_cronograma FROM cronograma_dias d
     JOIN cronogramas c ON c.id_cronograma = d.id_cronograma
     JOIN perfil_estudo p ON p.id_perfil = c.id_perfil
     WHERE d.id_dia = ? AND p.id_usuario = ?`, [idDia, idUsuario]
  )
  return rows[0] || null
}

async function disciplinasDoCronograma(idCronograma, idDia = null) {
  const params = [idCronograma]
  let filtro = ''
  if (idDia) { filtro = ' AND d.id_dia = ?'; params.push(idDia) }
  const [rows] = await pool.execute(
    `SELECT DISTINCT c.disciplina FROM cronograma_conteudos cc
     JOIN cronograma_dias d ON d.id_dia = cc.id_dia JOIN conteudos c ON c.id_conteudo = cc.id_conteudo
     WHERE d.id_cronograma = ?${filtro}`, params
  )
  return rows.map((row) => row.disciplina).filter(Boolean)
}

async function selecionarQuestoes(disciplinas, quantidade) {
  await garantirBancoQuestoes()
  if (!disciplinas.length) throw new Error('Este cronograma não possui conteúdos avaliáveis.')
  const placeholders = disciplinas.map(() => '?').join(',')
  const [rows] = await pool.execute(
    `SELECT * FROM questoes_estudo WHERE ativo = 1 AND disciplina IN (${placeholders})
     ORDER BY CASE dificuldade WHEN 'DIFICIL' THEN 0 WHEN 'MEDIA' THEN 1 ELSE 2 END, RAND() LIMIT ?`,
    [...disciplinas, quantidade]
  )
  if (rows.length < quantidade) throw new Error(`Ainda não há ${quantidade} questões disponíveis para as matérias deste cronograma.`)
  return rows
}

function questaoPublica(row) {
  return { id_questao: row.id_questao, disciplina: row.disciplina, competencia: row.competencia, dificuldade: row.dificuldade, enunciado: row.enunciado, alternativas: desserializar(row).alternativas }
}

function montarQuestoes(questoes, ordens = null) {
  return questoes.map((questao, indice) => ordens?.[indice]
    ? embaralharQuestaoComOrdem(questao, ordens[indice])
    : embaralharQuestao(questao)
  )
}

async function iniciar({ idUsuario, idCronograma, idDia = null, tipo, quantidade, minimoAcertos }) {
  const [abertas] = await pool.execute(
    `SELECT id_avaliacao FROM cronograma_avaliacoes WHERE id_usuario = ? AND id_cronograma = ?
     AND tipo = ? AND status = 'EM_ANDAMENTO' AND (id_dia <=> ?) LIMIT 1`, [idUsuario, idCronograma, tipo, idDia]
  )
  if (abertas[0]) throw new Error('Já existe uma avaliação em andamento. Finalize-a antes de iniciar outra.')
  const disciplinas = await disciplinasDoCronograma(idCronograma, idDia)
  const rows = await selecionarQuestoes(disciplinas, quantidade)
  const questoes = rows.map(questaoPublica)
  const questoesEmbaralhadas = montarQuestoes(questoes)
  const registroQuestoes = questoesEmbaralhadas.map((questao) => ({ id_questao: questao.id_questao, ordem: validarEmbaralhamento(questao.embaralhamento, questao.id_questao) }))
  const [result] = await pool.execute(
    `INSERT INTO cronograma_avaliacoes (id_usuario, id_cronograma, id_dia, tipo, questoes, total_questoes, minimo_acertos)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [idUsuario, idCronograma, idDia, tipo, JSON.stringify(registroQuestoes), quantidade, minimoAcertos]
  )
  return { id_avaliacao: result.insertId, tipo, total: quantidade, minimoAcertos, questoes: questoesEmbaralhadas }
}

async function enviar(idAvaliacao, idUsuario, respostas) {
  const [rows] = await pool.execute('SELECT * FROM cronograma_avaliacoes WHERE id_avaliacao = ? AND id_usuario = ?', [idAvaliacao, idUsuario])
  const avaliacao = rows[0]
  if (!avaliacao || avaliacao.status !== 'EM_ANDAMENTO') throw new Error('Esta avaliação não está disponível para envio.')
  const registros = typeof avaliacao.questoes === 'string' ? JSON.parse(avaliacao.questoes) : avaliacao.questoes
  const ids = registros.map((item) => Number(typeof item === 'object' ? item.id_questao : item))
  if (!Array.isArray(respostas) || respostas.length !== ids.length || new Set(respostas.map((item) => Number(item.idQuestao))).size !== ids.length) throw new Error('Envie uma resposta para cada questão.')
  let acertos = 0
  const correcoes = []
  for (const resposta of respostas) {
    const idQuestao = Number(resposta.idQuestao)
    if (!ids.includes(idQuestao)) throw new Error('A avaliação contém uma questão inválida.')
    const ordem = validarEmbaralhamento(resposta.embaralhamento, idQuestao)
    const [questoes] = await pool.execute('SELECT enunciado, alternativas, resposta_correta, explicacao, origem FROM questoes_estudo WHERE id_questao = ?', [idQuestao])
    const questao = questoes[0]
    const acertou = Number(ordem[Number(resposta.resposta)]) === Number(questao?.resposta_correta)
    if (acertou) acertos += 1
    correcoes.push({
      idQuestao,
      enunciado: questao?.enunciado,
      acertou,
      respostaMarcada: Number(resposta.resposta),
      respostaCorreta: ordem.indexOf(Number(questao?.resposta_correta)),
      explicacao: questao?.explicacao || 'Revise o conteúdo correspondente antes de tentar novamente.',
      fonte: /^https?:\/\//i.test(String(questao?.origem || '')) ? questao.origem : null,
      origem: /^https?:\/\//i.test(String(questao?.origem || '')) ? 'Fonte consultada' : (questao?.origem || 'Banco de questões PlanejAI')
    })
  }
  const aprovada = acertos >= Number(avaliacao.minimo_acertos)
  const percentual = Math.round((acertos / Number(avaliacao.total_questoes)) * 100)
  await pool.execute(
    `UPDATE cronograma_avaliacoes SET status = ?, acertos = ?, percentual = ?, finalizado_em = CURRENT_TIMESTAMP WHERE id_avaliacao = ?`,
    [aprovada ? 'APROVADA' : 'REPROVADA', acertos, percentual, idAvaliacao]
  )
  if (aprovada && avaliacao.tipo === 'FINAL') await pool.execute("UPDATE cronogramas SET status = 'CONCLUIDO' WHERE id_cronograma = ?", [avaliacao.id_cronograma])
  return { aprovada, acertos, total: Number(avaliacao.total_questoes), percentual, minimoAcertos: Number(avaliacao.minimo_acertos), tipo: avaliacao.tipo, correcoes }
}

async function diaTemDesafioAprovado(idDia, idUsuario) {
  const [rows] = await pool.execute("SELECT id_avaliacao FROM cronograma_avaliacoes WHERE id_dia = ? AND id_usuario = ? AND tipo = 'ADIANTAMENTO' AND status = 'APROVADA' LIMIT 1", [idDia, idUsuario])
  return Boolean(rows[0])
}

async function obterProvaFinal(idCronograma, idUsuario) {
  const [rows] = await pool.execute("SELECT * FROM cronograma_avaliacoes WHERE id_cronograma = ? AND id_usuario = ? AND tipo = 'FINAL' ORDER BY iniciado_em DESC LIMIT 1", [idCronograma, idUsuario])
  return rows[0] || null
}

async function obterEmAndamento(idCronograma, idUsuario) {
  const [rows] = await pool.execute("SELECT * FROM cronograma_avaliacoes WHERE id_cronograma = ? AND id_usuario = ? AND status = 'EM_ANDAMENTO' ORDER BY iniciado_em DESC LIMIT 1", [idCronograma, idUsuario])
  return rows[0] || null
}

async function retomar(idAvaliacao, idUsuario) {
  const [rows] = await pool.execute("SELECT * FROM cronograma_avaliacoes WHERE id_avaliacao = ? AND id_usuario = ? AND status = 'EM_ANDAMENTO'", [idAvaliacao, idUsuario])
  const avaliacao = rows[0]
  if (!avaliacao) throw new Error('Esta avaliação não pode mais ser retomada.')
  const registros = typeof avaliacao.questoes === 'string' ? JSON.parse(avaliacao.questoes) : avaliacao.questoes
  if (!registros.every((item) => typeof item === 'object' && Array.isArray(item.ordem))) throw new Error('Esta avaliação foi criada em uma versão anterior e não pode ser retomada. Inicie uma nova avaliação.')
  const ids = registros.map((item) => Number(item.id_questao))
  const placeholders = ids.map(() => '?').join(',')
  const [questoes] = await pool.execute(`SELECT * FROM questoes_estudo WHERE id_questao IN (${placeholders})`, ids)
  const porId = new Map(questoes.map((item) => [Number(item.id_questao), questaoPublica(item)]))
  if (porId.size !== ids.length) throw new Error('Uma questão desta avaliação não está mais disponível.')
  return { id_avaliacao: avaliacao.id_avaliacao, tipo: avaliacao.tipo, total: Number(avaliacao.total_questoes), minimoAcertos: Number(avaliacao.minimo_acertos), questoes: montarQuestoes(registros.map((item) => porId.get(Number(item.id_questao))), registros.map((item) => item.ordem)) }
}

async function abandonar(idAvaliacao, idUsuario) {
  const [result] = await pool.execute(
    "UPDATE cronograma_avaliacoes SET status = 'EXPIRADA', finalizado_em = CURRENT_TIMESTAMP WHERE id_avaliacao = ? AND id_usuario = ? AND status = 'EM_ANDAMENTO'",
    [idAvaliacao, idUsuario]
  )
  if (!result.affectedRows) throw new Error('Esta avaliação não está mais em andamento.')
  return { id_avaliacao: Number(idAvaliacao), status: 'EXPIRADA' }
}

module.exports = { obterCronogramaDoUsuario, obterDiaDoUsuario, iniciar, enviar, diaTemDesafioAprovado, obterProvaFinal, obterEmAndamento, retomar, abandonar }

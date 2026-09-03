const pool = require('../config/db')

const inicioSemana = () => {
  const data = new Date(); data.setHours(0, 0, 0, 0); data.setDate(data.getDate() - ((data.getDay() + 6) % 7)); return data.toISOString().slice(0, 10)
}

async function diagnostico(idUsuario, disciplinas = []) {
  const lista = [...new Set((Array.isArray(disciplinas) ? disciplinas : []).map(String).filter(Boolean))].slice(0, 6)
  if (!lista.length) return []
  const placeholders = lista.map(() => '?').join(',')
  const [rows] = await pool.execute(`SELECT id_questao, disciplina, competencia, enunciado, alternativas, dificuldade FROM questoes_estudo WHERE ativo = 1 AND disciplina IN (${placeholders}) ORDER BY RAND() LIMIT 12`, lista)
  return rows.map((row) => ({ ...row, alternativas: typeof row.alternativas === 'string' ? JSON.parse(row.alternativas) : row.alternativas }))
}

async function salvarDiagnostico(idUsuario, respostas) {
  if (!Array.isArray(respostas) || !respostas.length) throw new Error('Envie as respostas do diagnóstico.')
  const ids = respostas.map((item) => Number(item.idQuestao)).filter(Boolean)
  const [questoes] = await pool.execute(`SELECT id_questao, disciplina, resposta_correta FROM questoes_estudo WHERE id_questao IN (${ids.map(() => '?').join(',')})`, ids)
  const porDisciplina = new Map()
  for (const resposta of respostas) { const q = questoes.find((item) => Number(item.id_questao) === Number(resposta.idQuestao)); if (!q) continue; const atual = porDisciplina.get(q.disciplina) || { acertos: 0, total: 0 }; atual.total += 1; atual.acertos += Number(resposta.resposta) === Number(q.resposta_correta) ? 1 : 0; porDisciplina.set(q.disciplina, atual) }
  const resultado = []
  for (const [disciplina, dados] of porDisciplina) { const percentual = dados.total ? dados.acertos / dados.total : 0; const nivel = percentual < .45 ? 'FACIL' : percentual < .8 ? 'MEDIA' : 'DIFICIL'; await pool.execute('INSERT INTO diagnosticos_estudo (id_usuario, disciplina, acertos, total, nivel_recomendado) VALUES (?, ?, ?, ?, ?)', [idUsuario, disciplina, dados.acertos, dados.total, nivel]); resultado.push({ disciplina, ...dados, nivelRecomendado: nivel }) }
  return resultado
}

async function metas(idUsuario) {
  const [rows] = await pool.execute('SELECT disciplina, tipo, alvo, flexivel FROM metas_por_materia WHERE id_usuario = ? AND inicio_semana = ?', [idUsuario, inicioSemana()])
  const dia = new Date().getDay(); const diasRestantes = Math.max(1, dia === 0 ? 1 : 8 - dia)
  for (const meta of rows) {
    let sql; let params
    if (meta.tipo === 'QUESTOES') { sql = `SELECT COUNT(*) AS total FROM tentativas_questoes t JOIN questoes_estudo q ON q.id_questao=t.id_questao WHERE t.id_usuario=? AND q.disciplina=? AND t.criado_em>=?`; params = [idUsuario, meta.disciplina, inicioSemana()] }
    else if (meta.tipo === 'MINUTOS') { sql = `SELECT COALESCE(SUM(s.duracao_minutos),0) AS total FROM sessoes_estudo s LEFT JOIN conteudos c ON c.id_conteudo=s.id_conteudo WHERE s.id_usuario=? AND (c.disciplina=? OR s.id_conteudo IS NULL) AND s.concluida_em>=?`; params = [idUsuario, meta.disciplina, inicioSemana()] }
    else { sql = `SELECT COUNT(*) AS total FROM redacoes WHERE id_usuario=? AND enviada_em>=?`; params = [idUsuario, inicioSemana()] }
    const [[progresso]] = await pool.execute(sql, params)
    meta.progresso = Number(progresso.total || 0); meta.restante = Math.max(0, Number(meta.alvo) - meta.progresso); meta.sugestaoDiaria = Math.ceil(meta.restante / diasRestantes)
  }
  return rows
}
async function salvarMeta(idUsuario, { disciplina, tipo, alvo, flexivel = true }) { if (!disciplina || !['QUESTOES','REDACOES','MINUTOS'].includes(tipo)) throw new Error('Meta inválida.'); const valor = Math.max(1, Math.min(1000, Number(alvo) || 1)); await pool.execute('INSERT INTO metas_por_materia (id_usuario, disciplina, tipo, alvo, inicio_semana, flexivel) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE alvo = VALUES(alvo), flexivel = VALUES(flexivel), ajustada_em = CURRENT_TIMESTAMP', [idUsuario, disciplina, tipo, valor, inicioSemana(), flexivel ? 1 : 0]); return metas(idUsuario) }
async function privacidade(idUsuario, visibilidade) { if (visibilidade) { if (!['RESUMO','DETALHADO','PRIVADO'].includes(visibilidade)) throw new Error('Nível de privacidade inválido.'); await pool.execute('INSERT INTO privacidade_aprendizagem (id_usuario, visibilidade) VALUES (?, ?) ON DUPLICATE KEY UPDATE visibilidade = VALUES(visibilidade)', [idUsuario, visibilidade]) }; const [rows] = await pool.execute('SELECT visibilidade FROM privacidade_aprendizagem WHERE id_usuario = ?', [idUsuario]); return { visibilidade: rows[0]?.visibilidade || 'RESUMO' } }

async function listarFlashcards(idUsuario) { const [rows] = await pool.execute('SELECT * FROM flashcards_estudo WHERE id_usuario = ? ORDER BY proxima_revisao ASC, criado_em DESC LIMIT 100', [idUsuario]); return rows }
async function criarFlashcard(idUsuario, { frente, verso, disciplina, origem = 'MANUAL' }) { if (!String(frente || '').trim() || !String(verso || '').trim()) throw new Error('Preencha frente e verso do flashcard.'); const tipo = ['ANOTACAO','ERRO','MANUAL'].includes(origem) ? origem : 'MANUAL'; await pool.execute('INSERT INTO flashcards_estudo (id_usuario, frente, verso, disciplina, origem) VALUES (?, ?, ?, ?, ?)', [idUsuario, String(frente).trim(), String(verso).trim(), disciplina || null, tipo]); return listarFlashcards(idUsuario) }
async function avaliarFlashcard(idUsuario, idFlashcard, resultado) { const intervalo = resultado === 'ERREI' ? 1 : resultado === 'DIFICIL' ? 3 : resultado === 'LEMBREI' ? 7 : 15; await pool.execute('UPDATE flashcards_estudo SET proxima_revisao = DATE_ADD(CURRENT_DATE, INTERVAL ? DAY) WHERE id_flashcard = ? AND id_usuario = ?', [intervalo, idFlashcard, idUsuario]); return { intervaloDias: intervalo } }
async function buscar(idUsuario, termo) { const texto = String(termo || '').trim(); if (texto.length < 2) return []; const like = `%${texto}%`; const [conteudos] = await pool.execute('SELECT id_conteudo AS id, titulo, disciplina, \'CONTEÚDO\' AS tipo FROM conteudos WHERE titulo LIKE ? OR disciplina LIKE ? LIMIT 8', [like, like]); const [questoes] = await pool.execute('SELECT id_questao AS id, enunciado AS titulo, disciplina, \'QUESTÃO\' AS tipo FROM questoes_estudo WHERE enunciado LIKE ? OR disciplina LIKE ? LIMIT 8', [like, like]); const [flashcards] = await pool.execute('SELECT id_flashcard AS id, frente AS titulo, disciplina, \'FLASHCARD\' AS tipo FROM flashcards_estudo WHERE id_usuario = ? AND (frente LIKE ? OR verso LIKE ?) LIMIT 8', [idUsuario, like, like]); return [...conteudos, ...questoes, ...flashcards] }
async function provas(idUsuario) { const [rows] = await pool.execute('SELECT * FROM provas_planejadas WHERE id_usuario = ? ORDER BY data_prova ASC', [idUsuario]); return rows.map((r) => ({ ...r, materias: typeof r.materias === 'string' ? JSON.parse(r.materias) : r.materias })) }
async function criarProva(idUsuario, { titulo, dataProva, materias }) { if (!titulo || !dataProva || !Array.isArray(materias) || !materias.length) throw new Error('Preencha título, data e ao menos uma matéria.'); await pool.execute('INSERT INTO provas_planejadas (id_usuario, titulo, data_prova, materias) VALUES (?, ?, ?, ?)', [idUsuario, titulo, dataProva, JSON.stringify(materias)]); return provas(idUsuario) }

async function catalogoProvas() {
  const [rows] = await pool.execute(`SELECT c.*,
    (SELECT COUNT(*) FROM catalogo_prova_questoes cp JOIN questoes_estudo q ON q.id_questao=cp.id_questao WHERE cp.id_catalogo=c.id_catalogo AND q.ativo=1) AS questoes_disponiveis,
    (SELECT COUNT(*) FROM catalogo_prova_questoes cp JOIN questoes_estudo q ON q.id_questao=cp.id_questao WHERE cp.id_catalogo=c.id_catalogo AND q.ativo=1 AND q.dificuldade='FACIL') AS questoes_faceis,
    (SELECT COUNT(*) FROM catalogo_prova_questoes cp JOIN questoes_estudo q ON q.id_questao=cp.id_questao WHERE cp.id_catalogo=c.id_catalogo AND q.ativo=1 AND q.dificuldade='MEDIA') AS questoes_medias,
    (SELECT COUNT(*) FROM catalogo_prova_questoes cp JOIN questoes_estudo q ON q.id_questao=cp.id_questao WHERE cp.id_catalogo=c.id_catalogo AND q.ativo=1 AND q.dificuldade='DIFICIL') AS questoes_dificeis
    FROM catalogo_provas c WHERE c.ativo=1 ORDER BY c.instituicao, c.referencia_ano DESC`)
  return rows
}

async function gerarSimulado(idUsuario, { idCatalogo, dificuldade = 'TODAS', quantidade = 45 }) {
  const nivel = String(dificuldade || 'TODAS').toUpperCase()
  if (!['TODAS', 'FACIL', 'MEDIA', 'DIFICIL'].includes(nivel)) throw new Error('Dificuldade inválida.')
  const limite = Math.max(1, Math.min(180, Number(quantidade) || 45))
  const [[catalogo]] = await pool.execute('SELECT * FROM catalogo_provas WHERE id_catalogo=? AND ativo=1', [idCatalogo])
  if (!catalogo) throw new Error('Prova não encontrada no catálogo.')
  const params = [idCatalogo]
  let filtro = ''
  if (nivel !== 'TODAS') { filtro = ' AND q.dificuldade=?'; params.push(nivel) }
  const [disponiveis] = await pool.execute(`SELECT COUNT(*) AS total
    FROM catalogo_prova_questoes cp JOIN questoes_estudo q ON q.id_questao=cp.id_questao
    WHERE cp.id_catalogo=? AND q.ativo=1${filtro}`, params)
  const totalDisponivel = Number(disponiveis[0]?.total || 0)
  if (!totalDisponivel) throw new Error('Não há questões disponíveis para este nível.')
  if (limite > totalDisponivel) {
    throw new Error(`Esta coleção possui ${totalDisponivel} questão(ões) disponíveis para o nível escolhido. Ajuste a quantidade ou escolha outro nível.`)
  }
  params.push(limite)
  const [questoes] = await pool.execute(`SELECT q.id_questao,q.disciplina,q.competencia,q.enunciado,q.alternativas,q.dificuldade
    FROM catalogo_prova_questoes cp JOIN questoes_estudo q ON q.id_questao=cp.id_questao
    WHERE cp.id_catalogo=? AND q.ativo=1${filtro} ORDER BY RAND() LIMIT ?`, params)
  const ids = questoes.map((item) => item.id_questao)
  const [result] = await pool.execute(`INSERT INTO simulados_catalogo
    (id_usuario,id_catalogo,dificuldade,questoes,total_questoes) VALUES(?,?,?,?,?)`,
    [idUsuario, idCatalogo, nivel, JSON.stringify(ids), ids.length])
  return {
    idSimulado: result.insertId,
    iniciadoEm: new Date().toISOString(),
    catalogo: { idCatalogo: catalogo.id_catalogo, titulo: catalogo.titulo, instituicao: catalogo.instituicao, duracaoMinutos: catalogo.duracao_minutos },
    questoes: questoes.map((item) => ({ ...item, alternativas: typeof item.alternativas === 'string' ? JSON.parse(item.alternativas) : item.alternativas })),
    respostas: {}
  }
}

function normalizarRespostas(respostas, ids) {
  const permitidas = new Set(ids.map(Number))
  const lista = respostas && typeof respostas === 'object' && !Array.isArray(respostas) ? respostas : {}
  return Object.fromEntries(Object.entries(lista)
    .map(([id, resposta]) => [Number(id), Number(resposta)])
    .filter(([id, resposta]) => permitidas.has(id) && Number.isInteger(resposta) && resposta >= 0 && resposta <= 3))
}

async function obterSimulado(idUsuario, idSimulado) {
  const [[simulado]] = await pool.execute(`SELECT s.*,c.titulo,c.instituicao,c.duracao_minutos
    FROM simulados_catalogo s JOIN catalogo_provas c ON c.id_catalogo=s.id_catalogo
    WHERE s.id_simulado=? AND s.id_usuario=?`, [idSimulado, idUsuario])
  if (!simulado) throw new Error('Simulado não encontrado.')
  if (simulado.status !== 'EM_ANDAMENTO') throw new Error('Este simulado já foi concluído.')
  const ids = typeof simulado.questoes === 'string' ? JSON.parse(simulado.questoes) : simulado.questoes
  if (!Array.isArray(ids) || !ids.length) throw new Error('Este simulado não possui questões válidas.')
  const [questoes] = await pool.execute(`SELECT id_questao,disciplina,competencia,enunciado,alternativas,dificuldade
    FROM questoes_estudo WHERE id_questao IN (${ids.map(() => '?').join(',')})`, ids)
  const porId = new Map(questoes.map((item) => [Number(item.id_questao), item]))
  const ordenadas = ids.map((id) => porId.get(Number(id))).filter(Boolean)
  return {
    idSimulado: simulado.id_simulado,
    iniciadoEm: simulado.iniciado_em,
    catalogo: { idCatalogo: simulado.id_catalogo, titulo: simulado.titulo, instituicao: simulado.instituicao, duracaoMinutos: simulado.duracao_minutos },
    questoes: ordenadas.map((item) => ({ ...item, alternativas: typeof item.alternativas === 'string' ? JSON.parse(item.alternativas) : item.alternativas })),
    respostas: normalizarRespostas(typeof simulado.respostas === 'string' ? JSON.parse(simulado.respostas) : simulado.respostas, ids)
  }
}

async function salvarProgressoSimulado(idUsuario, idSimulado, respostas) {
  const [[simulado]] = await pool.execute('SELECT questoes,status FROM simulados_catalogo WHERE id_simulado=? AND id_usuario=?', [idSimulado, idUsuario])
  if (!simulado) throw new Error('Simulado não encontrado.')
  if (simulado.status !== 'EM_ANDAMENTO') throw new Error('Este simulado já foi concluído.')
  const ids = typeof simulado.questoes === 'string' ? JSON.parse(simulado.questoes) : simulado.questoes
  const lista = normalizarRespostas(respostas, ids)
  await pool.execute('UPDATE simulados_catalogo SET respostas=? WHERE id_simulado=? AND id_usuario=? AND status=\'EM_ANDAMENTO\'', [JSON.stringify(lista), idSimulado, idUsuario])
  return { salvo: true, respondidas: Object.keys(lista).length }
}

async function concluirSimulado(idUsuario, idSimulado, respostas) {
  const [[simulado]] = await pool.execute('SELECT * FROM simulados_catalogo WHERE id_simulado=? AND id_usuario=?', [idSimulado, idUsuario])
  if (!simulado) throw new Error('Simulado não encontrado.')
  if (simulado.status === 'CONCLUIDO') throw new Error('Este simulado já foi concluído.')
  const ids = typeof simulado.questoes === 'string' ? JSON.parse(simulado.questoes) : simulado.questoes
  const lista = normalizarRespostas(respostas, ids)
  const [questoes] = await pool.execute(`SELECT id_questao,disciplina,resposta_correta,explicacao FROM questoes_estudo WHERE id_questao IN (${ids.map(() => '?').join(',')})`, ids)
  let acertos = 0
  const correcoes = questoes.map((questao) => {
    const resposta = Number(lista[questao.id_questao])
    const acertou = resposta === Number(questao.resposta_correta)
    if (acertou) acertos += 1
    return { idQuestao: questao.id_questao, acertou, respostaCorreta: Number(questao.resposta_correta), explicacao: questao.explicacao }
  })
  const nota = questoes.length ? Number(((acertos / questoes.length) * 100).toFixed(2)) : 0
  await pool.execute(`UPDATE simulados_catalogo SET respostas=?,acertos=?,nota=?,status='CONCLUIDO',concluido_em=CURRENT_TIMESTAMP WHERE id_simulado=? AND id_usuario=?`, [JSON.stringify(lista), acertos, nota, idSimulado, idUsuario])
  return { idSimulado: Number(idSimulado), acertos, total: questoes.length, nota, correcoes }
}

async function historicoSimulados(idUsuario) {
  const [rows] = await pool.execute(`SELECT s.id_simulado,s.dificuldade,s.total_questoes,s.acertos,s.nota,s.status,s.iniciado_em,s.concluido_em,c.titulo,c.instituicao
    FROM simulados_catalogo s JOIN catalogo_provas c ON c.id_catalogo=s.id_catalogo
    WHERE s.id_usuario=? ORDER BY s.iniciado_em DESC LIMIT 30`, [idUsuario])
  return rows
}

async function trilhas(idUsuario) {
  await pool.query(`INSERT IGNORE INTO competencias_estudo (disciplina, nome)
    SELECT DISTINCT disciplina, competencia FROM questoes_estudo WHERE ativo=1 AND competencia IS NOT NULL AND competencia<>''`)
  const [disciplinas] = await pool.execute(`SELECT DISTINCT c.disciplina FROM competencias_estudo c
    LEFT JOIN dominio_competencias d ON d.id_competencia=c.id_competencia AND d.id_usuario=?
    WHERE c.ativo=1 AND (d.id_usuario IS NOT NULL OR EXISTS(SELECT 1 FROM diagnosticos_estudo dx WHERE dx.id_usuario=? AND dx.disciplina=c.disciplina))`, [idUsuario,idUsuario])
  for (const { disciplina } of disciplinas) {
    await pool.execute(`INSERT INTO trilhas_aprendizagem(id_usuario,disciplina) VALUES(?,?) ON DUPLICATE KEY UPDATE atualizado_em=CURRENT_TIMESTAMP`,[idUsuario,disciplina])
    const [[trilha]]=await pool.execute('SELECT id_trilha FROM trilhas_aprendizagem WHERE id_usuario=? AND disciplina=?',[idUsuario,disciplina])
    const [competencias]=await pool.execute(`SELECT c.id_competencia,COALESCE(d.dominio,0) dominio FROM competencias_estudo c LEFT JOIN dominio_competencias d ON d.id_competencia=c.id_competencia AND d.id_usuario=? WHERE c.disciplina=? AND c.ativo=1 ORDER BY c.id_competencia`,[idUsuario,disciplina])
    let ordem=0; for(const item of competencias){ordem+=1;const [[bloqueio]]=await pool.execute(`SELECT COUNT(*) total FROM competencia_prerequisitos cp LEFT JOIN dominio_competencias d ON d.id_competencia=cp.id_prerequisito AND d.id_usuario=? WHERE cp.id_competencia=? AND COALESCE(d.dominio,0)<cp.dominio_minimo`,[idUsuario,item.id_competencia]);const status=Number(item.dominio)>=80?'DOMINADA':Number(bloqueio.total)>0?'BLOQUEADA':Number(item.dominio)>0?'EM_PROGRESSO':'DISPONIVEL';await pool.execute(`INSERT INTO trilha_etapas(id_trilha,id_competencia,ordem,status) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE ordem=VALUES(ordem),status=VALUES(status)`,[trilha.id_trilha,item.id_competencia,ordem,status])}
  }
  const [rows]=await pool.execute(`SELECT t.id_trilha,t.disciplina,t.status AS trilha_status,e.id_etapa,e.ordem,e.status,c.id_competencia,c.nome,c.descricao,COALESCE(d.dominio,0) dominio,COALESCE(d.evidencias,0) evidencias FROM trilhas_aprendizagem t JOIN trilha_etapas e ON e.id_trilha=t.id_trilha JOIN competencias_estudo c ON c.id_competencia=e.id_competencia LEFT JOIN dominio_competencias d ON d.id_competencia=c.id_competencia AND d.id_usuario=t.id_usuario WHERE t.id_usuario=? ORDER BY t.disciplina,e.ordem`,[idUsuario])
  const grouped=new Map();for(const row of rows){if(!grouped.has(row.id_trilha))grouped.set(row.id_trilha,{idTrilha:row.id_trilha,disciplina:row.disciplina,status:row.trilha_status,etapas:[]});grouped.get(row.id_trilha).etapas.push(row)}return [...grouped.values()]
}

module.exports = { diagnostico, salvarDiagnostico, metas, salvarMeta, privacidade, listarFlashcards, criarFlashcard, avaliarFlashcard, buscar, provas, criarProva, catalogoProvas, gerarSimulado, obterSimulado, salvarProgressoSimulado, concluirSimulado, historicoSimulados, trilhas }

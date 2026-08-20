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

async function metas(idUsuario) { const [rows] = await pool.execute('SELECT disciplina, tipo, alvo FROM metas_por_materia WHERE id_usuario = ? AND inicio_semana = ?', [idUsuario, inicioSemana()]); return rows }
async function salvarMeta(idUsuario, { disciplina, tipo, alvo }) { if (!disciplina || !['QUESTOES','REDACOES','MINUTOS'].includes(tipo)) throw new Error('Meta inválida.'); const valor = Math.max(1, Math.min(1000, Number(alvo) || 1)); await pool.execute('INSERT INTO metas_por_materia (id_usuario, disciplina, tipo, alvo, inicio_semana) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE alvo = VALUES(alvo)', [idUsuario, disciplina, tipo, valor, inicioSemana()]); return metas(idUsuario) }
async function privacidade(idUsuario, visibilidade) { if (visibilidade) { if (!['RESUMO','DETALHADO','PRIVADO'].includes(visibilidade)) throw new Error('Nível de privacidade inválido.'); await pool.execute('INSERT INTO privacidade_aprendizagem (id_usuario, visibilidade) VALUES (?, ?) ON DUPLICATE KEY UPDATE visibilidade = VALUES(visibilidade)', [idUsuario, visibilidade]) }; const [rows] = await pool.execute('SELECT visibilidade FROM privacidade_aprendizagem WHERE id_usuario = ?', [idUsuario]); return { visibilidade: rows[0]?.visibilidade || 'RESUMO' } }

async function listarFlashcards(idUsuario) { const [rows] = await pool.execute('SELECT * FROM flashcards_estudo WHERE id_usuario = ? ORDER BY proxima_revisao ASC, criado_em DESC LIMIT 100', [idUsuario]); return rows }
async function criarFlashcard(idUsuario, { frente, verso, disciplina, origem = 'MANUAL' }) { if (!String(frente || '').trim() || !String(verso || '').trim()) throw new Error('Preencha frente e verso do flashcard.'); const tipo = ['ANOTACAO','ERRO','MANUAL'].includes(origem) ? origem : 'MANUAL'; await pool.execute('INSERT INTO flashcards_estudo (id_usuario, frente, verso, disciplina, origem) VALUES (?, ?, ?, ?, ?)', [idUsuario, String(frente).trim(), String(verso).trim(), disciplina || null, tipo]); return listarFlashcards(idUsuario) }
async function avaliarFlashcard(idUsuario, idFlashcard, resultado) { const intervalo = resultado === 'ERREI' ? 1 : resultado === 'DIFICIL' ? 3 : resultado === 'LEMBREI' ? 7 : 15; await pool.execute('UPDATE flashcards_estudo SET proxima_revisao = DATE_ADD(CURRENT_DATE, INTERVAL ? DAY) WHERE id_flashcard = ? AND id_usuario = ?', [intervalo, idFlashcard, idUsuario]); return { intervaloDias: intervalo } }
async function buscar(idUsuario, termo) { const texto = String(termo || '').trim(); if (texto.length < 2) return []; const like = `%${texto}%`; const [conteudos] = await pool.execute('SELECT id_conteudo AS id, titulo, disciplina, \'CONTEÚDO\' AS tipo FROM conteudos WHERE titulo LIKE ? OR disciplina LIKE ? LIMIT 8', [like, like]); const [questoes] = await pool.execute('SELECT id_questao AS id, enunciado AS titulo, disciplina, \'QUESTÃO\' AS tipo FROM questoes_estudo WHERE enunciado LIKE ? OR disciplina LIKE ? LIMIT 8', [like, like]); const [flashcards] = await pool.execute('SELECT id_flashcard AS id, frente AS titulo, disciplina, \'FLASHCARD\' AS tipo FROM flashcards_estudo WHERE id_usuario = ? AND (frente LIKE ? OR verso LIKE ?) LIMIT 8', [idUsuario, like, like]); return [...conteudos, ...questoes, ...flashcards] }
async function provas(idUsuario) { const [rows] = await pool.execute('SELECT * FROM provas_planejadas WHERE id_usuario = ? ORDER BY data_prova ASC', [idUsuario]); return rows.map((r) => ({ ...r, materias: typeof r.materias === 'string' ? JSON.parse(r.materias) : r.materias })) }
async function criarProva(idUsuario, { titulo, dataProva, materias }) { if (!titulo || !dataProva || !Array.isArray(materias) || !materias.length) throw new Error('Preencha título, data e ao menos uma matéria.'); await pool.execute('INSERT INTO provas_planejadas (id_usuario, titulo, data_prova, materias) VALUES (?, ?, ?, ?)', [idUsuario, titulo, dataProva, JSON.stringify(materias)]); return provas(idUsuario) }

module.exports = { diagnostico, salvarDiagnostico, metas, salvarMeta, privacidade, listarFlashcards, criarFlashcard, avaliarFlashcard, buscar, provas, criarProva }

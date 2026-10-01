const pool = require('../config/db')

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object' && !Buffer.isBuffer(value)) return value
  try { return JSON.parse(Buffer.isBuffer(value) ? value.toString('utf8') : value) } catch { return fallback }
}

function normalizar(atividade) {
  return atividade && {
    ...atividade,
    anexos: parseJson(atividade.anexos, []),
    questoes: parseJson(atividade.questoes, []),
    destinatarios: parseJson(atividade.destinatarios, []),
    rubrica: parseJson(atividade.rubrica, []),
    rascunho: parseJson(atividade.rascunho_conteudo, null)
  }
}

function snapshot(atividade) {
  return {
    titulo: atividade.titulo,
    descricao: atividade.descricao,
    prazo: atividade.prazo,
    status: atividade.status,
    anexos: parseJson(atividade.anexos, []),
    questoes: parseJson(atividade.questoes, []),
    destinatarios: parseJson(atividade.destinatarios, []),
    atribuicao: atividade.atribuicao,
    rubrica: parseJson(atividade.rubrica, []),
    publicarEm: atividade.publicar_em,
    permiteReenvio: Boolean(atividade.permite_reenvio)
  }
}

async function buscarPorId(idAtividade, executor = pool) {
  const [rows] = await executor.execute('SELECT a.*,u.nome AS criador_nome,d.conteudo AS rascunho_conteudo,d.atualizado_em AS rascunho_salvo_em FROM atividades a LEFT JOIN usuarios u ON u.id_usuario=a.criado_por LEFT JOIN atividade_rascunhos d ON d.id_atividade=a.id_atividade WHERE a.id_atividade=?', [idAtividade])
  return normalizar(rows[0])
}

async function criar({ titulo, descricao, prazo, status, anexos, questoes, criadoPor, destinatarios, atribuicao, rubrica, publicarEm, permiteReenvio }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      `INSERT INTO atividades (titulo, descricao, criado_por, prazo, status, anexos, questoes, pergunta, tipo, destinatarios, atribuicao, rubrica, publicar_em, permite_reenvio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, criadoPor, prazo || null, status, JSON.stringify(anexos || []), JSON.stringify(questoes || []), titulo, 'DISSERTATIVA', destinatarios?.length ? JSON.stringify(destinatarios) : null, atribuicao || 'TODOS', JSON.stringify(rubrica || []), publicarEm || null, permiteReenvio ? 1 : 0]
    )
    await connection.execute('INSERT INTO atividade_versoes (id_atividade, numero_versao, conteudo, alterado_por) VALUES (?, 1, ?, ?)', [result.insertId, JSON.stringify({ titulo, descricao, prazo, status, anexos, questoes, destinatarios, atribuicao, rubrica, publicarEm, permiteReenvio }), criadoPor])
    await connection.commit()
    return buscarPorId(result.insertId)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
}

async function listarPublicadas(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT a.*, u.nome AS criador_nome,
       (SELECT COUNT(*) FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.status IN ('ENTREGUE','CORRIGIDA')) AS entregas,
       (SELECT r.status FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.id_usuario = ? ORDER BY r.respondido_em DESC LIMIT 1) AS minha_resposta_status,
       (SELECT r.nota FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.id_usuario = ? ORDER BY r.respondido_em DESC LIMIT 1) AS minha_nota
     FROM atividades a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por
     WHERE a.status = 'PUBLICADA' AND (a.publicar_em IS NULL OR a.publicar_em <= CURRENT_TIMESTAMP)
     ORDER BY a.prazo IS NULL, a.prazo ASC, a.id_atividade DESC`,
    [idUsuario, idUsuario]
  )
  return rows.map(normalizar)
}

async function listarGestao(criadoPor = null) {
  const filtro = criadoPor ? ' WHERE a.criado_por = ?' : ''
  const [rows] = await pool.execute(
    `SELECT a.*,u.nome AS criador_nome,d.conteudo AS rascunho_conteudo,d.atualizado_em AS rascunho_salvo_em,(SELECT COUNT(*) FROM respostas_usuario r WHERE r.id_atividade=a.id_atividade AND r.status IN ('ENTREGUE','CORRIGIDA')) AS entregas
     FROM atividades a LEFT JOIN usuarios u ON u.id_usuario=a.criado_por LEFT JOIN atividade_rascunhos d ON d.id_atividade=a.id_atividade${filtro} ORDER BY COALESCE(d.atualizado_em,a.atualizado_em) DESC`,
    criadoPor ? [criadoPor] : []
  )
  return rows.map(normalizar)
}

async function atualizar(idAtividade, dados, alteradoPor) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const atual = await buscarPorId(idAtividade, connection)
    if (!atual) throw new Error('Atividade não encontrada.')
    await connection.execute('INSERT IGNORE INTO atividade_versoes (id_atividade, numero_versao, conteudo, alterado_por) VALUES (?, ?, ?, ?)', [idAtividade, Number(atual.versao) || 1, JSON.stringify(snapshot(atual)), alteradoPor])
    const proximaVersao = (Number(atual.versao) || 1) + 1
    await connection.execute(
      `UPDATE atividades SET titulo=?,descricao=?,prazo=?,status=?,anexos=?,questoes=?,pergunta=?,destinatarios=?,atribuicao=?,rubrica=?,publicar_em=?,permite_reenvio=?,versao=? WHERE id_atividade=?`,
      [dados.titulo, dados.descricao || null, dados.prazo || null, dados.status, JSON.stringify(dados.anexos || []), JSON.stringify(dados.questoes || []), dados.titulo, dados.destinatarios?.length ? JSON.stringify(dados.destinatarios) : null, dados.atribuicao || 'TODOS', JSON.stringify(dados.rubrica || []), dados.publicarEm || null, dados.permiteReenvio ? 1 : 0, proximaVersao, idAtividade]
    )
    await connection.execute('INSERT INTO atividade_versoes (id_atividade, numero_versao, conteudo, alterado_por) VALUES (?, ?, ?, ?)', [idAtividade, proximaVersao, JSON.stringify(dados), alteradoPor])
    await connection.execute('DELETE FROM atividade_rascunhos WHERE id_atividade=?', [idAtividade])
    await connection.commit()
    return buscarPorId(idAtividade)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally { connection.release() }
}

async function autosalvarRascunho(idAtividade, dados, criadoPor) {
  const payload = {
    titulo: String(dados.titulo || '').trim() || 'Rascunho sem título',
    descricao: String(dados.descricao || '').trim() || null,
    prazo: dados.prazo || null,
    status: 'RASCUNHO',
    anexos: Array.isArray(dados.anexos) ? dados.anexos : [],
    questoes: Array.isArray(dados.questoes) ? dados.questoes : [],
    destinatarios: dados.atribuicao === 'SELECIONADOS' && Array.isArray(dados.destinatarios) ? dados.destinatarios : [],
    atribuicao: dados.atribuicao === 'SELECIONADOS' ? 'SELECIONADOS' : 'TODOS',
    rubrica: Array.isArray(dados.rubrica) ? dados.rubrica : [],
    publicarEm: dados.publicarEm || null,
    permiteReenvio: Boolean(dados.permiteReenvio)
  }
  if (!idAtividade) return criar({ ...payload, criadoPor })
  const atual = await buscarPorId(idAtividade)
  if (!atual) throw new Error('Rascunho não encontrado.')
  if (atual.status !== 'RASCUNHO') {
    await pool.execute(`INSERT INTO atividade_rascunhos (id_atividade,conteudo,salvo_por) VALUES (?,?,?) ON DUPLICATE KEY UPDATE conteudo=VALUES(conteudo),salvo_por=VALUES(salvo_por),atualizado_em=CURRENT_TIMESTAMP`, [idAtividade, JSON.stringify(payload), criadoPor])
    return { ...atual, rascunho: payload, rascunho_salvo_em: new Date() }
  }
  await pool.execute(`UPDATE atividades SET titulo=?,descricao=?,prazo=?,status='RASCUNHO',anexos=?,questoes=?,pergunta=?,destinatarios=?,atribuicao=?,rubrica=?,publicar_em=?,permite_reenvio=? WHERE id_atividade=? AND criado_por=?`, [payload.titulo, payload.descricao, payload.prazo, JSON.stringify(payload.anexos), JSON.stringify(payload.questoes), payload.titulo, payload.destinatarios.length ? JSON.stringify(payload.destinatarios) : null, payload.atribuicao, JSON.stringify(payload.rubrica), payload.publicarEm, payload.permiteReenvio ? 1 : 0, idAtividade, criadoPor])
  return buscarPorId(idAtividade)
}

async function listarVersoes(idAtividade) {
  const [rows] = await pool.execute('SELECT id_versao,numero_versao,alterado_por,criado_em FROM atividade_versoes WHERE id_atividade=? ORDER BY numero_versao DESC', [idAtividade])
  return rows
}

async function listarBancoQuestoes(idUsuario, acessoTotal = false) {
  const [rows] = await pool.execute(`SELECT b.*,u.nome AS autor_nome FROM banco_questoes_atividade b JOIN usuarios u ON u.id_usuario=b.criado_por ${acessoTotal ? '' : 'WHERE b.criado_por=? OR b.visibilidade=\'PLATAFORMA\''} ORDER BY b.atualizado_em DESC LIMIT 200`, acessoTotal ? [] : [idUsuario])
  return rows.map((row) => ({ ...row, dados: parseJson(row.dados, {}), tags: parseJson(row.tags, []) }))
}

async function criarQuestaoBanco(idUsuario, questao) {
  const [result] = await pool.execute(`INSERT INTO banco_questoes_atividade (criado_por,titulo,enunciado,tipo,disciplina,dificuldade,dados,tags,visibilidade) VALUES (?,?,?,?,?,?,?,?,?)`, [idUsuario, questao.titulo || null, questao.enunciado, questao.tipo, questao.disciplina || null, questao.dificuldade || 'MEDIA', JSON.stringify(questao), JSON.stringify(questao.tags || []), questao.visibilidade === 'PLATAFORMA' ? 'PLATAFORMA' : 'PRIVADA'])
  const [[row]] = await pool.execute('SELECT * FROM banco_questoes_atividade WHERE id_questao_banco=?', [result.insertId])
  return { ...row, dados: parseJson(row.dados, {}), tags: parseJson(row.tags, []) }
}

async function registrarUsoQuestao(idQuestaoBanco) {
  await pool.execute('UPDATE banco_questoes_atividade SET usos=usos+1 WHERE id_questao_banco=?', [idQuestaoBanco])
}

async function deletarQuestaoBanco(idQuestaoBanco, idUsuario, acessoTotal = false) {
  const [result] = await pool.execute(`DELETE FROM banco_questoes_atividade WHERE id_questao_banco=?${acessoTotal ? '' : ' AND criado_por=?'}`, acessoTotal ? [idQuestaoBanco] : [idQuestaoBanco, idUsuario])
  return result.affectedRows > 0
}

async function deletar(idAtividade) { await pool.execute('DELETE FROM atividades WHERE id_atividade = ?', [idAtividade]) }

module.exports = { criar, listarPublicadas, listarGestao, buscarPorId, atualizar, autosalvarRascunho, listarVersoes, listarBancoQuestoes, criarQuestaoBanco, registrarUsoQuestao, deletarQuestaoBanco, deletar }

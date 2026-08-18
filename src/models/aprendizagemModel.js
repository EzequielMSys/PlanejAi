const pool = require('../config/db');
const questionBank = require('../data/questionBank');
const { calcularProximaRevisao } = require('../utils/reviewScheduler');
const { embaralharSimulado, validarEmbaralhamento } = require('../utils/questionShuffle');

async function garantirBancoQuestoes() {
  for (const questao of questionBank) {
    const valores = [questao.disciplina, questao.competencia, JSON.stringify(questao.alternativas), questao.resposta, questao.explicacao, questao.dificuldade, questao.enunciado];
    const [existentes] = await pool.execute('SELECT id_questao FROM questoes_estudo WHERE enunciado = ? LIMIT 1', [questao.enunciado]);
    if (existentes[0]) {
      await pool.execute(
      `UPDATE questoes_estudo SET disciplina = ?, competencia = ?, alternativas = ?, resposta_correta = ?, explicacao = ?, dificuldade = ?
       WHERE enunciado = ?`, valores
      );
    } else {
      await pool.execute(
        `INSERT INTO questoes_estudo (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [questao.disciplina, questao.competencia, questao.enunciado, JSON.stringify(questao.alternativas), questao.resposta, questao.explicacao, questao.dificuldade]
      );
    }
  }
}

function desserializarQuestao(row, incluirResposta = false) {
  let alternativas = row.alternativas;
  if (typeof alternativas === 'string') {
    try { alternativas = JSON.parse(alternativas); } catch { alternativas = []; }
  }
  const questao = { ...row, alternativas };
  if (!incluirResposta) {
    delete questao.resposta_correta;
    delete questao.explicacao;
  }
  return questao;
}

async function gerarSimulado(idUsuario, { quantidade = 10, disciplina, dificuldade, origem } = {}) {
  await garantirBancoQuestoes();
  const limite = Math.max(1, Math.min(30, Number(quantidade) || 10));
  const params = [idUsuario, idUsuario];
  let filtro = '';
  if (disciplina) { filtro = 'AND q.disciplina = ?'; params.push(disciplina); }
  if (dificuldade && ['FACIL', 'MEDIA', 'DIFICIL'].includes(dificuldade)) { filtro += ' AND q.dificuldade = ?'; params.push(dificuldade); }
  if (origem === 'erros') filtro += ' AND ce.id_erro IS NOT NULL AND ce.resolvido = 0';
  params.push(limite);
  const [rows] = await pool.execute(
    `SELECT q.*, COALESCE(hist.erros, 0) AS erros_anteriores
     FROM questoes_estudo q
     LEFT JOIN caderno_erros ce ON ce.id_questao = q.id_questao AND ce.id_usuario = ?
     LEFT JOIN (
       SELECT id_questao, SUM(acertou = 0) AS erros FROM tentativas_questoes
       WHERE id_usuario = ? GROUP BY id_questao
     ) hist ON hist.id_questao = q.id_questao
     WHERE q.ativo = 1 ${filtro}
     ORDER BY erros_anteriores DESC, RAND() LIMIT ?`, params
  );
  return embaralharSimulado(rows.map((row) => desserializarQuestao(row, true)));
}

async function responderQuestao(idUsuario, idQuestao, resposta, duracaoSegundos, embaralhamento) {
  const [rows] = await pool.execute('SELECT * FROM questoes_estudo WHERE id_questao = ? AND ativo = 1', [idQuestao]);
  if (!rows[0]) return null;
  const questao = desserializarQuestao(rows[0], true);
  const ordem = validarEmbaralhamento(embaralhamento, idQuestao);
  const respostaOriginal = ordem[Number(resposta)];
  const acertou = Number(respostaOriginal) === Number(questao.resposta_correta);
  await pool.execute(
    'INSERT INTO tentativas_questoes (id_usuario, id_questao, resposta, acertou, duracao_segundos) VALUES (?, ?, ?, ?, ?)',
    [idUsuario, idQuestao, respostaOriginal, acertou ? 1 : 0, Math.max(0, Number(duracaoSegundos) || 0)]
  );
  if (acertou) {
    await pool.execute(
      `UPDATE caderno_erros SET resolvido = 1, resolvido_em = CURRENT_TIMESTAMP
       WHERE id_usuario = ? AND id_questao = ?`, [idUsuario, idQuestao]
    );
  } else {
    await pool.execute(
      `INSERT INTO caderno_erros (id_usuario, id_questao, proxima_tentativa)
       VALUES (?, ?, DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY))
       ON DUPLICATE KEY UPDATE total_erros = total_erros + 1, resolvido = 0,
       ultimo_erro_em = CURRENT_TIMESTAMP, proxima_tentativa = DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), resolvido_em = NULL`,
      [idUsuario, idQuestao]
    );
  }
  return { acertou, respostaCorreta: ordem.indexOf(Number(questao.resposta_correta)), explicacao: questao.explicacao };
}

async function listarCadernoErros(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT e.*, q.disciplina, q.competencia, q.enunciado, q.alternativas, q.explicacao
     FROM caderno_erros e JOIN questoes_estudo q ON q.id_questao = e.id_questao
     WHERE e.id_usuario = ? ORDER BY e.resolvido ASC, e.proxima_tentativa ASC, e.total_erros DESC`, [idUsuario]
  );
  return rows.map((row) => desserializarQuestao(row, true));
}

async function atualizarErro(idUsuario, idErro, { reflexao, resolvido }) {
  await pool.execute(
    `UPDATE caderno_erros SET reflexao = COALESCE(?, reflexao), resolvido = COALESCE(?, resolvido),
     resolvido_em = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP WHEN ? = 0 THEN NULL ELSE resolvido_em END
     WHERE id_erro = ? AND id_usuario = ?`,
    [reflexao ?? null, typeof resolvido === 'boolean' ? Number(resolvido) : null, Number(resolvido), Number(resolvido), idErro, idUsuario]
  );
  return listarCadernoErros(idUsuario);
}

async function listarRevisoes(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT r.*, c.titulo, c.disciplina, c.area, c.tipo, c.link
     FROM revisoes_estudo r JOIN conteudos c ON c.id_conteudo = r.id_conteudo
     WHERE r.id_usuario = ? AND r.proxima_revisao <= CURRENT_DATE
     ORDER BY r.proxima_revisao ASC, r.nivel_dominio ASC LIMIT 30`, [idUsuario]
  );
  return rows;
}

async function adicionarRevisao(idUsuario, idConteudo) {
  await pool.execute(
    `INSERT INTO revisoes_estudo (id_usuario, id_conteudo, proxima_revisao)
     VALUES (?, ?, CURRENT_DATE) ON DUPLICATE KEY UPDATE proxima_revisao = LEAST(proxima_revisao, CURRENT_DATE)`,
    [idUsuario, idConteudo]
  );
  return listarRevisoes(idUsuario);
}

async function avaliarRevisao(idUsuario, idConteudo, resultado) {
  const [rows] = await pool.execute('SELECT * FROM revisoes_estudo WHERE id_usuario = ? AND id_conteudo = ?', [idUsuario, idConteudo]);
  const proximo = calcularProximaRevisao(rows[0] || {}, resultado);
  await pool.execute(
    `INSERT INTO revisoes_estudo (id_usuario, id_conteudo, nivel_dominio, repeticoes, intervalo_dias, proxima_revisao, ultima_revisao, ultimo_resultado)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
     ON DUPLICATE KEY UPDATE nivel_dominio = VALUES(nivel_dominio), repeticoes = VALUES(repeticoes), intervalo_dias = VALUES(intervalo_dias), proxima_revisao = VALUES(proxima_revisao), ultima_revisao = CURRENT_TIMESTAMP, ultimo_resultado = VALUES(ultimo_resultado)`,
    [idUsuario, idConteudo, proximo.nivelDominio, proximo.repeticoes, proximo.intervaloDias, proximo.proximaRevisao, resultado]
  );
  return proximo;
}

async function obterResumo(idUsuario) {
  const [[revisoes], [questoes], [erros], [dominio]] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS hoje FROM revisoes_estudo WHERE id_usuario = ? AND proxima_revisao <= CURRENT_DATE', [idUsuario]),
    pool.execute('SELECT COUNT(*) AS total, COALESCE(ROUND(AVG(acertou) * 100), 0) AS acerto FROM tentativas_questoes WHERE id_usuario = ?', [idUsuario]),
    pool.execute('SELECT COUNT(*) AS pendentes FROM caderno_erros WHERE id_usuario = ? AND resolvido = 0', [idUsuario]),
    pool.execute('SELECT COALESCE(ROUND(AVG(nivel_dominio) * 10), 0) AS percentual FROM revisoes_estudo WHERE id_usuario = ?', [idUsuario])
  ]);
  const [porDisciplina] = await pool.execute(
    `SELECT q.disciplina, COUNT(*) AS tentativas, ROUND(AVG(t.acertou) * 100) AS acerto
     FROM tentativas_questoes t JOIN questoes_estudo q ON q.id_questao = t.id_questao
     WHERE t.id_usuario = ? GROUP BY q.disciplina ORDER BY acerto ASC`, [idUsuario]
  );
  const [redacoes] = await pool.execute('SELECT competencias_enem FROM redacoes WHERE id_usuario = ? AND competencias_enem IS NOT NULL', [idUsuario]);
  const acumulado = [[], [], [], [], []];
  for (const redacao of redacoes) {
    try {
      const competencias = typeof redacao.competencias_enem === 'string' ? JSON.parse(redacao.competencias_enem) : redacao.competencias_enem;
      if (Array.isArray(competencias)) competencias.forEach((item, indice) => {
        const codigo = Number(item.codigo || indice + 1);
        const nota = Number(item.nota);
        if (codigo >= 1 && codigo <= 5 && Number.isFinite(nota)) acumulado[codigo - 1].push(nota);
      });
    } catch { /* análise antiga inválida é ignorada */ }
  }
  const competenciasEnem = acumulado.map((notas, indice) => ({
    codigo: indice + 1,
    media: notas.length ? Math.round(notas.reduce((soma, nota) => soma + nota, 0) / notas.length) : 0,
    avaliacoes: notas.length
  }));
  return { revisoesHoje: revisoes[0].hoje, questoesRespondidas: questoes[0].total, taxaAcerto: questoes[0].acerto, errosPendentes: erros[0].pendentes, dominio: dominio[0].percentual, porDisciplina, competenciasEnem };
}

async function criarVersaoRedacao(idUsuario, idRedacao, { texto, observacao }) {
  const [redacoes] = await pool.execute('SELECT * FROM redacoes WHERE id_redacao = ? AND id_usuario = ?', [idRedacao, idUsuario]);
  if (!redacoes[0]) return null;
  const redacao = redacoes[0];
  const [[sequencia]] = await pool.execute('SELECT COALESCE(MAX(numero_versao), 0) + 1 AS numero FROM redacao_versoes WHERE id_redacao = ?', [idRedacao]);
  await pool.execute(
    `INSERT INTO redacao_versoes (id_redacao, id_usuario, numero_versao, texto, nota_estimada, competencias_enem, observacao)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [idRedacao, idUsuario, sequencia.numero, texto || redacao.texto, redacao.nota_estimada, redacao.competencias_enem, observacao || null]
  );
  return listarVersoesRedacao(idUsuario, idRedacao);
}

async function listarVersoesRedacao(idUsuario, idRedacao) {
  const [rows] = await pool.execute('SELECT * FROM redacao_versoes WHERE id_redacao = ? AND id_usuario = ? ORDER BY numero_versao DESC', [idRedacao, idUsuario]);
  return rows.map((row) => ({ ...row, competencias_enem: typeof row.competencias_enem === 'string' ? JSON.parse(row.competencias_enem || 'null') : row.competencias_enem }));
}

module.exports = { garantirBancoQuestoes, gerarSimulado, responderQuestao, listarCadernoErros, atualizarErro, listarRevisoes, adicionarRevisao, avaliarRevisao, obterResumo, criarVersaoRedacao, listarVersoesRedacao };

// Immutable experiments and argumentation sessions live in the owner's existing path.
const { createHash } = require('crypto');
const sources = require('./studyPathSources');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const text = (v, max, required = true) => {
  if (v == null && !required) return '';
  if (typeof v !== 'string' || v.trim().length > max || (required && !v.trim())) fail(`Confira o texto: use até ${max} caracteres.`);
  return v.trim();
};
const key = v => { if (!/^[a-f0-9-]{36}$/i.test(v || '')) fail('Identificador de envio inválido.'); return v; };
const hash = body => createHash('sha256').update(JSON.stringify({ ...body, version: undefined })).digest('hex');
const stamp = body => ({ id: key(body.key), hash: hash(body), created: new Date().toISOString() });
const find = (list, id) => { const item = list?.find(v => v.id === id); if (!item) fail('Registro não encontrado neste percurso.', 404); return item; };
const under = (list, limit) => { if (list.length >= limit) fail('O limite deste histórico foi atingido. Os registros anteriores foram preservados.'); };
function replay(data, body) {
  const candidates = [...(data.experiments || []).flatMap(e => [e, ...e.attempts, ...e.decisions]), ...(data.defences || []).flatMap(d => [d, ...d.turns, ...d.turns.flatMap(t => [...t.events, ...t.hints]), ...d.revisions, ...(d.closing ? [d.closing] : [])])];
  const prior = candidates.find(e => e.id === body.key);
  if (!prior) return false;
  if (prior.hash !== hash(body)) fail('Este envio já foi confirmado com outros dados. Reabra o histórico.', 409);
  return true;
}
async function apply(owner, data, kind, body, db, actor) {
  if (kind === 'estrategia' && body.action === 'experimentCreate') {
    if (data.archived) fail('Restaure a estratégia antes de iniciar uma experiência.');
    data.experiments ||= []; under(data.experiments, 12);
    if (!Array.isArray(body.activities) || body.activities.length !== 2) fail('Escolha duas atividades relacionadas.');
    const activities = [];
    for (const activity of body.activities) {
      const source = activity.source ? await sources.resolve(owner, activity.source, db, actor) : null;
      activities.push({ title: text(activity.title, 160), prompt: text(activity.prompt, 2000), source });
    }
    if (activities[0].prompt === activities[1].prompt) fail('Escolha duas atividades distintas e descreva suas diferenças.');
    data.experiments.push({ ...stamp(body), title: text(body.title, 120), difficulty: text(body.difficulty, 1000), expectation: text(body.expectation, 1200), common: text(body.common, 1200), differences: text(body.differences, 1200), procedure: data.procedure, activities, attempts: [], decisions: [] });
    return true;
  }
  if (kind === 'estrategia' && ['experimentAttempt', 'experimentDecision'].includes(body.action)) {
    const experiment = find(data.experiments, body.experiment);
    if (body.action === 'experimentAttempt') {
      under(experiment.attempts, 12);
      if (![0, 1].includes(body.slot)) fail('Escolha a primeira ou a segunda atividade.');
      const previous = experiment.attempts.filter(a => a.slot === body.slot).at(-1);
      const reason = text(body.reason, 1200, false);
      if (previous && !reason) fail('Explique por que está registrando outra tentativa.');
      const minutes = Number(body.minutes);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) fail('Informe de 1 a 240 minutos utilizados.');
      const attempt = { ...stamp(body), slot: body.slot, response: text(body.response, 4000), supports: text(body.supports, 1200), conditions: text(body.conditions, 1200), difficulty: text(body.difficulty, 1200), procedureUsed: text(body.procedureUsed, 1600), minutes, reason, replaces: previous?.id || null };
      attempt.text = [experiment.activities[body.slot].title, experiment.activities[body.slot].prompt, `Minha resposta: ${attempt.response}`, `Como apliquei o procedimento: ${attempt.procedureUsed}`, `Apoios utilizados: ${attempt.supports}`, `Condições: ${attempt.conditions}`, `Dificuldade percebida: ${attempt.difficulty}`, `Tempo utilizado: ${minutes} minutos`].join('\n\n');
      experiment.attempts.push(attempt);
    } else {
      under(experiment.decisions, 8);
      const attempts = [0, 1].map(slot => experiment.attempts.filter(a => a.slot === slot).at(-1));
      if (attempts.some(a => !a)) fail('Guarde uma tentativa de cada atividade antes de comparar.');
      if (!['manter', 'adaptar', 'deixar'].includes(body.decision)) fail('Escolha manter, adaptar ou deixar de lado.');
      experiment.decisions.push({ ...stamp(body), attempts: attempts.map(a => a.id), comparison: text(body.comparison, 2400), limitations: text(body.limitations, 1600), decision: body.decision, justification: text(body.justification, 1600), adaptation: text(body.adaptation, 2000, body.decision === 'adaptar') });
    }
    return true;
  }
  if (kind === 'projeto' && body.action === 'defenceCreate') {
    data.defences ||= []; under(data.defences, 8);
    const production = find(data.entries, body.production);
    if (production.type !== 'producao') fail('Escolha uma produção própria do projeto.');
    const excerpt = text(body.excerpt, 3000);
    if (!production.text.includes(excerpt)) fail('Escolha um trecho que esteja na produção original.');
    if (!Array.isArray(body.sources) || body.sources.length > 5 || new Set(body.sources).size !== body.sources.length) fail('Escolha até cinco referências.');
    const selected = body.sources.map(id => find(data.sources, id));
    data.defences.push({ ...stamp(body), production: production.id, excerpt, claim: text(body.claim, 1500), sources: selected.map(s => ({ id: s.id, origin: s.origin, purpose: s.purpose, limits: s.limits, url: s.url || '' })), turns: [], revisions: [], status: 'aberta' });
    return true;
  }
  if (kind === 'projeto' && ['defenceRespond', 'defenceRevise', 'defenceClose'].includes(body.action)) {
    const defence = find(data.defences, body.defence);
    if (defence.status !== 'aberta') fail('Esta conversa foi encerrada. O histórico permanece disponível.');
    if (body.action === 'defenceRespond') {
      const turn = find(defence.turns, body.turn);
      if (turn !== defence.turns.at(-1) || turn.events.length) fail('Esta pergunta já foi respondida. Reabra a conversa.', 409);
      if (!['responder', 'contestar', 'pular'].includes(body.responseType)) fail('Escolha responder, contestar ou seguir sem responder.');
      turn.events.push({ ...stamp(body), type: body.responseType, text: text(body.text, 3000, body.responseType !== 'pular') });
    } else if (body.action === 'defenceRevise') {
      under(defence.revisions, 8); under(data.entries, 100);
      const previous = find(data.entries, defence.revisions.at(-1)?.entry || defence.production);
      const entry = { ...stamp(body), type: 'producao', stage: 'producao', text: text(body.text, 6000), reason: text(body.reason, 1600), replaces: previous.id, questionAtCreation: data.question, sources: defence.sources.map(s => s.id), sourcesAtCreation: structuredClone(defence.sources), artifactUrl: '', defence: defence.id };
      data.entries.push(entry);
      defence.revisions.push({ ...stamp(body), entry: entry.id, claim: text(body.claim, 1500), reason: entry.reason });
    } else {
      defence.closing = { ...stamp(body), reflection: text(body.reflection, 1600, false) }; defence.status = 'encerrada';
    }
    return true;
  }
  return false;
}
function target(record, id) {
  const attempt = (record.experiments || []).flatMap(e => e.attempts).find(a => a.id === id);
  if (attempt) return attempt;
  const defence = (record.defences || []).find(d => d.id === id);
  return defence ? { id: defence.id, text: JSON.stringify(defence) } : null;
}
function defenceContext(record, body) {
  if (record.kind !== 'projeto' || body.attempts.length !== 1) fail('Escolha uma conversa deste projeto.');
  const defence = find(record.defences, body.attempts[0]);
  if (defence.status !== 'aberta') fail('Esta conversa já foi encerrada.');
  const request = body.request || 'question', last = defence.turns.at(-1);
  if (!['question', 'hint'].includes(request)) fail('Escolha uma pergunta ou pista.');
  if (request === 'hint' && (!last || last.events.length || last.hints.length >= 2)) fail('Peça uma pista para a pergunta atual, até duas vezes.');
  if (request === 'question' && ((last && !last.events.length) || defence.turns.length >= 8)) fail('Responda, conteste ou pule a pergunta atual antes de continuar. Cada conversa tem até oito perguntas.');
  return { chosen: [target(record, defence.id)], content: JSON.stringify({ afirmacao: defence.revisions.at(-1)?.claim || defence.claim, trechoOriginal: defence.excerpt, referenciasEscolhidas: defence.sources, conversa: defence.turns.map(t => ({ pergunta: t.question, pistas: t.hints.map(h => h.text), resposta: t.events.map(e => ({ tipo: e.type, texto: e.text })) })), pedido: request }), policy: `Atue como tutora de argumentação. ${request === 'hint' ? 'O campo pergunta deve conter uma pista breve, declarativa, sem ponto de interrogação, que oriente UM passo do raciocínio da última pergunta. Não reformule a pergunta, não crie outro exercício e não revele a resposta. A pista deve ser diferente das pistas já recebidas.' : 'O campo pergunta deve conter exatamente UMA pergunta de aprofundamento, sobre evidências, pressupostos, explicações alternativas OU limites da afirmação apresentada. Não escreva várias perguntas. Não substitua o aprofundamento por exercício de cálculo com números inventados; questione como a conclusão é sustentada.'} Considere apenas a afirmação, o trecho e as referências compartilhadas. Uma referência identificada não significa que seu conteúdo completo foi lido. Não invente fatos nem valide fontes que não consultou. Diferencie o que o trecho sustenta do que precisa de investigação. Preserve a autoria; não escreva a conclusão final. Não dê notas. Expresse incertezas. Contestações do estudante devem ser consideradas sem presumir erro.` };
}
function context(record, body) {
  if (body.mode === 'defence') return defenceContext(record, body);
  if (record.kind !== 'estrategia' || body.mode !== 'experiment') fail('Modo de investigação inválido.');
  const experiment = find(record.experiments, body.experiment);
  const allowed = ['response', 'supports', 'conditions', 'difficulty', 'procedureUsed', 'minutes'];
  if (!Array.isArray(body.fields) || !body.fields.length || body.fields.some(f => !allowed.includes(f))) fail('Escolha as partes das tentativas para compartilhar.');
  const chosen = body.attempts.map(id => find(experiment.attempts, id));
  return { chosen, content: JSON.stringify({ contextoEscolhido: text(body.goal, 1000, false), tentativas: chosen.map(a => ({ atividade: experiment.activities[a.slot].prompt, partes: Object.fromEntries(body.fields.map(f => [f, a[f]])) })) }), policy: 'Compare somente as partes escolhidas das tentativas. Não atribua causalidade à estratégia, não conclua domínio nem classifique estilos de aprendizagem. Mesmo que os cálculos estejam corretos, isso não demonstra a eficácia da estratégia nem uma justificativa conceitual. Discuta explicitamente em incerteza os limites da comparação: diferenças entre enunciados, apoios, familiaridade, contexto e dificuldade; se essas informações não foram compartilhadas, diga isso. Não declare ausência de incerteza de forma geral. Use pergunta para investigar uma diferença relevante entre as tentativas, não para simplesmente propor outro cálculo. Sugira uma verificação concreta sem resolver as atividades pelo estudante.' };
}
function acceptQuestion(data, body, receipt, owner, id) {
  if (receipt.purpose !== 'defence' || String(receipt.owner) !== String(owner) || receipt.record !== id) fail('A pergunta não pertence a esta conversa.', 404);
  const defence = find(data.defences, receipt.attempt);
  if (createHash('sha256').update(JSON.stringify(target(data, defence.id).text)).digest('hex') !== receipt.hash) fail('A conversa mudou. Confira o histórico antes de pedir outra orientação.', 409);
  defenceContext({ ...data, kind: 'projeto' }, { attempts: [defence.id], request: receipt.request });
  if (receipt.request === 'hint') defence.turns.at(-1).hints.push({ ...stamp(body), text: text(receipt.feedback.pergunta, 1800), uncertainty: text(receipt.feedback.incerteza, 1800) });
  else defence.turns.push({ ...stamp(body), question: text(receipt.feedback.pergunta, 1800), supported: text(receipt.feedback.claro, 1800), investigate: text(receipt.feedback.lacuna, 1800), uncertainty: text(receipt.feedback.incerteza, 1800), events: [], hints: [] });
}
module.exports = { apply, replay, context, target, acceptQuestion };

const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const guided = require('../src/services/guidedStudyService');
const lab = require('../src/services/studyLabService');
const paths = require('../src/services/learningExperiments');
const database = require('./helpers/guidedStore');
const feedback = { claro: 'O trecho considera potência e duração.', lacuna: 'Ainda falta comparar condições de uso.', pergunta: 'O que mudaria se a duração fosse diferente?', proximoPasso: 'Confronte dois períodos.', incerteza: 'Só recebi o trecho e as referências escolhidas; não verifiquei as fontes completas.' };
function provider(capture = () => {}, result = feedback) { return { chat: { completions: { create: async payload => { capture(payload); return { choices: [{ message: { content: JSON.stringify(result) } }] }; } } } }; }
const write = (db, record, body) => guided.change(7, record.id, { key: randomUUID(), version: record.version, ...body }, db);
async function setup() {
  const db = database();
  const origin = await guided.create(7, 'evidencia', { key: randomUUID(), title: 'Energia', mode: 'explicar', prompt: 'Explique energia.', initialText: 'Minha explicação original.' }, db);
  const source = { type: 'caminho', record: origin.id, step: origin.attempts[0].id };
  const strategy = await guided.create(7, 'estrategia', { key: randomUUID(), title: 'Conferir unidades', procedure: 'Converter a duração antes de calcular.', experience: { subject: 'Energia', difficulty: 'Conversão do tempo', outcome: 'parcial', observation: 'Precisei converter os minutos.', source } }, db);
  let project = await guided.create(7, 'projeto', { key: randomUUID(), title: 'Consumo', question: 'O que determina o consumo?', scope: 'Dois aparelhos', subjects: ['Física'], minutes: 30, deliverable: 'texto' }, db);
  project = await write(db, project, { action: 'projectEntry', stage: 'producao', entryType: 'producao', text: 'Minha conclusão relaciona potência e duração.', sources: [] });
  return { db, origin, source, strategy, project };
}
const experimentPlan = extra => ({ action: 'experimentCreate', title: 'Conferir duas situações', difficulty: 'Converter tempo', expectation: 'Identificar as unidades compatíveis.', common: 'As duas situações envolvem energia.', differences: 'Um enunciado usa minutos e o outro horas.', activities: [{ title: 'Primeira', prompt: 'Explique o consumo durante 30 minutos.' }, { title: 'Segunda', prompt: 'Explique o consumo durante duas horas.' }], ...extra });
const attemptBody = (r, slot, extra) => ({ action: 'experimentAttempt', experiment: r.experiments[0].id, slot, response: `RESPOSTA_${slot}`, procedureUsed: 'Conferi as unidades.', supports: 'EXEMPLO_PRIVADO', conditions: 'CONDICAO_PRIVADA', difficulty: 'Ainda confundi potência e energia.', minutes: 12, ...extra });
async function experiment() { const data = await setup(); data.strategy = await write(data.db, data.strategy, experimentPlan()); return data; }
const defenceBody = (p, extra) => ({ action: 'defenceCreate', production: p.entries[0].id, excerpt: 'relaciona potência e duração', claim: 'A duração precisa ser considerada.', sources: [], ...extra });
async function defence() { const data = await setup(); data.project = await write(data.db, data.project, defenceBody(data.project)); return data; }
async function question(db, project, request = 'question') {
  const result = await guided.assist(7, project.id, { mode: 'defence', attempts: [project.defences[0].id], request }, db, provider(() => {}, request === 'hint' ? { ...feedback, pergunta: 'Identifique qual condição precisa permanecer igual.' } : feedback));
  return write(db, project, { action: 'defenceQuestion', receipt: result.receipt });
}
test('comparação preserva plano, enunciados e procedimento mesmo após editar repertório', async () => {
  const { db, strategy, source } = await setup();
  let r = await write(db, strategy, experimentPlan({ activities: [{ title: 'Minha tentativa', prompt: 'Enunciado com minutos', source }, { title: 'Outra', prompt: 'Enunciado com horas' }] }));
  assert.equal(r.experiments[0].activities[0].source.record, source.record);
  r = await write(db, r, { action: 'strategyEdit', title: r.title, procedure: 'Outro procedimento', limits: '' });
  assert.equal(r.experiments[0].procedure, 'Converter a duração antes de calcular.');
  assert.equal(r.experiments[0].attempts.length, 0);
});
test('plano exige duas atividades distintas, relação e origens da própria conta', async () => {
  const { db, strategy, source } = await setup();
  for (const body of [experimentPlan({ activities: [] }), experimentPlan({ common: '' }), experimentPlan({ differences: '' }), experimentPlan({ activities: [{ title: 'A', prompt: 'Igual' }, { title: 'B', prompt: 'Igual' }] })]) await assert.rejects(write(db, strategy, body), e => e.status === 400);
  const foreign = await guided.create(8, 'evidencia', { key: randomUUID(), title: 'Privado', mode: 'explicar', prompt: 'Pergunta', initialText: 'Resposta' }, db);
  await assert.rejects(write(db, strategy, experimentPlan({ activities: [{ title: 'A', prompt: 'Enunciado A', source: { ...source, record: foreign.id, step: foreign.attempts[0].id } }, { title: 'B', prompt: 'Enunciado B' }] })), e => e.status === 404);
});
test('tentativa exige contexto e apoios explícitos e não aceita índice ou tempo inválidos', async () => {
  const { db, strategy: r } = await experiment();
  for (const extra of [{ slot: 2 }, { minutes: 0 }, { minutes: 241 }, { supports: '' }, { conditions: '' }, { response: '' }]) await assert.rejects(write(db, r, attemptBody(r, 0, extra)), e => e.status === 400);
});
test('reenvio é idempotente e nova tentativa conserva a primeira com motivo', async () => {
  const { db, strategy } = await experiment(); const body = { ...attemptBody(strategy, 0), key: randomUUID(), version: strategy.version };
  let r = await guided.change(7, strategy.id, body, db);
  assert.equal((await guided.change(7, r.id, body, db)).experiments[0].attempts.length, 1);
  await assert.rejects(guided.change(7, r.id, { ...body, response: 'Outro texto' }, db), e => e.status === 409);
  await assert.rejects(write(db, r, attemptBody(r, 0)), e => e.status === 400);
  r = await write(db, r, attemptBody(r, 0, { reason: 'Quero tentar sem exemplo.', response: 'SEGUNDA_RESPOSTA' }));
  assert.equal(r.experiments[0].attempts[0].response, 'RESPOSTA_0');
  assert.equal(r.experiments[0].attempts[1].replaces, r.experiments[0].attempts[0].id);
});
test('decisão exige as duas tentativas, limites e justificativa sem alterar repertório', async () => {
  const { db, strategy } = await experiment(); let r = strategy;
  const decision = { action: 'experimentDecision', experiment: r.experiments[0].id, comparison: 'Usei apoios diferentes.', limitations: 'A segunda atividade era mais familiar.', decision: 'adaptar', justification: 'Quero conferir o enunciado primeiro.', adaptation: 'Separar dados antes das unidades.' };
  await assert.rejects(write(db, r, decision), e => e.status === 400);
  r = await write(db, r, attemptBody(r, 0)); r = await write(db, r, attemptBody(r, 1));
  await assert.rejects(write(db, r, { ...decision, limitations: '' }), e => e.status === 400);
  await assert.rejects(write(db, r, { ...decision, adaptation: '' }), e => e.status === 400);
  r = await write(db, r, decision);
  assert.deepEqual(r.experiments[0].decisions[0].attempts, r.experiments[0].attempts.map(a => a.id));
  assert.equal(r.procedure, strategy.procedure); assert.equal(r.experiments[0].score, undefined);
});
test('Lumi recebe apenas partes marcadas das tentativas da comparação escolhida', async () => {
  const { db, strategy } = await experiment(); let r = await write(db, strategy, attemptBody(strategy, 0)); r = await write(db, r, attemptBody(r, 1)); let sent;
  const result = await guided.assist(7, r.id, { mode: 'experiment', experiment: r.experiments[0].id, attempts: r.experiments[0].attempts.map(a => a.id), fields: ['response'], goal: 'Comparar minhas respostas.' }, db, provider(p => sent = p));
  const input = JSON.stringify(sent.messages); assert.match(input, /RESPOSTA_0/); assert.doesNotMatch(input, /EXEMPLO_PRIVADO|CONDICAO_PRIVADA|Converter a duração/); assert.match(input, /Não atribua causalidade/);
  assert.equal((await guided.detail(7, r.id, db)).experiments[0].attempts[1].feedback, undefined);
  r = await write(db, r, { action: 'feedback', receipt: result.receipt }); assert.ok(r.experiments[0].attempts[1].feedback);
  r = await write(db, r, { action: 'contest', attempt: r.experiments[0].attempts[1].id, text: 'As condições eram diferentes.' }); assert.equal(r.experiments[0].attempts[1].contest, 'As condições eram diferentes.');
});
test('tentativa pode ser levada ao entendimento com origem verificável e acesso restrito', async () => {
  const { db, strategy } = await experiment(); const r = await write(db, strategy, attemptBody(strategy, 0));
  const body = { key: randomUUID(), type: 'evidencia', attempt: r.experiments[0].attempts[0].id, title: 'O que entendi', prompt: 'Comparar unidades', text: 'Meu registro conferido.' };
  const saved = await lab.saveAs(7, r.id, body, db); assert.equal(saved.sourceStrategy, r.id);
  await assert.rejects(lab.saveAs(8, r.id, body, db), e => e.status === 404);
});
test('defesa exige produção própria e trecho original, rejeita fonte alheia e não chama Lumi', async () => {
  const { db, project: p } = await setup();
  await assert.rejects(write(db, p, defenceBody(p, { excerpt: 'Trecho que não está na produção' })), e => e.status === 400);
  await assert.rejects(write(db, p, defenceBody(p, { sources: ['foreign'] })), e => e.status === 404);
  const r = await write(db, p, defenceBody(p)); assert.equal(r.defences[0].turns.length, 0); assert.equal(r.defences[0].excerpt, 'relaciona potência e duração');
  await assert.rejects(guided.change(8, r.id, { action: 'defenceClose', version: r.version, key: randomUUID(), defence: r.defences[0].id }, db), e => e.status === 404);
});
test('Lumi não recebe outras produções ou fontes não selecionadas da defesa', async () => {
  const { db, project: p } = await defence();
  const r = await write(db, p, { action: 'projectEntry', stage: 'analise', entryType: 'anotacao', text: 'OUTRO_REGISTRO_PRIVADO', sources: [] }); let sent;
  await guided.assist(7, r.id, { mode: 'defence', attempts: [r.defences[0].id] }, db, provider(v => sent = v));
  assert.doesNotMatch(JSON.stringify(sent.messages), /OUTRO_REGISTRO_PRIVADO|O que determina o consumo/);
  assert.match(JSON.stringify(sent.messages), /exatamente UMA pergunta/); assert.equal((await guided.detail(7, r.id, db)).defences[0].turns.length, 0);
});
test('pergunta assinada é guardada só mediante confirmação, sem duplicação ou sobrescrita', async () => {
  const { db, project: p } = await defence(); const result = await guided.assist(7, p.id, { mode: 'defence', attempts: [p.defences[0].id] }, db, provider());
  const body = { action: 'defenceQuestion', key: randomUUID(), version: p.version, receipt: result.receipt };
  const r = await guided.change(7, p.id, body, db); assert.equal(r.defences[0].turns.length, 1);
  assert.equal((await guided.change(7, p.id, body, db)).defences[0].turns.length, 1);
  await assert.rejects(write(db, r, { action: 'defenceQuestion', receipt: result.receipt }), e => e.status === 409);
  await assert.rejects(write(db, r, { action: 'feedback', receipt: result.receipt }), e => e.status === 400);
});
test('assinatura inválida e recibos de outra finalidade não criam perguntas', async () => {
  const { db, project: p, strategy } = await defence();
  await assert.rejects(write(db, p, { action: 'defenceQuestion', receipt: 'forged' }), e => e.status === 409);
  const ordinary = await guided.assist(7, strategy.id, { attempts: [strategy.experiences[0].id], fields: ['observation'] }, db, provider());
  await assert.rejects(write(db, p, { action: 'defenceQuestion', receipt: ordinary.receipt }), e => e.status === 404);
});
test('pergunta pendente bloqueia outra; pistas são progressivas e resposta permite continuar', async () => {
  const { db, project: p } = await defence(); let r = await question(db, p), id = r.defences[0].id;
  await assert.rejects(guided.assist(7, r.id, { mode: 'defence', attempts: [id] }, db, provider()), e => e.status === 400);
  r = await question(db, r, 'hint'); r = await question(db, r, 'hint'); assert.equal(r.defences[0].turns[0].hints.length, 2);
  await assert.rejects(guided.assist(7, r.id, { mode: 'defence', attempts: [id], request: 'hint' }, db, provider()), e => e.status === 400);
  r = await write(db, r, { action: 'defenceRespond', defence: id, turn: r.defences[0].turns[0].id, responseType: 'responder', text: 'Eu precisaria comparar as durações.' });
  r = await question(db, r); assert.equal(r.defences[0].turns.length, 2); assert.match(r.defences[0].turns[0].events[0].text, /comparar/);
});
test('estudante pode contestar, pular e encerrar sem nota ou resposta obrigatória', async () => {
  const { db, project: p } = await defence(); let r = await question(db, p), id = r.defences[0].id;
  r = await write(db, r, { action: 'defenceRespond', defence: id, turn: r.defences[0].turns[0].id, responseType: 'contestar', text: 'A duração já está no trecho.' }); r = await question(db, r);
  r = await write(db, r, { action: 'defenceRespond', defence: id, turn: r.defences[0].turns[1].id, responseType: 'pular', text: '' }); r = await question(db, r);
  r = await write(db, r, { action: 'defenceClose', defence: id, reflection: 'Vou buscar dados antes de continuar.' });
  assert.equal(r.defences[0].status, 'encerrada'); assert.equal(r.defences[0].turns.length, 3); assert.equal(r.defences[0].score, undefined);
  await assert.rejects(guided.assist(7, r.id, { mode: 'defence', attempts: [id] }, db, provider()), e => e.status === 400);
});
test('revisão cria produção autoral versionada com motivo e preserva afirmação original', async () => {
  const { db, project: p } = await defence(); const id = p.defences[0].id;
  await assert.rejects(write(db, p, { action: 'defenceRevise', defence: id, text: 'Nova versão', claim: 'Nova afirmação', reason: '' }), e => e.status === 400);
  const r = await write(db, p, { action: 'defenceRevise', defence: id, text: 'Minha nova conclusão limita a comparação ao mesmo intervalo.', claim: 'A comparação depende das condições.', reason: 'A pergunta destacou uma condição ausente.' });
  assert.equal(r.entries[0].text, p.entries[0].text); assert.equal(r.entries[1].replaces, p.entries[0].id); assert.equal(r.defences[0].claim, p.defences[0].claim); assert.equal(r.defences[0].revisions[0].entry, r.entries[1].id);
  assert.equal(r.next, null);
});
test('Lumi recusa saída com várias perguntas e contexto inválido antes de consumir cota', async () => {
  const { db, project: p } = await defence();
  await assert.rejects(guided.assist(7, p.id, { mode: 'defence', attempts: [p.defences[0].id] }, db, provider(() => {}, { ...feedback, pergunta: 'Qual o dado? E a fonte?' })), e => e.status === 503);
  const before = db.calls.length;
  await assert.rejects(guided.assist(7, p.id, { mode: 'defence', attempts: ['foreign'] }, db, provider()), e => e.status === 404);
  assert.ok(!db.calls.slice(before).some(c => c.sql.includes('diario_lumi_uso')));
});
test('limites de histórico preservam registros existentes e contas antigas continuam utilizáveis', async () => {
  const { db, strategy } = await experiment(); const r = structuredClone(strategy); r.experiments = Array.from({ length: 12 }, () => structuredClone(r.experiments[0]));
  await assert.rejects(paths.apply(7, r, 'estrategia', { key: randomUUID(), ...experimentPlan() }, db), e => e.status === 400);
  assert.equal(r.experiments.length, 12); assert.equal(paths.replay({ experiences: [] }, { key: randomUUID() }), false);
});

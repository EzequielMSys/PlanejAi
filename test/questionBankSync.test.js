const test = require('node:test');
const assert = require('node:assert/strict');
const bank = require('../src/data/questionBank');
const { createQuestionBankSync } = require('../src/services/questionBankSync');
const row = (question, id) => ({id_questao:id,disciplina:question.disciplina,competencia:question.competencia || null,enunciado:question.enunciado,alternativas:JSON.stringify(question.alternativas),resposta_correta:question.resposta,explicacao:question.explicacao,dificuldade:question.dificuldade || 'MEDIA'});

test('banco atualizado exige uma leitura e nenhuma regravação, inclusive com montagens simultâneas',async()=>{
  let reads=0,writes=0;
  const sync=createQuestionBankSync({query:async()=>{reads++;return [bank.map(row)]},execute:async()=>{writes++}},bank);
  await Promise.all([sync(),sync(),sync()]);await sync();
  assert.equal(reads,1);assert.equal(writes,0);
});

test('sincronização preserva os IDs e corrige somente conteúdo alterado ou ausente',async()=>{
  const rows=bank.slice(0,2).map(row);rows[0].explicacao='Explicação antiga';rows[1].alternativas=JSON.parse(rows[1].alternativas);
  const writes=[];
  const sync=createQuestionBankSync({query:async()=>[rows],execute:async(sql,params)=>{writes.push({sql,params})}},bank.slice(0,3));
  assert.equal(await sync(),2);
  assert.match(writes[0].sql,/UPDATE/);assert.equal(writes[0].params.at(-1),rows[0].id_questao);
  assert.match(writes[1].sql,/INSERT/);assert.equal(writes[1].params.at(-1),bank[2].enunciado);
  assert.ok(writes.every(w=>!/DELETE|REPLACE/.test(w.sql)));
});

test('uma falha transitória não deixa a sincronização permanentemente bloqueada',async()=>{
  let calls=0;
  const sync=createQuestionBankSync({query:async()=>{if(++calls===1)throw new Error('unavailable');return [bank.map(row)]},execute:async()=>{throw new Error('unexpected write')}},bank);
  await assert.rejects(sync(),/unavailable/);assert.equal(await sync(),0);assert.equal(calls,2);
});

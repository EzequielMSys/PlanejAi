const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load(name, pool) {
  const context = { module: { exports: {} }, require: () => pool };
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/models/' + name), 'utf8'), context);
  return context.module.exports;
}
test('diretório usa LIMIT inteiro compatível com MySQL 8.4 e mantém filtros parametrizados', async () => {
  const calls=[];
  const pool={ execute:async(sql)=>{assert.doesNotMatch(sql,/LIMIT \?/);return [[{total:21}]]},query:async(sql,params)=>{calls.push({sql,params});return [[{total:21}]]} };
  const model=load('usuarioModel',pool);
  const result=await model.listarUsuarios({page:2,limit:10,search:"' OR 1=1 --",tipo:'aluno'});
  const call=calls.at(-1);
  assert.match(call.sql,/LIMIT \? OFFSET \?/);
  assert.deepEqual(Array.from(call.params),["%' OR 1=1 --%","%' OR 1=1 --%",'aluno',10,10]);
  assert.equal(result.total_paginas,3);
  await model.listarUsuarios({page:Infinity,limit:1.5});
  assert.deepEqual(Array.from(calls.at(-1).params),[10,0]);
});
test('avisos usam LIMIT compatível com MySQL 8.4 preservando acesso por turma', async () => {
  const calls=[];
  const model=load('avisoModel',{query:async(sql,params)=>{calls.push({sql,params});return [[]]},execute:()=>{throw Error('LIMIT DOUBLE inválido')}});
  await model.listarAvisos('aluno',50,7);
  assert.match(calls[0].sql,/m.id_aluno=\?/);
  assert.deepEqual(Array.from(calls[0].params),[7,'todos','alunos',50]);
  await model.listarAvisos('dono',Infinity);
  assert.deepEqual(Array.from(calls.at(-1).params),['todos','alunos','docentes',50]);
});

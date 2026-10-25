const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function service(overrides={}) {
  const context={module:{exports:{}},require:name=>name==='node:crypto'?require(name):name==='../utils/reviewScheduler'?require('../src/utils/reviewScheduler'):overrides[name] || {}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/sessionClosureService'),'utf8'),context);
  return context.module.exports;
}
const user={id:7,tipo:'aluno'};
const payload=()=>({chave:'session-test-request-0001',idConteudo:9,inicio:new Date(Date.now()-300000).toISOString(),resultado:'LEMBREI',proximoPasso:'Tentar sem consultar o exemplo.'});
function database(options={}) {
  let state={sessions:0,reviews:0,saved:null},previous;
  const calls=[];
  const conn={beginTransaction:async()=>{previous=structuredClone(state)},commit:async()=>{},rollback:async()=>{state=previous},release:()=>{},execute:async(sql,params)=>{
    calls.push({sql,params});
    if(sql.startsWith('SELECT * FROM fechamentos'))return [[].concat(state.saved || [])];
    if(sql.startsWith('SELECT cc.id'))return [options.foreign?[]:[{id:5,id_conteudo:9,id_dia:8,id_cronograma:3,data_estudo:'2026-10-25',futuro:options.future?1:0,titulo:'Leis de Newton',disciplina:'Física'}]];
    if(sql.startsWith('SELECT id_dia'))return [options.blocked?[{id_dia:1}]:[]];
    if(sql.startsWith('SELECT id_avaliacao'))return [[]];
    if(sql.startsWith('SELECT * FROM revisoes'))return [[]];
    if(sql.startsWith('INSERT INTO revisoes'))state.reviews++;
    if(sql.startsWith('INSERT INTO sessoes'))return [{insertId:++state.sessions}];
    if(sql.startsWith('SELECT\n'))return [[{anotacoes:1,explicacoes:2,duvidas:1}]];
    if(sql.startsWith('SELECT id,titulo'))return [[{id:11,titulo:'Minha dúvida'}]];
    if(sql.startsWith('INSERT INTO fechamentos')) {
      if(options.failFinal)throw Error('database unavailable');
      state.saved={id:22,id_usuario:params[0],id_conteudo:params[1],id_sessao:params[2],chave:params[3],hash_payload:params[4],sintese:params[5],proximo_passo:params[6]};
      return [{insertId:22}];
    }
    return [[]];
  }};
  return {db:{getConnection:async()=>conn},calls,state:()=>state};
}
const scope={'./unifiedSearchService':{content:async(u,c)=>u.id===7 && c===9?{id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}:null}};
test('closing validates required identifiers, limits and time before writing',async()=>{
  for(const patch of [{chave:[]},{chave:'short'},{resultado:'UNKNOWN'},{proximoPasso:'x'.repeat(601)},{inicio:'bad'},{inicio:new Date(Date.now()+3600000).toISOString()},{idConteudo:-1},{idConteudo:null}]) await assert.rejects(service().close(user,{...payload(),...patch},{}),e=>e.status===400);
});
test('one atomic closing saves a single session, review, verified summary and next step across retries',async()=>{
  const data=database(),s=service(scope),body=payload();
  const first=await s.close(user,body,data.db),retry=await s.close(user,body,data.db);
  assert.equal(first.confirmado,true);assert.equal(first.fechamento.sintese.explicacoes,2);
  assert.equal(retry.fechamento.proximo_passo,body.proximoPasso);
  assert.equal(data.state().sessions,1);assert.equal(data.state().reviews,1);
  await assert.rejects(s.close(user,{...body,proximoPasso:'Outra intenção'},data.db),e=>e.status===409);
  assert.equal(data.state().sessions,1);
  const noteQuery=data.calls.find(c=>c.sql.startsWith('SELECT\n'));
  assert.match(noteQuery.sql,/d.id_usuario=\?/);assert.ok(noteQuery.params.filter(n=>n===7).length>=4);
});
test('failure saving the summary rolls back session and review instead of reporting completion',async()=>{
  const data=database({failFinal:true});
  await assert.rejects(service(scope).close(user,payload(),data.db));
  assert.equal(data.state().sessions,0);assert.equal(data.state().reviews,0);assert.equal(data.state().saved,null);
});
test('closing rejects foreign content and respects pending days and advance challenges',async()=>{
  await assert.rejects(service(scope).close({id:8,tipo:'aluno'},payload(),database().db),e=>e.status===404);
  for(const options of [{foreign:true},{blocked:true},{future:true}]) {
    const data=database(options);
    await assert.rejects(service(scope).close(user,{...payload(),idItem:5},data.db),e=>e.status===(options.foreign?404:409));
    assert.equal(data.state().sessions,0);
  }
});
test('return priority follows student intent, overdue review, explanation, today review then doubt',()=>{
  const s=service();
  const items={proximoPasso:{id:1},revisao:{id:2,atrasada:true},explicacao:{id:3},duvida:{id:4}};
  assert.equal(s.recommend(items).tipo,'lembrete');
  delete items.proximoPasso;assert.equal(s.recommend(items).tipo,'revisao');
  items.revisao.atrasada=false;assert.equal(s.recommend(items).tipo,'explicacao');
  delete items.explicacao;assert.equal(s.recommend(items).tipo,'revisao');
  delete items.revisao;assert.equal(s.recommend(items).tipo,'duvida');
  assert.equal(s.recommend({}),null);
});
test('pending work is bounded and isolated per owner and does not treat recent explanations as due',async()=>{
  const calls=[];
  const result=await service().pending(7,{execute:async(sql,params)=>{
    calls.push({sql,params});assert.deepEqual(Array.from(params),[7]);assert.match(sql,/id_usuario=\?/);assert.match(sql,/LIMIT 1/);
    if(sql.includes('HAVING MAX')){assert.match(sql,/INTERVAL 3 DAY/);return [[{id:5,titulo:'Minha explicação'}]]}
    return [[]];
  }});
  assert.equal(calls.length,4);assert.equal(result.principal.tipo,'explicacao');assert.equal(result.principal.minutos,5);assert.equal(result.duvida,null);
});
test('a reminder rechecks both ownership and current material access and opening never marks it done',async()=>{
  let queries=0;
  const s=service({'./unifiedSearchService':{content:async()=>null}});
  const db={execute:async(sql,params)=>{queries++;assert.match(sql,/id_usuario=\?/);assert.deepEqual(Array.from(params),[22,7]);return [[{id_conteudo:9}]]}};
  await assert.rejects(s.resume(user,22,db),e=>e.status===404);assert.equal(queries,1);
  await assert.rejects(s.resume(user,22,{execute:async()=>[[]]}),e=>e.status===404);
  await assert.rejects(s.done(7,22,{execute:async(sql,params)=>{assert.match(sql,/WHERE id=\? AND id_usuario=\?/);assert.deepEqual(Array.from(params),[22,7]);return [{affectedRows:0}]}}),e=>e.status===404);
});

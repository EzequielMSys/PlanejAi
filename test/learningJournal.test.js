const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function service(overrides={}) {
  const context={module:{exports:{}},require:name=>name==='node:crypto'?require(name):overrides[name] || {}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/learningJournalService'),'utf8'),context);
  return context.module.exports;
}
const body={tipo:'explicacao',titulo:'Inércia',texto:'Minha explicação',chave:'1234567890abcdef'};
test('journal validates bounded text, ids and request keys before a write',async()=>{
  let calls=0;
  const db={getConnection:async()=>{calls++;throw Error('must not query')}};
  for(const input of [{...body,texto:''},{...body,texto:'a'.repeat(4001)},{...body,titulo:'a'.repeat(161)},{...body,tipo:'admin'},{...body,chave:'short'},{...body,idConteudo:'1 OR 1=1'}]) await assert.rejects(service().write(1,null,input,db),e=>e.status===400);
  assert.equal(calls,0);
});
test('journal list is owner scoped, bounded and computes revisit dates in the database',async()=>{
  let calls=0;
  const result=await service().list(7,{tipo:'explicacao',pagina:2,idConteudo:15,id_usuario:99},{execute:async(sql,params)=>{
    calls++;assert.match(sql,/d.id_usuario=\?/);assert.match(sql,/INTERVAL 3 DAY/);assert.match(sql,/LIMIT 21 OFFSET 20/);
    assert.deepEqual(Array.from(params),[7,'explicacao',15]);return [Array.from({length:21},(_,id)=>({id}))];
  }});
  assert.equal(result.itens.length,20);assert.equal(result.mais,true);assert.equal(calls,1);
  for(const query of [{pagina:0},{pagina:1001},{tipo:'users'}])await assert.rejects(service().list(7,query,{}),e=>e.status===400);
});
test('another account cannot inspect, append to or remove a journal',async()=>{
  const calls=[];let rolled=false,released=false;
  const conn={execute:async(sql,params)=>{calls.push({sql,params});return [[]]},beginTransaction:async()=>{},rollback:async()=>{rolled=true},release:()=>{released=true}};
  await assert.rejects(service().detail(2,91,null,conn),e=>e.status===404);
  await assert.rejects(service().write(2,91,{...body}, {getConnection:async()=>conn}),e=>e.status===404);
  await assert.rejects(service().remove(2,91,{execute:async(sql,params)=>{assert.deepEqual(Array.from(params),[91,2]);return [{affectedRows:0}]}}),e=>e.status===404);
  assert.ok(calls.some(c=>/id_usuario=\? FOR UPDATE/.test(c.sql)&&c.params[1]===2));assert.ok(rolled&&released);
});
test('lost-response retries reuse the committed version and reject edited payloads with the same key',async()=>{
  let hash,writes=0,commits=0;
  const conn={beginTransaction:async()=>{},commit:async()=>{commits++},rollback:async()=>{},release:()=>{},execute:async(sql,params)=>{
    if(sql.startsWith('SELECT id_diario'))return [hash?[{id_diario:8,hash_payload:hash}]:[]];
    if(sql.startsWith('INSERT INTO diario_aprendizagem')){writes++;return [{insertId:8}]}
    if(sql.startsWith('INSERT INTO diario_passos')){writes++;hash=params[5]}
    return [[]];
  }};
  const db={getConnection:async()=>conn},s=service();
  const created=await s.write(7,null,body,db),retry=await s.write(7,null,body,db);
  assert.equal(created.id,8);assert.equal(retry.repetido,true);assert.equal(writes,2);assert.equal(commits,2);
  await assert.rejects(s.write(7,null,{...body,texto:'Outro texto'},db),e=>e.status===409);assert.equal(writes,2);
});
test('resolving a doubt requires a recorded explanation and reopening preserves the history',async()=>{
  let resolved=0;const updates=[],entries=[];
  const conn={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},execute:async(sql,params)=>{
    if(sql.startsWith('SELECT *'))return [[{id:8,tipo:'duvida',resolvido:resolved}]];
    if(sql.startsWith('INSERT INTO diario_passos'))entries.push(params[2]);
    if(sql.startsWith('UPDATE diario_aprendizagem')){resolved=params[0];updates.push(resolved)}
    return [[]];
  }};
  const db={getConnection:async()=>conn},s=service();
  await s.write(7,8,{...body,tipo:'resolucao'},db);
  await assert.rejects(s.write(7,8,{...body,tipo:'tentativa'},db),e=>e.status===409);
  await s.write(7,8,{...body,tipo:'reabertura'},db);
  assert.deepEqual(updates,[1,0]);assert.deepEqual(entries,['resolucao','reabertura']);
});
test('Lumi sees only explicitly selected owned steps, without automatic profile or chat retrieval',async()=>{
  const calls=[],payloads=[];
  const s=service({'./iaService':{_test:{montarPayloadChat:messages=>({messages})}}});
  const db={execute:async(sql,params)=>{calls.push({sql,params});
    if(sql.startsWith('SELECT tipo'))return [[{tipo:'duvida'}]];
    if(sql.startsWith('SELECT id,tipo'))return [[{id:12,tipo:'tentativa',texto:'Somente este trecho',criado_em:'2026-10-25'}]];
    return [{affectedRows:1}];
  }};
  const provider={client:{chat:{completions:{create:async payload=>{payloads.push(payload);return {choices:[{message:{content:'Uma pergunta'}}]}}}}}};
  assert.equal((await s.assist(7,8,[12],db,provider)).resposta,'Uma pergunta');
  const query=calls.find(c=>c.sql.startsWith('SELECT id,tipo'));
  assert.deepEqual(Array.from(query.params),[8,7,12]);
  assert.equal(payloads[0].messages.length,2);assert.match(payloads[0].messages[1].content,/Somente este trecho/);assert.ok(!/titulo|id_usuario/.test(payloads[0].messages[1].content));
  const denied={execute:async sql=>sql.startsWith('SELECT tipo')?[[{tipo:'duvida'}]]:[[]]};
  await assert.rejects(s.assist(7,8,[99],denied,provider),e=>e.status===404);assert.equal(payloads.length,1);
});
test('Lumi rejects empty, excessive or duplicate selection and caps concurrent consumption atomically',async()=>{
  const s=service();
  for(const selected of [[],[1,1],[1,2,3,4,5],['not an id']])await assert.rejects(s.assist(7,8,selected,{}),e=>e.status===400);
  let sent=false;
  const db={execute:async sql=>{
    if(sql.startsWith('SELECT tipo'))return [[{tipo:'duvida'}]];
    if(sql.startsWith('SELECT id,tipo'))return [[{id:1,texto:'Dúvida'}]];
    if(sql.startsWith('UPDATE'))assert.match(sql,/total<20/);
    return [{affectedRows:0}];
  }};
  await assert.rejects(s.assist(7,8,[1],db,{client:{chat:{completions:{create:async()=>{sent=true}}}}}),e=>e.status===429);
  assert.equal(sent,false);
});
test('personal data export includes only this account’s journal, versions and Lumi usage',async()=>{
  const calls=[];
  const context={module:{exports:{}},require:()=>({execute:async(sql,params)=>{calls.push({sql,params});return [[]]}})};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/privacyService'),'utf8'),context);
  const result=await context.module.exports.exportUserData(7);
  for(const table of ['diario_aprendizagem','diario_passos','diario_lumi_uso','fechamentos_estudo','leitura_destaques','lumi_conversas','revisoes_destaques','flashcard_revisoes']) {
    assert.ok(Object.hasOwn(result.records,table));
    const query=calls.find(call=>call.sql.includes('`'+table+'`'));
    assert.match(query.sql,/WHERE id_usuario = \?/);assert.deepEqual(Array.from(query.params),[7]);
  }
});

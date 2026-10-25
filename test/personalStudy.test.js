const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function service(catalog={content:async()=>null}){
  const ctx={module:{exports:{}},require:name=>name==='./unifiedSearchService'?catalog:{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/personalStudyService'),'utf8'),ctx);
  return ctx.module.exports;
}
const user={id_usuario:7,tipo:'aluno'};
function database(initial=[],unavailable=false){
  let rows=structuredClone(initial),prior,rollbacks=0;
  const calls=[];
  const conn={beginTransaction:async()=>{prior=structuredClone(rows)},commit:async()=>{},rollback:async()=>{rows=prior;rollbacks++},release:()=>{},execute:async(sql,p)=>{
    calls.push({sql,p});
    if(sql.startsWith('SELECT id_usuario'))return [[{id_usuario:7}]];
    if(sql.startsWith('SELECT')&&sql.includes('FROM mesa_estudo'))return [rows.filter(row=>row.id_usuario===(sql.includes('WHERE id=?')?p[1]:p[0])&&(!sql.includes('WHERE id=?')||row.id===p[0])).sort((a,b)=>a.posicao-b.posicao)];
    if(sql.includes('FROM diario_aprendizagem WHERE'))return [!unavailable&&p[0]===7?[{id:p[1],titulo:'Dúvida minha',resolvido:0}]:[]];
    if(sql.startsWith('INSERT INTO mesa')){const row={id:rows.length+10,id_usuario:p[0],tipo:p[1],id_origem:p[2],posicao:p[3]};rows.push(row);return [{insertId:row.id}];}
    if(sql.startsWith('UPDATE mesa')){const row=rows.find(row=>row.id===p[1]&&row.id_usuario===p[2]);if(row)row.posicao=p[0];return [{affectedRows:row?1:0}];}
    if(sql.startsWith('DELETE')){const before=rows.length;rows=rows.filter(row=>!(row.id===p[0]&&row.id_usuario===p[1]));return [{affectedRows:before-rows.length}];}
    throw Error(`Unexpected query: ${sql}`);
  }};
  return {db:{execute:conn.execute,getConnection:async()=>conn},calls,rows:()=>rows,rollbacks:()=>rollbacks};
}
test('desk validates types and IDs before opening a connection',async()=>{
  for(const body of [{tipo:'usuario',idOrigem:1},{tipo:'duvida',idOrigem:0},{tipo:'duvida',idOrigem:'1 OR 1=1'},{tipo:'duvida',idOrigem:1.5}])await assert.rejects(service().pin(user,body,{}),e=>e.status===400);
});
test('pinning is retry safe and serializes the six-item cap under an account lock',async()=>{
  const data=database(),s=service();
  const first=await s.pin(user,{tipo:'duvida',idOrigem:21},data.db);
  assert.equal((await s.pin(user,{tipo:'duvida',idOrigem:21},data.db)).id,first.id);
  for(let i=22;i<27;i++)await s.pin(user,{tipo:'duvida',idOrigem:i},data.db);
  await assert.rejects(s.pin(user,{tipo:'duvida',idOrigem:27},data.db),e=>e.status===409);
  assert.equal(data.rows().length,6);assert.match(data.calls[0].sql,/FOR UPDATE/);
  assert.equal(data.rollbacks(),1);
});
test('foreign sources cannot be pinned and failures roll back',async()=>{
  const data=database([],true);
  await assert.rejects(service().pin(user,{tipo:'duvida',idOrigem:22},data.db),e=>e.status===404);
  assert.equal(data.rows().length,0);assert.equal(data.rollbacks(),1);
});
test('reordering cannot move another account item and uses stable contiguous positions',async()=>{
  const data=database([{id:1,id_usuario:7,tipo:'duvida',id_origem:21,posicao:8},{id:2,id_usuario:7,tipo:'duvida',id_origem:22,posicao:9},{id:3,id_usuario:8,tipo:'duvida',id_origem:23,posicao:1}]),s=service();
  await s.move(user,2,'subir',data.db);
  assert.equal(data.rows().find(r=>r.id===2).posicao,1);assert.equal(data.rows().find(r=>r.id===1).posicao,2);
  await assert.rejects(s.move(user,3,'subir',data.db),e=>e.status===404);
  await assert.rejects(s.move(user,1,'sideways',data.db),e=>e.status===400);
  await assert.rejects(s.remove(user,3,data.db),e=>e.status===404);
  assert.equal(data.rows().find(r=>r.id===3).id_usuario,8);
});
test('unavailable desk references reveal no stale title and are reauthorized when opened',async()=>{
  const data=database([{id:1,id_usuario:7,tipo:'duvida',id_origem:21,posicao:1}],true),s=service();
  const result=await s.desk(user,data.db);assert.equal(result.itens[0].disponivel,false);assert.equal(result.itens[0].titulo,'Item indisponível');
  await assert.rejects(s.open(user,1,data.db),e=>e.status===404);
  await s.remove(user,1,data.db);assert.equal(data.rows().length,0);
  assert.equal(data.calls.filter(c=>c.sql.startsWith('DELETE')).length,1);
  assert.ok(!data.calls.some(c=>c.sql.startsWith('DELETE FROM diario')));
});
test('a note pin never authorizes a material or returns its file URLs',async()=>{
  let catalogCalls=0;
  const s=service({content:async()=>{catalogCalls++;return null}});
  const db={execute:async(sql,p)=>{assert.match(sql,/anotacoes_estudo/);assert.match(sql,/a.id_usuario=\?/);assert.equal(p[0],7);assert.ok(!sql.includes('materiais'));assert.ok(!sql.includes('c.link'));return [[{id_conteudo:9,titulo:'Meu texto',trecho:'Resumo'}]];}};
  assert.equal((await s.source(user,'anotacao',9,db)).titulo,'Meu texto');
  assert.equal(await s.source(user,'material',9,db),null);assert.equal(catalogCalls,1);
});
test('understanding is bounded, personal and requires an earlier explanation before reporting a new version',async()=>{
  const s=service();let sql;
  const result=await s.understanding(user,{pagina:2},{execute:async(query,p)=>{sql=query;assert.deepEqual(Array.from(p),[7]);return [Array.from({length:21},(_,id)=>({id}))];}});
  assert.equal(result.itens.length,20);assert.equal(result.mais,true);assert.match(sql,/LIMIT 21 OFFSET 20/);assert.match(sql,/anterior.id_usuario=d.id_usuario/);assert.match(sql,/p.tipo='resolucao' AND d.resolvido=1/);
  for(const pagina of [0,1001,'bad'])await assert.rejects(s.understanding(user,{pagina},{}),e=>e.status===400);
});
test('exact evidence and the previous version are owner scoped even for old entries',async()=>{
  const calls=[],s=service(),db={execute:async(sql,p)=>{calls.push({sql,p});return calls.length===1?[[{id:100,id_diario:9,tipo:'explicacao',texto:'Nova versão'}]]:[[{id:2,tipo:'explicacao',texto:'Versão anterior'}]];}};
  const result=await s.evidence(user,100,db);
  assert.equal(result.anterior.id,2);assert.equal(calls[0].p[1],7);assert.equal(calls[1].p[1],7);assert.match(calls[1].sql,/id<\? ORDER BY id DESC LIMIT 1/);
  await assert.rejects(s.evidence({id:8},100,{execute:async()=>[[]]}),e=>e.status===404);
});

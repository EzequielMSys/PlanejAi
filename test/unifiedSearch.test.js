const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function service() {
  const context={module:{exports:{}},require:()=>({})};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/unifiedSearchService'),'utf8'),context);
  return context.module.exports;
}
test('search rejects broad, oversized, malformed and unbounded requests before querying',async()=>{
  const search=service();let calls=0;const db={execute:async()=>{calls++;return [[]]}};
  for(const input of [{q:'a'},{q:'a'.repeat(101)},{q:['math']},{q:'math',tipo:'usuarios'},{q:'math',pagina:0},{q:'math',pagina:1.5},{q:'math',pagina:101}]) {
    await assert.rejects(search.search({id:11,tipo:'aluno'},input,db),error=>error.status===400);
  }
  assert.equal(calls,0);
});
test('search escapes wildcard literals, binds the term and uses only authenticated owner scopes',async()=>{
  const search=service(),calls=[];
  await search.search({id:11,tipo:'aluno'},{q:"50%_! ' OR 1=1",id_usuario:22},{execute:async(sql,params)=>{calls.push({sql,params});return [[]]}});
  assert.equal(calls.length,6);
  for(const call of calls){assert.ok(!call.sql.includes("OR 1=1"));assert.ok(call.params.includes("%50!%!_!! ' OR 1=1%"));assert.ok(!call.params.includes(22));}
  for(const call of calls.slice(0,2)) {assert.match(call.sql,/p.id_usuario=\?/);assert.deepEqual(Array.from(call.params.slice(0,1)),[11]);}
  for(const call of calls.slice(2)) {assert.match(call.sql,/WHERE [arhl].id_usuario=\?/);assert.equal(call.params[0],11);}
});
test('staff catalog access never expands ownership of personal notes and essays',async()=>{
  const calls=[];
  await service().search({id:33,tipo:'dono'},{q:'Newton'},{execute:async(sql,params)=>{calls.push({sql,params});return [[]]}});
  assert.ok(!calls[1].sql.includes('p.id_usuario'));
  assert.equal(calls[2].params[0],33);assert.equal(calls[3].params[0],33);
  assert.match(calls[2].sql,/a.id_usuario=\?/);assert.match(calls[3].sql,/r.id_usuario=\?/);
});
test('results are bounded, ordered in SQL, paginated and do not expose full texts or raw links',async()=>{
  const search=service();
  const text='x'.repeat(500)+' energia '+ 'y'.repeat(500);
  const result=await search.search({id:11,tipo:'aluno'},{q:'energia',tipo:'redacoes',pagina:2},{execute:async(sql)=>{
    assert.match(sql,/LIMIT 13 OFFSET 12/);assert.match(sql,/ORDER BY/);
    return [Array.from({length:13},(_,index)=>({id:index+1,titulo:'Texto',texto:text,link:'private',id_usuario:11}))];
  }});
  assert.equal(result.grupos[0].itens.length,12);assert.equal(result.grupos[0].mais,true);
  const item=result.grupos[0].itens[0];assert.ok(item.trecho.includes('energia'));assert.ok(item.trecho.length<200);assert.equal(item.texto,undefined);assert.equal(item.link,undefined);assert.equal(item.id_usuario,undefined);
});
test('opening a result rechecks access in the SQL and invalid ids never reach the database',async()=>{
  let calls=0;const db={execute:async(sql,params)=>{calls++;assert.match(sql,/c.id_conteudo=\? AND/);assert.match(sql,/p.id_usuario=\?/);assert.deepEqual(Array.from(params),[71,11]);return [[]]}};
  assert.equal(await service().content({id:11,tipo:'aluno'},71,db),null);
  for(const id of ['1 OR 1=1',-1,0])assert.equal(await service().content({id:11,tipo:'aluno'},id,db),null);
  assert.equal(calls,1);
});
test('a source failure rejects the search instead of presenting incomplete data as no matches',async()=>{
  await assert.rejects(service().search({id:11,tipo:'aluno'},{q:'math'},{execute:async()=>{throw new Error('database unavailable')}}),/unavailable/);
});
test('an orphaned personal note opens only its metadata and cannot grant catalog or file access',async()=>{
  const search=service();
  await search.content({id:11,tipo:'dono'},71,{execute:async(sql,params)=>{
    assert.match(sql,/a.id_usuario=\?/);assert.ok(!sql.includes('c.link'));assert.ok(!sql.includes('c.materiais'));assert.deepEqual(Array.from(params),[71,11]);return [[]];
  }},true);
  const scope=search.contentScope({id:11,tipo:'aluno'});
  assert.ok(!scope.sql.includes('anotacoes_estudo'));assert.ok(!scope.sql.includes('revisoes_estudo'));
});
test('HTTP search requires authentication, disables caching and keeps errors recoverable',async()=>{
  const express=require('express');
  let failed=false,captured;
  const context={module:{exports:{}},require:name=>name==='express'?express:name.includes('authMiddleware')?{authMiddleware:(req,res,next)=>{if(req.headers.authorization!=='fixture')return res.sendStatus(401);req.usuario={id:11,tipo:'aluno'};next()}}:{
    search:async(user,input)=>{captured=user;if(failed)throw new Error('private database detail');return {query:input.q,grupos:[]}},
    content:async()=>null,
  }};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/routes/searchRoutes'),'utf8'),context);
  const app=express();app.use('/api/busca',context.module.exports);
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/busca`;
  try {
    assert.equal((await fetch(base+'?q=math')).status,401);
    const response=await fetch(base+'?q=math&id_usuario=22',{headers:{Authorization:'fixture'}});
    assert.equal(response.status,200);assert.equal(captured.id,11);assert.equal(response.headers.get('cache-control'),'private, no-store');
    assert.equal((await fetch(base+'/conteudos/99',{headers:{Authorization:'fixture'}})).status,404);
    failed=true;const error=await fetch(base+'?q=math',{headers:{Authorization:'fixture'}});
    assert.equal(error.status,503);assert.ok(!(await error.text()).includes('private database detail'));
  } finally {await new Promise(resolve=>server.close(resolve));}
});

test('material excerpts include matching resource titles without exposing private source URLs',async()=>{
 const result=await service().search({id:11,tipo:'aluno'},{q:'energia',tipo:'materiais'},{execute:async()=>[[{id:9,titulo:'Física',texto:'Exatas',recursos:JSON.stringify([{titulo:'Trabalho e energia',url:'https://source.invalid/?secret=private'}])}]]});
 const item=result.grupos[0].itens[0];assert.match(item.trecho,/Trabalho e energia/);assert.ok(!JSON.stringify(item).includes('secret'));assert.equal(item.recursos,undefined);
});

test('highlight and conversation search remain private for staff, exclude archived records and bound excerpts',async()=>{
 for(const type of ['destaques','conversas']){let captured;const result=await service().search({id:33,tipo:'dono'},{q:'aceleração',tipo:type,pagina:2},{execute:async(sql,params)=>{captured={sql,params};return [[{id:91,titulo:'Newton',texto:'Minha aceleração e anotação.',mensagens:JSON.stringify([{role:'user',content:'O que significa aceleração?'},{role:'assistant',content:'Uma explicação.'}]),contexto:JSON.stringify([{tipo:'anotacao',titulo:'Ideia',texto:'Uma ideia própria.'}])}]]}});assert.equal(captured.params[0],33);assert.match(captured.sql,/arquivado=0/);assert.match(captured.sql,/LIMIT 13 OFFSET 12/);const item=result.grupos[0].itens[0];assert.match(item.trecho,/aceleração/);assert.equal(item.mensagens,undefined);assert.equal(item.contexto,undefined);assert.ok(item.trecho.length<200);if(type==='conversas')assert.match(captured.sql,/JSON_SEARCH/)}
});

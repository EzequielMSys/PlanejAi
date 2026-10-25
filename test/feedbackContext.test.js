const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {validateContext,MAX_IMAGE}=require('../src/services/feedbackContext');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVZkAAAAASUVORK5CYII=','base64');
const body={categoria:'MELHORIA',pagina:'/busca',mensagem:'Sugiro uma forma de encontrar meus textos.',detalhes:'Um exemplo próprio.',captura:{mime:'image/png',base64:png.toString('base64')}};
test('feedback context is optional and a valid screenshot is bounded and decoded',()=>{
 assert.equal(validateContext({categoria:'DUVIDA'}),null);const data=validateContext(body);assert.equal(data.tipo,'MELHORIA');assert.equal(data.pagina,'/busca');assert.deepEqual(data.image,png);assert.equal(validateContext({...body,captura:undefined}).image,null);
});
test('feedback rejects hidden URLs, oversized data and disguised image formats',()=>{
 for(const patch of [{pagina:'https://evil.test/'},{pagina:'/busca?q=segredo'},{pagina:'//evil.test'},{detalhes:'a'.repeat(1001)},{captura:{mime:'image/svg+xml',base64:png.toString('base64')}},{captura:{mime:'image/png',base64:Buffer.from('<html>script</html>').toString('base64')}},{captura:{mime:'image/png',base64:Buffer.alloc(MAX_IMAGE+1).toString('base64')}}])assert.throws(()=>validateContext({...body,...patch}),e=>e.status===400);
});
function service(fail=false){
 const calls=[],connection={beginTransaction:async()=>calls.push('begin'),execute:async(sql,params)=>{calls.push({sql,params});if(fail&&sql.includes('suporte_contexto'))throw Error('db');return [{insertId:92}]},commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback'),release:()=>calls.push('release')};
 const pool={getConnection:async()=>connection,execute:async(sql,params)=>{calls.push({sql,params});return [[{captura:png,captura_mime:'image/png'}]]}};
 const context={module:{exports:{}},require:name=>name==='../config/db'?pool:name==='./rateLimitStore'?{consume:async()=>1}:require('../src/services/feedbackContext')};vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/supportService'),'utf8'),context);return {api:context.module.exports,calls};
}
test('feedback request and private attachment commit together and roll back on failure',async()=>{
 const ok=service();assert.equal((await ok.api.create(7,body)).id,92);assert.ok(ok.calls.includes('commit'));assert.ok(!ok.calls.includes('rollback'));assert.equal(ok.calls.at(-1),'release');assert.equal(ok.calls.find(call=>call.sql?.includes('suporte_solicitacoes')).params[1],'DUVIDA');
 const failure=service(true);await assert.rejects(failure.api.create(7,body));assert.ok(failure.calls.includes('rollback'));assert.ok(!failure.calls.includes('commit'));assert.equal(failure.calls.at(-1),'release');
});
test('private screenshot lookup restricts students and staff to their own request; owner can attend',async()=>{
 const {api,calls}=service();await api.screenshot(92,{id:7,tipo:'aluno'});assert.match(calls[0].sql,/AND s.id_usuario=\?/);assert.deepEqual([...calls[0].params],[92,7]);
 await api.screenshot(92,{id:8,tipo:'docente'});assert.deepEqual([...calls[1].params],[92,8]);
 await api.screenshot(92,{id:1,tipo:'dono'});assert.ok(!calls[2].sql.includes('AND s.id_usuario'));assert.equal(await api.screenshot('abc',{id:7,tipo:'aluno'}),null);assert.equal(calls.length,3);
});

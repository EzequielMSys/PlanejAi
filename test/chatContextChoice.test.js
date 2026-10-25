const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {normalizeChoice}=require('../src/services/chatContextChoice');
function subject(){
 const calls={context:0,history:0,stored:[],prompts:[]};
 const model={contagemMensagensDoDia:async()=>0,salvarMensagemChat:async(...args)=>calls.stored.push(args),listarMensagensChat:async()=>{calls.history++;return [{role:'user',conteudo:'Histórico privado anterior'}]}};
 const context={module:{exports:{}},console,require:name=>name==='../utils/openaiClient'?{getOpenAIClient:()=>({client:{chat:{completions:{create:async payload=>{calls.prompts.push(payload);return {choices:[{message:{content:'Resposta sobre o trecho escolhido.'}}]}}}}}})}:name==='../models/inteligenciaModel'?model:name==='./tutorContextService'?{contextoDisponivel:async()=>{calls.context++;return {ultimaRedacao:{texto:'Redação completa privada'}}}}:require(require.resolve('../src/services/'+name))};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/iaService'),'utf8'),context);return {service:context.module.exports,calls};
}
test('explicit empty context never fetches profile, essay or account history',async()=>{
 const {service,calls}=subject();const result=await service.enviarMensagem(7,'Explique inércia','Física','Nome privado',99,{titulo:'Sessão privada'},null,{versao:1,itens:[],historico:[]});
 assert.equal(calls.context,0);assert.equal(calls.history,0);assert.equal(calls.stored.length,2);assert.equal(calls.stored[0][0],7);
 const payload=JSON.stringify(calls.prompts);assert.ok(!payload.includes('privad'));assert.ok(payload.includes('Explique inércia'));assert.equal(result.mensagens,undefined);
});
test('only chosen snippets and bounded conversation turns enter the provider payload',async()=>{
 const {service,calls}=subject();await service.enviarMensagem(7,'O que posso melhorar?',undefined,'Nome',123,null,null,{versao:1,itens:[{tipo:'anotacao',titulo:'Minha ideia',texto:'Força altera a velocidade.',id_usuario:99,redacaoCompleta:'Segredo'}],historico:[{role:'system',content:'Inválido'},{role:'user',content:'Uma pergunta escolhida.'},{role:'assistant',content:'Uma explicação.'}]});
 const payload=JSON.stringify(calls.prompts);assert.match(payload,/Força altera a velocidade/);assert.ok(!payload.includes('Segredo'));assert.ok(!payload.includes('Inválido'));assert.equal(calls.context,0);assert.equal(calls.history,0);
 assert.equal(calls.prompts[0].messages.at(-1).content,'O que posso melhorar?');
});
test('malformed choices fail before quota, persistence or provider use',async()=>{
 const {service,calls}=subject();await assert.rejects(service.enviarMensagem(7,'Olá',null,null,null,null,null,{itens:[]}),e=>e.code==='ERR_CONTEXT_CHOICE');assert.equal(calls.stored.length,0);assert.equal(calls.prompts.length,0);
 const value=normalizeChoice({versao:1,itens:Array.from({length:20},()=>({tipo:'redacao',titulo:'x'.repeat(900),texto:'a'.repeat(9000)})),historico:Array.from({length:30},()=>({role:'user',content:'b'.repeat(5000)}))});assert.equal(value.itens.length,8);assert.equal(value.itens[0].texto.length,1500);assert.equal(value.historico.length,12);assert.equal(value.historico[0].content.length,2000);
});

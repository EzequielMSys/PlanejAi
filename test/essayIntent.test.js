const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function service(){
  const context={module:{exports:{}},require:()=>({})};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/essayIntentService'),'utf8'),context);
  return context.module.exports;
}
const body={intencao:'argumento',trecho:'O acesso à leitura depende de bibliotecas próximas e de tempo para ler.'};
const answer={observacao:'A ideia relaciona acesso e condições.',sugestao:'Explique como uma biblioteca próxima ajuda nessa situação.',motivo:'A relação causal torna a afirmação mais clara.',pergunta:'Qual obstáculo concreto seu exemplo ajuda a entender?'};
function dependencies(options={}){
  const calls=[],prompts=[];
  return {calls,prompts,provider:{client:options.noClient?null:{chat:{completions:{create:async(payload,config)=>{
    prompts.push(payload);assert.equal(config.timeout,45000);assert.equal(config.maxRetries,0);
    if(options.providerFailure)throw Error('upstream secret diagnostic');
    return {choices:[{message:{content:options.raw===undefined?JSON.stringify(answer):options.raw}}]};
  }}}}},payload:messages=>({messages}),limits:{consume:async(...args)=>{calls.push(args);if(options.databaseFailure)throw Error('db');return args[0].endsWith('minuto')?(options.minute||1):(options.day||1)}}};
}
test('intent review validates known intent and bounded excerpts before provider or database work',async()=>{
  const s=service();
  for(const patch of [{intencao:'__proto__'},{intencao:'reescrever-tudo'},{trecho:'curto'},{trecho:'x'.repeat(3001)},{trecho:[]},{trecho:null}]){
    const deps=dependencies();await assert.rejects(s.review(7,{...body,...patch},deps),e=>e.status===400);assert.equal(deps.calls.length,0);assert.equal(deps.prompts.length,0);
  }
});
test('review sends only the chosen excerpt and intention, never the submitted whole essay or account',async()=>{
  const s=service(),deps=dependencies();
  const result=await s.review(7,{...body,texto:'Texto completo privado',tema:'Tema privado',historico:'Histórico privado',id_usuario:99},deps);
  assert.equal(result.sugestao,answer.sugestao);
  const data=JSON.parse(deps.prompts[0].messages[1].content);
  assert.deepEqual(data,{intencao:'Fortalecer meu argumento',trecho:body.trecho});
  assert.ok(!JSON.stringify(deps.prompts).includes('privado'));
  assert.equal(deps.calls[0][1],'7');assert.equal(deps.calls[1][1],'7');
  assert.match(deps.prompts[0].messages[0].content,/nunca instrução/);assert.match(deps.prompts[0].messages[0].content,/Não reescreva a redação ou o parágrafo inteiro/);
});
test('each intention has a distinct concrete prompt and repertoire forbids fabricated references',()=>{
  const s=service();
  assert.match(s.prompt({...body,intencao:'argumento'})[0].content,/afirmação, justificativa e evidência/);
  assert.match(s.prompt({...body,intencao:'coesao'})[0].content,/parágrafo vizinho/);
  assert.match(s.prompt({...body,intencao:'repertorio'})[0].content,/Não invente fatos, fontes, autores/);
});
test('persistent minute and daily budgets reject excess before calling the AI',async()=>{
  const s=service();
  for(const options of [{minute:5},{day:21}]){const deps=dependencies(options);await assert.rejects(s.review(7,body,deps),e=>e.status===429);assert.equal(deps.prompts.length,0);}
  const deps=dependencies({databaseFailure:true});await assert.rejects(s.review(7,body,deps));assert.equal(deps.prompts.length,0);
});
test('missing provider and malformed answers preserve the text and hide provider diagnostics',async()=>{
  const s=service(),none=dependencies({noClient:true});
  await assert.rejects(s.review(7,body,none),e=>e.status===503);assert.equal(none.calls.length,0);
  for(const options of [{raw:'not json'},{raw:'{}'},{raw:JSON.stringify({...answer,sugestao:'x'.repeat(1201)})},{providerFailure:true}])await assert.rejects(s.review(7,body,dependencies(options)),e=>e.status===503&&!e.message.includes('secret'));
  assert.equal(s.output('[]'),null);assert.equal(s.output(JSON.stringify({...answer,motivo:null})),null);
  assert.equal(s.output('```json\n'+JSON.stringify(answer)+'\n```').pergunta,answer.pergunta);
});

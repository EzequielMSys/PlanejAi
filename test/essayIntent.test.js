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

test('a new percentage is rejected while figures already supplied in the excerpt remain eligible',()=>{
 const s=service(),raw=JSON.stringify({...answer,sugestao:'Em X cidade a leitura aumentou 15% após a abertura da biblioteca.'});
 assert.equal(s.output(raw,body.trecho),null);
 assert.equal(s.output(raw,'O texto enviado informa aumento de 15 por cento.' ).sugestao,JSON.parse(raw).sugestao);
 assert.equal(s.output(JSON.stringify({...answer,motivo:'Um aumento de 2,5 por cento.'}),'Texto sem percentual.'),null);
});
test('all intentions forbid fabricated evidence and single-paragraph cohesion is rejected before spending quota',async()=>{
 const s=service();for(const intencao of ['argumento','coesao','repertorio'])assert.match(s.prompt({...body,intencao})[0].content,/não invente estatísticas, percentuais/);
 const limited=dependencies();await assert.rejects(s.review(7,{...body,intencao:'coesao'},limited),e=>e.status===400);assert.equal(limited.calls.length,0);
 assert.equal((await s.review(7,{...body,intencao:'coesao',trecho:body.trecho+'\n\n'+body.trecho},dependencies())).intencao,'coesao');
});

test('fictional repertoire receives an explicit source boundary and a separate prompt constraint',async()=>{
 const s=service(),deps=dependencies(),trecho='No meu romance fictício, uma jovem usa a biblioteca escolar para conseguir livros.';
 const result=await s.review(7,{intencao:'repertorio',trecho},deps);
 assert.match(result.avisoFonte,/fontes verificáveis/);
 assert.equal(deps.prompts[0].messages.length,3);assert.match(deps.prompts[0].messages[1].content,/NÃO COMPROVA/);
 assert.equal(JSON.parse(deps.prompts[0].messages[2].content).trecho,trecho);
});

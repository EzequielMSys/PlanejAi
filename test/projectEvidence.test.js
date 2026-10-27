const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('crypto');
const guided=require('../src/services/guidedStudyService'),port=require('../src/services/researchPortfolioService'),evidence=require('../src/services/projectEvidenceService'),database=require('./helpers/guidedStore'),today=require('../src/services/flashcardService').today;
const write=(db,r,body)=>guided.change(7,r.id,{key:randomUUID(),version:r.version,...body},db);
const plan=extra=>({action:'observationPlan',title:'Duração de duas atividades',question:'O que muda entre as condições?',observe:'Anotar duração e condições de cada tentativa.',unit:'minutos',conditions:'Registrar se consultei um exemplo.',count:5,limits:'Poucas observações, atividades diferentes.',...extra});
const row=(r,extra)=>({action:'observation',plan:r.observationPlans.at(-1).id,label:'Tentativa observada',date:today(),kind:'medido',value:0,conditions:'Sem interrupções.',note:'NOTA_PRIVADA',...extra});
const select=(r,extra)=>({action:'observationSelection',plan:r.observationPlans.at(-1).id,rows:r.observations.map(v=>v.id),title:'Minha seleção',purpose:'Conferir as diferenças.',limits:'Não comparo dificuldades equivalentes.',...extra});
async function setup(){const db=database();let r=await guided.create(7,'projeto',{key:randomUUID(),title:'Investigar condições',question:'Como comparar observações?',scope:'Poucas tentativas.',subjects:['Matemática'],minutes:30,deliverable:'texto'},db);r=await write(db,r,plan());return {db,r};}
async function selected(){const value=await setup();value.r=await write(value.db,value.r,row(value.r));value.r=await write(value.db,value.r,row(value.r,{kind:'ausente',value:null,note:'Não consegui observar.'}));value.r=await write(value.db,value.r,select(value.r));return value;}
async function origin(db,r){return port.resolve(7,{type:'coleta',record:r.id,step:r.observationSelections[0].id},db);}
const argument=(source,extra)=>({action:'argumentVersion',title:'Concluir dentro do recorte',claim:'A diferença observada depende das condições.',evidences:[{ref:source.ref,sourceHash:source.sourceHash,parts:['evidence'],references:[],justification:'As condições registradas limitam a comparação.'}],counterpoint:'A tarefa pode ter sido diferente.',alternative:'A familiaridade pode contribuir.',limits:'Não atribuo causa nem generalizo.',...extra});
const feedback={claro:'O registro distingue valores e ausências.',lacuna:'As condições não demonstram causalidade.',pergunta:'O que precisaria manter igual para comparar?',proximoPasso:'Conferir as condições.',incerteza:'Só recebi a seleção escolhida.'};
const provider=capture=>({chat:{completions:{create:async payload=>{capture?.(payload);return {choices:[{message:{content:JSON.stringify(feedback)}}]};}}}});
test('plano nasce antes dos dados e valida quantidade, unidade e limites',async()=>{
  const {db,r}=await setup();assert.equal(r.observations,undefined);assert.equal(r.observationPlans[0].count,5);
  for(const extra of [{count:0},{count:41},{unit:''},{limits:''}])await assert.rejects(write(db,r,plan(extra)),e=>e.status===400);
});
test('zero medido e ausência permanecem distintos e ausência não aceita um número',async()=>{
  const {db,r:p}=await setup();let r=await write(db,p,row(p));r=await write(db,r,row(r,{kind:'ausente',value:null,note:'Não houve observação.'}));assert.equal(r.observations[0].value,0);assert.equal(r.observations[1].value,null);
  for(const extra of [{kind:'ausente',value:0},{kind:'ausente',value:null,note:''},{value:null},{value:NaN},{date:'2026-02-30'}])await assert.rejects(write(db,r,row(r,extra)),e=>e.status===400);
});
test('correção conserva o valor anterior, pede motivo e rejeita corrigir versão ultrapassada',async()=>{
  const {db,r:p}=await setup();let r=await write(db,p,row(p));const first=r.observations[0];await assert.rejects(write(db,r,row(r,{replaces:first.id,value:8})),e=>e.status===400);
  const body={...row(r,{replaces:first.id,value:8,reason:'Revisei a anotação.'}),key:randomUUID(),version:r.version};r=await guided.change(7,r.id,body,db);assert.equal(r.observations[0].value,0);assert.equal(evidence.latestRows(r,r.observationPlans[0].id)[0].value,8);assert.equal((await guided.change(7,r.id,body,db)).observations.length,2);
  await assert.rejects(write(db,r,row(r,{replaces:first.id,value:9,reason:'Outra correção'})),e=>e.status===409);
});
test('revisão do plano preserva condições anteriores e não converte unidade ou reduz abaixo do coletado',async()=>{
  const {db,r:p}=await setup();let r=await write(db,p,row(p));r=await write(db,r,row(r,{value:2}));const old=r.observationPlans[0];
  await assert.rejects(write(db,r,plan({replaces:old.id,reason:'Outra unidade',unit:'segundos'})),e=>e.status===400);await assert.rejects(write(db,r,plan({replaces:old.id,reason:'Menos observações',count:1})),e=>e.status===400);
  r=await write(db,r,plan({replaces:old.id,reason:'Vou observar mais vezes.',count:7,conditions:'Registrar também as interrupções.'}));assert.equal(r.observations[0].plan,old.id);assert.equal(r.observationPlans.length,2);assert.equal(r.observationPlans[0].conditions,old.conditions);
  await assert.rejects(write(db,r,{...row(r),plan:old.id}),e=>e.status===409);
});
test('quantidade planejada bloqueia novas linhas, mas permite corrigir as existentes',async()=>{
  const {db,r:p}=await setup();let r=await write(db,p,plan({replaces:p.observationPlans[0].id,count:1,reason:'Uma observação possível.'}));r=await write(db,r,row(r));await assert.rejects(write(db,r,row(r)),e=>e.status===400);r=await write(db,r,row(r,{replaces:r.observations[0].id,reason:'Corrigi a leitura.',value:1}));assert.equal(evidence.latestRows(r,r.observationPlans[0].id).length,1);
});
test('seleção congela as versões escolhidas mesmo após correção e recusa duas versões da mesma observação',async()=>{
  const {db,r:p}=await selected();let r=await write(db,p,row(p,{replaces:p.observations[0].id,value:9,reason:'Corrigi a leitura.'}));assert.equal(r.observationSelections[0].rows[0].value,0);assert.equal(r.observationSelections[0].rows[1].value,null);
  await assert.rejects(write(db,r,select(r)),e=>e.status===400);await assert.rejects(write(db,r,select(r,{rows:['foreign']})),e=>e.status===404);
  const source=await origin(db,r);assert.match(source.blocks.find(b=>b.key==='evidence').text,/Medido: 0 minutos/);assert.match(source.blocks.find(b=>b.key==='evidence').text,/Ausente: sem valor/);
});
test('levar dados ao projeto exige confirmação e cópia explícita sem duplicar publicação',async()=>{
  const {db,r:p}=await selected();assert.equal(p.entries.length,0);const body={action:'publishObservation',selection:p.observationSelections[0].id,text:'Minha síntese dos dados.',reason:'Quero confrontar a pergunta.',key:randomUUID(),version:p.version};const r=await guided.change(7,p.id,body,db);assert.equal(r.entries[0].type,'evidencia');assert.equal(r.entries[0].sourceObservation,p.observationSelections[0].id);assert.equal((await guided.change(7,p.id,body,db)).entries.length,1);
});
test('Lumi da coleta recebe só linhas e campos escolhidos sem outras notas ou valores',async()=>{
  const {db,r}=await selected();let sent;const result=await guided.assist(7,r.id,{mode:'observations',attempts:[r.observationSelections[0].id],rows:[r.observations[1].id],fields:['value','kind'],goal:'Como tratar uma ausência?'},db,provider(v=>sent=v));const content=sent.messages[1].content;assert.match(content,/null/);assert.doesNotMatch(content,/NOTA_PRIVADA|minutos|Sem interrupções/);assert.match(sent.messages[0].content,/nunca zero/);
  const saved=await write(db,r,{action:'feedback',receipt:result.receipt});assert.ok(saved.observationSelections[0].feedback);await assert.rejects(guided.assist(7,r.id,{mode:'observations',attempts:[r.observationSelections[0].id],rows:['foreign'],fields:['value']},db,provider()),e=>e.status===404);
});
test('argumento liga versão exata de coleta, justificativa, contraponto e limites',async()=>{
  const {db,r:p}=await selected(),s=await origin(db,p);const r=await write(db,p,argument(s));assert.equal(r.argumentVersions.length,1);assert.equal(r.argumentVersions[0].evidences[0].ref.step,p.observationSelections[0].id);assert.equal(r.entries.length,0);
  for(const patch of [{claim:''},{counterpoint:''},{alternative:''},{limits:''},{evidences:[]}])await assert.rejects(write(db,r,argument(s,patch)),e=>e.status===400);
});
test('evidência de outra conta, trecho forjado ou orientação da IA não entra como evidência',async()=>{
  const {db,r:p}=await selected(),s=await origin(db,p);await assert.rejects(guided.change(8,p.id,{key:randomUUID(),version:p.version,...argument(s)},db),e=>e.status===404);
  for(const extra of [{parts:['lumi']},{parts:['inventado']},{sourceHash:'forged'}])await assert.rejects(write(db,p,argument(s,{evidences:[{...argument(s).evidences[0],...extra}]})),e=>[400,409].includes(e.status));
});
test('argumento pode usar versão de outro projeto da própria conta, preservando o trecho',async()=>{
  const {db,r:p}=await selected();let other=await guided.create(7,'projeto',{key:randomUUID(),title:'Outro projeto',question:'Outra pergunta',scope:'Um recorte',subjects:['Matemática'],minutes:20,deliverable:'texto'},db);other=await write(db,other,{action:'projectEntry',stage:'analise',entryType:'evidencia',text:'Trecho do outro projeto.',sources:[]});const s=await port.resolve(7,{type:'projeto',record:other.id,step:other.entries[0].id},db);const r=await write(db,p,argument(s));assert.equal(r.argumentVersions[0].evidences[0].ref.record,other.id);assert.equal(r.argumentVersions[0].evidences[0].blocks[0].text,'Trecho do outro projeto.');
});
test('revisão preserva argumento anterior, exige motivo e mantém fonte selecionada ao publicar',async()=>{
  const {db,r:p}=await selected(),s=await origin(db,p);let r=await write(db,p,argument(s)),first=r.argumentVersions[0];await assert.rejects(write(db,r,argument(s,{replaces:first.id})),e=>e.status===400);r=await write(db,r,argument(s,{replaces:first.id,reason:'Reconheci outro limite.',claim:'Agora delimito a afirmação.'}));assert.equal(r.argumentVersions[0].claim,first.claim);assert.equal(r.argumentVersions[1].thread,first.id);r=await write(db,r,{action:'publishArgument',selection:r.argumentVersions[1].id,text:'Minha produção delimitada.',reason:'Escolhi esta versão.'});assert.equal(r.entries[0].type,'producao');assert.equal(r.entries[0].sourceArgument,r.argumentVersions[1].id);
});
test('Lumi questiona só uma ligação e os campos escolhidos, sem completar o argumento',async()=>{
  const {db,r:p}=await selected(),s=await origin(db,p);const r=await write(db,p,argument(s));let sent;await guided.assist(7,r.id,{mode:'argument',attempts:[r.argumentVersions[0].id],evidence:r.argumentVersions[0].evidences[0].id,fields:['claim','justification']},db,provider(v=>sent=v));assert.doesNotMatch(sent.messages[1].content,/NOTA_PRIVADA|A tarefa pode|familiaridade/);assert.match(sent.messages[0].content,/Não complete o argumento/);assert.equal((await guided.detail(7,r.id,db)).argumentVersions[0].feedback,undefined);
});
test('argumento e coleta chegam ao portfólio somente como versões e partes selecionadas',async()=>{
  const {db,r:p}=await selected(),s=await origin(db,p);const r=await write(db,p,argument(s));const source=await port.resolve(7,{type:'argumento',record:r.id,step:r.argumentVersions[0].id},db);const saved=await guided.create(7,'portfolio',{key:randomUUID(),title:'Meu percurso',introduction:'Minha investigação.',conclusion:'Ainda tenho limites.',items:[{id:randomUUID(),ref:source.ref,sourceHash:source.sourceHash,role:'Meu argumento',demonstrates:'Explicitei uma ligação.',limits:'Não atribuo causalidade.',parts:['conclusion'],references:[]}]},db);assert.deepEqual(saved.editions[0].items[0].blocks.map(b=>b.key),['conclusion']);assert.doesNotMatch(JSON.stringify(saved.editions),/NOTA_PRIVADA/);
});

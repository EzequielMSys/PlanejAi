const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const guided=require('../src/services/guidedStudyService'),paths=require('../src/services/personalLearningPaths'),sources=require('../src/services/studyPathSources'),lab=require('../src/services/studyLabService'),database=require('./helpers/guidedStore');
const today=require('../src/services/flashcardService').today;
async function setup(){const db=database();const origin=await guided.create(7,'evidencia',{key:randomUUID(),title:'Energia',mode:'explicar',prompt:'Explique potência e energia.',initialText:'Usei tempo e potência para calcular a energia.'},db);return {db,origin,source:{type:'caminho',record:origin.id,step:origin.attempts[0].id}};}
const strategyBody=source=>({key:randomUUID(),title:'Conferir unidades',procedure:'Escrever as unidades antes de multiplicar.',limits:'Ainda preciso entender o enunciado.',experience:{date:today(),subject:'Energia',difficulty:'Confundia potência e energia.',outcome:'ajudou',observation:'Percebi que precisava converter minutos para horas.',limits:'Não resolveu minha interpretação sozinho.',source}});
const projectBody=extra=>({key:randomUUID(),title:'Investigar energia',question:'Como o tempo afeta o consumo?',scope:'Dois aparelhos em um período definido.',subjects:['Física','Matemática'],minutes:30,deadline:'',deliverable:'relatorio',...extra});
const entryBody=(record,extra)=>({action:'projectEntry',version:record.version,key:randomUUID(),stage:'hipoteses',entryType:'hipotese',text:'Minha hipótese inicial considera apenas a potência.',reason:'',sources:[],artifactUrl:'',...extra});
function feedbackProvider(capture){return {chat:{completions:{create:async payload=>{capture(payload);return {choices:[{message:{content:JSON.stringify({claro:'Você descreveu um procedimento.',lacuna:'Não há evidência suficiente para atribuir causalidade.',pergunta:'Em que outra situação vale tentar?',proximoPasso:'Registre outra experiência e seus limites.',incerteza:'A percepção se refere somente aos registros escolhidos.'})}}]};}}}};}
test('estratégia exige origem real da própria conta e preserva experiência e limites',async()=>{
  const {db,source}=await setup(),body=strategyBody(source),r=await guided.create(7,'estrategia',body,db);assert.equal(r.experiences[0].source.record,source.record);assert.match(r.experiences[0].source.snippet,/tempo e potência/);assert.equal(r.experiences[0].outcome,'ajudou');assert.equal(r.versions.length,1);
  assert.equal((await guided.create(7,'estrategia',body,db)).id,r.id);await assert.rejects(guided.create(8,'estrategia',strategyBody(source),db),e=>e.status===404);await assert.rejects(guided.create(7,'estrategia',strategyBody({...source,step:'foreign'}),db),e=>e.status===404);
});
test('origem material ou inexistente não é apresentada como evidência de uma estratégia',async()=>{
  const {db}=await setup();await assert.rejects(guided.create(7,'estrategia',strategyBody({type:'material',record:1}),db),e=>e.status===400);await assert.rejects(guided.create(7,'estrategia',strategyBody(null),db),e=>e.status===400);
});
test('reavaliar preserva a primeira experiência sem fingir nova prática e reenvio não duplica',async()=>{
  const {db,source}=await setup();let r=await guided.create(7,'estrategia',strategyBody(source),db);const body={action:'strategyExperience',key:randomUUID(),version:r.version,...strategyBody(source).experience,reassessOf:r.experiences[0].id,outcome:'nao_ajudou',observation:'Percebi que o resultado tinha outra explicação.'};
  r=await guided.change(7,r.id,body,db);assert.equal(r.experiences[0].outcome,'ajudou');assert.equal(r.experiences[1].outcome,'nao_ajudou');assert.equal(r.experiences[1].reassessOf,r.experiences[0].id);assert.equal((await guided.list(7,'estrategia',db))[0].experiences,1);assert.equal((await guided.list(7,'estrategia',db))[0].reassessments,1);assert.equal((await guided.change(7,r.id,body,db)).experiences.length,2);await assert.rejects(guided.change(7,r.id,{...body,observation:'Diferente'},db),e=>e.status===409);
});
test('edição de estratégia preserva procedimentos anteriores e respeita versão e conta',async()=>{
  const {db,source}=await setup();const r=await guided.create(7,'estrategia',strategyBody(source),db);const updated=await guided.change(7,r.id,{action:'strategyEdit',key:randomUUID(),version:1,title:'Unidades com interpretação',procedure:'Ler o enunciado antes de converter unidades.',limits:'Ainda não basta em todos os casos.'},db);assert.equal(updated.versions.length,2);assert.equal(updated.versions[0].procedure,r.procedure);assert.notEqual(updated.procedure,r.procedure);await assert.rejects(guided.change(7,r.id,{action:'archiveStrategy',version:1,archived:true},db),e=>e.status===409);await assert.rejects(guided.detail(8,r.id,db),e=>e.status===404);
});
test('sugestões respeitam contexto, arquivamento e a experiência mais recente',async()=>{
  const {db,source}=await setup();let r=await guided.create(7,'estrategia',strategyBody(source),db);const execute=db.execute;db.execute=async(sql,v)=>sql.startsWith('SELECT id,dados')?[[...db.rows.values()].filter(row=>row.id_usuario===v[0]&&row.tipo==='estrategia')]:execute(sql,v);
  assert.equal((await paths.suggestions(7,'Energia','',db)).length,1);assert.equal((await paths.suggestions(8,'Energia','',db)).length,0);assert.equal((await paths.suggestions(7,'História medieval','',db)).length,0);
  r=await guided.change(7,r.id,{action:'archiveStrategy',version:r.version,archived:true},db);assert.equal((await paths.suggestions(7,'Energia','',db)).length,0);
  r=await guided.change(7,r.id,{action:'archiveStrategy',version:r.version,archived:false},db);r=await guided.change(7,r.id,{action:'strategyExperience',key:randomUUID(),version:r.version,...strategyBody(source).experience,outcome:'nao_ajudou'},db);assert.equal((await paths.suggestions(7,'Energia','',db)).length,0);
});
test('projeto nasce com critérios conhecidos e origem opcional sem agendar ação automaticamente',async()=>{
  const {db,source}=await setup();const p=await guided.create(7,'projeto',projectBody({source}),db);assert.equal(p.criteria.length,4);assert.equal(p.stages.length,5);assert.equal(p.sources[0].source.record,source.record);assert.equal(p.next,null);assert.equal(p.entries.length,0);assert.equal(p.status,'ativo');
  for(const extra of [{subjects:[]},{minutes:0},{deliverable:'nota automática'},{deadline:'2026-02-30'}])await assert.rejects(guided.create(7,'projeto',projectBody(extra),db),e=>e.status===400);
});
test('hipóteses e produções são versionadas, com motivo da revisão e pergunta original',async()=>{
  const {db}=await setup();let p=await guided.create(7,'projeto',projectBody(),db);p=await guided.change(7,p.id,entryBody(p),db);const first=p.entries[0];
  await assert.rejects(guided.change(7,p.id,entryBody(p,{replaces:first.id}),db),e=>e.status===400);
  p=await guided.change(7,p.id,entryBody(p,{text:'Agora considero também a duração de uso.',replaces:first.id,reason:'Confrontei a hipótese com um cálculo.'}),db);assert.equal(p.entries[0].text,first.text);assert.equal(p.entries[1].replaces,first.id);assert.equal(p.entries[0].questionAtCreation,p.question);
  p=await guided.change(7,p.id,{action:'projectSettings',key:randomUUID(),version:p.version,...projectBody({question:'Como comparar dois períodos?'})},db);assert.equal(p.entries[0].questionAtCreation,'Como o tempo afeta o consumo?');assert.equal(p.settingsHistory.length,1);
});
test('referências carregam propósito e limites e não aceitam protocolo executável',async()=>{
  const {db,source}=await setup();let p=await guided.create(7,'projeto',projectBody(),db);const body={action:'projectSource',key:randomUUID(),version:p.version,origin:'Minha primeira tentativa',question:p.question,purpose:'Confrontar a hipótese.',limits:'Este caso usa potência constante.',source,url:'https://example.org/estudo'};
  p=await guided.change(7,p.id,body,db);assert.equal(p.sources.length,1);assert.equal((await guided.change(7,p.id,body,db)).sources.length,1);p=await guided.change(7,p.id,entryBody(p,{sources:[p.sources[0].id]}),db);assert.equal(p.entries[0].sourcesAtCreation[0].limits,'Este caso usa potência constante.');
  await assert.rejects(guided.change(7,p.id,{...body,key:randomUUID(),version:p.version,url:'javascript:alert(1)'},db),e=>e.status===400);await assert.rejects(guided.change(7,p.id,entryBody(p,{sources:['foreign']}),db),e=>e.status===400);
});
test('origem de outra conta é recusada tanto ao criar quanto ao acrescentar fonte ao projeto',async()=>{
  const {db,source}=await setup();await assert.rejects(guided.create(8,'projeto',projectBody({source}),db),e=>e.status===404);const p=await guided.create(8,'projeto',projectBody(),db);await assert.rejects(guided.change(8,p.id,{action:'projectSource',key:randomUUID(),version:1,origin:'Fonte',question:'Pergunta',purpose:'Comparar',source},db),e=>e.status===404);
});
test('uma ação por projeto pode ser reagendada sem duplicar a fila ou apagar o histórico',async()=>{
  const {db}=await setup();let p=await guided.create(7,'projeto',projectBody(),db);const body={action:'projectNext',key:randomUUID(),version:p.version,title:'Comparar dois aparelhos',reason:'É meu próximo passo escolhido.',minutes:15,date:today(),stage:'analise'};
  p=await guided.change(7,p.id,body,db);assert.equal(p.actionHistory.length,0);assert.equal((await guided.change(7,p.id,body,db)).next.id,p.next.id);
  p=await guided.change(7,p.id,{...body,key:randomUUID(),version:p.version,date:guided._test.dateAdd(today(),2)},db);assert.equal(p.actionHistory.length,1);assert.equal(p.actionHistory[0].outcome,'reagendado');const complete={action:'completeProjectAction',version:p.version,task:p.next.id};p=await guided.change(7,p.id,complete,db);assert.equal(p.next,null);assert.equal((await guided.change(7,p.id,complete,db)).actionHistory.length,2);
  await assert.rejects(guided.change(7,p.id,{...body,key:randomUUID(),version:p.version,minutes:90},db),e=>e.status===400);
});
test('conclusão exige produção própria e autoavaliação fundamentada, sem nota automática',async()=>{
  const {db}=await setup();let p=await guided.create(7,'projeto',projectBody(),db);let body={action:'finishProject',key:randomUUID(),version:p.version,criteria:p.criteria.map(c=>({id:c.id,outcome:'nao_sei',evidence:null,note:''})),reflection:'Ainda tenho questões abertas.'};await assert.rejects(guided.change(7,p.id,body,db),e=>e.status===400);
  p=await guided.change(7,p.id,entryBody(p,{stage:'producao',entryType:'producao',text:'Meu relatório distingue os dados e as hipóteses.'}),db);body={...body,version:p.version,criteria:p.criteria.map(c=>({id:c.id,outcome:'consegui',evidence:p.entries[0].id,note:'Fundamentei no meu relatório.'}))};p=await guided.change(7,p.id,body,db);assert.equal(p.status,'concluido');assert.equal(p.reviews.length,1);assert.equal(p.score,undefined);assert.equal((await guided.change(7,p.id,body,db)).reviews.length,1);p=await guided.change(7,p.id,{action:'projectStatus',version:p.version,status:'ativo'},db);assert.equal(p.reviews.length,1);assert.equal(p.entries.length,1);
});
test('registro de projeto pode fundamentar estratégia e ser copiado para entendimento',async()=>{
  const {db}=await setup();let p=await guided.create(7,'projeto',projectBody(),db);p=await guided.change(7,p.id,entryBody(p,{entryType:'evidencia',text:'Comparar as unidades revelou a diferença.'}),db);const source={type:'caminho',record:p.id,step:p.entries[0].id};const r=await guided.create(7,'estrategia',strategyBody(source),db);assert.match(r.experiences[0].source.href,/projetos-investigacao/);
  const copy=await lab.saveAs(7,p.id,{type:'evidencia',key:randomUUID(),attempt:p.entries[0].id,title:'Minha evidência do projeto',prompt:p.question,text:p.entries[0].text},db);assert.equal(copy.sourceProject,p.id);assert.equal(copy.attempts[0].text,p.entries[0].text);
});
test('Lumi da estratégia usa só partes escolhidas e só guarda orientação com autorização explícita',async()=>{
  const {db,source}=await setup();const r=await guided.create(7,'estrategia',strategyBody(source),db);let payload;const result=await guided.assist(7,r.id,{attempts:[r.experiences[0].id],fields:['observation'],goal:'Adaptar a uma nova questão.'},db,feedbackProvider(p=>payload=p));
  const sent=JSON.stringify(payload.messages);assert.match(sent,/converter minutos/);assert.doesNotMatch(sent,/Escrever as unidades antes|Usei tempo e potência/);assert.match(sent,/Não classifique estilos/);assert.equal((await guided.detail(7,r.id,db)).experiences[0].feedback,undefined);
  const saved=await guided.change(7,r.id,{action:'feedback',version:r.version,receipt:result.receipt},db);assert.ok(saved.experiences[0].feedback);const contested=await guided.change(7,r.id,{action:'contest',version:saved.version,attempt:r.experiences[0].id,text:'Preciso explicar melhor meu contexto.'},db);assert.equal(contested.experiences[0].contest,'Preciso explicar melhor meu contexto.');
});
test('Lumi do projeto não recebe texto de outras versões nem fontes não selecionadas',async()=>{
  const {db}=await setup();let p=await guided.create(7,'projeto',projectBody(),db);p=await guided.change(7,p.id,entryBody(p,{text:'REGISTRO_ESCOLHIDO',reason:'MOTIVO_NAO_ESCOLHIDO'}),db);const selected=p.entries[0].id;p=await guided.change(7,p.id,entryBody(p,{text:'OUTRA_VERSAO_PRIVADA'}),db);let payload;
  await guided.assist(7,p.id,{attempts:[selected],fields:['text'],goal:'Conferir uma hipótese.'},db,feedbackProvider(v=>payload=v));const sent=JSON.stringify(payload.messages);assert.match(sent,/REGISTRO_ESCOLHIDO/);assert.doesNotMatch(sent,/OUTRA_VERSAO_PRIVADA|MOTIVO_NAO_ESCOLHIDO/);assert.match(sent,/não escreva a produção final/);
});
test('busca de originais vincula a conta e trata caracteres de busca como literais',async()=>{
  let call;await sources.options(7,'caminho','50%_!',{execute:async(sql,args)=>{call={sql,args};return [[]];}});assert.match(call.sql,/id_usuario=\?/);assert.deepEqual(call.args,[7,'%50!%!_!!%']);assert.match(call.sql,/tipo IN \('evidencia','laboratorio','projeto'\)/);
});
test('origem removida mantém a evidência vinculada sem permitir ler dados de outra conta',async()=>{
  const {db,source}=await setup();const r=await guided.create(7,'estrategia',strategyBody(source),db);db.rows.delete(source.record);await assert.rejects(sources.resolve(7,source,db),e=>e.status===404);const saved=await guided.detail(7,r.id,db);assert.match(saved.experiences[0].source.snippet,/tempo e potência/);await assert.rejects(guided.detail(8,r.id,db),e=>e.status===404);
});

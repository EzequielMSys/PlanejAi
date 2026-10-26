const test=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const service=require('../src/services/guidedStudyService');
const post=require('../src/services/postExamService');
const lab=require('../src/services/studyLabService');
const catalog=require('../src/services/studyLabCatalog');
const database=require('./helpers/guidedStore');
const today=require('../src/services/flashcardService').today;
const add=service._test.dateAdd;
async function preparation(db=database()) {return {db,record:await service.create(7,'prova',{key:randomUUID(),title:'Física',date:add(today(),14),minutes:40,days:[1,2,3,4,5],topics:[{title:'Energia',level:'seguro'}]},db)};}
const reflection=(p,extra={})=>({action:'postexam',version:p.version,key:randomUUID(),takenOn:today(),score:'',maximum:10,worked:'Consegui interpretar parte dos dados.',blocked:'Confundi potência e energia.',change:'Vou conferir unidades.',useful:'Meu exemplo da bicicleta.',question:'Qual relação existe entre potência e energia?',reasoning:'Eu usei somente a potência.',retry:'Vou relacionar potência e tempo.',topics:p.topics.map(t=>({id:t.id,experience:'dificuldade',causes:['aplicacao','calculo'],note:'Preciso conferir as unidades.'})),...extra});
async function investigation(db=database()) {return {db,record:await service.create(7,'laboratorio',{key:randomUUID(),caseId:'energia-cotidiano'},db)};}
const response=(p,extra={})=>({action:'investigate',version:p.version,key:randomUUID(),phase:'base',hypothesis:'Hipótese selecionada.',notes:'ANOTAÇÃO NÃO ESCOLHIDA',calculations:'CÁLCULO NÃO ESCOLHIDO',conclusion:'A energia depende de potência e tempo.',comparison:'',...extra});

test('fechamento preserva expectativa, experiência e versões; nota é opcional',async()=>{
  const {db,record}=await preparation();let p=await service.change(7,record.id,reflection(record),db);
  assert.equal(p.reflections[0].grade,null);assert.equal(p.reflections[0].topics[0].before,'seguro');assert.equal(p.reflections[0].topics[0].experience,'dificuldade');assert.equal(p.recoverySuggestions.length,1);assert.equal(p.reflections[0].topics[0].recommendation.id,'energia-cotidiano');
  p=await service.change(7,p.id,reflection(p,{score:7.5,maximum:10,blocked:'Uma reflexão mais precisa.'}),db);assert.equal(p.reflections.length,2);assert.equal(p.reflections[0].blocked,'Confundi potência e energia.');assert.deepEqual(p.reflections[1].grade,{score:7.5,maximum:10});
});
test('reenvio de fechamento confirma sem duplicar; alteração e outra conta são recusadas',async()=>{
  const {db,record}=await preparation(),body=reflection(record);await service.change(7,record.id,body,db);assert.equal((await service.change(7,record.id,body,db)).reflections.length,1);
  await assert.rejects(service.change(7,record.id,{...body,worked:'Outro texto'},db),e=>e.status===409);
  await assert.rejects(service.change(8,record.id,body,db),e=>e.status===404);
});
test('valida nota, data real, assunto e classificação sem incorporar dados inválidos',async()=>{
  const {record}=await preparation();for(const extra of [{score:11,maximum:10},{takenOn:add(today(),1)},{takenOn:'2026-02-30'},{topics:[]},{topics:[{id:record.topics[0].id,experience:'dificuldade',causes:['diagnostico-medico']}]},{worked:'',blocked:'',change:''},{question:'',retry:'Uma resposta'}])assert.throws(()=>post.reflection(record,reflection(record,extra),today()),e=>e.status===400);
});
test('prévia da recuperação não grava, respeita capacidade e preserva passos sem espaço',async()=>{
  const {db,record}=await preparation();const p=await service.change(7,record.id,reflection(record),db);
  const body={version:p.version,reflection:p.reflections[0].id,start:today(),minutes:10,days:[0,1,2,3,4,5,6],tasks:[{topic:p.topics[0].id,title:'Conferir as unidades',minutes:15,reason:'Percebi dificuldade de aplicação.'}]};
  const preview=await service.recoveryPreview(7,p.id,body,db);assert.equal(preview.tasks[0].date,null);assert.equal((await service.detail(7,p.id,db)).recovery,undefined);
  body.minutes=40;const available=await service.recoveryPreview(7,p.id,body,db);assert.ok(available.tasks[0].date);assert.equal(available.tasks[0].reason,body.tasks[0].reason);
});
test('recuperação só entra na rotina após aprovação e mantém a versão anterior',async()=>{
  const {db,record}=await preparation();let p=await service.change(7,record.id,reflection(record),db);
  const body={action:'approveRecovery',key:randomUUID(),version:p.version,reflection:p.reflections[0].id,start:today(),minutes:40,days:[0,1,2,3,4,5,6],tasks:[{topic:p.topics[0].id,title:'Conferir unidades',minutes:15,reason:'Eu escolhi revisar esta dificuldade.'}]};
  p=await service.change(7,p.id,body,db);assert.equal(p.recovery.tasks.length,1);assert.equal((await service.change(7,p.id,body,db)).recovery.id,p.recovery.id);
  p=await service.change(7,p.id,{action:'completeRecovery',version:p.version,task:p.recovery.tasks[0].id},db);assert.equal(p.recovery.tasks[0].done,true);
  p=await service.change(7,p.id,{...body,key:randomUUID(),version:p.version},db);assert.equal(p.recoveryHistory.length,1);assert.equal(p.recoveryHistory[0].tasks[0].done,true);
});
test('aprovação concorrente e referência a reflexão antiga falham sem trocar o plano',async()=>{
  const {db,record}=await preparation();const p=await service.change(7,record.id,reflection(record),db);
  await assert.rejects(service.recoveryPreview(7,p.id,{version:1},db),e=>e.status===409);
  assert.throws(()=>post.preview(p,{reflection:'foreign'},today()),e=>e.status===409);
});
test('catálogo não entrega resolução e referências distinguem dados fictícios',async()=>{
  const cards=catalog.cards();assert.equal(cards.length,3);assert.ok(cards.every(c=>c.fictional&&c.sources.length&&c.prerequisites));assert.ok(cards.every(c=>!c.phases&&!c.solution));
  const {record}=await investigation();assert.equal(record.case.phases.base.solution,undefined);assert.equal(record.case.phases.base.guiding,undefined);
});
test('cálculos e limites dos três casos e de suas transferências são consistentes',()=>{
  const energy=catalog.find('energia-cotidiano').phases(8);assert.match(energy.base.solution,/47,12 kWh/);assert.match(energy.base.solution,/37,70/);assert.match(energy.variation.solution,/22,00 kWh/);assert.match(energy.variation.solution,/-4,40/);assert.match(energy.transfer.solution,/12 kWh/);assert.match(energy.transfer.solution,/9,60/);
  const news=catalog.find('noticia-percentuais').phases(90);assert.match(news.base.solution,/10 pontos percentuais/);assert.match(news.variation.solution,/0,00 pontos percentuais/);assert.match(news.transfer.solution,/−10 pontos percentuais/);assert.match(news.base.solution,/Não se pode generalizar/);
  const water=catalog.find('agua-argumento').phases(600);assert.match(water.base.solution,/22,5%/);assert.match(water.variation.solution,/15,00%/);assert.match(water.transfer.solution,/25%/);
});
test('apoios são progressivos, persistidos e idempotentes sem inventar pontuação',async()=>{
  const {db,record}=await investigation();await assert.rejects(service.change(7,record.id,{action:'help',version:1,phase:'base',level:3},db),e=>e.status===400);
  let p=await service.change(7,record.id,{action:'help',version:1,phase:'base',level:1},db);assert.ok(p.case.phases.base.guiding);assert.equal(p.case.phases.base.solution,undefined);
  p=await service.change(7,p.id,{action:'help',version:1,phase:'base',level:1},db);assert.equal(p.helpEvents.length,1);
  for(const level of [2,3])p=await service.change(7,p.id,{action:'help',version:p.version,phase:'base',level},db);
  assert.ok(p.case.phases.base.solution);assert.equal(p.case.phases.base.strategies.length,2);assert.equal(p.score,undefined);
});
test('mudar uma condição preserva tentativas anteriores e reabre os apoios daquela condição',async()=>{
  const {db,record}=await investigation();let p=await service.change(7,record.id,response(record),db);
  p=await service.change(7,p.id,{action:'help',version:p.version,phase:'variation',level:1},db);
  p=await service.change(7,p.id,response(p,{phase:'variation',conclusion:'Pensei no banho de 8 minutos.'}),db);
  p=await service.change(7,p.id,{action:'parameter',version:p.version,value:12},db);
  assert.match(p.attempts[1].prompt,/8 minutos/);assert.match(p.case.phases.variation.prompt,/12 minutos/);assert.equal(p.help.variation,0);assert.equal(p.attempts[1].parameter,8);
  await assert.rejects(service.change(7,p.id,{action:'parameter',version:p.version,value:100},db),e=>e.status===400);
});
test('tentativas conservam raciocínio, apoios e reenvio; transferência antecipada não apaga a retomada',async()=>{
  const {db,record}=await investigation();await assert.rejects(service.change(7,record.id,response(record,{phase:'transfer'}),db),e=>e.status===400);
  const body=response(record);let p=await service.change(7,record.id,body,db);assert.equal((await service.change(7,p.id,body,db)).attempts.length,1);
  const due=p.due;p=await service.change(7,p.id,response(p,{phase:'transfer'}),db);assert.equal(p.due,due);assert.equal(p.attempts.length,2);
  const raw=lab.create({caseId:'energia-cotidiano'});lab.apply(raw,response({version:1}),today());lab.apply(raw,response({version:2},{phase:'transfer'}),add(today(),3));assert.equal(raw.due,null);
});
test('Lumi recebe somente as partes marcadas e o enunciado, sem solução ou outros registros',async()=>{
  const {db,record}=await investigation();const p=await service.change(7,record.id,response(record),db);let payload;
  const provider={chat:{completions:{create:async value=>{payload=value;return {choices:[{message:{content:JSON.stringify({claro:'Você relacionou duas grandezas.',lacuna:'Não foram compartilhados cálculos.',pergunta:'Como o tempo participa?',proximoPasso:'Confronte sua hipótese com as unidades.',incerteza:'Os cálculos não foram enviados.'})}}]}}}}};
  const result=await service.assist(7,p.id,{attempts:[p.attempts[0].id],fields:['hypothesis']},db,provider);const prompt=JSON.stringify(payload.messages);
  assert.match(prompt,/Hipótese selecionada/);assert.doesNotMatch(prompt,/ANOTAÇÃO NÃO ESCOLHIDA|CÁLCULO NÃO ESCOLHIDO|47,12/);assert.match(prompt,/não revele a resolução/);
  const saved=await service.change(7,p.id,{version:p.version,action:'feedback',receipt:result.receipt},db);assert.ok(saved.attempts[0].feedback);assert.equal(saved.attempts[0].calculations,'CÁLCULO NÃO ESCOLHIDO');
});
test('copiar para entendimento exige origem da conta e preserva a tentativa do laboratório',async()=>{
  const {db,record}=await investigation();const p=await service.change(7,record.id,response(record),db);
  const body={key:randomUUID(),type:'evidencia',attempt:p.attempts[0].id,title:'Minha conclusão sobre energia',prompt:p.attempts[0].prompt,text:p.attempts[0].conclusion};
  await assert.rejects(lab.saveAs(8,p.id,body,db),e=>e.status===404);
  const saved=await lab.saveAs(7,p.id,body,db);assert.equal(saved.sourceLab,p.id);assert.equal(saved.attempts[0].text,body.text);assert.equal((await lab.saveAs(7,p.id,body,db)).id,saved.id);assert.equal((await service.detail(7,p.id,db)).attempts.length,1);
  await assert.rejects(lab.saveAs(7,p.id,{...body,attempt:'foreign'},db),e=>e.status===404);
});

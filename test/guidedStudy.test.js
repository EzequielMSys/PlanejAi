const test = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const service = require('../src/services/guidedStudyService');
const {createPreparation, schedule, dateAdd} = service._test;
const day = require('../src/services/flashcardService').today;
function preparation(extra={}) {return {key:randomUUID(),title:'Prova de Física',date:dateAdd(day(),14),minutes:40,days:[0,1,2,3,4,5,6],topics:[{title:'Energia',level:'dificuldade',diagnostic:'Confundo trabalho e energia'}],...extra};}
const database=require('./helpers/guidedStore');

test('preparação distribui apenas em dias disponíveis, reserva margem e respeita a prova',()=>{
  const plan=createPreparation(preparation({days:[1,3,5]}));
  const sums=new Map();for(const t of plan.tasks){if(!t.date)continue;assert.ok(t.date<plan.date);assert.ok([1,3,5].includes(new Date(t.date+'T12:00:00Z').getUTCDay()));sums.set(t.date,(sums.get(t.date)||0)+t.minutes);}
  assert.ok([...sums.values()].every(n=>n<=32));
  assert.equal(plan.tasks.at(-1).kind,'final');
});
test('capacidade insuficiente deixa pendências visíveis sem sobrecarga',()=>{
  const plan=createPreparation(preparation({date:dateAdd(day(),1),minutes:15,topics:Array.from({length:12},(_,i)=>({title:`Tema ${i}`,level:'novo'}))}));
  assert.ok(plan.tasks.some(t=>!t.date));assert.ok(plan.tasks.filter(t=>t.date===day()).reduce((n,t)=>n+t.minutes,0)<=12);
});
test('perder um dia preserva o realizado e não agenda tarefas no passado ou no dia perdido',()=>{
  const plan=createPreparation(preparation());const done=plan.tasks[0];done.done=true;done.completedOn=day();const snapshot=JSON.stringify(done);
  schedule(plan,day(),true);assert.equal(JSON.stringify(plan.tasks.find(t=>t.id===done.id)),snapshot);
  assert.ok(plan.tasks.filter(t=>!t.done&&t.date).every(t=>t.date>day()));
});
test('revisão espaçada e revisão final têm lugar quando há capacidade',()=>{
  const plan=createPreparation(preparation({minutes:120}));const practice=plan.tasks.find(t=>t.kind==='pratica'),review=plan.tasks.find(t=>t.kind==='revisao');
  assert.ok(review.date>=dateAdd(practice.date,2));assert.ok(plan.tasks.at(-1).date>=review.date);
});
test('diagnóstico e configuração rejeitam datas impossíveis e entradas não limitadas',()=>{
  for(const extra of [{date:day()},{date:'2026-02-30'},{date:dateAdd(day(),181)},{minutes:14},{minutes:241},{days:'123'},{days:[]},{days:[9]},{topics:[]},{topics:[{title:'Tema',level:'talvez'}]}])assert.throws(()=>createPreparation(preparation(extra)),e=>e.status===400);
});
test('criação é persistida por conta e reenvio exato não duplica plano ou coleção',async()=>{
  const db=database(),body=preparation(),first=await service.create(7,'prova',body,db),again=await service.create(7,'prova',body,db);
  assert.equal(first.id,again.id);assert.equal(first.collection,81);assert.equal(db.rows.size,1);assert.equal(db.calls.filter(c=>c.sql.startsWith('INSERT INTO flashcard_colecoes')).length,1);
  await assert.rejects(service.create(7,'prova',{...body,title:'Outro nome'},db),e=>e.status===409);
  await assert.rejects(service.create(8,'prova',body,db),e=>e.status===409);
});
test('nem outra conta pode ler ou alterar um percurso',async()=>{
  const db=database(),p=await service.create(7,'prova',preparation(),db);
  await assert.rejects(service.detail(8,p.id,db),e=>e.status===404);
  await assert.rejects(service.change(8,p.id,{version:1,action:'delete'},db),e=>e.status===404);assert.equal(db.rows.size,1);
});
test('alteração concorrente falha sem substituir o plano salvo',async()=>{
  const db=database(),p=await service.create(7,'prova',preparation(),db);
  const updated=await service.change(7,p.id,{version:1,action:'complete',task:p.tasks[0].id},db);assert.equal(updated.version,2);
  await assert.rejects(service.change(7,p.id,{version:1,action:'replan',minutes:0},db),e=>e.status===409);
  assert.equal((await service.detail(7,p.id,db)).tasks[0].done,true);
});
test('disponibilidade menor divide trabalho sem apagar minutos nem conclusões',async()=>{
  const db=database(),p=await service.create(7,'prova',preparation(),db),total=p.tasks.reduce((n,t)=>n+t.minutes,0);
  const updated=await service.change(7,p.id,{version:1,action:'settings',date:p.date,minutes:15,days:p.days},db);
  assert.equal(updated.tasks.reduce((n,t)=>n+t.minutes,0),total);assert.ok(updated.tasks.every(t=>t.minutes<=12));
});
async function cycle(db=database(),owner=7) {const record=await service.create(owner,'evidencia',{key:randomUUID(),title:'Energia',mode:'aplicar',prompt:'Explique a transformação de energia numa queda.'},db);return {db,record};}
test('ciclo aceita quatro modos e mantém versões, correções e retomadas separadas',async()=>{
  const {db,record}=await cycle();let r=await service.change(7,record.id,{version:1,action:'attempt',key:randomUUID(),text:'Minha primeira resposta.'},db);const due=r.due;
  r=await service.change(7,r.id,{version:r.version,action:'attempt',key:randomUUID(),text:'Uma correção fundamentada.',correction:true},db);
  assert.equal(r.attempts.length,2);assert.equal(r.attempts[0].text,'Minha primeira resposta.');assert.equal(r.due,due);assert.equal(r.attempts[1].correction,true);
  for(const mode of ['explicar','aplicar','comparar','erro'])assert.equal((await service.create(7,'evidencia',{key:randomUUID(),title:'Tema',mode,prompt:'Enunciado concreto'},db)).mode,mode);
});
test('reenvio após perder resposta confirma tentativa sem duplicar; conteúdo divergente conflita',async()=>{
  const {db,record}=await cycle();const body={version:1,action:'attempt',key:randomUUID(),text:'Minha resposta'};
  await service.change(7,record.id,body,db);const replay=await service.change(7,record.id,body,db);assert.equal(replay.attempts.length,1);
  await assert.rejects(service.change(7,record.id,{...body,text:'Diferente'},db),e=>e.status===409);
});
test('ciclo só pode se vincular à preparação da própria conta',async()=>{
  const db=database(),p=await service.create(7,'prova',preparation(),db);
  await assert.rejects(service.create(8,'evidencia',{key:randomUUID(),title:'Tema',mode:'explicar',prompt:'Explique',preparation:p.id},db),e=>e.status===404);
});
test('Lumi recebe somente versões selecionadas; devolutiva não é salva até escolha do estudante',async()=>{
  const {db,record}=await cycle();let r=await service.change(7,record.id,{version:1,action:'attempt',key:randomUUID(),text:'RESPOSTA ESCOLHIDA'},db);
  r=await service.change(7,r.id,{version:2,action:'attempt',key:randomUUID(),text:'RESPOSTA PRIVADA NÃO ESCOLHIDA'},db);
  let payload;const feedback={claro:'Você descreveu a ideia.',lacuna:'Falta justificar a transformação.',pergunta:'O que se conserva?',proximoPasso:'Explique usando um exemplo.',incerteza:'A análise não garante correção factual.'};
  const provider={chat:{completions:{create:async value=>{payload=value;return {choices:[{message:{content:JSON.stringify(feedback)}}]}}}}};
  const result=await service.assist(7,r.id,{attempts:[r.attempts[0].id]},db,provider);
  assert.match(JSON.stringify(payload),/RESPOSTA ESCOLHIDA/);assert.doesNotMatch(JSON.stringify(payload),/RESPOSTA PRIVADA/);
  assert.equal((await service.detail(7,r.id,db)).attempts[0].feedback,undefined);
  const saved=await service.change(7,r.id,{version:3,action:'feedback',receipt:result.receipt},db);assert.deepEqual(saved.attempts[0].feedback,feedback);
  const contested=await service.change(7,r.id,{version:4,action:'contest',attempt:r.attempts[0].id,text:'Discordo: justifiquei no exemplo.'},db);assert.equal(contested.attempts[0].contest,'Discordo: justifiquei no exemplo.');assert.deepEqual(contested.attempts[0].feedback,feedback);
});
test('contexto vazio ou alheio e recibo adulterado são recusados',async()=>{
  const {db,record}=await cycle();await assert.rejects(service.assist(7,record.id,{attempts:['foreign']},db,{}),e=>e.status===400);
  await assert.rejects(service.change(7,record.id,{version:1,action:'feedback',receipt:'fake'},db),e=>e.status===409);
});
test('falha ou saída não estruturada da IA preserva tentativa e informa indisponibilidade',async()=>{
  const {db,record}=await cycle();const r=await service.change(7,record.id,{version:1,action:'attempt',key:randomUUID(),text:'Ainda confundo energia e força.'},db);
  const provider={chat:{completions:{create:async()=>({choices:[{message:{content:'Resposta fora do contrato'}}]})}}};
  await assert.rejects(service.assist(7,r.id,{attempts:[r.attempts[0].id]},db,provider),e=>e.status===503);assert.equal((await service.detail(7,r.id,db)).attempts.length,1);
});

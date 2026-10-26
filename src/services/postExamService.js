const {randomUUID,createHash}=require('crypto');
const catalog=require('./studyLabCatalog');
const causes=['conhecimento','interpretacao','aplicacao','calculo','tempo'];
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const digest=body=>createHash('sha256').update(JSON.stringify({...body,version:undefined})).digest('hex');
const optional=(v,max=1200)=>{if(v==null)return '';if(typeof v!=='string'||v.trim().length>max)fail(`Use até ${max} caracteres por campo.`);return v.trim();};
const required=(v,max)=>{const result=optional(v,max);if(!result)fail('Preencha os campos obrigatórios.');return result;};
const key=v=>{if(!/^[a-f0-9-]{36}$/i.test(v||''))fail('Identificador de envio inválido.');return v;};
const add=(date,n)=>new Date(Date.parse(`${date}T12:00:00Z`)+n*86400000).toISOString().slice(0,10);
const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(`${date}T12:00:00Z`))&&add(date,0)===date;
function reflection(plan,body,day) {
  if(!validDate(body.takenOn)||body.takenOn>day||body.takenOn<add(day,-365))fail('Informe a data em que realizou a prova, até hoje e no último ano.');
  if(!Array.isArray(body.topics)||body.topics.length!==plan.topics.length||new Set(body.topics.map(t=>t.id)).size!==plan.topics.length)fail('Confira a experiência em cada assunto.');
  let grade=null;
  if(body.score!==''&&body.score!=null){const score=Number(body.score),maximum=Number(body.maximum);if(!Number.isFinite(score)||!Number.isFinite(maximum)||maximum<=0||maximum>1000||score<0||score>maximum)fail('Confira a nota e a pontuação máxima.');grade={score,maximum};}
  const topics=body.topics.map(t=>{
    const before=plan.topics.find(p=>p.id===t.id);
    if(!before||!['consegui','dificuldade','nao_avaliado'].includes(t.experience)||!Array.isArray(t.causes)||t.causes.some(c=>!causes.includes(c)))fail('Confira o assunto, a experiência e as causas selecionadas.');
    return {id:t.id,title:before.title,before:before.level,experience:t.experience,causes:[...new Set(t.causes)],note:optional(t.note,800),recommendation:catalog.recommend(before.title,t.causes)};
  });
  const result={id:key(body.key),hash:digest(body),takenOn:body.takenOn,grade,worked:optional(body.worked),blocked:optional(body.blocked),change:optional(body.change),useful:optional(body.useful),question:optional(body.question,2000),reasoning:optional(body.reasoning,3000),retry:optional(body.retry,3000),topics,created:new Date().toISOString()};
  if(!result.worked&&!result.blocked&&!result.change)fail('Registre pelo menos o que funcionou, uma dificuldade ou o que faria diferente.');
  if((result.reasoning||result.retry)&&!result.question)fail('Descreva a questão para acompanhar suas tentativas.');
  return result;
}
function suggestions(plan) {
  const last=plan.reflections?.at(-1);if(!last)return [];
  return last.topics.filter(t=>t.experience==='dificuldade').slice(0,5).map(t=>{
    const focus=t.causes.includes('tempo')?'Resolver uma questão com tempo combinado e rever a estratégia':t.causes.includes('interpretacao')?'Reescrever o enunciado e identificar os dados necessários':t.causes.includes('calculo')?'Refazer um cálculo explicando cada unidade':t.causes.includes('aplicacao')?'Aplicar a ideia em uma situação diferente':'Explicar a ideia sem consultar e conferir um exemplo';
    return {topic:t.id,title:`${focus}: ${t.title}`.slice(0,180),minutes:15,reason:t.note||`Você registrou dificuldade em ${t.title} após a prova.`,recommendation:t.recommendation};
  });
}
function preview(plan,body,day) {
  const last=plan.reflections?.at(-1);
  if(!last||body.reflection!==last.id)fail('O fechamento mudou. Reabra antes de preparar a recuperação.',409);
  if(!validDate(body.start)||body.start<day||body.start>add(day,7))fail('Comece a recuperação entre hoje e os próximos sete dias.');
  const minutes=Number(body.minutes);if(!Number.isInteger(minutes)||minutes<10||minutes>120)fail('Reserve de 10 a 120 minutos por dia.');
  if(!Array.isArray(body.days)||!body.days.length||body.days.some(d=>!Number.isInteger(d)||d<0||d>6))fail('Selecione os dias disponíveis.');
  if(!Array.isArray(body.tasks)||!body.tasks.length||body.tasks.length>7)fail('Escolha de um a sete próximos passos.');
  const slots=Array.from({length:14},(_,i)=>({date:add(body.start,i),remaining:Math.floor(minutes*.8)})).filter(s=>body.days.includes(new Date(s.date+'T12:00:00Z').getUTCDay()));
  const tasks=body.tasks.map(t=>{
    const topic=plan.topics.find(p=>p.id===t.topic);const duration=Number(t.minutes);
    if(!topic||!Number.isInteger(duration)||duration<5||duration>60)fail('Cada passo precisa de assunto e duração entre 5 e 60 minutos.');
    const slot=slots.find(s=>s.remaining>=duration);if(slot)slot.remaining-=duration;
    return {id:randomUUID(),topic:topic.id,title:required(t.title,180),minutes:duration,reason:required(t.reason,800),date:slot?.date||null,done:false};
  });
  return {start:body.start,minutes,days:[...new Set(body.days)],reflection:last.id,tasks};
}
function replay(plan,body) {
  const prior=body.action==='postexam'?plan.reflections?.find(r=>r.id===body.key):body.action==='approveRecovery'?[...(plan.recoveryHistory||[]),plan.recovery].find(r=>r?.id===body.key):null;
  if(!prior)return false;if(prior.hash!==digest(body))fail('Este envio já foi confirmado com outros dados. Reabra o registro.',409);return true;
}
function apply(plan,body,day) {
  if(body.action==='postexam') {
    if((plan.reflections?.length||0)>=10)fail('Este fechamento já possui dez versões. O histórico foi preservado.');
    plan.reflections=[...(plan.reflections||[]),reflection(plan,body,day)];
  } else if(body.action==='approveRecovery') {
    const recovery=preview(plan,body,day);
    if((plan.recoveryHistory?.length||0)>=5)fail('Esta preparação já possui seis planos de recuperação. Preserve o histórico e continue pelos ciclos de entendimento.');
    if(plan.recovery)plan.recoveryHistory=[...(plan.recoveryHistory||[]),plan.recovery];
    plan.recovery={...recovery,id:key(body.key),hash:digest(body),approvedAt:new Date().toISOString()};
  } else if(body.action==='completeRecovery') {
    const task=plan.recovery?.tasks.find(t=>t.id===body.task);if(!task)fail('Próximo passo não encontrado.',404);task.done=true;task.completedOn ||= day;
  } else fail('Ação inválida.');
  return plan;
}
module.exports={reflection,suggestions,preview,apply,replay,causes};

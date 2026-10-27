const {randomUUID,createHash}=require('crypto');
const catalog=require('./studyLabCatalog');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const fields=['hypothesis','notes','calculations','conclusion','comparison'];
const phases=['base','variation','transfer'];
const hash=body=>createHash('sha256').update(JSON.stringify({...body,version:undefined})).digest('hex');
const add=(day,n)=>new Date(Date.parse(`${day}T12:00:00Z`)+n*86400000).toISOString().slice(0,10);
function create(body) {
  const item=catalog.find(body.caseId);if(!item)fail('Caso não encontrado no laboratório.',404);
  return {title:item.title,caseId:item.id,caseVersion:item.version,parameter:item.parameter.initial,attempts:[],help:{base:0,variation:0,transfer:0},helpEvents:[],due:null};
}
function replay(data,body) {
  if(body.action==='investigate') {
    const prior=data.attempts.find(a=>a.id===body.key);if(!prior)return false;
    if(prior.hash!==hash(body))fail('Este envio já foi usado com outro raciocínio.',409);return true;
  }
  if(body.action==='help'&&phases.includes(body.phase)&&Number.isInteger(body.level)&&body.level>=1&&body.level<=(data.help[body.phase]||0))return true;
  return false;
}
function apply(data,body,day) {
  if(body.action==='help') {
    if(!phases.includes(body.phase)||body.level!==(data.help[body.phase]||0)+1||body.level>3)fail('Abra os apoios na sequência: pergunta, pista e resolução.');
    data.help[body.phase]=body.level;data.helpEvents.push({phase:body.phase,level:body.level,parameter:data.parameter,at:new Date().toISOString()});
  } else if(body.action==='parameter') {
    const parameter=catalog.find(data.caseId,data.caseVersion).parameter;const value=body.value;
    if(!Number.isFinite(value)||value<parameter.min||value>parameter.max||Math.abs((value-parameter.min)/parameter.step-Math.round((value-parameter.min)/parameter.step))>1e-8)fail('Confira o valor dentro do intervalo disponível.');
    data.parameter=value;data.help.variation=0;
  } else if(body.action==='investigate') {
    if(!phases.includes(body.phase)||!/^[a-f0-9-]{36}$/i.test(body.key||''))fail('Confira a etapa e o identificador da tentativa.');
    if(data.attempts.length>=30)fail('Esta investigação chegou a 30 versões. Comece outra para continuar.');
    if(body.phase!=='base'&&!data.attempts.some(a=>a.phase==='base'))fail('Guarde uma primeira tentativa antes de mudar o contexto.');
    const response=Object.fromEntries(fields.map(field=>{const value=body[field]??'';if(typeof value!=='string'||value.trim().length>1600)fail('Use até 1.600 caracteres em cada parte do raciocínio.');return [field,value.trim()];}));
    if(!response.conclusion)fail('Registre uma conclusão, mesmo que provisória.');
    const scenario=catalog.find(data.caseId,data.caseVersion).phases(data.parameter)[body.phase];
    const prompt=`${scenario.prompt}\n\nDados do cenário:\n${scenario.data.join('\n')}`;
    const attempt={id:body.key,hash:hash(body),phase:body.phase,parameter:data.parameter,prompt,...response,text:fields.filter(f=>response[f]).map(f=>`${f}: ${response[f]}`).join('\n').slice(0,8000),helpLevel:data.help[body.phase]||0,created:new Date().toISOString()};
    data.attempts.push(attempt);
    if(body.phase==='transfer'&&data.due&&day>=data.due)data.due=null;
    else if(body.phase!=='transfer')data.due=add(day,3);
  } else fail('Ação inválida.');
  if(data.helpEvents.length>90)fail('Limite de apoios desta investigação atingido. O histórico continua preservado.');
  return data;
}
async function saveAs(owner,id,body,db) {
  const guided=require('./guidedStudyService');
  const record=await guided.detail(owner,id,db);
  const strategyAttempt=record.kind==='estrategia'&&(record.experiments||[]).flatMap(e=>e.attempts).find(a=>a.id===body.attempt);
  if(!strategyAttempt&&(!['laboratorio','projeto'].includes(record.kind)||!(record.kind==='projeto'?record.entries:record.attempts).some(a=>a.id===body.attempt)))fail('Registro não encontrado nesta investigação.',404);
  if(!/^[a-f0-9-]{36}$/i.test(body.key||''))fail('Identificador de envio inválido.');
  if(typeof body.text!=='string'||!body.text.trim()||body.text.trim().length>4000)fail('Confira o texto que escolheu guardar (até 4.000 caracteres).');
  if(body.type==='evidencia')return {type:body.type,...await guided.create(owner,'evidencia',{key:body.key,title:body.title,mode:'aplicar',prompt:body.prompt,initialText:body.text,...(record.kind==='estrategia'?{sourceStrategy:id,sourceAttempt:body.attempt}:record.kind==='projeto'?{sourceProject:id,sourceEntry:body.attempt}:{sourceLab:id,sourceAttempt:body.attempt}),preparation:record.preparation||null},db)};
  if(body.type==='duvida')return {type:body.type,...await require('./learningJournalService').write(owner,null,{tipo:'duvida',chave:body.key,titulo:body.title,texto:body.text},db)};
  if(body.type==='cartao')return {type:body.type,...await require('./flashcardService').create(owner,{chave:body.key,pergunta:body.title,resposta:body.text,disciplina:''},db)};
  fail('Escolha entendimento, dúvida ou cartão.');
}
module.exports={create,apply,replay,saveAs,fields,phases};

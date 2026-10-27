const {randomUUID,createHash}=require('crypto');
const sourceService=require('./studyPathSources');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const text=(value,max=1200,required=false)=>{if(value==null&&!required)return '';if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))fail(`Confira o texto: use ${required?'de 1 a':'até'} ${max} caracteres.`);return value.trim();};
const key=value=>{if(!/^[a-f0-9-]{36}$/i.test(value||''))fail('Identificador de envio inválido.');return value;};
const hash=body=>createHash('sha256').update(JSON.stringify({...body,version:undefined})).digest('hex');
const add=(date,n)=>new Date(Date.parse(`${date}T12:00:00Z`)+n*86400000).toISOString().slice(0,10);
const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(`${date}T12:00:00Z`))&&add(date,0)===date;
const outcomes={ajudou:'Ajudou nesta situação',parcial:'Ajudou em parte / adaptei',nao_ajudou:'Não ajudou nesta situação'};
const stages=[{id:'pergunta',title:'Compreender o problema',objective:'Delimitar uma pergunta e o que será possível observar.'},{id:'hipoteses',title:'Levantar hipóteses',objective:'Escrever uma explicação provisória e como ela poderia ser confrontada.'},{id:'fontes',title:'Buscar fontes',objective:'Identificar a origem, o propósito e os limites das informações.'},{id:'analise',title:'Analisar evidências',objective:'Confrontar hipóteses com os dados e registrar o que mudou.'},{id:'producao',title:'Produzir e revisar a conclusão',objective:'Distinguir dados de interpretações e reconhecer o que não foi demonstrado.'}];
const criteria=[{id:'pergunta',title:'Clareza da pergunta',description:'Minha pergunta é delimitada e pode ser investigada com os recursos disponíveis.'},{id:'fontes',title:'Fontes identificadas',description:'Identifiquei de onde vêm as informações e o que cada fonte ajuda a responder.'},{id:'raciocinio',title:'Coerência do raciocínio',description:'Minha conclusão se apoia nas evidências apresentadas e distingue fatos de interpretações.'},{id:'limites',title:'Reconhecimento dos limites',description:'Expliquei as condições, incertezas e perguntas que continuam abertas.'}];
const templates=[{id:'energia',title:'Como interpretar um consumo de energia?',question:'Como potência e tempo de uso ajudam a explicar o consumo dos aparelhos?',scope:'Comparar poucos aparelhos em um período definido, usando dados identificados e sem presumir que o modelo reproduz toda a conta.',subjects:['Física','Matemática'],deliverable:'relatorio',caseId:'energia-cotidiano'},{id:'manchete',title:'Os dados sustentam esta manchete?',question:'O que os números apresentados permitem concluir e o que a manchete sugere além deles?',scope:'Escolher uma manchete e os dados usados, comparar medidas e explicar os limites da conclusão.',subjects:['Matemática','Língua Portuguesa'],deliverable:'texto',caseId:'noticia-percentuais'}];
function aboutProject(body,day) {
  if(!Array.isArray(body.subjects)||!body.subjects.length||body.subjects.length>5)fail('Escolha de uma a cinco matérias.');
  const minutes=Number(body.minutes);if(!Number.isInteger(minutes)||minutes<5||minutes>120)fail('Reserve de 5 a 120 minutos por encontro.');
  const deadline=body.deadline||null;if(deadline&&(!validDate(deadline)||deadline<day||deadline>add(day,365)))fail('Escolha um prazo entre hoje e os próximos 365 dias, ou deixe em branco.');
  if(!['texto','relatorio','apresentacao','outro'].includes(body.deliverable))fail('Escolha a produção que pretende construir.');
  return {title:text(body.title,100,true),question:text(body.question,600,true),scope:text(body.scope,1200,true),subjects:[...new Set(body.subjects.map(s=>text(s,80,true)))],minutes,deadline,deliverable:body.deliverable};
}
async function experience(owner,body,db,actor,day) {
  if(!Object.hasOwn(outcomes,body.outcome))fail('Registre como a estratégia funcionou nesta situação.');
  const date=body.date||day;if(!validDate(date)||date>day||date<'2000-01-01')fail('Informe uma data válida, até hoje.');
  if(body.source?.type==='material')fail('Vincule uma tentativa, anotação ou registro próprio para descrever o efeito observado.');
  const source=await sourceService.resolve(owner,body.source,db,actor);
  return {id:key(body.key),hash:hash(body),date,subject:text(body.subject,100,true),difficulty:text(body.difficulty,1000,true),outcome:body.outcome,observation:text(body.observation,1600,true),limits:text(body.limits,1200),source,created:new Date().toISOString(),reassessOf:body.reassessOf||null};
}
function immutableText(entry,kind) {return kind==='estrategia'?[entry.subject,entry.difficulty,entry.observation,entry.limits,entry.source?.snippet].join('\n'):entry.text;}
async function create(owner,kind,body,db,actor,day) {
  if(kind==='estrategia') {
    const first=await experience(owner,{...body.experience,key:body.key},db,actor,day);first.text=immutableText(first,kind);
    const procedure=text(body.procedure,2000,true),limits=text(body.limits,1200);
    return {title:text(body.title,100,true),procedure,limits,experiences:[first],versions:[{id:randomUUID(),procedure,limits,created:new Date().toISOString()}],archived:false};
  }
  const data={...aboutProject(body,day),stage:'pergunta',stageHistory:[],entries:[],sources:[],criteria:structuredClone(criteria),status:'ativo',next:null,actionHistory:[],settingsHistory:[],reviews:[]};
  if(body.source||body.sourceLab) {
    const source=await sourceService.resolve(owner,body.source||{type:'caminho',record:body.sourceLab,step:body.sourceAttempt},db,actor);
    data.sources.push({id:randomUUID(),origin:source.title,question:data.question,purpose:'Investigação que escolhi como ponto de partida.',limits:'Este registro é um ponto de partida; ainda preciso confrontar as hipóteses.',source,created:new Date().toISOString()});
  }
  return data;
}
function replay(data,kind,body) {
  if(require('./learningExperiments').replay(data,body))return true;
  if(kind==='projeto'&&body.action==='completeProjectAction'&&data.actionHistory.some(a=>a.id===body.task&&a.outcome==='realizado'))return true;
  const candidates=kind==='estrategia'?body.action==='strategyEdit'?data.versions:data.experiences:[...data.entries,...data.sources,...data.reviews,...data.actionHistory,...data.settingsHistory,...data.stageHistory,...(data.next?[data.next]:[])];
  const prior=candidates.find(e=>e.id===body.key);if(!prior)return false;
  if(prior.hash!==hash(body))fail('Este envio já foi confirmado com outros dados. Reabra os registros antes de reenviar.',409);return true;
}
function url(value) {
  if(!value)return '';let parsed;try{parsed=new URL(value);}catch{fail('Informe um endereço http ou https válido.');}
  if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)fail('Informe um endereço http ou https sem credenciais.');return parsed.href;
}
async function apply(owner,data,kind,body,db,actor,day) {
  if(await require('./learningExperiments').apply(owner,data,kind,body,db,actor))return data;
  if(kind==='estrategia') {
    if(body.action==='strategyExperience') {
      if(data.experiences.length>=50)fail('Esta estratégia já tem 50 experiências. O histórico foi preservado.');
      if(body.reassessOf&&!data.experiences.some(e=>e.id===body.reassessOf))fail('A experiência que deseja reavaliar não existe neste registro.',404);
      const entry=await experience(owner,body,db,actor,day);entry.text=immutableText(entry,kind);data.experiences.push(entry);
    } else if(body.action==='strategyEdit') {
      if(data.versions.length>=20)fail('Esta estratégia já possui 20 versões. O histórico foi preservado.');
      const procedure=text(body.procedure,2000,true),limits=text(body.limits,1200);
      data.versions.push({id:key(body.key),hash:hash(body),procedure,limits,title:data.title,created:new Date().toISOString()});data.title=text(body.title,100,true);data.procedure=procedure;data.limits=limits;
    } else if(body.action==='archiveStrategy') {
      if(typeof body.archived!=='boolean')fail('Escolha arquivar ou restaurar a estratégia.');data.archived=body.archived;
    } else fail('Ação inválida.');
    return data;
  }
  if(body.action==='projectEntry') {
    if(data.entries.length>=100)fail('Este projeto chegou a 100 registros. O histórico foi preservado.');
    if(!stages.some(s=>s.id===body.stage)||!['hipotese','anotacao','evidencia','producao'].includes(body.entryType))fail('Escolha o marco e o tipo do registro.');
    const ids=body.sources||[];if(!Array.isArray(ids)||ids.length>5||ids.some(id=>!data.sources.some(s=>s.id===id)))fail('Escolha até cinco fontes deste projeto.');
    if(body.replaces&&!data.entries.some(e=>e.id===body.replaces))fail('A versão anterior não pertence ao projeto.',404);
    if(body.replaces&&!text(body.reason,1600))fail('Explique o que fez você rever a versão anterior.');
    const entry={id:key(body.key),hash:hash(body),stage:body.stage,type:body.entryType,text:text(body.text,6000,true),reason:text(body.reason,1600),questionAtCreation:data.question,replaces:body.replaces||null,sources:[...new Set(ids)],sourcesAtCreation:data.sources.filter(s=>ids.includes(s.id)).map(s=>({id:s.id,origin:s.origin,purpose:s.purpose,limits:s.limits,url:s.url||null})),artifactUrl:url(text(body.artifactUrl,1500)),created:new Date().toISOString()};
    data.entries.push(entry);
  } else if(body.action==='projectSource') {
    if(data.sources.length>=40)fail('Este projeto já possui 40 fontes. O histórico foi preservado.');
    const source=body.source?await sourceService.resolve(owner,body.source,db,actor):null;
    const origin=text(body.origin,300,true),link=url(text(body.url,1500));
    data.sources.push({id:key(body.key),hash:hash(body),origin,question:text(body.question,600,true),purpose:text(body.purpose,1200,true),limits:text(body.limits,1200),url:link,source,created:new Date().toISOString()});
  } else if(body.action==='projectNext') {
    const minutes=Number(body.minutes);if(!Number.isInteger(minutes)||minutes<5||minutes>Math.min(90,data.minutes))fail(`Reserve de 5 a ${Math.min(90,data.minutes)} minutos para este passo.`);
    if(!validDate(body.date)||body.date<day||body.date>add(day,180)||(data.deadline&&body.date>data.deadline))fail('Escolha uma data futura válida dentro do prazo do projeto.');
    if(!stages.some(s=>s.id===body.stage))fail('Escolha o marco deste passo.');
    if(data.actionHistory.length>=100)fail('Este projeto chegou a 100 ações no histórico.');
    if(data.next)data.actionHistory.push({...data.next,outcome:'reagendado'});
    data.next={id:key(body.key),hash:hash(body),title:text(body.title,180,true),reason:text(body.reason,1000,true),minutes,date:body.date,stage:body.stage,created:new Date().toISOString()};
  } else if(body.action==='completeProjectAction') {
    if(!data.next||data.next.id!==body.task)fail('O próximo passo mudou. Reabra o projeto.',409);
    if(data.actionHistory.length>=100)fail('Este projeto chegou a 100 ações no histórico.');
    data.actionHistory.push({...data.next,outcome:'realizado',completed:new Date().toISOString()});data.next=null;
  } else if(body.action==='projectStage') {
    if(!stages.some(s=>s.id===body.stage)||typeof body.completed!=='boolean')fail('Escolha o próximo marco e registre sua decisão.');
    if(data.stageHistory.length>=50)fail('O histórico de marcos chegou a 50 decisões.');
    data.stageHistory.push({id:key(body.key),hash:hash(body),from:data.stage,to:body.stage,completed:body.completed,note:text(body.note,1000),created:new Date().toISOString()});data.stage=body.stage;
  } else if(body.action==='projectSettings') {
    if(data.settingsHistory.length>=20)fail('Este projeto já tem 20 versões da pergunta e das condições.');
    const settings=aboutProject(body,day);data.settingsHistory.push({id:key(body.key),hash:hash(body),title:data.title,question:data.question,scope:data.scope,subjects:data.subjects,minutes:data.minutes,deadline:data.deadline,deliverable:data.deliverable,created:new Date().toISOString()});Object.assign(data,settings);
  } else if(body.action==='projectStatus') {
    if(!['ativo','pausado'].includes(body.status))fail('Escolha pausar ou retomar o projeto.');data.status=body.status;
  } else if(body.action==='finishProject') {
    if(!data.entries.some(e=>e.type==='producao'))fail('Guarde uma produção própria antes de concluir o projeto.');
    if(!Array.isArray(body.criteria)||body.criteria.length!==data.criteria.length||new Set(body.criteria.map(c=>c.id)).size!==data.criteria.length)fail('Faça a autoavaliação dos quatro critérios.');
    const answers=body.criteria.map(c=>{if(!data.criteria.some(r=>r.id===c.id)||!['consegui','fortalecer','nao_sei'].includes(c.outcome))fail('Confira cada critério da autoavaliação.');if(c.evidence&&!data.entries.some(e=>e.id===c.evidence))fail('A evidência escolhida não pertence ao projeto.',404);if(c.outcome!=='nao_sei'&&!c.evidence)fail('Escolha um registro para fundamentar sua percepção, ou marque que ainda não sabe.');return {id:c.id,outcome:c.outcome,evidence:c.evidence||null,note:text(c.note,1000)};});
    if(data.reviews.length>=10)fail('Este projeto já possui dez fechamentos. O histórico foi preservado.');
    data.reviews.push({id:key(body.key),hash:hash(body),criteria:answers,reflection:text(body.reflection,2000,true),nextStep:text(body.nextStep,1000),created:new Date().toISOString()});data.status='concluido';
  } else fail('Ação inválida.');
  return data;
}
function summary(data,kind) {return kind==='estrategia'?{title:data.title,subject:data.experiences.at(-1)?.subject,experiences:data.experiences.filter(e=>!e.reassessOf).length,reassessments:data.experiences.filter(e=>e.reassessOf).length,archived:data.archived}:{title:data.title,question:data.question,stage:data.stage,status:data.status,entries:data.entries.length,next:data.next?{title:data.next.title,date:data.next.date,minutes:data.next.minutes,reason:data.next.reason,stage:data.next.stage}:null};}
function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
async function suggestions(owner,theme,difficulty,db) {
  if(typeof theme!=='string'||theme.length<2||theme.length>300||typeof difficulty!=='string'||difficulty.length>1000)fail('Informe um assunto e, se quiser, uma dificuldade.');
  const [rows]=await db.execute("SELECT id,dados FROM percursos_estudo WHERE id_usuario=? AND tipo='estrategia' ORDER BY atualizado_em DESC LIMIT 100",[owner]);
  const words=normalize(theme+' '+difficulty).split(/\W+/).filter(w=>w.length>=4);
  return rows.flatMap(r=>{const data=typeof r.dados==='string'?JSON.parse(r.dados):r.dados;if(data.archived)return [];const last=data.experiences.at(-1);if(!last||last.outcome==='nao_ajudou')return [];const matches=words.filter(w=>normalize(last.subject+' '+last.difficulty).includes(w));if(!matches.length)return [];return [{id:r.id,title:data.title,procedure:data.procedure,limits:data.limits,experience:last,reason:`Você relatou ${last.outcome==='ajudou'?'que ajudou':'ajuda parcial'} em “${last.subject}”. Há termos em comum com o contexto atual: ${[...new Set(matches)].slice(0,3).join(', ')}. Isso não garante o mesmo resultado.`}];}).slice(0,3);
}
function feedbackTarget(record,id){return (record.kind==='estrategia'?record.experiences:record.entries).find(e=>e.id===id)||require('./learningExperiments').target(record,id);}
function context(record,body) {
  if(!Array.isArray(body.attempts)||!body.attempts.length||body.attempts.length>2||new Set(body.attempts).size!==body.attempts.length)fail('Escolha um ou dois registros para compartilhar.');
  if(body.mode)return require('./learningExperiments').context(record,body);
  const allowed=record.kind==='estrategia'?['procedure','subject','difficulty','observation','limits','sourceSnippet']:['text','reason','sources'];
  if(!Array.isArray(body.fields)||!body.fields.length||body.fields.length>allowed.length||body.fields.some(f=>!allowed.includes(f)))fail('Escolha quais partes quer compartilhar.');
  const chosen=body.attempts.map(id=>feedbackTarget(record,id));if(chosen.some(e=>!e))fail('Um registro não pertence a este percurso.',404);
  const payload=chosen.map(e=>Object.fromEntries(body.fields.map(f=>[f,f==='procedure'?record.procedure:f==='sourceSnippet'?e.source?.snippet:f==='sources'?e.sourcesAtCreation:e[f]])));
  return {chosen,content:JSON.stringify({contextoEscolhido:text(body.goal,1000),registros:payload}),policy:record.kind==='estrategia'?'Ajude a descrever e adaptar uma estratégia ao contexto escolhido. Não classifique estilos de aprendizagem, não atribua causalidade nem declare uma técnica universal. Considere os limites e as experiências de ajuda parcial ou ausência de ajuda.':'Questione hipóteses, aponte informação ausente e comente os trechos escolhidos. Preserve a autoria: não escreva a produção final pelo estudante. Distinga dados de interpretações; não invente fontes nem valide uma conclusão sem evidência.'};
}
module.exports={create,apply,replay,summary,suggestions,context,feedbackTarget,stages,criteria,templates,outcomes};

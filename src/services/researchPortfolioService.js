const {randomUUID,createHash}=require('crypto');
const pool=require('../config/db');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const parse=v=>typeof v==='string'?JSON.parse(v):v;
const text=(v,max,required=true)=>{if(v==null&&!required)return '';if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim()))fail(`Confira o texto: use até ${max} caracteres.`);return v.trim();};
const hash=b=>createHash('sha256').update(JSON.stringify({...b,version:undefined})).digest('hex');
const stamp=b=>{if(!/^[a-f0-9-]{36}$/i.test(b.key||''))fail('Identificador de envio inválido.');return {id:b.key,hash:hash(b),created:new Date().toISOString()};};
const parts={question:'Pergunta inicial',attempt:'Tentativa escolhida',evidence:'Evidência apresentada',change:'Mudança de raciocínio',conclusion:'Conclusão do estudante',lumi:'Orientação da Lumi'};
function blocks(record,ref){
  let chosen,values,references=[],href;
  if(record.kind==='projeto'&&ref.type==='projeto'){
    chosen=record.entries.find(e=>e.id===ref.step);if(!chosen)fail('Versão não encontrada neste projeto.',404);
    values={question:chosen.questionAtCreation||record.question,attempt:chosen.text,evidence:chosen.type==='evidencia'?chosen.text:'',change:chosen.reason||'',conclusion:chosen.type==='producao'?chosen.text:''};references=chosen.sourcesAtCreation||[];href=`/projetos-investigacao?projeto=${record.id}`;
  }else if(record.kind==='evidencia'&&ref.type==='evidencia'){
    chosen=record.attempts.find(a=>a.id===ref.step);if(!chosen)fail('Tentativa não encontrada nesta conta.',404);
    values={question:record.prompt,attempt:chosen.text,evidence:chosen.text,change:chosen.correction?'O estudante registrou esta tentativa como uma correção.':'',conclusion:chosen.text};href=`/meu-entendimento?ciclo=${record.id}`;
  }else if(record.kind==='estrategia'&&ref.type==='comparacao'){
    const experiment=record.experiments?.find(e=>e.id===ref.experiment);chosen=experiment?.decisions.find(d=>d.id===ref.step);if(!chosen)fail('Comparação não encontrada nesta conta.',404);
    const attempts=chosen.attempts.map(id=>experiment.attempts.find(a=>a.id===id));if(attempts.some(a=>!a))fail('As tentativas da comparação não estão disponíveis.',404);
    values={question:`${experiment.difficulty}\nO que eu esperava: ${experiment.expectation}`,attempt:attempts.map((a,i)=>`Atividade ${i+1}\n${a.text}`).join('\n\n'),evidence:chosen.comparison,change:chosen.adaptation||'',conclusion:`${({manter:'Manter',adaptar:'Adaptar',deixar:'Deixar de lado'})[chosen.decision]}: ${chosen.justification}\nLimites: ${chosen.limitations}`};
    chosen={...chosen,feedback:attempts.at(-1).feedback,contest:attempts.at(-1).contest};references=experiment.activities.flatMap(a=>a.source?[{id:a.source.record+':'+(a.source.step||''),origin:a.source.title,purpose:'Registro de origem da atividade.',limits:'Trecho vinculado, não verificação externa.'}]:[]);href=`/como-aprendo?estrategia=${record.id}`;
  }else fail('Escolha um projeto, uma comparação ou uma evidência da sua conta.');
  if(chosen.feedback)values.lumi=Object.entries({claro:'O que aparece no registro',lacuna:'O que investigar',pergunta:'Pergunta',proximoPasso:'Sugestão',incerteza:'Incertezas'}).map(([f,label])=>`${label}: ${chosen.feedback[f]}`).join('\n')+(chosen.contest?`\nContestação do estudante: ${chosen.contest}`:'');
  return {title:record.title,ref:{type:ref.type,record:record.id,step:ref.step,...(ref.experiment?{experiment:ref.experiment}:{})},href,created:chosen.created,blocks:Object.entries(parts).filter(([key])=>values[key]).map(([key,label])=>({key,label,authorship:key==='lumi'?'Orientação da Lumi - pode conter erros':'Registro do estudante',text:values[key]})),references:references.map(s=>({id:s.id,origin:s.origin,purpose:s.purpose||'',limits:s.limits||'',url:s.url||''}))};
}
async function resolve(owner,ref,db=pool){if(!ref||typeof ref.record!=='string')fail('Escolha uma origem da sua conta.');const source=blocks(await require('./guidedStudyService').detail(owner,ref.record,db),ref);return {...source,sourceHash:createHash('sha256').update(JSON.stringify(source)).digest('hex')};}
async function options(owner,q='',db=pool){
  if(typeof q!=='string'||q.length>100)fail('Busque por até 100 caracteres.');
  const pattern=`%${q.trim().replace(/[!%_]/g,c=>'!'+c)}%`;
  const [rows]=await db.execute("SELECT id,tipo,dados FROM percursos_estudo WHERE id_usuario=? AND tipo IN ('projeto','estrategia','evidencia') AND JSON_UNQUOTE(JSON_EXTRACT(dados,'$.title')) LIKE ? ESCAPE '!' ORDER BY atualizado_em DESC LIMIT 30",[owner,pattern]);
  return rows.flatMap(row=>{const r=parse(row.dados),entries=row.tipo==='projeto'?r.entries.map((e,i)=>({ref:{type:'projeto',record:row.id,step:e.id},label:`Registro ${i+1} · ${e.type}`})):row.tipo==='evidencia'?r.attempts.map((a,i)=>({ref:{type:'evidencia',record:row.id,step:a.id},label:`Tentativa ${i+1}`})):(r.experiments||[]).flatMap(e=>e.decisions.map((d,i)=>({ref:{type:'comparacao',record:row.id,experiment:e.id,step:d.id},label:`${e.title} · decisão ${i+1}`})));return entries.slice(-5).reverse().map(e=>({...e,title:r.title}));}).slice(0,60);
}
async function selection(owner,body,db){
  if(!Array.isArray(body.items)||!body.items.length||body.items.length>6)fail('Escolha de um a seis registros para o portfólio.');
  const identities=body.items.map(i=>[i.ref?.type,i.ref?.record,i.ref?.experiment||'',i.ref?.step].join(':'));if(new Set(identities).size!==identities.length)fail('Cada versão deve aparecer uma única vez no portfólio.');
  if(body.items.some(i=>!/^[a-f0-9-]{36}$/i.test(i.id||''))||new Set(body.items.map(i=>i.id)).size!==body.items.length)fail('Confira os identificadores dos registros selecionados.');
  const items=[];
  for(const item of body.items){
    const source=await resolve(owner,item.ref,db);
    if(item.sourceHash!==source.sourceHash)fail('Uma origem mudou desde a prévia. Confira novamente os trechos antes de salvar; seu rascunho foi preservado.',409);
    if(!Array.isArray(item.parts)||!item.parts.length||new Set(item.parts).size!==item.parts.length||item.parts.some(p=>!source.blocks.some(b=>b.key===p)))fail('Confira os trechos escolhidos para cada registro.');
    if(!Array.isArray(item.references)||item.references.length>5||new Set(item.references).size!==item.references.length||item.references.some(id=>!source.references.some(r=>r.id===id)))fail('Confira as referências escolhidas.');
    items.push({id:item.id&&/^[a-f0-9-]{36}$/i.test(item.id)?item.id:randomUUID(),ref:source.ref,title:source.title,href:source.href,originalDate:source.created,role:text(item.role,100),demonstrates:text(item.demonstrates,1600),limits:text(item.limits,1600),blocks:source.blocks.filter(b=>item.parts.includes(b.key)),references:source.references.filter(r=>item.references.includes(r.id))});
  }
  if(items.reduce((n,i)=>n+i.blocks.reduce((m,b)=>m+b.text.length,0),0)>48000)fail('Esta seleção ficou extensa. Use menos trechos ou versões (até 48 mil caracteres por edição).');
  return items;
}
async function edition(owner,body,db){return {...stamp(body),title:text(body.title,120),introduction:text(body.introduction,2400),conclusion:text(body.conclusion,2400),items:await selection(owner,body,db)};}
async function create(owner,body,db){return {title:text(body.title,120),editions:[await edition(owner,body,db)]};}
function replay(data,body){const prior=data.editions.find(e=>e.id===body.key);if(!prior)return false;if(prior.hash!==hash(body))fail('Este envio já foi usado com outros dados.',409);return true;}
async function apply(owner,data,body,db){if(body.action!=='portfolioEdition')fail('Ação inválida.');if(data.editions.length>=8)fail('Este portfólio chegou a oito edições. As anteriores foram preservadas.');const next=await edition(owner,body,db);data.editions.push(next);data.title=next.title;}
function summary(data){return {title:data.title,editions:data.editions.length,items:data.editions.at(-1).items.length};}
module.exports={resolve,options,create,apply,replay,summary,parts};

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
  if(record.kind==='projeto'&&['apresentacao','ensaio','devolutiva','revisao-humana'].includes(ref.type)){
    ({chosen,values,references}=require('./productionPracticeService').projection(record,ref));href=`/projetos-investigacao?projeto=${record.id}&foco=produzir`;
  }else if(record.kind==='projeto'&&ref.type==='revisao'){
    ({chosen,values,references}=require('./projectWorkspaceService').projection(record,ref));href=`/projetos-investigacao?projeto=${record.id}&foco=produzir`;
  }else if(record.kind==='projeto'&&['previsao','contraponto'].includes(ref.type)){
    ({chosen,values,references}=require('./investigationCycleService').projection(record,ref));href=`/projetos-investigacao?projeto=${record.id}`;
  }else if(record.kind==='projeto'&&['coleta','argumento','fonte'].includes(ref.type)){
    href=`/projetos-investigacao?projeto=${record.id}`;
    if(ref.type==='coleta'){
      chosen=record.observationSelections?.find(v=>v.id===ref.step);if(!chosen)fail('Seleção de observações não encontrada nesta conta.',404);
      values={question:chosen.plan.question,attempt:`O que observei: ${chosen.plan.observe}\nUnidade: ${chosen.plan.unit}\nCondições planejadas: ${chosen.plan.conditions}`,evidence:`Versões escolhidas em ${chosen.created.slice(0,10)}; correções posteriores não substituem esta seleção.\nLimites do plano: ${chosen.plan.limits}\nLimites da seleção: ${chosen.limits}\n\n`+chosen.rows.map(require('./projectEvidenceService').rowText).join('\n\n'),conclusion:`Por que escolhi estes dados: ${chosen.purpose}\nLimites desta seleção: ${chosen.limits}`};references=[{id:chosen.plan.id,origin:chosen.plan.title,purpose:chosen.plan.observe,limits:chosen.plan.limits}];
    }else if(ref.type==='argumento'){
      chosen=record.argumentVersions?.find(v=>v.id===ref.step);if(!chosen)fail('Versão do argumento não encontrada nesta conta.',404);
      values={question:chosen.question||record.question,attempt:chosen.claim,evidence:chosen.evidences.map(e=>`Origem: ${e.title}\n${e.blocks.map(b=>`${b.label}: ${b.text}`).join('\n')}\nJustificativa da ligação: ${e.justification}`).join('\n\n'),change:chosen.reason,conclusion:`Contraponto: ${chosen.counterpoint}\nInterpretação alternativa: ${chosen.alternative}\nLimites: ${chosen.limits}`};references=chosen.evidences.flatMap(e=>e.references);
    }else{
      chosen=record.sourceInquiries?.find(v=>v.id===ref.step);if(!chosen)fail('Análise de fontes não encontrada nesta conta.',404);
      values={question:chosen.claim,evidence:chosen.sources.map(s=>`${s.origin}\nAutoria informada: ${s.author||'Não identificada'}\nData informada: ${s.published||'Não identificada'}\nTrecho: ${s.excerpt}\nEvidências apresentadas: ${s.evidence}\nFatos ou dados: ${s.facts}`).join('\n\n'),change:chosen.reason,conclusion:chosen.sources.map(s=>`${s.origin}\nInterpretações: ${s.interpretations}\nIncertezas: ${s.uncertain}\nInformações ausentes: ${s.missing}\nMinha decisão: ${require('./sourceInquiryService').decisions[s.decision]}\nMotivo: ${s.motive}`).join('\n\n')+(chosen.comparison?`\n\nConcordâncias: ${chosen.comparison.agreement}\nDivergências: ${chosen.comparison.divergence}\nPossível dependência: ${chosen.comparison.dependency}`:'')};references=chosen.sources.map(s=>({id:s.id,origin:s.origin,purpose:s.purpose,limits:s.missing,url:s.url}));
    }
  }else if(record.kind==='projeto'&&ref.type==='projeto'){
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
  return {title:record.title,ref:{type:ref.type,record:record.id,step:ref.step,...(ref.experiment?{experiment:ref.experiment}:{})},href,created:chosen.created,blocks:Object.entries(parts).filter(([key])=>values[key]).map(([key,label])=>({key,label,authorship:key==='lumi'?'Orientação da Lumi - pode conter erros':'Registro do estudante',text:values[key]})),references:references.filter((s,i,a)=>a.findIndex(v=>v.id===s.id)===i).map(s=>({id:s.id,origin:s.origin,purpose:s.purpose||'',limits:s.limits||'',url:s.url||''}))};
}
function projectOptions(r,id){return [['apresentacao',r.presentationVersions,'Roteiro'],['ensaio',r.presentationAttempts,'Ensaio'],['devolutiva',r.humanDecisions,'Decisão sobre devolutiva'],['revisao-humana',r.humanRevisions,'Revisão após devolutiva']].flatMap(([type,items,label])=>(items||[]).slice(-5).map(v=>({ref:{type,record:id,step:v.id},label:`${label}: ${(v.title||v.comment?.comment||v.reason).slice(0,60)}`}))).concat([...(r.coherenceReviews||[]).slice(-5).map(v=>({ref:{type:'revisao',record:id,step:v.id},label:'Revisão de coerência: '+v.production.text.slice(0,60)})),...(r.predictionComparisons||[]).slice(-5).map(v=>({ref:{type:'previsao',record:id,step:v.id},label:`Previsão confrontada: ${v.prediction.expected.slice(0,60)}`})),...(r.counterInquiryResults||[]).slice(-5).map(v=>({ref:{type:'contraponto',record:id,step:v.id},label:`Investigação de contraponto: ${v.plan.title}`})),...r.entries.slice(-5).map((e,i)=>({ref:{type:'projeto',record:id,step:e.id},label:`Registro ${Math.max(1,r.entries.length-4)+i} · ${e.type}`})),...(r.observationSelections||[]).slice(-5).map(v=>({ref:{type:'coleta',record:id,step:v.id},label:`Coleta: ${v.title}`})),...(r.sourceInquiries||[]).slice(-5).map((v)=>({ref:{type:'fonte',record:id,step:v.id},label:`Análise de fontes: ${v.claim.slice(0,80)}`})),...(r.argumentVersions||[]).slice(-5).map(v=>({ref:{type:'argumento',record:id,step:v.id},label:`Argumento: ${v.title}`}))]);}
async function resolve(owner,ref,db=pool){if(!ref||typeof ref.record!=='string')fail('Escolha uma origem da sua conta.');const source=blocks(await require('./guidedStudyService').detail(owner,ref.record,db),ref);return {...source,sourceHash:createHash('sha256').update(JSON.stringify(source)).digest('hex')};}
async function options(owner,q='',db=pool){
  if(typeof q!=='string'||q.length>100)fail('Busque por até 100 caracteres.');
  const pattern=`%${q.trim().replace(/[!%_]/g,c=>'!'+c)}%`;
  const [rows]=await db.execute("SELECT id,tipo,dados FROM percursos_estudo WHERE id_usuario=? AND tipo IN ('projeto','estrategia','evidencia') AND JSON_UNQUOTE(JSON_EXTRACT(dados,'$.title')) LIKE ? ESCAPE '!' ORDER BY atualizado_em DESC LIMIT 30",[owner,pattern]);
  return rows.flatMap(row=>{const r=parse(row.dados),entries=row.tipo==='projeto'?projectOptions(r,row.id):row.tipo==='evidencia'?r.attempts.slice(-5).map((a,i)=>({ref:{type:'evidencia',record:row.id,step:a.id},label:`Tentativa ${Math.max(1,r.attempts.length-4)+i}`})):(r.experiments||[]).flatMap(e=>e.decisions.map((d,i)=>({ref:{type:'comparacao',record:row.id,experiment:e.id,step:d.id},label:`${e.title} · decisão ${i+1}`}))).slice(-5);return entries.reverse().map(e=>({...e,title:r.title}));}).slice(0,120);
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

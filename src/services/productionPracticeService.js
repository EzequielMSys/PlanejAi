const {createHash}=require('crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const text=(v,max=1600)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)fail(`Preencha o texto com até ${max} caracteres.`);return v.trim();};
const hash=b=>createHash('sha256').update(JSON.stringify({...b,version:undefined})).digest('hex');
const find=(list,id)=>{const item=list?.find(v=>v.id===id);if(!item)fail('Versão não encontrada neste projeto.',404);return item;};
function stamp(body){if(!/^[a-f0-9-]{36}$/i.test(body.key||''))fail('Identificador de envio inválido.');return {id:body.key,hash:hash(body),created:new Date().toISOString()};}
function append(data,name,item,max){if((data[name]?.length||0)>=max)fail('O limite deste histórico foi atingido. As versões anteriores permanecem guardadas.');data[name]=[...(data[name]||[]),item];}
function prior(list,id){const item=find(list,id);if(list.some(v=>v.replaces===item.id))fail('Há uma versão posterior. Reabra este registro.',409);return item;}
const refKey=ref=>`${ref.type}:${ref.record}:${ref.step}`;
const sections={pergunta:'Pergunta',procedimento:'Procedimento',evidencias:'Evidências',limites:'Limites'};
const categories={duvida:'Dúvida',evidencia:'Pedido de evidência',clareza:'Sugestão de clareza',contraponto:'Contraponto'};
const choices={aceitar:'Aceitar',adaptar:'Adaptar',contestar:'Contestar',investigar:'Investigar'};
const collections=['presentationVersions','presentationAttempts','humanComments','humanDecisions','humanRevisions'];
function replay(data,body){const found=collections.flatMap(name=>data[name]||[]).find(v=>v.id===body.key);if(!found)return false;if(found.hash!==hash(body))fail('Este envio já foi confirmado com outros dados.',409);return true;}
async function production(owner,data,body,db,id){
  const entry=find(data.entries,body.production);if(entry.type!=='producao')fail('Escolha uma produção própria.');
  const source=await require('./researchPortfolioService').resolve(owner,{type:'projeto',record:id,step:entry.id},db);
  if(source.sourceHash!==body.productionSourceHash)fail('A produção mudou desde a prévia. Confira a origem novamente.',409);
  return {id:entry.id,text:entry.text,created:entry.created,sources:structuredClone(entry.sourcesAtCreation||[])};
}
async function links(owner,items,db,id){
  if(!Array.isArray(items)||items.length>4||new Set(items.map(v=>refKey(v?.ref||{}))).size!==items.length)fail('Escolha até quatro origens distintas deste projeto.');
  const result=[];
  for(const item of items){
    if(!item?.ref||item.ref.record!==id||!['projeto','coleta','argumento','fonte','previsao','contraponto'].includes(item.ref.type))fail('Escolha registros e fontes analisadas deste projeto.');
    const source=await require('./researchPortfolioService').resolve(owner,item.ref,db);
    if(source.sourceHash!==item.sourceHash)fail('Uma origem mudou desde a prévia. Confira os trechos novamente.',409);
    if(!Array.isArray(item.parts)||!item.parts.length||new Set(item.parts).size!==item.parts.length||item.parts.some(p=>p==='lumi'||!source.blocks.some(b=>b.key===p)))fail('Escolha trechos autorais; orientações da Lumi não serão usadas como evidência.');
    if(!Array.isArray(item.references)||item.references.length>5||new Set(item.references).size!==item.references.length||item.references.some(r=>!source.references.some(v=>v.id===r)))fail('Confira as referências escolhidas.');
    result.push({key:refKey(source.ref),ref:source.ref,title:source.title,created:source.created,blocks:source.blocks.filter(b=>item.parts.includes(b.key)),references:source.references.filter(r=>item.references.includes(r.id))});
  }
  if(result.reduce((n,r)=>n+r.blocks.reduce((m,b)=>m+b.text.length,0),0)>24000)fail('Escolha menos trechos (até 24 mil caracteres).');return result;
}
function descends(entries,id,ancestor){const visited=new Set();while(id&&!visited.has(id)){if(id===ancestor)return true;visited.add(id);id=entries.find(e=>e.id===id)?.replaces;}return false;}
async function apply(owner,data,body,db,id=data.id){
  if(body.action==='presentationVersion'){
    const old=body.replaces?prior(data.presentationVersions,body.replaces):null;
    if(!old&&(data.presentationVersions||[]).filter(v=>!v.replaces).length>=4)fail('Este projeto já tem quatro roteiros. Reveja um existente.');
    if(!Number.isInteger(body.minutes)||body.minutes<1||body.minutes>30)fail('Escolha de 1 a 30 minutos para apresentar.');
    const source=await production(owner,data,body,db,id),selected=await links(owner,body.links,db,id);
    if(!selected.length)fail('Vincule ao menos uma origem aos trechos do roteiro.');
    if(!Array.isArray(body.parts)||body.parts.length!==4||new Set(body.parts.map(p=>p.id)).size!==4)fail('Prepare pergunta, procedimento, evidências e limites.');
    const parts=Object.keys(sections).map(key=>{const part=body.parts.find(p=>p.id===key);if(!part||!Number.isInteger(part.seconds)||part.seconds<10||part.seconds>600)fail('Reserve de 10 a 600 segundos para cada parte.');if(!Array.isArray(part.links)||!part.links.length||part.links.length>2||new Set(part.links).size!==part.links.length||part.links.some(k=>!selected.some(l=>l.key===k)))fail('Vincule uma ou duas origens escolhidas a cada parte.');return {id:key,title:sections[key],text:text(part.text,2000),seconds:part.seconds,links:[...part.links]};});
    if(parts.reduce((n,p)=>n+p.seconds,0)>body.minutes*60)fail('O tempo das partes ultrapassa o tempo disponível. Ajuste o roteiro.');
    const item={...stamp(body),thread:old?.thread||body.key,title:text(body.title,120),audience:text(body.audience,160),minutes:body.minutes,conclusion:text(body.conclusion),production:source,links:selected,parts,replaces:old?.id||null,reason:old?text(body.reason):''};
    append(data,'presentationVersions',item,24);return true;
  }
  if(body.action==='presentationAttempt'){
    const script=find(data.presentationVersions,body.script),part=find(script.parts,body.part),previous=body.previous?find(data.presentationAttempts,body.previous):null;
    if(previous&&(previous.thread!==script.thread||previous.part.id!==part.id))fail('Retome uma tentativa desta mesma parte do roteiro.');
    if(!['claro','rever','nao_sei'].includes(body.clarity))fail('Registre como percebe sua explicação.');
    const item={...stamp(body),script:script.id,thread:script.thread,title:script.title,audience:script.audience,conclusion:script.conclusion,part:structuredClone(part),links:structuredClone(script.links.filter(l=>part.links.includes(l.key))),answer:text(body.answer,3000),clarity:body.clarity,improve:text(body.improve,1200),previous:previous?.id||null,question:previous?.feedback?.pergunta||null};
    item.text=`Parte: ${part.title}\nRoteiro: ${part.text}\nResposta ensaiada: ${item.answer}\nQuero rever: ${item.improve}`;append(data,'presentationAttempts',item,40);return true;
  }
  if(body.action==='humanComment'){
    const old=body.replaces?prior(data.humanComments,body.replaces):null,source=await production(owner,data,body,db,id);
    if(old&&old.production.id!==source.id)fail('Uma correção do comentário preserva sua produção de origem.');
    if(!Object.hasOwn(categories,body.category)||!['professor','colega','outro'].includes(body.originRole))fail('Identifique a origem e o tipo da devolutiva.');
    const day=require('./flashcardService').today();if(typeof body.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||body.date<'2000-01-01'||body.date>day||!Number.isFinite(Date.parse(body.date+'T12:00:00Z'))||new Date(body.date+'T12:00:00Z').toISOString().slice(0,10)!==body.date)fail('Informe uma data válida, até hoje.');
    const excerpt=text(body.excerpt,2000);if(!source.text.includes(excerpt))fail('O trecho comentado precisa corresponder à produção escolhida.');
    const item={...stamp(body),thread:old?.thread||body.key,production:source,originRole:body.originRole,origin:text(body.origin,120),date:body.date,category:body.category,excerpt,comment:text(body.comment,2500),replaces:old?.id||null,reason:old?text(body.reason):''};append(data,'humanComments',item,40);return true;
  }
  if(body.action==='humanDecision'){
    const comment=find(data.humanComments,body.comment),old=body.replaces?prior(data.humanDecisions,body.replaces):null;
    if(old&&old.comment.id!==comment.id)fail('A decisão revista deve preservar a versão do comentário.');
    if(!old&&(data.humanDecisions||[]).some(d=>d.comment.id===comment.id))fail('Reveja a decisão existente sobre este comentário.',409);
    if(!Object.hasOwn(choices,body.choice))fail('Escolha aceitar, adaptar, contestar ou investigar.');
    const item={...stamp(body),thread:old?.thread||body.key,comment:structuredClone(comment),choice:body.choice,rationale:text(body.rationale),nextStep:text(body.nextStep,1200),links:await links(owner,body.links,db,id),replaces:old?.id||null,reason:old?text(body.reason):''};append(data,'humanDecisions',item,40);return true;
  }
  if(body.action==='humanRevision'){
    const decision=prior(data.humanDecisions,body.decision);
    if(!['aceitar','adaptar'].includes(decision.choice))fail('Para mudar o texto a partir deste comentário, registre uma decisão de aceitar ou adaptar.');
    if(data.humanRevisions?.some(r=>r.decision.id===decision.id))fail('Esta decisão já originou uma revisão. A versão anterior permanece preservada.',409);
    const before=await production(owner,data,{production:body.base,productionSourceHash:body.baseSourceHash},db,id);
    if(!descends(data.entries,before.id,decision.comment.production.id))fail('Escolha a produção comentada ou uma revisão dela.');
    if(data.entries.some(e=>e.replaces===before.id))fail('Há uma versão posterior da produção. Confira a base da revisão.',409);
    const revised=text(body.text,6000);if(revised===before.text)fail('Registre o que deseja mudar no texto, ou mantenha apenas sua decisão.');
    if(data.entries.length>=100)fail('Este projeto chegou a cem registros. O histórico foi preservado.');
    const reason=text(body.reason),entry={...stamp(body),type:'producao',stage:'producao',text:revised,reason,replaces:before.id,questionAtCreation:data.question,sources:before.sources.map(s=>s.id),sourcesAtCreation:structuredClone(before.sources),artifactUrl:'',sourceHumanComment:decision.comment.id,sourceHumanDecision:decision.id};
    const item={...stamp(body),decision:structuredClone(decision),before,after:{id:entry.id,text:entry.text,created:entry.created,sources:entry.sourcesAtCreation},reason};append(data,'humanRevisions',item,24);data.entries.push(entry);return true;
  }
  return false;
}
const target=(record,id)=>record.presentationAttempts?.find(a=>a.id===id);
function context(record,body){
  if(record.kind!=='projeto'||body.attempts.length!==1)fail('Escolha uma tentativa de apresentação.');const item=target(record,body.attempts[0]);if(!item)fail('Tentativa não encontrada neste projeto.',404);
  if(item.feedback)fail('Responda à pergunta guardando outra tentativa antes de pedir uma nova.');
  const values={audience:item.audience,conclusion:item.conclusion,part:{titulo:item.part.title,roteiro:item.part.text,segundos:item.part.seconds},links:item.links.map(l=>({trechos:l.blocks,referencias:l.references})),answer:item.answer,clarity:{percepcao:item.clarity,oQueRever:item.improve},question:item.question};
  if(!Array.isArray(body.fields)||!body.fields.length||new Set(body.fields).size!==body.fields.length||body.fields.some(f=>!Object.hasOwn(values,f)))fail('Confira as partes que quer compartilhar.');
  return {chosen:[item],content:JSON.stringify({partes:Object.fromEntries(body.fields.map(f=>[f,values[f]]))}),policy:'Ajude o estudante a explicar seu próprio projeto ao público, apenas se esse público foi compartilhado. Faça exatamente UMA pergunta curta no campo pergunta, com um único ponto de interrogação. Questione a clareza de uma ligação, termo, evidência ou limite apresentado. Não faça várias perguntas, não escreva o roteiro, não complete a resposta e não atribua nota ou domínio. Em proximoPasso, sugira conferir um trecho já escolhido e ensaiar outra explicação, sem fornecer resposta pronta. Não invente dados, participantes ou fontes. Não prescreva experimentos ou peça prova causal quando o texto apenas reconhece que não pode atribuir uma causa. Declare os limites dos campos ausentes. Orientação da Lumi é distinta da produção do estudante.'};
}
function projection(record,ref){
  if(ref.type==='apresentacao'){const s=find(record.presentationVersions,ref.step);return {chosen:s,values:{question:`Público: ${s.audience}\nConclusão que quero explicar: ${s.conclusion}`,attempt:s.parts.map(p=>`${p.title} · ${p.seconds} segundos\n${p.text}`).join('\n\n'),evidence:s.parts.map(p=>`${p.title}:\n${s.links.filter(l=>p.links.includes(l.key)).map(l=>l.blocks.map(b=>b.text).join('\n')).join('\n')}`).join('\n\n'),change:s.reason,conclusion:`Tempo disponível: ${s.minutes} minutos. Tempo planejado: ${s.parts.reduce((n,p)=>n+p.seconds,0)} segundos.`},references:s.links.flatMap(l=>l.references)};}
  if(ref.type==='ensaio'){const a=find(record.presentationAttempts,ref.step);return {chosen:a,values:{question:`Público: ${a.audience}\nParte: ${a.part.title}`,attempt:a.answer,evidence:a.links.flatMap(l=>l.blocks.map(b=>b.text)).join('\n'),change:a.improve,conclusion:`Minha percepção: ${({claro:'Percebo clareza',rever:'Quero rever',nao_sei:'Ainda não sei avaliar'})[a.clarity]}`},references:a.links.flatMap(l=>l.references)};}
  const revision=ref.type==='revisao-humana',item=find(revision?record.humanRevisions:record.humanDecisions,ref.step),d=revision?item.decision:item,c=d.comment;
  return {chosen:item,values:{question:`Comentário registrado como recebido de ${c.origin} (${({professor:'professor',colega:'colega',outro:'outra origem'})[c.originRole]}) em ${c.date}. Categoria: ${categories[c.category]}. Origem informada pelo estudante, sem verificação externa.`,attempt:`Trecho comentado:\n${c.excerpt}\n\nComentário recebido:\n${c.comment}`,evidence:d.links.flatMap(l=>l.blocks.map(b=>b.text)).join('\n'),change:revision?`Antes:\n${item.before.text}\n\nDepois:\n${item.after.text}\n\nMotivo da mudança: ${item.reason}`:`Minha decisão: ${choices[d.choice]}\nPor quê: ${d.rationale}${d.reason?`\nRevisão da decisão: ${d.reason}`:''}`,conclusion:`Minha justificativa: ${d.rationale}\nPróximo passo que escolhi: ${d.nextStep}`},references:[...c.production.sources,...d.links.flatMap(l=>l.references)]};
}
module.exports={apply,replay,target,context,projection,sections,categories,choices,descends};

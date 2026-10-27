const {createHash}=require('crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const focuses=['panorama','planejar','observar','argumentar','produzir'];
const decisions={corrigir:'Quero corrigir',justificar:'Justifico minha interpretação',manter:'Mantenho esta escolha',em_aberto:'Mantenho esta questão aberta'};
const text=(v,max)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)fail(`Preencha o texto com até ${max} caracteres.`);return v.trim();};
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const bodyHash=body=>digest({...body,version:undefined});
function stamp(body){if(!/^[a-f0-9-]{36}$/i.test(body.key||''))fail('Identificador de envio inválido.');return {id:body.key,hash:bodyHash(body),created:new Date().toISOString()};}
const productionHash=p=>digest({id:p.id,text:p.text,created:p.created,replaces:p.replaces,sources:p.sourcesAtCreation||[]});
function replay(record,body){const prior=[...(record.coherenceReviews||[]),...(record.workspace?[record.workspace]:[])].find(v=>v.id===body.key);if(!prior)return false;if(prior.hash!==bodyHash(body))fail('Este envio já foi confirmado com outros dados.',409);return true;}
const focusForType=type=>['coleta','fonte','previsao'].includes(type)?'observar':['argumento','contraponto'].includes(type)?'argumentar':'produzir';
function newer(record,ref){
  const lists={projeto:record.entries,argumento:record.argumentVersions,fonte:record.sourceInquiries,previsao:record.predictionComparisons,contraponto:record.counterInquiryResults};
  return Boolean(lists[ref.type]?.some(item=>item.replaces===ref.step));
}
async function preview(owner,record,body,db){
  if(typeof record.id!=='string')fail('Reabra o projeto antes de conferir a produção.');
  if(record.kind&&record.kind!=='projeto')fail('Escolha uma produção de um projeto.');
  const production=record.entries.find(e=>e.id===body.production&&e.type==='producao');if(!production)fail('Produção não encontrada neste projeto.',404);
  if(body.productionHash&&body.productionHash!==productionHash(production))fail('A produção mudou desde a prévia. Confira novamente.',409);
  if(!Array.isArray(body.links)||body.links.length>4)fail('Escolha até quatro versões relacionadas.');
  const identities=body.links.map(l=>`${l?.ref?.type}:${l?.ref?.step}`);if(new Set(identities).size!==identities.length)fail('Cada versão deve aparecer uma única vez.');
  const links=[];
  for(const link of body.links){
    if(!link?.ref||!['projeto','coleta','argumento','fonte','previsao','contraponto'].includes(link.ref.type))fail('Escolha registros, argumentos ou fontes analisadas deste projeto.');
    if(link.ref.type==='projeto'&&link.ref.step===production.id)fail('Escolha uma origem relacionada, em vez de usar a produção como sua própria evidência.');
    // The selected production and every origin must share this project and owner.
    // Resolve still checks ownership, including in direct API requests.
    const source=await require('./researchPortfolioService').resolve(owner,link.ref,db);
    if(source.ref.record!==record.id)fail('Use versões do mesmo projeto nesta revisão.');
    if(link.sourceHash!==source.sourceHash)fail('Uma origem mudou desde a prévia. Confira os trechos novamente.',409);
    if(!Array.isArray(link.parts)||!link.parts.length||new Set(link.parts).size!==link.parts.length||link.parts.some(p=>p==='lumi'||!source.blocks.some(b=>b.key===p)))fail('Escolha trechos autorais; a Lumi não será usada como evidência.');
    if(!Array.isArray(link.references)||link.references.length>5||new Set(link.references).size!==link.references.length||link.references.some(id=>!source.references.some(r=>r.id===id)))fail('Confira as referências escolhidas.');
    links.push({ref:source.ref,title:source.title,created:source.created,sourceHash:source.sourceHash,blocks:source.blocks.filter(b=>link.parts.includes(b.key)),references:source.references.filter(r=>link.references.includes(r.id)),newerVersion:newer(record,source.ref),focus:focusForType(source.ref.type)});
  }
  if(links.reduce((n,l)=>n+l.blocks.reduce((m,b)=>m+b.text.length,0),0)>30000)fail('Escolha menos trechos para esta revisão (até 30 mil caracteres).');
  const productRef={type:'projeto',record:record.id,step:production.id};
  const references=[...(production.sourcesAtCreation||[]),...links.flatMap(l=>l.references)].filter((r,i,a)=>a.findIndex(v=>v.id===r.id)===i);
  const checks=[
    {id:'versoes',title:'Versões que escolhi citar',prompt:'Estas são as versões que quero usar? Uma versão posterior não substitui automaticamente a que escolhi.',detail:newer(record,productRef)||links.some(l=>l.newerVersion)?'Há uma versão posterior em pelo menos uma origem. Confira se manter esta versão faz sentido.':'Nenhuma substituição posterior foi encontrada nas versões escolhidas deste projeto.',origins:[productRef,...links.map(l=>l.ref)]},
    {id:'unidades',title:'Unidades, estimativas e ausências',prompt:'Meu texto distingue o que foi medido, estimado e não obtido? As unidades e condições permitem a comparação que apresento?',detail:'Esta é uma conferência sua. A plataforma não deduz unidades nem converte ausências em zero.',origins:links.filter(l=>['coleta','previsao','contraponto'].includes(l.ref.type)).map(l=>l.ref)},
    {id:'referencias',title:'Referências e trechos de origem',prompt:'As referências escolhidas acompanham as informações que usei? O trecho permite conferir de onde veio a informação?',detail:`${references.length} referência(s) nesta seleção. Referência registrada não equivale a fonte verificada externamente.`,origins:[productRef,...links.filter(l=>l.references.length||l.ref.type==='fonte').map(l=>l.ref)]},
    {id:'sustentacao',title:'O alcance da minha afirmação',prompt:'Expliquei como as evidências sustentam ou limitam a afirmação? Há uma generalização que os registros escolhidos não permitem?',detail:links.length?`${links.length} versão(ões) relacionada(s) escolhida(s), somente com os trechos conferidos.`:'Nenhuma versão relacionada foi escolhida. Você pode reconhecer essa lacuna ou voltar para vincular registros.',origins:links.filter(l=>['argumento','projeto'].includes(l.ref.type)).map(l=>l.ref)},
    {id:'limites',title:'Contrapontos e perguntas abertas',prompt:'O texto reconhece contrapontos, outras interpretações e o que continua em aberto?',detail:'Manter uma pergunta aberta é uma decisão válida. Esta revisão não atribui uma nota ou aprovação automática.',origins:links.filter(l=>['argumento','contraponto','previsao'].includes(l.ref.type)).map(l=>l.ref)}
  ];
  return {production:{id:production.id,text:production.text,created:production.created,replaces:production.replaces,sources:structuredClone(production.sourcesAtCreation||[])},productionHash:productionHash(production),links,checks,references};
}
async function apply(owner,record,body,db,recordId=record.id){
  if(body.action==='projectFocus'){
    if(!focuses.includes(body.focus))fail('Escolha panorama, planejar, observar, argumentar ou produzir.');
    record.workspace={...stamp(body),focus:body.focus};return true;
  }
  if(body.action!=='coherenceReview')return false;
  if((record.coherenceReviews?.length||0)>=16)fail('Este projeto chegou a dezesseis revisões. O histórico permanece preservado.');
  if(typeof body.productionHash!=='string')fail('Confira a produção antes de guardar a revisão.');
  const view=await preview(owner,{...record,id:recordId},body,db);
  if(!Array.isArray(body.decisions)||body.decisions.length!==view.checks.length||new Set(body.decisions.map(d=>d.check)).size!==view.checks.length)fail('Registre uma decisão para cada ponto da conferência.');
  const answers=view.checks.map(check=>{const answer=body.decisions.find(a=>a.check===check.id);if(!answer||!Object.hasOwn(decisions,answer.decision))fail('Confira as decisões da revisão.');return {check:check.id,decision:answer.decision,note:text(answer.note,1200)};});
  const item={...stamp(body),question:record.question,...view,decisions:answers,reflection:text(body.reflection,2000)};
  item.text=`Produção escolhida:\n${view.production.text}\n\n${answers.map(a=>`${view.checks.find(c=>c.id===a.check).title}: ${decisions[a.decision]}\n${a.note}`).join('\n\n')}\n\nMinha reflexão: ${item.reflection}`;
  record.coherenceReviews=[...(record.coherenceReviews||[]),item];return true;
}
const target=(record,id)=>record.coherenceReviews?.find(r=>r.id===id);
function context(record,body){
  if(record.kind!=='projeto'||body.attempts.length!==1)fail('Escolha uma revisão deste projeto.');
  const review=target(record,body.attempts[0]);if(!review)fail('Revisão não encontrada.',404);
  if(typeof body.excerpt!=='string'||!body.excerpt.trim()||body.excerpt.length>3000||!review.production.text.includes(body.excerpt))fail('Escolha um trecho literal da produção conferida (até 3 mil caracteres).');
  if(!Array.isArray(body.links)||body.links.length>2||new Set(body.links).size!==body.links.length||body.links.some(id=>!review.links.some(l=>l.ref.step===id)))fail('Escolha até duas ligações desta revisão.');
  const links=review.links.filter(l=>body.links.includes(l.ref.step));
  return {chosen:[review],content:JSON.stringify({trecho:body.excerpt,ligacoes:links.map(l=>({trechos:l.blocks,referencias:l.references})),objetivo:body.goal?text(body.goal,1000):''}),policy:'Examine somente o trecho literal e as ligações selecionadas. As outras partes da produção, decisões, versões e registros não foram compartilhados. Faça uma pergunta fundamentada sobre a sustentação ou os limites do trecho, sem reescrever ou completar a produção e sem atribuir nota, aprovação, domínio ou veracidade. Não declare fonte verificada. Se o trecho reconhece que não é possível concluir uma causa, não o trate como uma alegação causal a ser provada. Diga explicitamente quando não tiver evidência suficiente para avaliar uma ligação. Não invente dados nem use ausência como zero. Sua pergunta deve tratar da clareza de uma limitação ou de como um trecho se liga aos dados já apresentados. Não cobre uma prova causal que a produção não alega fornecer. Em proximoPasso, indique uma anotação, referência ou condição já existente para conferir. Não prescreva uma nova coleta ou experimento, não peça isolar variáveis e não prometa que padronizar algumas condições permitirá atribuir uma causa.'};
}
function projection(record,ref){const review=target(record,ref.step);if(!review)fail('Revisão não encontrada neste projeto.',404);return {chosen:review,values:{question:review.question,attempt:review.production.text,evidence:review.links.map(l=>`${l.title} · versão de ${l.created}\n${l.blocks.map(b=>`${b.label}: ${b.text}`).join('\n')}`).join('\n\n'),change:review.decisions.map(a=>`${review.checks.find(c=>c.id===a.check).title}: ${decisions[a.decision]}\n${a.note}`).join('\n\n'),conclusion:review.reflection},references:review.references};}
module.exports={apply,replay,preview,target,context,projection,focuses,decisions,productionHash};

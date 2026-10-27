const {createHash}=require('crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const text=(value,max=1600)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail(`Preencha o texto com até ${max} caracteres.`);return value.trim();};
const find=(items,id)=>{const found=items?.find(item=>item.id===id);if(!found)fail('Versão não encontrada neste projeto.',404);return found;};
const digest=body=>createHash('sha256').update(JSON.stringify({...body,version:undefined})).digest('hex');
function stamp(body){if(!/^[a-f0-9-]{36}$/i.test(body.key||''))fail('Identificador de envio inválido.');return {id:body.key,hash:digest(body),created:new Date().toISOString()};}
const names=['predictions','predictionComparisons','counterInvestigations','counterInquiryEvents','counterInquiryResults'];
function replay(data,body){const found=names.flatMap(name=>data[name]||[]).find(item=>item.id===body.key);if(!found)return false;if(found.hash!==digest(body))fail('Este envio já foi confirmado com outros dados.',409);return true;}
function append(data,name,item,max){if((data[name]?.length||0)>=max)fail('O limite deste histórico foi atingido. As versões anteriores estão preservadas.');data[name]=[...(data[name]||[]),item];}
function latest(items,group,value){return items?.filter(item=>item[group]===value).at(-1);}
function current(items,id,group){const prior=find(items,id);if(latest(items,group,prior[group]).id!==prior.id)fail('Há uma versão mais recente. Reabra este registro.',409);return prior;}
const verdicts={favoravel:'Favorável à previsão, dentro dos limites',contraria:'Contrária à previsão, dentro dos limites',insuficiente:'Evidência insuficiente para decidir'};
const outcomes={apoia:'Favorece a afirmação dentro do recorte',contraria:'Questiona a afirmação dentro do recorte',inconclusiva:'Permanece inconclusiva'};
function inquiryState(data,root){return latest(data.counterInquiryEvents,'inquiry',root)?.state||'planejada';}
function comparisonText(item){return `O que esperava: ${item.prediction.expected}\nPor quê: ${item.prediction.rationale}\nO que poderia contrariar: ${item.prediction.challenge}\nMomento da previsão: ${item.prediction.timing==='antes'?'antes das observações deste caderno':'registrada ou revista após existirem observações'}\n\nO que observei:\n${require('./projectEvidenceService').selectionText(item.selection)}\n\nMinha leitura: ${verdicts[item.verdict]}\nO que é favorável: ${item.support}\nO que contraria ou não se encaixa: ${item.against}\nO que preciso reconsiderar: ${item.reconsider}\nIncertezas e limites: ${item.limits}`;}
function resultText(result){return `Contraponto de origem: ${result.plan.origin.counterpoint}\nAfirmação naquela versão: ${result.plan.origin.claim}\nPergunta investigada: ${result.plan.question}\nCritérios definidos: ${result.plan.criteria}\n\nO que fiz e encontrei: ${result.observed}\n${result.selection?`Dados escolhidos:\n${require('./projectEvidenceService').selectionText(result.selection)}\n`:''}Minha interpretação: ${outcomes[result.outcome]}\nPor que interpreto assim: ${result.interpretation}\nLimites: ${result.limits}\nPergunta que permanece aberta: ${result.openQuestion}`;}
async function apply(data,body){
  if(body.action==='prediction'){
    const plan=find(data.observationPlans,body.plan),prior=body.replaces?current(data.predictions,body.replaces,'thread'):null;
    if(prior&&prior.notebook!==plan.notebook)fail('A revisão deve permanecer no mesmo caderno.');
    const observed=(data.observations||[]).filter(row=>row.notebook===plan.notebook);
    if(observed.length&&body.acknowledgeExisting!==true)fail('Reconheça que já existem observações. Esta previsão não será apresentada como anterior à coleta.');
    if(!prior&&(data.predictions||[]).filter(p=>!p.replaces).some(p=>p.notebook===plan.notebook))fail('Este caderno já tem uma previsão. Reveja a versão existente.');
    const item={...stamp(body),thread:prior?.thread||body.key,notebook:plan.notebook,plan:{...plan},expected:text(body.expected),rationale:text(body.rationale),challenge:text(body.challenge),timing:observed.length?'posterior':'antes',observationsAtCreation:observed.map(r=>r.id),replaces:prior?.id||null,reason:prior?text(body.reason):''};
    item.text=`Previsão: ${item.expected}\nJustificativa: ${item.rationale}\nPossível contradição: ${item.challenge}`;
    append(data,'predictions',item,32);return true;
  }
  if(body.action==='predictionComparison'){
    const prediction=find(data.predictions,body.prediction),selection=find(data.observationSelections,body.selection),prior=body.replaces?current(data.predictionComparisons,body.replaces,'thread'):null;
    if(selection.plan.notebook!==prediction.notebook)fail('Compare dados do mesmo caderno da previsão.');
    if(prior&&prior.prediction.thread!==prediction.thread)fail('A revisão deve permanecer na mesma previsão.');
    if(!Object.hasOwn(verdicts,body.verdict))fail('Distinga evidência favorável, contrária ou insuficiente.');
    const item={...stamp(body),thread:prior?.thread||body.key,prediction:structuredClone(prediction),selection:structuredClone(selection),verdict:body.verdict,support:text(body.support),against:text(body.against),reconsider:text(body.reconsider),limits:text(body.limits),replaces:prior?.id||null,reason:prior?text(body.reason):''};
    // Feedback belongs to its original record, not to a frozen copy used as evidence.
    delete item.prediction.feedback;delete item.prediction.contest;delete item.selection.feedback;delete item.selection.contest;
    item.text=comparisonText(item);append(data,'predictionComparisons',item,32);return true;
  }
  if(body.action==='counterInquiryPlan'){
    const origin=find(data.argumentVersions,body.argument),prior=body.replaces?current(data.counterInvestigations,body.replaces,'thread'):null;
    if(prior&&prior.origin.id!==origin.id)fail('Preserve a versão do contraponto de origem.');
    if(prior&&!['planejada','pausada'].includes(inquiryState(data,prior.thread)))fail('Pause a investigação antes de rever o plano.',409);
    if(!prior&&(data.counterInvestigations||[]).filter(p=>!p.replaces).length>=8)fail('Este projeto já possui oito investigações de contrapontos.');
    if(!Number.isInteger(body.minutes)||body.minutes<5||body.minutes>120)fail('Escolha de 5 a 120 minutos por encontro.');
    const item={...stamp(body),thread:prior?.thread||body.key,origin:{id:origin.id,thread:origin.thread,title:origin.title,claim:origin.claim,counterpoint:origin.counterpoint,created:origin.created},title:text(body.title,120),question:text(body.question),missing:text(body.missing),explanations:text(body.explanations),resources:text(body.resources),conditions:text(body.conditions),criteria:text(body.criteria),firstAction:text(body.firstAction),limits:text(body.limits),minutes:body.minutes,replaces:prior?.id||null,reason:prior?text(body.reason):''};
    append(data,'counterInvestigations',item,32);return true;
  }
  if(body.action==='counterInquiryState'){
    const plan=current(data.counterInvestigations,body.plan,'thread'),state=inquiryState(data,plan.thread),next=body.state;
    if(!((['planejada','pausada'].includes(state)&&next==='em_andamento')||(state==='em_andamento'&&next==='pausada')))fail('Esta mudança de estado não está disponível.',409);
    append(data,'counterInquiryEvents',{...stamp(body),inquiry:plan.thread,plan:plan.id,state:next,note:text(body.note,1000)},80);return true;
  }
  if(body.action==='counterInquiryResult'){
    const plan=current(data.counterInvestigations,body.plan,'thread'),prior=body.replaces?current(data.counterInquiryResults,body.replaces,'inquiry'):null;
    if(prior&&(prior.inquiry!==plan.thread||prior.plan.id!==plan.id))fail('Confira o plano da versão que deseja corrigir.');
    if(!prior&&inquiryState(data,plan.thread)!=='em_andamento')fail('Comece a investigação antes de registrar seu resultado.',409);
    if(!prior&&(data.counterInquiryResults||[]).some(r=>r.inquiry===plan.thread))fail('Reveja o resultado anterior em vez de criar outro.',409);
    if(!Object.hasOwn(outcomes,body.outcome))fail('Distinga o resultado encontrado, inclusive quando inconclusivo.');
    const selection=body.selection?structuredClone(find(data.observationSelections,body.selection)):null;
    if(selection){delete selection.feedback;delete selection.contest;}
    const item={...stamp(body),inquiry:plan.thread,plan:structuredClone(plan),selection,observed:text(body.observed,4000),outcome:body.outcome,interpretation:text(body.interpretation),limits:text(body.limits),openQuestion:text(body.openQuestion),replaces:prior?.id||null,reason:prior?text(body.reason):''};
    item.text=resultText(item);append(data,'counterInquiryResults',item,32);
    if(!prior)append(data,'counterInquiryEvents',{...stamp(body),id:require('crypto').randomUUID(),inquiry:plan.thread,plan:plan.id,state:'concluida',note:'Resultado registrado pelo estudante.'},80);
    return true;
  }
  return false;
}
function target(data,id){return (data.predictionComparisons||[]).find(i=>i.id===id)||(data.counterInquiryResults||[]).find(i=>i.id===id);}
function context(record,body){
  if(record.kind!=='projeto'||body.attempts.length!==1)fail('Escolha uma comparação ou resultado deste projeto.');
  const comparison=body.mode==='prediction',item=find(comparison?record.predictionComparisons:record.counterInquiryResults,body.attempts[0]);
  const fields=comparison?{expected:item.prediction.expected,rationale:item.prediction.rationale,challenge:item.prediction.challenge,timing:item.prediction.timing==='antes'?'Previsão anterior às observações do caderno.':'Previsão registrada ou revista depois de existirem observações.',observations:require('./projectEvidenceService').selectionText(item.selection),verdict:verdicts[item.verdict],support:item.support,against:item.against,reconsider:item.reconsider,limits:item.limits}:{counterpoint:item.plan.origin.counterpoint,claim:item.plan.origin.claim,question:item.plan.question,criteria:item.plan.criteria,observed:item.observed,observations:item.selection?require('./projectEvidenceService').selectionText(item.selection):'Nenhuma seleção de dados enviada.',outcome:outcomes[item.outcome],interpretation:item.interpretation,limits:item.limits,openQuestion:item.openQuestion};
  if(!Array.isArray(body.fields)||!body.fields.length||new Set(body.fields).size!==body.fields.length||body.fields.some(f=>!Object.hasOwn(fields,f)))fail('Confira os campos escolhidos para a Lumi.');
  return {chosen:[item],content:JSON.stringify({objetivo:body.goal?text(body.goal,1000):'',partes:Object.fromEntries(body.fields.map(f=>[f,fields[f]]))}),policy:'Questione somente a comparação selecionada e os campos enviados. Não invente outros dados, não complete a conclusão pelo estudante e não atribua nota. Coincidência com uma previsão não é confirmação ou prova causal. Evidência contrária e ausência de evidência são diferentes. Preserve valores ausentes e incertezas; não generalize a partir de poucas observações. Se o momento da previsão não foi enviado, não a descreva como anterior à coleta. Uma previsão revista depois de observar é retrospectiva. Um resultado inconclusivo pode exigir uma nova pergunta, sem forçar decisão. Identifique o que o estudante realmente defende: reconhecer que não é possível atribuir causa não é uma alegação causal a ser provada. Não trate a ausência de uma prova causal como erro dessa conclusão cautelosa. Não prometa que cronometrar, repetir, padronizar algumas condições ou usar o mesmo texto isolará uma causa, garantirá comparabilidade ou fará a diferença refletir apenas um fator. Novas medidas podem reduzir uma incerteza, mas não resolvem automaticamente outras diferenças. Não invente participantes, grupos ou procedimentos que não foram apresentados. Nesta análise, examine a comparação já existente; o planejamento de nova coleta pertence ao formulário do estudante. Em pergunta, escolha uma diferença ou informação ausente já mencionada e pergunte como ela limita a interpretação. Em proximoPasso, sugira conferir uma condição, critério ou registro já existente. Não proponha um experimento, não peça isolar variáveis e não pergunte como garantir comparabilidade ou demonstrar uma causa.'};
}
function projection(record,ref){
  const comparison=ref.type==='previsao',item=find(comparison?record.predictionComparisons:record.counterInquiryResults,ref.step);
  return {chosen:item,values:comparison?{question:item.prediction.plan.question,attempt:`${item.prediction.expected}\nJustificativa: ${item.prediction.rationale}\nO que poderia contrariar: ${item.prediction.challenge}\nMomento: ${item.prediction.timing==='antes'?'Antes das observações':'Após existirem observações'}`,evidence:require('./projectEvidenceService').selectionText(item.selection),change:`${verdicts[item.verdict]}\nFavorável: ${item.support}\nContrário ou não explicado: ${item.against}\nReconsideração: ${item.reconsider}${item.reason?`\nMotivo da revisão: ${item.reason}`:''}`,conclusion:`Incertezas e limites: ${item.limits}`}:{question:`Contraponto de origem: ${item.plan.origin.counterpoint}\nPergunta: ${item.plan.question}`,attempt:`Plano escolhido: ${item.plan.title}\nCondições: ${item.plan.conditions}\nCritérios: ${item.plan.criteria}\nRecursos: ${item.plan.resources}\nLimites previstos: ${item.plan.limits}`,evidence:`O que fiz e encontrei: ${item.observed}\n${item.selection?require('./projectEvidenceService').selectionText(item.selection):'Sem seleção de observações vinculada.'}`,change:item.reason,conclusion:`${outcomes[item.outcome]}\nInterpretação: ${item.interpretation}\nLimites: ${item.limits}\nPergunta aberta: ${item.openQuestion}`},references:[]};
}
module.exports={apply,replay,target,context,projection,inquiryState,verdicts,outcomes};

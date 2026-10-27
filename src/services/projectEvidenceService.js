const {createHash}=require('crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const text=(v,max,required=true)=>{if(v==null&&!required)return '';if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim()))fail(`Confira o texto: use até ${max} caracteres.`);return v.trim();};
const hash=b=>createHash('sha256').update(JSON.stringify({...b,version:undefined})).digest('hex');
const stamp=b=>{if(!/^[a-f0-9-]{36}$/i.test(b.key||''))fail('Identificador de envio inválido.');return {id:b.key,hash:hash(b),created:new Date().toISOString()};};
const find=(list,id)=>{const value=list?.find(v=>v.id===id);if(!value)fail('Versão não encontrada neste projeto.',404);return value;};
const room=(list,max)=>{if(list.length>=max)fail('O limite deste histórico foi atingido. As versões anteriores continuam preservadas.');};
const kinds={medido:'Medido',estimado:'Estimado',ausente:'Ausente'};
function latestRows(data,notebook){const rows=(data.observations||[]).filter(r=>r.notebook===notebook),replaced=new Set(rows.map(r=>r.replaces).filter(Boolean));return rows.filter(r=>!replaced.has(r.id)).sort((a,b)=>a.position-b.position);}
function rowText(row){return `${row.position}. ${row.label} · ${row.date}\n${kinds[row.kind]}: ${row.value===null?'sem valor registrado':`${row.value} ${row.unit}`}\nCondições: ${row.conditions}\nObservações / ausência: ${row.note||'Sem observação adicional.'}${row.reason?`\nMotivo da correção: ${row.reason}`:''}`;}
function replay(data,body){const prior=[...(data.observationPlans||[]),...(data.observations||[]),...(data.observationSelections||[]),...(data.argumentVersions||[]),...(data.evidencePublications||[])].find(v=>v.id===body.key);if(!prior)return false;if(prior.hash!==hash(body))fail('Este envio já foi confirmado com outros dados. Reabra o histórico.',409);return true;}
function selectionText(selection){return `Pergunta: ${selection.plan.question}\nO que observei: ${selection.plan.observe}\nUnidade: ${selection.plan.unit}\nCondições planejadas: ${selection.plan.conditions}\n\n${selection.rows.map(rowText).join('\n\n')}\n\nPor que escolhi estes dados: ${selection.purpose}\nLimites desta seleção: ${selection.limits}`;}
async function apply(owner,data,body,db){
  if(body.action==='observationPlan'){
    const plans=data.observationPlans||[],prior=body.replaces?find(plans,body.replaces):null;room(plans,24);
    if(prior&&plans.filter(p=>p.notebook===prior.notebook).at(-1).id!==prior.id)fail('O plano já possui outra versão. Reabra o caderno.',409);
    if(!prior&&plans.filter(p=>!p.replaces).length>=8)fail('Este projeto já tem oito cadernos de observações.');
    const count=Number(body.count);if(!Number.isInteger(count)||count<1||count>40)fail('Planeje de uma a quarenta observações.');
    const unit=text(body.unit,60),current=prior?latestRows(data,prior.notebook):[];
    if(current.length&&unit!==prior.unit)fail('Para outra unidade, crie um novo caderno. Os valores registrados não serão convertidos automaticamente.');
    if(count<current.length)fail('A quantidade planejada deve comportar as observações já registradas.');
    const plan={...stamp(body),notebook:prior?.notebook||body.key,title:text(body.title,120),question:text(body.question,1000),observe:text(body.observe,1200),unit,conditions:text(body.conditions,1600),count,limits:text(body.limits,1600),replaces:prior?.id||null,reason:text(body.reason,1200,Boolean(prior))};
    data.observationPlans=[...plans,plan];return true;
  }
  if(body.action==='observation'){
    const plan=find(data.observationPlans,body.plan),plans=data.observationPlans.filter(p=>p.notebook===plan.notebook);if(plans.at(-1).id!==plan.id)fail('O plano mudou. Reabra o caderno antes de registrar.',409);
    const rows=data.observations||[];room(rows,240);const current=latestRows(data,plan.notebook),prior=body.replaces?find(rows,body.replaces):null;
    if(prior&&(prior.notebook!==plan.notebook||!current.some(r=>r.id===prior.id)))fail('Escolha a versão atual desta observação para corrigir.',409);
    if(!prior&&current.length>=plan.count)fail('A quantidade planejada foi preenchida. Reveja o plano para acrescentar observações.');
    if(!Object.hasOwn(kinds,body.kind))fail('Distinga valor medido, estimado ou ausente.');
    if(body.kind==='ausente'&&body.value!=null&&body.value!=='')fail('Uma observação ausente deve permanecer sem valor.');
    const value=body.kind==='ausente'?null:body.value;
    if(body.kind!=='ausente'&&(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e12))fail('Informe um número finito entre -1 trilhão e 1 trilhão, ou marque como ausente.');
    const day=require('./flashcardService').today();if(typeof body.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||body.date<'2000-01-01'||body.date>day||!Number.isFinite(Date.parse(`${body.date}T12:00:00Z`))||new Date(`${body.date}T12:00:00Z`).toISOString().slice(0,10)!==body.date)fail('Informe uma data válida, até hoje.');
    const row={...stamp(body),notebook:plan.notebook,plan:plan.id,position:prior?.position||current.length+1,label:text(body.label,100),date:body.date,kind:body.kind,value,unit:plan.unit,conditions:text(body.conditions,1600),note:text(body.note,1200,body.kind==='ausente'),replaces:prior?.id||null,reason:text(body.reason,1200,Boolean(prior))};row.text=rowText(row);data.observations=[...rows,row];return true;
  }
  if(body.action==='observationSelection'){
    const plan=find(data.observationPlans,body.plan),selections=data.observationSelections||[];room(selections,24);
    if(!Array.isArray(body.rows)||body.rows.length<1||body.rows.length>12||new Set(body.rows).size!==body.rows.length)fail('Escolha de uma a doze observações distintas.');
    const rows=body.rows.map(id=>find(data.observations,id));if(rows.some(r=>r.notebook!==plan.notebook||r.unit!==plan.unit)||new Set(rows.map(r=>r.position)).size!==rows.length)fail('Escolha uma versão de cada observação deste caderno, na unidade do plano.');
    const selected={...stamp(body),title:text(body.title,120),plan:{id:plan.id,notebook:plan.notebook,title:plan.title,question:plan.question,observe:plan.observe,unit:plan.unit,conditions:plan.conditions,limits:plan.limits},rows:rows.sort((a,b)=>a.position-b.position).map(r=>Object.fromEntries(['id','plan','position','label','date','kind','value','unit','conditions','note','replaces','reason'].map(k=>[k,r[k]]))),purpose:text(body.purpose,1600),limits:text(body.limits,1600)};
    selected.text=selectionText(selected);data.observationSelections=[...selections,selected];return true;
  }
  if(body.action==='argumentVersion'){
    const versions=data.argumentVersions||[];room(versions,32);const prior=body.replaces?find(versions,body.replaces):null;
    if(prior&&versions.filter(v=>v.thread===prior.thread).at(-1).id!==prior.id)fail('O argumento já possui outra versão. Reabra a linha de raciocínio.',409);
    if(!prior&&versions.filter(v=>!v.replaces).length>=8)fail('Este projeto já possui oito linhas de argumentação.');
    if(!Array.isArray(body.evidences)||!body.evidences.length||body.evidences.length>3||body.evidences.some(e=>!e||!e.ref))fail('Escolha de uma a três evidências do seu acervo.');
    const identities=body.evidences.map(e=>[e.ref.type,e.ref.record,e.ref.experiment||'',e.ref.step].join(':'));if(new Set(identities).size!==identities.length)fail('Cada versão deve aparecer uma única vez no argumento.');
    const evidences=[];
    for(const evidence of body.evidences){
      if(evidence.ref.type==='argumento')fail('Vincule um registro ou uma fonte analisada, em vez de usar outro argumento como evidência.');
      const source=await require('./researchPortfolioService').resolve(owner,evidence.ref,db);
      if(evidence.sourceHash!==source.sourceHash)fail('Uma evidência mudou desde a prévia. Confira novamente os trechos antes de salvar.',409);
      if(!Array.isArray(evidence.parts)||!evidence.parts.length||new Set(evidence.parts).size!==evidence.parts.length||evidence.parts.some(p=>p==='lumi'||!source.blocks.some(b=>b.key===p)))fail('Escolha os trechos do registro. Uma orientação da Lumi não será usada como evidência.');
      if(!Array.isArray(evidence.references)||evidence.references.length>5||new Set(evidence.references).size!==evidence.references.length||evidence.references.some(id=>!source.references.some(r=>r.id===id)))fail('Confira as referências selecionadas.');
      evidences.push({id:require('crypto').randomUUID(),ref:source.ref,title:source.title,href:source.href,date:source.created,blocks:source.blocks.filter(b=>evidence.parts.includes(b.key)),references:source.references.filter(r=>evidence.references.includes(r.id)),justification:text(evidence.justification,2000)});
    }
    const version={...stamp(body),thread:prior?.thread||body.key,question:data.question,title:text(body.title,120),claim:text(body.claim,1600),evidences,counterpoint:text(body.counterpoint,2000),alternative:text(body.alternative,2000),limits:text(body.limits,2000),replaces:prior?.id||null,reason:text(body.reason,1600,Boolean(prior))};
    version.text=`Afirmação: ${version.claim}\n\n${evidences.map(e=>`Evidência: ${e.title}\n${e.blocks.map(b=>`${b.label}: ${b.text}`).join('\n')}\nPor que sustenta a afirmação: ${e.justification}`).join('\n\n')}\n\nContraponto: ${version.counterpoint}\nInterpretação alternativa: ${version.alternative}\nLimites: ${version.limits}`;
    if(version.text.length>24000)fail('Esta linha ficou extensa. Escolha menos trechos (até 24 mil caracteres).');data.argumentVersions=[...versions,version];return true;
  }
  if(['publishObservation','publishArgument'].includes(body.action)){
    const observation=body.action==='publishObservation',selected=find(observation?data.observationSelections:data.argumentVersions,body.selection),publications=data.evidencePublications||[];room(publications,48);room(data.entries,100);
    if(publications.some(p=>p.selection===selected.id&&p.action===body.action))fail('Esta versão já foi levada aos registros do projeto.',409);
    const entry={...stamp(body),stage:observation?'analise':'producao',type:observation?'evidencia':'producao',text:text(body.text,6000),reason:text(body.reason,1600),questionAtCreation:data.question,replaces:null,sources:[],sourcesAtCreation:observation?[{id:selected.id,origin:selected.title,purpose:selected.purpose,limits:selected.limits,url:''}]:selected.evidences.flatMap(e=>e.references).filter((r,i,a)=>a.findIndex(v=>v.id===r.id)===i),artifactUrl:'',...(observation?{sourceObservation:selected.id}:{sourceArgument:selected.id})};
    data.entries.push(entry);data.evidencePublications=[...publications,{...stamp(body),action:body.action,selection:selected.id,entry:entry.id}];return true;
  }
  return false;
}
function target(data,id){return (data.observationSelections||[]).find(s=>s.id===id)||(data.argumentVersions||[]).find(v=>v.id===id);}
function context(record,body){
  if(record.kind!=='projeto'||body.attempts.length!==1)fail('Escolha uma seleção ou versão deste projeto.');
  const goal=text(body.goal,1000,false);
  if(body.mode==='observations'){
    const selected=find(record.observationSelections,body.attempts[0]),allowed=['question','observe','unit','conditions','limits','value','kind','date','label','note'];
    if(!Array.isArray(body.rows)||!body.rows.length||body.rows.length>12||new Set(body.rows).size!==body.rows.length||!Array.isArray(body.fields)||!body.fields.length||body.fields.some(f=>!allowed.includes(f)))fail('Escolha as observações e os campos para compartilhar.');
    const rows=body.rows.map(id=>find(selected.rows,id));
    return {chosen:[selected],content:JSON.stringify({objetivo:goal,plano:Object.fromEntries(body.fields.filter(f=>['question','observe','unit','conditions'].includes(f)).map(f=>[f,selected.plan[f]])),...(body.fields.includes('limits')?{limites:selected.limits,limitesDoPlano:selected.plan.limits}:{}),observacoes:rows.map(r=>Object.fromEntries(body.fields.filter(f=>['value','kind','date','label','note','conditions'].includes(f)).map(f=>[f,r[f]])))}),policy:'Examine SOMENTE as observações e os campos selecionados. Valor ausente é ausência de informação, nunca zero. Nesta coleta pequena, não sugira imputar, preencher ou substituir ausências por médias, medianas ou estimativas. Preserve a ausência e ajude a planejar como obter uma nova observação; qualquer estimativa futura deve ser uma decisão explícita do estudante e rotulada como tal. Diferencie medidas de estimativas se o tipo foi enviado; se não foi, não presuma que mediu. Não atribua causalidade, representatividade, significância estatística ou domínio a uma pequena coleta. Condições diferentes e informações não compartilhadas limitam a comparação. Sugira uma verificação concreta sem inventar valores ou completar resultados.'};
  }
  if(body.mode==='argument'){
    const version=find(record.argumentVersions,body.attempts[0]),evidence=find(version.evidences,body.evidence),allowed=['claim','evidence','justification','counterpoint','alternative','limits'];
    if(!Array.isArray(body.fields)||!body.fields.length||body.fields.some(f=>!allowed.includes(f)))fail('Escolha as partes desta ligação para compartilhar.');
    return {chosen:[version],content:JSON.stringify({objetivo:goal,partes:Object.fromEntries(body.fields.map(f=>[f,f==='evidence'?{title:evidence.title,blocks:evidence.blocks,references:evidence.references}:f==='justification'?evidence.justification:version[f]]))}),policy:'Questione SOMENTE a ligação selecionada entre afirmação, evidência e justificativa. Não complete o argumento, não escreva a conclusão pelo estudante, não dê nota nem presuma que uma ligação é válida. Identifique o que a afirmação realmente defende: se reconhece que não é possível atribuir uma causa, não a trate como uma alegação causal que o estudante precisaria provar. Não prometa que controlar poucas condições garante uma inferência causal. Evidência citada não foi verificada externamente; reconheça os limites do trecho e dos campos ausentes. Considere interpretações alternativas e contrapontos se foram compartilhados. Faça uma pergunta útil sobre como o registro sustenta ou limita a afirmação, preservando a autoria.'};
  }
  fail('Modo de análise inválido.');
}
module.exports={apply,replay,target,context,latestRows,rowText,selectionText,kinds};

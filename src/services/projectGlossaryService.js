const {createHash}=require('crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const text=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail(`Preencha o texto com até ${max} caracteres.`);return value.trim();};
const hash=body=>createHash('sha256').update(JSON.stringify({...body,version:undefined})).digest('hex');
const find=(data,id)=>{const item=data.glossaryVersions?.find(v=>v.id===id);if(!item)fail('Definição não encontrada neste projeto.',404);return item;};
function replay(data,body){const item=data.glossaryVersions?.find(v=>v.id===body.key);if(!item)return false;if(item.hash!==hash(body))fail('Este envio já foi usado com outros dados.',409);return true;}
async function apply(owner,data,body,db,id){
  if(body.action!=='glossaryVersion')return false;
  if(!/^[a-f0-9-]{36}$/i.test(body.key||''))fail('Identificador de envio inválido.');
  if((data.glossaryVersions?.length||0)>=80)fail('O glossário chegou a oitenta versões. Seu histórico foi preservado.');
  const old=body.replaces?find(data,body.replaces):null;
  if(old&&data.glossaryVersions.some(v=>v.replaces===old.id))fail('Há uma definição mais recente. Reabra o registro.',409);
  const term=text(body.term,100);
  if(!old&&data.glossaryVersions?.some(v=>!v.replaces&&v.term.toLocaleLowerCase('pt-BR')===term.toLocaleLowerCase('pt-BR')))fail('Este termo já está no glossário. Reveja sua definição.');
  const production=await require('./productionPracticeService').production(owner,data,body,db,id);
  const excerpt=text(body.excerpt,1200);if(!production.text.includes(excerpt))fail('Escolha um trecho literal da produção.');
  let presentation=null;
  if(body.presentation){const script=data.presentationVersions?.find(v=>v.id===body.presentation),part=script?.parts.find(p=>p.id===body.part);if(!part)fail('Parte do roteiro não encontrada.',404);presentation={id:script.id,title:script.title,part:structuredClone(part)};}
  const links=await require('./productionPracticeService').links(owner,body.links,db,id);
  const item={id:body.key,hash:hash(body),created:new Date().toISOString(),thread:old?.thread||body.key,replaces:old?.id||null,term,definition:text(body.definition,2000),example:text(body.example,1600),counterexample:text(body.counterexample,1600),origin:text(body.origin,1000),production,excerpt,presentation,links,reason:old?text(body.reason,1600):''};
  item.text=`${item.term}: ${item.definition}\nExemplo: ${item.example}\nContraexemplo: ${item.counterexample}\nContexto: ${item.excerpt}`;
  data.glossaryVersions=[...(data.glossaryVersions||[]),item];return true;
}
const target=(record,id)=>record.glossaryVersions?.find(v=>v.id===id);
function context(record,body){
  if(record.kind!=='projeto'||body.attempts.length!==1)fail('Escolha uma definição.');
  const item=find(record,body.attempts[0]),values={term:item.term,definition:item.definition,example:item.example,counterexample:item.counterexample,origin:item.origin,excerpt:item.excerpt,links:item.links};
  if(!Array.isArray(body.fields)||!body.fields.includes('definition')||new Set(body.fields).size!==body.fields.length||body.fields.some(f=>!Object.hasOwn(values,f)))fail('Inclua a definição e confira o contexto escolhido.');
  return {chosen:[item],content:JSON.stringify({partes:Object.fromEntries(body.fields.map(f=>[f,values[f]]))}),policy:'Examine somente a definição e os campos escolhidos. Faça exatamente UMA pergunta de esclarecimento com um único ponto de interrogação. A tarefa é esclarecer o significado de um termo, não exigir um experimento ou diagnosticar a investigação inteira. Quando a definição já reconhece uma limitação, não a trate como uma falha nem exija controle causal para uma conclusão que explicitamente não atribui causa. Faça uma pergunta curta sobre uma única distinção conceitual do contexto; não reúna várias solicitações numa pergunta. Não reescreva a definição nem produza uma resposta pronta. Não declare uma origem verificada, domínio ou nota. Diferencie exemplo e contraexemplo apenas se compartilhados. No campo lacuna, descreva somente uma imprecisão no significado apresentado; quando nenhuma for demonstrada, diga explicitamente que não há lacuna demonstrada na definição. Não liste dados, controles ou experimentos ausentes como defeitos de uma definição conceitual. No campo proximoPasso, proponha apenas rever uma frase da definição ou distinguir exemplo de contraexemplo; não solicite coleta, controle de variáveis, teste de reversibilidade ou experimento. No campo incerteza, explique que definição e exemplos não comprovam domínio nem verificam a investigação; não conclua que existe associação empírica só porque um exemplo hipotético a menciona.'};
}
function projection(record,ref){const item=find(record,ref.step);return {chosen:item,values:{question:item.term,attempt:item.definition,evidence:`Exemplo: ${item.example}\nContraexemplo: ${item.counterexample}\nTrecho da produção: ${item.excerpt}`,change:item.reason,conclusion:`Origem consultada: ${item.origin}`},references:item.links.flatMap(l=>l.references)};}
module.exports={apply,replay,target,context,projection};

const {createHash}=require('crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const text=(v,max,required=true)=>{if(v==null&&!required)return '';if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim()))fail(`Confira o texto: use até ${max} caracteres.`);return v.trim();};
const stamp=body=>{if(!/^[a-f0-9-]{36}$/i.test(body.key||''))fail('Identificador de envio inválido.');return {id:body.key,hash:createHash('sha256').update(JSON.stringify({...body,version:undefined})).digest('hex'),created:new Date().toISOString()};};
const fields={excerpt:2000,author:200,published:100,purpose:1000,evidence:2000,missing:1200,facts:1600,interpretations:1600,uncertain:1600};
const decisions={confiar:'Usar com os limites registrados',questionar:'Questionar antes de usar',buscar:'Buscar outra fonte'};
function replay(data,body){const prior=[...(data.sourceInquiries||[]),...(data.inquiryLinks||[])].find(i=>i.id===body.key);if(!prior)return false;if(prior.hash!==stamp(body).hash)fail('Este envio já foi usado com outros dados.',409);return true;}
function apply(data,body){
  if(body.action==='sourceInquiry'){
    data.sourceInquiries||=[];if(data.sourceInquiries.length>=20)fail('Este projeto chegou a 20 fichas. O histórico foi preservado.');
    if(!Array.isArray(body.sources)||body.sources.length<1||body.sources.length>2||new Set(body.sources.map(s=>s.id)).size!==body.sources.length)fail('Escolha uma ou duas fontes distintas deste projeto.');
    if(body.replaces&&!data.sourceInquiries.some(i=>i.id===body.replaces))fail('A ficha anterior não pertence a este projeto.',404);
    const reason=text(body.reason,1200,Boolean(body.replaces));
    const selected=body.sources.map(item=>{const original=data.sources.find(s=>s.id===item.id);if(!original)fail('Uma fonte não pertence ao projeto.',404);if(!Object.hasOwn(decisions,item.decision))fail('Registre sua decisão sobre cada fonte.');return {id:original.id,origin:original.origin,url:original.url||'',...Object.fromEntries(Object.entries(fields).map(([f,max])=>[f,text(item[f],max,!['author','published'].includes(f))])),decision:item.decision,motive:text(item.motive,1600)};});
    const comparison=selected.length===2?{agreement:text(body.agreement,1600),divergence:text(body.divergence,1600),dependency:text(body.dependency,1600)}:null;
    const inquiry={...stamp(body),claim:text(body.claim,1200),sources:selected,comparison,replaces:body.replaces||null,reason};
    inquiry.text=JSON.stringify({claim:inquiry.claim,sources:selected,comparison});data.sourceInquiries.push(inquiry);return true;
  }
  if(body.action==='attachInquiry'){
    const inquiry=(data.sourceInquiries||[]).find(i=>i.id===body.inquiry);if(!inquiry)fail('Ficha não encontrada neste projeto.',404);
    data.inquiryLinks||=[];if(data.inquiryLinks.length>=40)fail('O histórico de vínculos chegou ao limite.');
    if(data.inquiryLinks.some(i=>i.inquiry===inquiry.id))fail('Esta análise já está vinculada às referências.',409);
    data.inquiryLinks.push({...stamp(body),inquiry:inquiry.id});return true;
  }
  return false;
}
function target(record,id){return record.sourceInquiries?.find(i=>i.id===id);}
function context(record,body){
  if(record.kind!=='projeto'||body.attempts.length!==1)fail('Escolha uma ficha deste projeto.');
  const inquiry=target(record,body.attempts[0]);if(!inquiry)fail('Ficha não encontrada nesta conta.',404);
  if(!Array.isArray(body.sources)||!body.sources.length||body.sources.length>2||new Set(body.sources).size!==body.sources.length)fail('Escolha as fontes da ficha para compartilhar.');
  const allowed=[...Object.keys(fields),'claim','comparison'];
  if(!Array.isArray(body.fields)||!body.fields.length||body.fields.some(f=>!allowed.includes(f)))fail('Escolha as partes da ficha para compartilhar.');
  const selected=body.sources.map(id=>{const s=inquiry.sources.find(s=>s.id===id);if(!s)fail('Fonte não encontrada nesta ficha.',404);return {origin:s.origin,partes:Object.fromEntries(body.fields.filter(f=>Object.hasOwn(fields,f)).map(f=>[f,s[f]]))};});
  if(body.fields.includes('comparison')&&body.sources.length!==2)fail('Para compartilhar a comparação, escolha as duas fontes.');
  return {chosen:[inquiry],content:JSON.stringify({objetivo:text(body.goal,1000,false),...(body.fields.includes('claim')?{afirmacao:inquiry.claim}:{}),fontes:selected,...(body.fields.includes('comparison')?{comparacao:inquiry.comparison}:{})}),policy:'Ajude a investigar a confiabilidade de uma informação SOMENTE a partir dos trechos e metadados selecionados. Não navegou, não leu páginas completas nem verificou fontes externas: declare esses limites. Autoria, data ou URL informadas não comprovam veracidade. Distinga evidências apresentadas, interpretações do estudante e conclusões incertas. Compare fontes apenas se ambas foram compartilhadas; considere dependência entre fontes, não conte repetição como confirmação independente. Não atribua selo de fonte verificada nem confiança automática; proponha verificações concretas e preserve a autoria.'};
}
module.exports={apply,replay,target,context,fields,decisions};

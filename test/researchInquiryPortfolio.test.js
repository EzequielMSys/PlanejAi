const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const guided=require('../src/services/guidedStudyService'),portfolio=require('../src/services/researchPortfolioService'),database=require('./helpers/guidedStore');
const change=(db,r,b)=>guided.change(7,r.id,{key:randomUUID(),version:r.version,...b},db);
async function setup(){const db=database();let p=await guided.create(7,'projeto',{key:randomUUID(),title:'Consumo',question:'Os dados sustentam a afirmação?',scope:'Dois recortes identificados',subjects:['Física'],minutes:30,deliverable:'texto'},db);for(const origin of ['Fonte A','Fonte B'])p=await change(db,p,{action:'projectSource',origin,question:p.question,purpose:'Comparar dados.',limits:'Escopo limitado.',url:'https://example.org/'+origin.at(-1)});p=await change(db,p,{action:'projectEntry',stage:'producao',entryType:'producao',text:'MINHA_PRODUCAO_ESCOLHIDA',reason:'MOTIVO_PRIVADO',sources:[p.sources[0].id]});return {db,p};}
const fiche=(id,extra)=>({id,excerpt:'TRECHO_ESCOLHIDO',author:'AUTORIA_PRIVADA',published:'2026, data informada',purpose:'FINALIDADE_PRIVADA',evidence:'DADOS_PRIVADOS',missing:'Não há método descrito.',facts:'O trecho apresenta um valor.',interpretations:'O título generaliza o valor.',uncertain:'Não sei se o recorte é representativo.',decision:'questionar',motive:'Preciso conferir o método.',...extra});
const inquiryBody=p=>({action:'sourceInquiry',claim:'Esta informação é sustentada?',sources:p.sources.map(s=>fiche(s.id)),agreement:'Os valores coincidem.',divergence:'Os contextos diferem.',dependency:'A segunda fonte pode reproduzir a primeira.'});
async function item(db,p,extra){const source=await portfolio.resolve(7,{type:'projeto',record:p.id,step:p.entries[0].id},db);return {id:randomUUID(),ref:source.ref,sourceHash:source.sourceHash,role:'Minha conclusão',demonstrates:'O que consegui delimitar.',limits:'Não posso generalizar.',parts:['attempt'],references:[],...extra};}
const portfolioBody=items=>({key:randomUUID(),title:'Meu percurso',introduction:'Quero mostrar como examinei a questão.',conclusion:'Ainda preciso confrontar outros dados.',items});
test('ficha distingue dados, interpretação, lacunas e dependência sem alterar referência automaticamente',async()=>{
  const {db,p}=await setup(),body={...inquiryBody(p),key:randomUUID(),version:p.version};const r=await guided.change(7,p.id,body,db);
  assert.equal(r.sourceInquiries.length,1);assert.equal(r.sourceInquiries[0].sources[0].decision,'questionar');assert.match(r.sourceInquiries[0].comparison.dependency,/reproduzir/);assert.equal(r.inquiryLinks,undefined);assert.equal((await guided.change(7,p.id,body,db)).sourceInquiries.length,1);
  await assert.rejects(guided.change(7,p.id,{...body,claim:'Outra afirmação'},db),e=>e.status===409);
});
test('autoria desconhecida é permitida, mas duplicação e fontes alheias são recusadas',async()=>{
  const {db,p}=await setup();let r=await change(db,p,{...inquiryBody(p),sources:[fiche(p.sources[0].id,{author:'',published:''})]});assert.equal(r.sourceInquiries[0].sources[0].author,'');assert.equal(r.sourceInquiries[0].comparison,null);
  for(const sources of [[],[fiche('foreign')],[fiche(p.sources[0].id),fiche(p.sources[0].id)]])await assert.rejects(change(db,r,{...inquiryBody(p),sources}),e=>[400,404].includes(e.status));
  await assert.rejects(guided.change(8,p.id,{version:r.version,key:randomUUID(),...inquiryBody(p)},db),e=>e.status===404);
});
test('revisão exige motivo e conserva análise e vínculo anteriores',async()=>{
  const {db,p}=await setup();let r=await change(db,p,inquiryBody(p));const first=r.sourceInquiries[0];r=await change(db,r,{action:'attachInquiry',inquiry:first.id});assert.equal(r.inquiryLinks[0].inquiry,first.id);
  await assert.rejects(change(db,r,{...inquiryBody(p),replaces:first.id}),e=>e.status===400);
  r=await change(db,r,{...inquiryBody(p),claim:'Agora delimitei a afirmação.',replaces:first.id,reason:'Encontrei outro contexto.'});assert.equal(r.sourceInquiries[0].claim,first.claim);assert.equal(r.sourceInquiries[1].replaces,first.id);assert.equal(r.inquiryLinks.length,1);
});
test('Lumi de fontes recebe somente os campos e a fonte marcados; orientação só é salva com recibo',async()=>{
  const {db,p}=await setup();let r=await change(db,p,inquiryBody(p)),sent;const provider={chat:{completions:{create:async payload=>{sent=payload;return {choices:[{message:{content:JSON.stringify({claro:'O trecho apresenta uma afirmação.',lacuna:'O método não foi compartilhado.',pergunta:'Como conferir a origem do dado?',proximoPasso:'Localizar o método.',incerteza:'Não consultei a fonte completa.'})}}]}}}}};
  const result=await guided.assist(7,r.id,{mode:'sources',attempts:[r.sourceInquiries[0].id],sources:[p.sources[0].id],fields:['excerpt'],goal:'Examinar os limites.'},db,provider);const body=sent.messages[1].content;assert.match(body,/TRECHO_ESCOLHIDO/);assert.doesNotMatch(body,/Fonte B|AUTORIA_PRIVADA|DADOS_PRIVADOS|FINALIDADE_PRIVADA|MINHA_PRODUCAO/);assert.match(sent.messages[0].content,/não.*verificou fontes externas/i);assert.equal((await guided.detail(7,r.id,db)).sourceInquiries[0].feedback,undefined);
  r=await change(db,r,{action:'feedback',receipt:result.receipt});assert.ok(r.sourceInquiries[0].feedback);r=await change(db,r,{action:'contest',attempt:r.sourceInquiries[0].id,text:'Preciso contextualizar o trecho.'});assert.equal(r.sourceInquiries[0].contest,'Preciso contextualizar o trecho.');
  await assert.rejects(guided.assist(7,r.id,{mode:'sources',attempts:[r.sourceInquiries[0].id],sources:[p.sources[0].id],fields:['comparison']},db,provider),e=>e.status===400);
});
test('portfólio salva somente trechos e referências escolhidos e mantém versões específicas',async()=>{
  const {db,p}=await setup();const selection=await item(db,p,{parts:['attempt'],references:[p.sources[0].id]});const body=portfolioBody([selection]),r=await guided.create(7,'portfolio',body,db);assert.equal(r.editions.length,1);assert.deepEqual(r.editions[0].items[0].blocks.map(b=>b.key),['attempt']);assert.equal(r.editions[0].items[0].references.length,1);assert.doesNotMatch(JSON.stringify(r.editions[0]),/MOTIVO_PRIVADO/);assert.equal((await guided.create(7,'portfolio',body,db)).id,r.id);
  await change(db,p,{action:'projectEntry',stage:'producao',entryType:'producao',text:'OUTRA_VERSAO_PRIVADA',sources:[]});assert.doesNotMatch(JSON.stringify((await guided.detail(7,r.id,db)).editions),/OUTRA_VERSAO_PRIVADA/);
});
test('seleção e edição validam acesso de dono e estudante sem aceitar dados forjados',async()=>{
  const {db,p}=await setup(),i=await item(db,p);await assert.rejects(guided.create(8,'portfolio',portfolioBody([i]),db),e=>e.status===404);
  for(const extra of [{parts:['campo_inventado']},{references:['foreign']},{sourceHash:'forged'},{parts:[]}])await assert.rejects(guided.create(7,'portfolio',portfolioBody([{...i,...extra}]),db),e=>[400,409].includes(e.status));
  await assert.rejects(guided.create(7,'portfolio',portfolioBody([i,i]),db),e=>e.status===400);
});
test('origem alterada após prévia é recusada e nova edição mantém snapshot anterior',async()=>{
  const {db,p}=await setup(),i=await item(db,p);let r=await guided.create(7,'portfolio',portfolioBody([i]),db);
  const row=db.rows.get(p.id);row.dados.entries[0].feedback={claro:'Orientação posterior',lacuna:'Outra',pergunta:'Qual?',proximoPasso:'Conferir',incerteza:'Limitada'};
  await assert.rejects(change(db,r,{action:'portfolioEdition',...portfolioBody([i])}),e=>e.status===409);
  const updated=await item(db,p,{parts:['attempt','lumi']});r=await change(db,r,{action:'portfolioEdition',...portfolioBody([updated])});assert.equal(r.editions.length,2);assert.deepEqual(r.editions[0].items[0].blocks.map(b=>b.key),['attempt']);assert.match(r.editions[1].items[0].blocks.find(b=>b.key==='lumi').authorship,/Lumi/);
  db.rows.delete(p.id);assert.equal((await guided.detail(7,r.id,db)).editions.length,2);await assert.rejects(portfolio.resolve(7,i.ref,db),e=>e.status===404);
});
test('edição repetida não duplica histórico e exclusão do portfólio preserva os originais',async()=>{
  const {db,p}=await setup();let r=await guided.create(7,'portfolio',portfolioBody([await item(db,p)]),db);const body={action:'portfolioEdition',version:r.version,...portfolioBody([await item(db,p)])};r=await guided.change(7,r.id,body,db);assert.equal((await guided.change(7,r.id,body,db)).editions.length,2);await change(db,r,{action:'delete'});assert.ok(await guided.detail(7,p.id,db));
});
test('busca de versões restringe a conta e escapa curingas sem expor textos no seletor',async()=>{
  let call;const result=await portfolio.options(7,'50%_!',{execute:async(sql,values)=>{call={sql,values};return [[{id:'a',tipo:'evidencia',dados:{title:'Energia',attempts:[{id:'b',text:'TEXTO_PRIVADO'}]}}]]}});assert.match(call.sql,/id_usuario=\?/);assert.deepEqual(call.values,[7,'%50!%!_!!%']);assert.doesNotMatch(JSON.stringify(result),/TEXTO_PRIVADO/);
});
test('portfólio aceita comparação escolhida com tentativas e limites, sem copiar outras experiências',async()=>{
  const {db,p}=await setup();const source={type:'caminho',record:p.id,step:p.entries[0].id};let r=await guided.create(7,'estrategia',{key:randomUUID(),title:'Unidades',procedure:'Conferir unidades',experience:{subject:'Energia',difficulty:'Conversão',outcome:'parcial',observation:'EXPERIENCIA_NAO_ESCOLHIDA',source}},db);r=await change(db,r,{action:'experimentCreate',title:'Duas atividades',difficulty:'Conversão',expectation:'Conferir',common:'Energia',differences:'Unidades',activities:[{title:'A',prompt:'Atividade A'},{title:'B',prompt:'Atividade B'}]});for(const slot of [0,1])r=await change(db,r,{action:'experimentAttempt',experiment:r.experiments[0].id,slot,response:'Resposta escolhida',supports:'Sem apoio',conditions:'Sem interrupções',difficulty:'Justificar',procedureUsed:'Conferi unidades',minutes:10});r=await change(db,r,{action:'experimentDecision',experiment:r.experiments[0].id,comparison:'Percebi diferenças',limitations:'As atividades eram diferentes',decision:'manter',justification:'Quero testar novamente'});
  const resolved=await portfolio.resolve(7,{type:'comparacao',record:r.id,experiment:r.experiments[0].id,step:r.experiments[0].decisions[0].id},db);assert.match(resolved.blocks.find(b=>b.key==='conclusion').text,/Limites/);assert.doesNotMatch(JSON.stringify(resolved),/EXPERIENCIA_NAO_ESCOLHIDA/);
});

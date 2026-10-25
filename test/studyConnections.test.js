const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const frontendRequire=createRequire(path.resolve(__dirname,'../frontend/package.json'));
function data() {
  const source=fs.readFileSync(path.resolve(__dirname,'../frontend/src/data/studyConnections.js'),'utf8');
  const code=frontendRequire('esbuild').transformSync(source,{format:'cjs',target:'node24'}).code;
  const context={module:{exports:{}}};
  vm.runInNewContext(code,context);
  return context.module.exports;
}
test('curated connections have unique directions, complete explanations and first-party references',()=>{
  const {CONNECTIONS,TOPICS,SOURCES}=data();
  assert.equal(CONNECTIONS.length,8);assert.equal(Object.keys(TOPICS).length,7);
  const ids=new Set(),directions=new Set();
  for(const connection of CONNECTIONS) {
    assert.ok(!ids.has(connection.id));ids.add(connection.id);
    assert.ok(connection.from!==connection.to && TOPICS[connection.from] && TOPICS[connection.to]);
    const pair=`${connection.from}:${connection.to}`;assert.ok(!directions.has(pair));directions.add(pair);
    for(const key of ['why','example','question','reasoning','relation'])assert.ok(connection[key]?.trim().length>5);
    const source=SOURCES[connection.source];assert.ok(source);
    const url=new URL(source.url);assert.equal(url.protocol,'https:');
    assert.ok(['openstax.org','www.gov.br','download.inep.gov.br'].includes(url.hostname));
  }
});
test('matching is subject-aware and accepts accents, case, spacing and explicit aliases',()=>{
  const {connectionsFor}=data();
  for(const content of [{titulo:'LEIS DE NEWTON',disciplina:'FISICA'},{titulo:'  Leis   de Newton  ',disciplina:'Física'}])assert.equal(connectionsFor(content)[0].to,'energia');
  for(const titulo of ['Funções do 1º grau','Funções do 1° grau','Função do primeiro grau','Função afim'])assert.equal(connectionsFor({titulo,disciplina:'Matematica'})[0].to,'cinematica');
  assert.equal(connectionsFor({titulo:'Redação dissertativa',disciplina:'Português'}).length,2);
});
test('unknown, incomplete and similarly named materials never receive invented connections',()=>{
  const {connectionsFor}=data();
  for(const content of [null,{}, {titulo:'Leis de Newton'}, {titulo:'Leis de Newton',disciplina:'História'}, {titulo:'Funções do 2º grau',disciplina:'Matemática'}, {titulo:'Trabalho e energia solar em edifícios',disciplina:'Física'}, {titulo:'Dinâmica de grupo',disciplina:'Física'}, {titulo:{},disciplina:[]}])assert.equal(connectionsFor(content).length,0);
});
test('every alias has one unambiguous topic and the seeded catalog can reach every reviewed topic',()=>{
  const {TOPICS,normalizeTopic,connectionsFor}=data(),pairs=new Set();
  for(const topic of Object.values(TOPICS))for(const subject of topic.subjects)for(const alias of topic.aliases){
    const pair=`${normalizeTopic(subject)}:${normalizeTopic(alias)}`;assert.ok(!pairs.has(pair),`Ambiguous alias: ${pair}`);pairs.add(pair);
  }
  const source=fs.readFileSync(path.resolve(__dirname,'../src/scripts/seedConteudos.js'),'utf8');
  const catalog=[...source.matchAll(/disciplina: '([^']+)', titulo: '([^']+)'/g)].map(match=>({disciplina:match[1],titulo:match[2]}));
  const covered=new Set(catalog.flatMap(content=>connectionsFor(content).map(connection=>connection.from)));
  assert.equal(covered.size,Object.keys(TOPICS).length);
});

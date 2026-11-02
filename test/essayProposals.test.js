
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../frontend/src/utils/essayProposals.mjs');
test('catálogo de propostas tem percursos completos e referências institucionais identificadas',async()=>{
 const {ESSAY_PROPOSALS,PROPOSAL_LEVELS}=await load();assert.equal(ESSAY_PROPOSALS.length,6);assert.equal(new Set(ESSAY_PROPOSALS.map(x=>x.id)).size,6);assert.equal(new Set(ESSAY_PROPOSALS.map(x=>x.title)).size,6);
 for(const level of PROPOSAL_LEVELS)assert.equal(ESSAY_PROPOSALS.filter(x=>x.level===level.id).length,2);
 for(const item of ESSAY_PROPOSALS){assert.ok(item.question&&item.focus&&item.caution);assert.equal(item.support.length,2);assert.ok(item.support.every(x=>x.kind&&x.text));assert.equal(item.roadmap.length,3);assert.ok(item.roadmap.every(([stage,text])=>stage&&text.length>30));const url=new URL(item.source.url);assert.equal(url.protocol,'https:');assert.ok(['www.gov.br','cetic.br','www.unesco.org'].includes(url.hostname));assert.match(item.source.checkedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(item.source.limit&&item.source.institution&&item.source.period);}
});
test('proposta reaparece pelo tema aplicado sem associar um tema próprio a uma fonte incorreta',async()=>{
 const {ESSAY_PROPOSALS,proposalForTopic}=await load();for(const item of ESSAY_PROPOSALS)assert.equal(proposalForTopic(' '+item.title+' ').id,item.id);assert.equal(proposalForTopic('Meu tema autoral'),null);assert.equal(proposalForTopic(null),null);
});

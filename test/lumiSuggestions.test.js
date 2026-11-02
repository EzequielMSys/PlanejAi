
const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../frontend/src/utils/lumiSuggestions.mjs');
test('Lumi prioriza dificuldade e estudo concluído, sem sugerir lições futuras',async()=>{
 const {lumiSuggestions}=await load();const input={dificuldades:[{disciplina:'Física',competencia:'Energia',erros:4}],recentes:[{disciplina:'Biologia',titulo:'Células',data:'2026-11-01'}],licoes:[{titulo:'Nunca estudado',disciplina:'Química'}]};
 const result=lumiSuggestions(input);assert.deepEqual(result.map(x=>x.title),['Energia','Células']);assert.match(result[0].reason,/errou/);assert.ok(!JSON.stringify(result).includes('Nunca estudado'));
});
test('Lumi respeita a matéria, remove duplicatas e não inventa assunto sem dados',async()=>{
 const {lumiSuggestions}=await load();const result=lumiSuggestions({dificuldades:[{disciplina:'Física',competencia:'Energia',erros:3},{disciplina:'Física',competencia:'Energia',erros:1},{disciplina:'Biologia',competencia:'Células',erros:9}],recentes:[{disciplina:'Física',titulo:'Energia',data:'2026-11-01'}]},'Física');assert.equal(result.length,1);assert.equal(result[0].title,'Energia');assert.ok(lumiSuggestions(null).every(x=>!x.personal));
});
test('sessão difícil vem primeiro e sessões recentes são ordenadas por data',async()=>{
 const {lumiSuggestions}=await load();const result=lumiSuggestions({recentes:[{disciplina:'Física',titulo:'Óptica',resultado:'DIFICIL',data:'2026-10-01'},{disciplina:'Química',titulo:'Átomos',data:'2026-11-01'},{disciplina:'Biologia',titulo:'Células',data:'2026-10-20'}]});assert.deepEqual(result.map(x=>x.title),['Óptica','Átomos']);assert.match(result[0].reason,/difícil/);
});

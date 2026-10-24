const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(const existing of [false,true]) test(`optional school year persists as NULL when ${existing?'updating':'creating'} a study profile`,async()=>{
 let saved;
 const pool={execute:async(sql,values)=>{
  if(sql.startsWith('SELECT'))return[existing?[{id_perfil:17}]:[]];
  saved=values;return[{insertId:17}];
 }};
 const context={module:{exports:{}},require:()=>pool};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/models/perfilEstudoModel'),'utf8'),context);
 for(const year of ['',undefined,'   ','2º EM']){
  const result=await context.module.exports.criarOuAtualizarPerfil(51,{ano_escolar:year,objetivo:'ENEM',areas_foco:'Física',tempo_diario_min:30,prazo_estimado:30});
  assert.equal(saved[existing?0:1],year==='2º EM'?'2º EM':null);
  assert.equal(result.ano_escolar,year==='2º EM'?'2º EM':null);
 }
});

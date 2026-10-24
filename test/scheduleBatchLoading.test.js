const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function load(file,deps){const context={module:{exports:{}},require:name=>deps[name]||{},console,Date,Set,Map};vm.runInNewContext(fs.readFileSync(require.resolve(file),'utf8'),context);return context.module.exports}
test('a 60-day schedule loads contents in three queries and preserves grouping and order',async()=>{
 let calls=0;const days=Array.from({length:60},(_,i)=>({id_dia:i+1}));
 const pool={execute:async(sql,params)=>{calls++;assert.equal(params[0],9);if(sql.includes('FROM cronograma_conteudos'))return[[{id:10,id_dia:1,titulo:'A'},{id:11,id_dia:1,titulo:'B'},{id:99,id_dia:60,titulo:'C'}]];if(sql.includes('FROM cronograma_dias'))return[days];return[[{id_cronograma:9}]]}};
 const result=await load('../src/models/cronogramaModel',{'../config/db':pool}).obterCronogramaCompleto(9);
 assert.equal(calls,3);assert.equal(result.dias.length,60);assert.deepEqual(Array.from(result.dias[0].conteudos,x=>x.id),[10,11]);assert.equal(result.dias[1].conteudos.length,0);assert.equal(result.dias[59].conteudos[0].id,99);
});
test('bulk early-access approval stays scoped to user and schedule',async()=>{
 let args,sqlText;const pool={execute:async(sql,params)=>{sqlText=sql;args=params;return[[{id_dia:2},{id_dia:'3'}]]}};
 const result=await load('../src/models/cronogramaAvaliacaoModel',{'../config/db':pool}).diasAprovadosDoCronograma(9,77);
 assert.deepEqual(Array.from(args),[9,77]);assert.match(sqlText,/id_cronograma = \? AND id_usuario = \?/);assert.equal(result.has(3),true);
});
test('batch listing preserves sequential locks and an approved early-access challenge',async()=>{
 let approvals=0;
 const deps={
 '../models/perfilEstudoModel':{obterPerfilPorUsuario:async()=>({id_perfil:8})},
 '../models/cronogramaModel':{listarCronogramasPorPerfil:async()=>[{id_cronograma:9}],obterCronogramaCompleto:async()=>({id_cronograma:9,status:'ATIVO',dias:[{id_dia:1,data_estudo:'2000-01-01',concluido:1},{id_dia:2,data_estudo:'2999-01-02',concluido:0},{id_dia:3,data_estudo:'2999-01-03',concluido:0}]})},
 '../models/cronogramaConteudoModel':{contarConteudosPorCronograma:async()=>3,contarConteudosConcluidosPorCronograma:async()=>1},
 '../models/cronogramaAvaliacaoModel':{diasAprovadosDoCronograma:async(id,owner)=>{approvals++;assert.equal(id,9);assert.equal(owner,77);return new Set([2])},obterProvaFinal:async()=>null,obterEmAndamento:async()=>null,diaTemDesafioAprovado:()=>{throw Error('N+1 query')}}};
 const [result]=await load('../src/services/cronogramaService',deps).listar(77);
 assert.equal(approvals,1);assert.equal(result.dias[1].bloqueado,false);assert.equal(result.dias[1].desbloqueado_antecipadamente,true);assert.equal(result.dias[2].bloqueado,true);assert.equal(result.prova_final.disponivel,false);
});

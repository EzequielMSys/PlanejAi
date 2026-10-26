const test=require('node:test'),assert=require('node:assert/strict');
const organization=require('../src/services/flashcardOrganizationService');
const cards=require('../src/services/flashcardService');
test('marcação exige booleano e versão e não muda agendamento',async()=>{
 let call;const db={execute:async(sql,params)=>{call={sql,params};return [{affectedRows:1}]}};
 await organization.flag(7,41,{versao:2,melhorar:true,nota:'Separar as duas ideias'},db);
 assert.deepEqual(call.params,[1,'Separar as duas ideias',41,7,2]);assert.doesNotMatch(call.sql,/proxima_revisao|ultimo_resultado/);
 await organization.flag(7,41,{versao:3,melhorar:false,nota:'antiga'},db);assert.deepEqual(call.params,[0,null,41,7,3]);
 await assert.rejects(organization.flag(7,41,{versao:3,melhorar:'false'},db),e=>e.status===400);
 await assert.rejects(organization.flag(7,41,{versao:3,melhorar:true,nota:'x'.repeat(301)},db),e=>e.status===400);
 await assert.rejects(organization.flag(7,41,{versao:2,melhorar:true},{execute:async()=>[{affectedRows:0}]}),e=>e.status===409);
});
test('coleção pode ser reenviada sem duplicar e rejeita objetivo divergente',async()=>{
 const db={execute:async(sql)=>{if(sql.startsWith('INSERT'))throw Object.assign(Error(),{code:'ER_DUP_ENTRY'});return [[{id:5,objetivo:'Revisar energia'}]]}};
 assert.deepEqual(await organization.save(7,{nome:'Física',objetivo:'Revisar energia'},db),{salvo:true,id:5});
 await assert.rejects(organization.save(7,{nome:'Física',objetivo:'Outro objetivo'},db),e=>e.status===409);
 await assert.rejects(organization.save(7,{nome:'x',objetivo:'abc'},db),e=>e.status===400);
});
test('associação vincula ambos os donos e não aceita cartão de outra conta',async()=>{
 const calls=[],db={execute:async(sql,params)=>{calls.push({sql,params});return sql.startsWith('INSERT')?[{affectedRows:0}]:[[]]}};
 await assert.rejects(organization.member(7,9,41,{incluir:true},db),e=>e.status===404);
 assert.match(calls[0].sql,/f.id_usuario=c.id_usuario/);assert.match(calls[0].sql,/c.id_usuario=\?/);assert.deepEqual(calls[0].params,[9,7,41]);
 await organization.member(7,9,41,{incluir:false},db);assert.match(calls.at(-1).sql,/id_usuario=\?/);assert.deepEqual(calls.at(-1).params,[9,41,7]);
 await assert.rejects(organization.member(7,9,41,{incluir:1},db),e=>e.status===400);
});
test('remover coleção preserva cartões e histórico',async()=>{let call;await organization.remove(7,9,{execute:async(sql,params)=>{call={sql,params};return [{affectedRows:1}]}});assert.equal(call.sql,'DELETE FROM flashcard_colecoes WHERE id=? AND id_usuario=?');assert.deepEqual(call.params,[9,7])});
test('filtros de melhoria e coleção mantêm o dono e não permitem coleções alheias',async()=>{
 const calls=[],db={execute:async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('SELECT id FROM'))return [[{id:9}]];if(sql.includes('COUNT'))return [[{total:0}]];return [[]]}};
 await cards.list(7,{colecao:'9',melhorar:'1'},db);assert.match(calls[1].sql,/f.melhorar=1/);assert.match(calls[1].sql,/ci.id_usuario=f.id_usuario/);assert.deepEqual(calls[1].params,[7,0,9]);
 await assert.rejects(cards.list(7,{colecao:'9'},{execute:async()=>[[]]}),e=>e.status===404);
 for(const input of [{colecao:'9 OR 1=1'},{melhorar:'false'}])await assert.rejects(cards.list(7,input,db),e=>e.status===400);
});

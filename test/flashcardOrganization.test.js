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

test('edição de coleção protege versão e dono, preserva membros e confirma reenvio exato',async()=>{
 const calls=[],body={nome:'Prova de Física',objetivo:'Revisar energia',versao:2};
 const db={execute:async(sql,params)=>{calls.push({sql,params});return [{affectedRows:1}]}};
 assert.deepEqual(await organization.edit(7,9,body,db),{salvo:true,id:9,versao:3});
 assert.deepEqual(calls[0].params,['Prova de Física','Revisar energia',9,7,2]);assert.match(calls[0].sql,/id_usuario=\? AND versao=\?/);assert.doesNotMatch(calls[0].sql,/flashcards_estudo|colecao_itens/);
 const prior={execute:async(sql)=>sql.startsWith('UPDATE')?[{affectedRows:0}]:[[{nome:body.nome,objetivo:body.objetivo,versao:3}]]};
 assert.equal((await organization.edit(7,9,body,prior)).salvo,true);
 await assert.rejects(organization.edit(7,9,{...body,objetivo:'Outro texto'},prior),e=>e.status===409);
 await assert.rejects(organization.edit(7,9,body,{execute:async(sql)=>sql.startsWith('UPDATE')?[{affectedRows:0}]:[[]]}),e=>e.status===404);
 await assert.rejects(organization.edit(7,9,{...body,versao:0},db),e=>e.status===400);
 await assert.rejects(organization.edit(7,9,body,{execute:async()=>{throw Object.assign(Error(),{code:'ER_DUP_ENTRY'})}}),e=>e.status===409);
});
test('revisão curta de coleção valida acesso antes de selecionar e limita somente pendentes dela',async()=>{
 for(const [minutes,budget]of [[3,2],[5,3],[10,5]]){
 const calls=[],db={execute:async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('SELECT id,nome'))return [[{id:9,nome:'Prova',objetivo:'Revisar energia'}]];if(sql.includes('COUNT'))return [[{total:10}]];return [[{id_flashcard:41}]]}};
 const result=await cards.short(7,{minutos:minutes,colecao:'9'},db);assert.equal(result.colecao.id,9);assert.equal(result.totalPendentes,10);assert.equal(result.itens.length,1);
 assert.deepEqual(calls[0].params,[9,7]);assert.match(calls[2].sql,/f.arquivado=0 AND f.proxima_revisao<=\?/);assert.match(calls[2].sql,/ci.id_usuario=f.id_usuario/);assert.match(calls[2].sql,new RegExp('LIMIT '+budget+'$'));assert.deepEqual(calls[1].params,[7,result.hoje,9]);
 }
 let count=0;await assert.rejects(cards.short(7,{colecao:9},{execute:async()=>{count++;return [[]]}}),e=>e.status===404);assert.equal(count,1);
 await assert.rejects(cards.short(7,{colecao:'9 OR 1=1'},{execute:async()=>{throw Error('unexpected')}}),e=>e.status===400);
});

test('indicadores da coleção excluem arquivados das pendências e melhorias e usam o dia de São Paulo',async()=>{
 let call;await organization.list(7,{execute:async(sql,params)=>{call={sql,params};return [[]]}});
 assert.deepEqual(call.params,[cards.today(),7]);assert.match(call.sql,/f.arquivado=0 AND f.proxima_revisao<=\?/);assert.match(call.sql,/f.arquivado=0 AND f.melhorar=1/);assert.match(call.sql,/f.arquivado=1/);assert.match(call.sql,/f.id_usuario=c.id_usuario/);assert.match(call.sql,/WHERE c.id_usuario=\?/);
});
function bulkFixture({missingGroup=false,missingCard=false,insertFailure=false}={}) {
 const calls=[];let committed=0,rolledBack=0,released=0;
 const conn={beginTransaction:async()=>{},commit:async()=>{committed++},rollback:async()=>{rolledBack++},release:()=>{released++},execute:async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('SELECT id FROM'))return [missingGroup?[]:[{id:9}]];if(sql.startsWith('SELECT id_flashcard'))return [missingCard?[{id_flashcard:41}]:[{id_flashcard:41},{id_flashcard:42}]];if(insertFailure)throw Error('falha de escrita');return [{affectedRows:2}]}};
 return {db:{getConnection:async()=>conn},calls,stats:()=>({committed,rolledBack,released})};
}
test('inclusão em lote valida limites e identificadores antes de abrir transação',async()=>{
 const db={getConnection:async()=>{throw Error('não deve abrir conexão')}};
 for(const body of [undefined,null,{}, {cartoes:[]},{cartoes:Array(51).fill(41)},{cartoes:[0]},{cartoes:['41 OR 1=1']}])await assert.rejects(organization.addMany(7,9,body,db),e=>e.status===400);
});
test('inclusão em lote trava coleção e cartões do dono e evita duplicação',async()=>{
 const fixture=bulkFixture();assert.deepEqual(await organization.addMany(7,9,{cartoes:[42,41,42]},fixture.db),{salvo:true,confirmados:2});assert.deepEqual(fixture.calls[0].params,[9,7]);assert.match(fixture.calls[0].sql,/FOR UPDATE/);assert.deepEqual(fixture.calls[1].params,[7,41,42]);assert.match(fixture.calls[1].sql,/id_usuario=\?/);assert.match(fixture.calls[2].sql,/ON DUPLICATE KEY UPDATE/);assert.deepEqual(fixture.calls[2].params,[9,41,7,9,42,7]);assert.deepEqual(fixture.stats(),{committed:1,rolledBack:0,released:1});
});
test('lote misto ou coleção alheia não insere parcialmente e falha de escrita reverte tudo',async()=>{
 for(const options of [{missingGroup:true},{missingCard:true},{insertFailure:true}]){const fixture=bulkFixture(options);await assert.rejects(organization.addMany(7,9,{cartoes:[41,42]},fixture.db));assert.deepEqual(fixture.stats(),{committed:0,rolledBack:1,released:1});if(!options.insertFailure)assert.ok(!fixture.calls.some(c=>c.sql.startsWith('INSERT')))}
});

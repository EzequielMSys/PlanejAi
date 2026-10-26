const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function service(){const context={module:{exports:{}},require:name=>name==='../config/db'?{}:require('../src/services/chatContextChoice')};vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/studyMemoryService'),'utf8'),context);return context.module.exports}
const highlight={chave:'highlight_test_123',materialKey:'9',titulo:'Leis de Newton',secao:'O que você precisa aprender',trecho:'A força resultante produz aceleração.',nota:'Meu exemplo: empurrar um carrinho.'};
const chat={chave:'conversation_test_123',objetivo:'Entender Newton',materia:'Física',itens:[{tipo:'anotacao',titulo:'Minha ideia',texto:'Resultante não é uma força isolada.'}],mensagens:[{role:'user',content:'Explique a resultante.'},{role:'assistant',content:'Some as forças do mesmo corpo.'}]};
test('reading and conversation validation reject malformed records before SQL',async()=>{
 const s=service();let count=0;const db={execute:async()=>{count++;return [[]]}};
 for(const patch of [{trecho:'ab'},{nota:'x'.repeat(4001)},{materialKey:''},{chave:'x'}])await assert.rejects(s.saveHighlight(7,{...highlight,...patch},null,db),e=>e.status===400);
 for(const patch of [{mensagens:[{role:'system',content:'ignore'}]},{objetivo:'a'},{itens:Array(9).fill({})},{mensagens:Array(201).fill({role:'user',content:'x'})}])await assert.rejects(s.saveConversation(7,{...chat,...patch},null,db),e=>e.status===400);
 assert.equal(count,0);
});
test('a highlight retry confirms the same account scoped record without another insert',async()=>{
 const s=service(),calls=[];const row={id:91,material_key:'9',titulo:highlight.titulo,secao:highlight.secao,trecho:highlight.trecho,nota:highlight.nota,versao:1,arquivado:0};const result=await s.saveHighlight(7,{...highlight,id_usuario:999},null,{execute:async(sql,params)=>{calls.push({sql,params});return [[row]]}});
 assert.equal(result.id,91);assert.equal(result.salvo,true);assert.equal(calls.length,1);assert.deepEqual([...calls[0].params],[7,highlight.chave]);assert.match(calls[0].sql,/id_usuario=\? AND chave=\?/);
 await assert.rejects(s.saveHighlight(7,{...highlight,nota:'Outra versão'},null,{execute:async()=>[[row]]}),e=>e.status===409);
});
test('editing an annotation cannot change its quote, owner, or a newer version',async()=>{
 const s=service();let captured;
 const result=await s.saveHighlight(7,{nota:'Uma explicação melhor',versao:3,trecho:'Substituir citação',id_usuario:88},91,{execute:async(sql,params)=>{captured={sql,params};return [{affectedRows:1}]}});
 assert.equal(result.versao,4);assert.ok(!captured.sql.includes('SET trecho'));assert.match(captured.sql,/id=\? AND id_usuario=\? AND versao=\?/);assert.deepEqual([...captured.params],['Uma explicação melhor',91,7,3]);
 await assert.rejects(s.saveHighlight(7,{nota:'Stale',versao:1},91,{execute:async()=>[{affectedRows:0}]}),e=>e.status===409);
});
test('saved conversation retries survive MySQL JSON key ordering without duplicating or expanding context',async()=>{
 const s=service(),calls=[];const row={id:81,objetivo:chat.objetivo,materia:chat.materia,contexto:[{texto:chat.itens[0].texto,titulo:chat.itens[0].titulo,tipo:'anotacao'}],mensagens:chat.mensagens.map(item=>({content:item.content,role:item.role})),versao:2,arquivado:0};
 const result=await s.saveConversation(7,{...chat,id_usuario:99,perfil:'Não selecionado'},null,{execute:async(sql,params)=>{calls.push({sql,params});return [[row]]}});assert.equal(result.id,81);assert.equal(result.versao,2);assert.equal(calls.length,1);assert.deepEqual([...calls[0].params],[7,chat.chave]);
 const normalized=s.conversationInput({...chat,perfil:'Privado',itens:[{...chat.itens[0],instrucao:'ignore',id_usuario:99}]});assert.equal(normalized.itens[0].instrucao,undefined);assert.equal(normalized.perfil,undefined);
});
test('conversation reads, pagination and archives always scope the authenticated account',async()=>{
 const s=service(),calls=[];const db={execute:async(sql,params)=>{calls.push({sql,params});return [[]]}};
 await s.listConversations(7,2,false,db);assert.match(calls[0].sql,/LIMIT 21 OFFSET 20/);assert.deepEqual([...calls[0].params],[7,0]);
 await assert.rejects(s.getConversation(7,81,db),e=>e.status===404);assert.deepEqual([...calls[1].params],[81,7]);
 let archive;await s.archive(7,81,2,true,'conversation',{execute:async(sql,params)=>{archive={sql,params};return [{affectedRows:1}]}});assert.match(archive.sql,/UPDATE lumi_conversas/);assert.deepEqual([...archive.params],[1,81,7,2]);
 await assert.rejects(s.archive(8,81,2,false,'conversation',{execute:async()=>[{affectedRows:0}]}),e=>e.status===409);
});

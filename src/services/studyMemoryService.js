const pool=require('../config/db')
const {normalizeChoice}=require('./chatContextChoice')
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})}
const text=(value,min,max,label)=>{if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(`Confira ${label}: use de ${min} a ${max} caracteres.`);return value.trim()}
const positive=value=>{if(!Number.isSafeInteger(Number(value))||Number(value)<=0)fail('Identificador inválido.');return Number(value)}
const key=value=>{if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(value))fail('Reabra o registro antes de salvar.');return value}
function highlightInput(body={}){return {chave:key(body.chave),materialKey:text(body.materialKey,1,220,'a referência do material'),titulo:text(body.titulo,1,160,'o título'),secao:text(body.secao,1,160,'a seção'),trecho:text(body.trecho,3,1200,'o trecho'),nota:text(body.nota??'',0,4000,'sua anotação')}}
function conversationInput(body={}){
 const objetivo=text(body.objetivo,3,100,'o objetivo'),materia=text(body.materia??'',0,100,'a matéria')
 if(!Array.isArray(body.itens)||body.itens.length>8)fail('Escolha até oito itens de contexto.')
 const itens=normalizeChoice({versao:1,itens:body.itens,historico:[]}).itens
 if(!Array.isArray(body.mensagens)||body.mensagens.length>200)fail('Guarde até 200 mensagens por conversa. Comece outro objetivo para continuar.')
 const mensagens=body.mensagens.map(item=>{if(!item||!['user','assistant'].includes(item.role))fail('Mensagem inválida na conversa.');return {role:item.role,content:text(item.content,1,16000,'a mensagem')}})
 if(mensagens.reduce((sum,item)=>sum+item.content.length,0)>400000)fail('Esta conversa ficou muito extensa. Guarde um objetivo menor.')
 return {chave:key(body.chave),objetivo,materia,itens,mensagens}
}
const parse=value=>typeof value==='string'?JSON.parse(value):value
function conversation(row){return row?{id:row.id,objetivo:row.objetivo,materia:row.materia,itens:parse(row.contexto).map(({tipo,titulo,texto})=>({tipo,titulo,texto})),mensagens:parse(row.mensagens).map(({role,content})=>({role,content})),versao:row.versao,arquivado:row.arquivado,atualizado_em:row.atualizado_em}:null}
async function listHighlights(owner,materialKey,archived=false,db=pool){const value=text(materialKey,1,220,'a referência do material');const [rows]=await db.execute('SELECT id,material_key,titulo,secao,trecho,nota,versao,arquivado FROM leitura_destaques WHERE id_usuario=? AND material_key=? AND arquivado=? ORDER BY id DESC LIMIT 100',[owner,value,archived?1:0]);return rows}
async function saveHighlight(owner,body,id,db=pool){
 if(id){const nota=text(body.nota??'',0,4000,'sua anotação'),version=positive(body.versao);const [result]=await db.execute('UPDATE leitura_destaques SET nota=?,versao=versao+1 WHERE id=? AND id_usuario=? AND versao=? AND arquivado=0',[nota,positive(id),owner,version]);if(!result.affectedRows)fail('A anotação mudou ou não está disponível. Consulte a versão da conta antes de salvar.',409);return {id:Number(id),nota,versao:version+1,salvo:true}}
 const value=highlightInput(body),params=[owner,value.chave,value.materialKey,value.titulo,value.secao,value.trecho,value.nota]
 const existing=async()=>{const [[row]]=await db.execute('SELECT id,material_key,titulo,secao,trecho,nota,versao,arquivado FROM leitura_destaques WHERE id_usuario=? AND chave=?',[owner,value.chave]);if(!row)return null;if(row.material_key!==value.materialKey||row.trecho!==value.trecho||row.nota!==value.nota||row.secao!==value.secao||Number(row.arquivado))fail('Este envio já foi recebido com outra versão. Consulte seus destaques.',409);return {...row,salvo:true}}
 const found=await existing();if(found)return found
 const [[count]]=await db.execute('SELECT COUNT(*) AS total FROM leitura_destaques WHERE id_usuario=? AND material_key=? AND arquivado=0',[owner,value.materialKey]);if(Number(count.total)>=100)fail('Este guia já tem 100 destaques ativos. Retire um destaque antes de adicionar outro.')
 try{const [result]=await db.execute('INSERT INTO leitura_destaques (id_usuario,chave,material_key,titulo,secao,trecho,nota) VALUES (?,?,?,?,?,?,?)',params);return {id:result.insertId,material_key:value.materialKey,titulo:value.titulo,secao:value.secao,trecho:value.trecho,nota:value.nota,versao:1,arquivado:0,salvo:true}}catch(error){if(error.code==='ER_DUP_ENTRY')return existing();throw error}
}
async function listConversations(owner,page=1,archived=false,db=pool){const p=positive(page);if(p>100)fail('Página inválida.');const [rows]=await db.execute(`SELECT id,objetivo,materia,versao,arquivado,atualizado_em,JSON_LENGTH(mensagens) AS total FROM lumi_conversas WHERE id_usuario=? AND arquivado=? ORDER BY atualizado_em DESC,id DESC LIMIT 21 OFFSET ${(p-1)*20}`,[owner,archived?1:0]);return {itens:rows.slice(0,20),mais:rows.length>20,pagina:p}}
async function getConversation(owner,id,db=pool){const [[row]]=await db.execute('SELECT id,objetivo,materia,contexto,mensagens,versao,arquivado,atualizado_em FROM lumi_conversas WHERE id=? AND id_usuario=?',[positive(id),owner]);if(!row)fail('Conversa não encontrada.',404);return conversation(row)}
async function saveConversation(owner,body,id,db=pool){
 const value=conversationInput(body),contexto=JSON.stringify(value.itens),messages=JSON.stringify(value.mensagens)
 if(id){const version=positive(body.versao);const [result]=await db.execute('UPDATE lumi_conversas SET objetivo=?,materia=?,contexto=?,mensagens=?,versao=versao+1 WHERE id=? AND id_usuario=? AND versao=? AND arquivado=0',[value.objetivo,value.materia,contexto,messages,positive(id),owner,version]);if(!result.affectedRows)fail('A conversa mudou em outro lugar ou não está disponível. Seu texto continua aqui; abra a versão da conta ou salve como outra conversa.',409);return {id:Number(id),versao:version+1,salvo:true}}
 const existing=async()=>{const [[row]]=await db.execute('SELECT id,objetivo,materia,contexto,mensagens,versao,arquivado,atualizado_em FROM lumi_conversas WHERE id_usuario=? AND chave=?',[owner,value.chave]);if(!row)return null;const saved=conversation(row);if(saved.objetivo!==value.objetivo||saved.materia!==value.materia||JSON.stringify(saved.itens)!==contexto||JSON.stringify(saved.mensagens)!==messages||Number(saved.arquivado))fail('Este envio já foi recebido com outra versão. Consulte suas conversas ou salve outra cópia.',409);return {id:row.id,versao:row.versao,salvo:true}}
 const found=await existing();if(found)return found
 try{const [result]=await db.execute('INSERT INTO lumi_conversas (id_usuario,chave,objetivo,materia,contexto,mensagens) VALUES (?,?,?,?,?,?)',[owner,value.chave,value.objetivo,value.materia,contexto,messages]);return {id:result.insertId,versao:1,salvo:true}}catch(error){if(error.code==='ER_DUP_ENTRY')return existing();throw error}
}
async function archive(owner,id,version,archived,type,db=pool){if(typeof archived!=='boolean')fail('Escolha arquivar ou restaurar.');const table=type==='highlight'?'leitura_destaques':'lumi_conversas';const [result]=await db.execute(`UPDATE ${table} SET arquivado=?,versao=versao+1 WHERE id=? AND id_usuario=? AND versao=?`,[archived?1:0,positive(id),owner,positive(version)]);if(!result.affectedRows)fail('O registro mudou. Atualize a lista antes de tentar novamente.',409);return {salvo:true}}
module.exports={highlightInput,conversationInput,listHighlights,saveHighlight,listConversations,getConversation,saveConversation,archive}

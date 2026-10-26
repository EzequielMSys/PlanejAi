const pool = require('../config/db')
const {today}=require('./flashcardService')
const fail = (status, message) => { throw Object.assign(new Error(message), {status}) }
const id = value => { const n=Number(value); if(!Number.isSafeInteger(n)||n<1)fail(400,'Identificador inválido.'); return n }
const text = (value,min,max) => { if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(400,`Use de ${min} a ${max} caracteres.`);return value.trim() }
async function flag(owner,card,body,db=pool) {
 if(typeof body.melhorar!=='boolean')fail(400,'Escolha marcar ou concluir a melhoria.')
 const note=text(body.nota??'',0,300)
 const [result]=await db.execute('UPDATE flashcards_estudo SET melhorar=?,melhoria_nota=?,versao=versao+1 WHERE id_flashcard=? AND id_usuario=? AND versao=? AND arquivado=0',[body.melhorar?1:0,body.melhorar?note||null:null,id(card),owner,id(body.versao)])
 if(!result.affectedRows)fail(409,'O cartão mudou ou foi arquivado. Atualize a lista; sua observação continua aqui.')
 return {salvo:true}
}
async function list(owner,db=pool) {
 const [rows]=await db.execute(`SELECT c.id,c.nome,c.objetivo,c.versao,c.fixada,c.ordem_prioridade,COUNT(f.id_flashcard) AS total,
 SUM(CASE WHEN f.arquivado=0 THEN 1 ELSE 0 END) AS ativos,
 SUM(CASE WHEN f.arquivado=0 AND f.proxima_revisao<=? THEN 1 ELSE 0 END) AS pendentes,
 SUM(CASE WHEN f.arquivado=0 AND f.melhorar=1 THEN 1 ELSE 0 END) AS melhorar,
 SUM(CASE WHEN f.arquivado=1 THEN 1 ELSE 0 END) AS arquivados
 FROM flashcard_colecoes c LEFT JOIN flashcard_colecao_itens i ON i.id_colecao=c.id AND i.id_usuario=c.id_usuario
 LEFT JOIN flashcards_estudo f ON f.id_flashcard=i.id_flashcard AND f.id_usuario=c.id_usuario
 WHERE c.id_usuario=? GROUP BY c.id,c.nome,c.objetivo,c.versao,c.fixada,c.ordem_prioridade ORDER BY c.fixada DESC,c.ordem_prioridade,c.nome,c.id`,[today(),owner])
 return rows
}
async function save(owner,body,db=pool) {
 const name=text(body.nome,2,100),goal=text(body.objetivo,3,300)
 try {const [result]=await db.execute('INSERT INTO flashcard_colecoes (id_usuario,nome,objetivo) VALUES (?,?,?)',[owner,name,goal]);return {salvo:true,id:result.insertId}}
 catch(error){if(error.code!=='ER_DUP_ENTRY')throw error;const [[prior]]=await db.execute('SELECT id,objetivo FROM flashcard_colecoes WHERE id_usuario=? AND nome=?',[owner,name]);if(!prior||prior.objetivo!==goal)fail(409,'Já existe uma coleção com esse nome e outro objetivo. Escolha outro nome.');return {salvo:true,id:prior.id}}
}
async function remove(owner,collection,db=pool) {
 await db.execute('DELETE FROM flashcard_colecoes WHERE id=? AND id_usuario=?',[id(collection),owner]);return {salvo:true}
}
async function edit(owner,collection,body,db=pool) {
 const collectionId=id(collection),version=id(body.versao)
 const name=text(body.nome,2,100),goal=text(body.objetivo,3,300)
 try {
  const [result]=await db.execute('UPDATE flashcard_colecoes SET nome=?,objetivo=?,versao=versao+1 WHERE id=? AND id_usuario=? AND versao=?',[name,goal,collectionId,owner,version])
  if(result.affectedRows)return {salvo:true,id:collectionId,versao:version+1}
 } catch(error) {
  if(error.code==='ER_DUP_ENTRY')fail(409,'Já existe uma coleção com esse nome. Escolha outro nome; seu texto continua aqui.')
  throw error
 }
 const [[record]]=await db.execute('SELECT nome,objetivo,versao FROM flashcard_colecoes WHERE id=? AND id_usuario=?',[collectionId,owner])
 if(!record)fail(404,'Coleção não disponível nesta conta.')
 // A retry after a lost response confirms only this exact edit, never a newer one.
 if(Number(record.versao)===version+1&&record.nome===name&&record.objetivo===goal)return {salvo:true,id:collectionId,versao:version+1}
 fail(409,'A coleção mudou em outra tela. Seu texto continua aqui; consulte a versão atual antes de salvar.')
}
async function memberships(owner,card,db=pool) {
 const cardId=id(card),[[record]]=await db.execute('SELECT id_flashcard FROM flashcards_estudo WHERE id_flashcard=? AND id_usuario=?',[cardId,owner]);if(!record)fail(404,'Cartão não disponível nesta conta.')
 const [rows]=await db.execute('SELECT id_colecao FROM flashcard_colecao_itens WHERE id_flashcard=? AND id_usuario=?',[cardId,owner]);return rows.map(row=>row.id_colecao)
}
async function member(owner,collection,card,body,db=pool) {
 if(typeof body.incluir!=='boolean')fail(400,'Escolha adicionar ou retirar o cartão.')
 const collectionId=id(collection),cardId=id(card)
 // One statement binds both owners, including when identifiers are guessed.
 if(body.incluir){const [result]=await db.execute(`INSERT INTO flashcard_colecao_itens (id_colecao,id_flashcard,id_usuario)
 SELECT c.id,f.id_flashcard,c.id_usuario FROM flashcard_colecoes c JOIN flashcards_estudo f ON f.id_usuario=c.id_usuario
 WHERE c.id=? AND c.id_usuario=? AND f.id_flashcard=?
 ON DUPLICATE KEY UPDATE id_colecao=VALUES(id_colecao)`,[collectionId,owner,cardId]);
 if(!result.affectedRows){const [[existing]]=await db.execute('SELECT id_colecao FROM flashcard_colecao_itens WHERE id_colecao=? AND id_flashcard=? AND id_usuario=?',[collectionId,cardId,owner]);if(!existing)fail(404,'Coleção ou cartão não disponível nesta conta.')}
 }else await db.execute('DELETE FROM flashcard_colecao_itens WHERE id_colecao=? AND id_flashcard=? AND id_usuario=?',[collectionId,cardId,owner])
 return {salvo:true}
}
async function changeMany(owner,collection,body,db,removing) {
 const collectionId=id(collection)
 if(!Array.isArray(body?.cartoes)||body.cartoes.length<1||body.cartoes.length>50)fail(400,'Selecione de 1 a 50 cartões por operação.')
 const ids=[...new Set(body.cartoes.map(id))].sort((a,b)=>a-b)
 const conn=await db.getConnection()
 try {
  await conn.beginTransaction()
  const [[group]]=await conn.execute('SELECT id FROM flashcard_colecoes WHERE id=? AND id_usuario=? FOR UPDATE',[collectionId,owner])
  if(!group)fail(404,'Coleção não disponível nesta conta. Confira a seleção antes de tentar novamente.')
  const [records]=await conn.execute(`SELECT id_flashcard FROM flashcards_estudo WHERE id_usuario=? AND id_flashcard IN (${ids.map(()=>'?').join(',')}) ORDER BY id_flashcard FOR UPDATE`,[owner,...ids])
  if(records.length!==ids.length)fail(404,'Um ou mais cartões não estão disponíveis nesta conta. Nenhum vínculo foi alterado por este envio.')
  if(removing)await conn.execute(`DELETE FROM flashcard_colecao_itens WHERE id_colecao=? AND id_usuario=? AND id_flashcard IN (${ids.map(()=>'?').join(',')})`,[collectionId,owner,...ids])
  else await conn.execute(`INSERT INTO flashcard_colecao_itens (id_colecao,id_flashcard,id_usuario) VALUES ${ids.map(()=>'(?,?,?)').join(',')} ON DUPLICATE KEY UPDATE id_colecao=VALUES(id_colecao)`,ids.flatMap(cardId=>[collectionId,cardId,owner]))
  await conn.commit()
  return {salvo:true,confirmados:ids.length}
 } catch(error) {await conn.rollback();throw error} finally {conn.release()}
}
const addMany=(owner,collection,body,db=pool)=>changeMany(owner,collection,body,db,false)
const removeMany=(owner,collection,body,db=pool)=>changeMany(owner,collection,body,db,true)
async function pin(owner,collection,body,db=pool) {
 const collectionId=id(collection)
 if(typeof body?.fixada!=='boolean')fail(400,'Escolha fixar ou desafixar a coleção.')
 const conn=await db.getConnection()
 try {
  await conn.beginTransaction()
  // Serialize priority changes in this account, including concurrent requests.
  const [[user]]=await conn.execute('SELECT id_usuario FROM usuarios WHERE id_usuario=? FOR UPDATE',[owner])
  if(!user)fail(404,'Conta não disponível.')
  const [[record]]=await conn.execute('SELECT fixada,ordem_prioridade FROM flashcard_colecoes WHERE id=? AND id_usuario=? FOR UPDATE',[collectionId,owner])
  if(!record)fail(404,'Coleção não disponível nesta conta.')
  let position=body.fixada?Number(record.ordem_prioridade||0):0
  if(body.fixada&&!Number(record.fixada)){
   const [[count]]=await conn.execute('SELECT COUNT(*) AS total FROM flashcard_colecoes WHERE id_usuario=? AND fixada=1',[owner])
   if(Number(count.total)>=3)fail(409,'Você já tem três coleções fixadas em Hoje. Desafixe uma delas antes de escolher outra.')
   const [[last]]=await conn.execute('SELECT COALESCE(MAX(ordem_prioridade),0) AS ultima FROM flashcard_colecoes WHERE id_usuario=? AND fixada=1',[owner])
   position=Number(last.ultima||0)+1
  }
  await conn.execute('UPDATE flashcard_colecoes SET fixada=?,ordem_prioridade=? WHERE id=? AND id_usuario=?',[body.fixada?1:0,position,collectionId,owner])
  await conn.commit();return {salvo:true,fixada:body.fixada}
 }catch(error){await conn.rollback();throw error}finally{conn.release()}
}
async function reorder(owner,body,db=pool) {
 const parse=value=>{if(!Array.isArray(value)||value.length<1||value.length>3)fail(400,'Confira as coleções prioritárias.');const values=value.map(id);if(new Set(values).size!==values.length)fail(400,'Cada coleção deve aparecer uma única vez.');return values}
 const desired=parse(body?.ordem),previous=parse(body?.anterior)
 if(JSON.stringify([...desired].sort((a,b)=>a-b))!==JSON.stringify([...previous].sort((a,b)=>a-b)))fail(400,'Envie a mesma seleção de prioridades nas duas ordens.')
 const conn=await db.getConnection()
 try {
  await conn.beginTransaction()
  const [[user]]=await conn.execute('SELECT id_usuario FROM usuarios WHERE id_usuario=? FOR UPDATE',[owner])
  if(!user)fail(404,'Conta não disponível.')
  const [records]=await conn.execute('SELECT id FROM flashcard_colecoes WHERE id_usuario=? AND fixada=1 ORDER BY ordem_prioridade,nome,id FOR UPDATE',[owner])
  const actual=records.map(row=>Number(row.id))
  if(JSON.stringify(actual)===JSON.stringify(desired)){await conn.commit();return {salvo:true,ordem:desired}}
  if(JSON.stringify(actual)!==JSON.stringify(previous))fail(409,'As prioridades mudaram em outra tela. Atualize a lista antes de salvar uma nova ordem.')
  for(const [index,collectionId] of desired.entries())await conn.execute('UPDATE flashcard_colecoes SET ordem_prioridade=? WHERE id=? AND id_usuario=? AND fixada=1',[index+1,collectionId,owner])
  await conn.commit();return {salvo:true,ordem:desired}
 }catch(error){await conn.rollback();throw error}finally{conn.release()}
}
module.exports={flag,list,save,edit,remove,memberships,member,addMany,removeMany,pin,reorder}

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
 const [rows]=await db.execute(`SELECT c.id,c.nome,c.objetivo,c.versao,COUNT(f.id_flashcard) AS total,
 SUM(CASE WHEN f.arquivado=0 THEN 1 ELSE 0 END) AS ativos,
 SUM(CASE WHEN f.arquivado=0 AND f.proxima_revisao<=? THEN 1 ELSE 0 END) AS pendentes,
 SUM(CASE WHEN f.arquivado=0 AND f.melhorar=1 THEN 1 ELSE 0 END) AS melhorar,
 SUM(CASE WHEN f.arquivado=1 THEN 1 ELSE 0 END) AS arquivados
 FROM flashcard_colecoes c LEFT JOIN flashcard_colecao_itens i ON i.id_colecao=c.id AND i.id_usuario=c.id_usuario
 LEFT JOIN flashcards_estudo f ON f.id_flashcard=i.id_flashcard AND f.id_usuario=c.id_usuario
 WHERE c.id_usuario=? GROUP BY c.id,c.nome,c.objetivo,c.versao ORDER BY c.nome,c.id`,[today(),owner])
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
async function addMany(owner,collection,body,db=pool) {
 const collectionId=id(collection)
 if(!Array.isArray(body?.cartoes)||body.cartoes.length<1||body.cartoes.length>50)fail(400,'Selecione de 1 a 50 cartões por inclusão.')
 const ids=[...new Set(body.cartoes.map(id))].sort((a,b)=>a-b)
 const conn=await db.getConnection()
 try {
  await conn.beginTransaction()
  const [[group]]=await conn.execute('SELECT id FROM flashcard_colecoes WHERE id=? AND id_usuario=? FOR UPDATE',[collectionId,owner])
  if(!group)fail(404,'Coleção não disponível nesta conta. Confira a seleção antes de tentar novamente.')
  const [records]=await conn.execute(`SELECT id_flashcard FROM flashcards_estudo WHERE id_usuario=? AND id_flashcard IN (${ids.map(()=>'?').join(',')}) ORDER BY id_flashcard FOR UPDATE`,[owner,...ids])
  if(records.length!==ids.length)fail(404,'Um ou mais cartões não estão disponíveis nesta conta. Nenhum cartão foi adicionado por este envio.')
  await conn.execute(`INSERT INTO flashcard_colecao_itens (id_colecao,id_flashcard,id_usuario) VALUES ${ids.map(()=>'(?,?,?)').join(',')} ON DUPLICATE KEY UPDATE id_colecao=VALUES(id_colecao)`,ids.flatMap(cardId=>[collectionId,cardId,owner]))
  await conn.commit()
  return {salvo:true,confirmados:ids.length}
 } catch(error) {await conn.rollback();throw error} finally {conn.release()}
}
module.exports={flag,list,save,edit,remove,memberships,member,addMany}

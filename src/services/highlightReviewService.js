const pool=require('../config/db')
const {createHash}=require('node:crypto')
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})}
const positive=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<=0)fail(400,'Destaque inválido.');return n}
const text=(value,min,max,label)=>{if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(400,`Confira ${label}: use de ${min} a ${max} caracteres.`);return value.trim()}
function input(body={}){
 if(typeof body.chave!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(body.chave))fail(400,'Reabra a pergunta antes de salvar.')
 return {chave:body.chave,idDestaque:positive(body.idDestaque),pergunta:text(body.pergunta,5,1000,'a pergunta'),resposta:text(body.resposta,3,4000,'a resposta'),disciplina:text(body.disciplina??'',0,100,'a matéria')}
}
async function getHighlight(owner,id,db=pool){const [[row]]=await db.execute('SELECT id,material_key,titulo,secao,trecho,nota,versao,arquivado FROM leitura_destaques WHERE id=? AND id_usuario=? AND arquivado=0',[positive(id),owner]);if(!row)fail(404,'Destaque não disponível. Ele pode ter sido retirado.');return row}
async function save(owner,body,db=pool){
 const data=input(body),hash=createHash('sha256').update(JSON.stringify(data)).digest('hex'),conn=await db.getConnection()
 try{
  await conn.beginTransaction()
  // Serialize retries for this account, including concurrent requests with the same key.
  const [[user]]=await conn.execute('SELECT id_usuario FROM usuarios WHERE id_usuario=? FOR UPDATE',[owner]);if(!user)fail(404,'Conta não disponível.')
  const [[prior]]=await conn.execute('SELECT id_flashcard,hash_payload FROM revisoes_destaques WHERE id_usuario=? AND chave=?',[owner,data.chave])
  if(prior){if(prior.hash_payload!==hash)fail(409,'Este envio já foi confirmado com outro texto. Abra uma nova pergunta para salvar uma versão diferente.');await conn.commit();return {salvo:true,id:prior.id_flashcard}}
  const source=await getHighlight(owner,data.idDestaque,conn)
  const [card]=await conn.execute("INSERT INTO flashcards_estudo (id_usuario,frente,verso,disciplina,origem) VALUES (?,?,?,?,'ANOTACAO')",[owner,data.pergunta,data.resposta,data.disciplina||null])
  await conn.execute('INSERT INTO revisoes_destaques (id_usuario,chave,id_destaque,id_flashcard,hash_payload,fonte_titulo,fonte_secao,fonte_trecho) VALUES (?,?,?,?,?,?,?,?)',[owner,data.chave,source.id,card.insertId,hash,source.titulo,source.secao,source.trecho])
  await conn.commit();return {salvo:true,id:card.insertId}
 }catch(error){await conn.rollback();throw error}finally{conn.release()}
}
async function getReview(owner,id,db=pool){const [[row]]=await db.execute('SELECT f.id_flashcard,f.frente,f.verso,f.disciplina,f.proxima_revisao,r.fonte_titulo,r.fonte_secao,r.fonte_trecho FROM flashcards_estudo f JOIN revisoes_destaques r ON r.id_flashcard=f.id_flashcard AND r.id_usuario=f.id_usuario WHERE f.id_flashcard=? AND f.id_usuario=?',[positive(id),owner]);if(!row)fail(404,'Cartão não disponível nesta conta.');return row}
module.exports={input,getHighlight,save,getReview}

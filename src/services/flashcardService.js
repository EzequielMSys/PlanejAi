const pool = require('../config/db')
const {createHash} = require('node:crypto')
const fail = (status,message) => { throw Object.assign(new Error(message),{status}) }
const positive = value => { const n=Number(value); if(!Number.isSafeInteger(n)||n<=0)fail(400,'Identificador inválido.'); return n }
const text = (value,min,max,label) => {if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(400,`Confira ${label}: use de ${min} a ${max} caracteres.`);return value.trim()}
const key = value => {if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(value))fail(400,'Reabra o cartão antes de salvar.');return value}
const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date())
const fields = 'f.id_flashcard,f.frente,f.verso,f.disciplina,f.origem,f.proxima_revisao,f.versao,f.arquivado'
const sourceFields = ',r.fonte_titulo,r.fonte_secao,r.fonte_trecho'
const sourceJoin = ' LEFT JOIN revisoes_destaques r ON r.id_flashcard=f.id_flashcard AND r.id_usuario=f.id_usuario '
const intervals = {ERREI:1,DIFICIL:3,LEMBREI:7,DOMINEI:15}
function content(body={}){return {pergunta:text(body.pergunta,5,1000,'a pergunta'),resposta:text(body.resposta,3,4000,'a resposta'),disciplina:text(body.disciplina??'',0,100,'a matéria')}}
function filters(input={}){
 const pagina=input.pagina===undefined?1:positive(input.pagina)
 if(pagina>100||!['ativos','arquivados'].includes(input.arquivo||'ativos')||!['todos','pendentes'].includes(input.estado||'todos')||![undefined,'1'].includes(input.semMateria))fail(400,'Confira os filtros dos cartões.')
 const materia=text(input.materia??'',0,100,'o filtro de matéria')
 if(materia&&input.semMateria==='1')fail(400,'Escolha uma matéria por vez.')
 return {pagina,arquivado:input.arquivo==='arquivados'?1:0,pendentes:input.estado==='pendentes',materia,semMateria:input.semMateria==='1'}
}
async function list(owner,input,db=pool){
 const opt=filters(input),params=[owner,opt.arquivado];let where='f.id_usuario=? AND f.arquivado=?'
 if(opt.materia){where+=' AND f.disciplina=?';params.push(opt.materia)}
 if(opt.semMateria)where+=" AND (f.disciplina IS NULL OR TRIM(f.disciplina)='')"
 if(opt.pendentes){where+=' AND f.proxima_revisao<=?';params.push(today())}
 const [[count]]=await db.execute(`SELECT COUNT(*) AS total FROM flashcards_estudo f WHERE ${where}`,params)
 const [rows]=await db.execute(`SELECT ${fields}${sourceFields} FROM flashcards_estudo f ${sourceJoin} WHERE ${where} ORDER BY f.proxima_revisao,f.id_flashcard LIMIT 13 OFFSET ${(opt.pagina-1)*12}`,params)
 const [subjects]=await db.execute("SELECT DISTINCT disciplina FROM flashcards_estudo WHERE id_usuario=? AND disciplina IS NOT NULL AND TRIM(disciplina)<>'' ORDER BY disciplina LIMIT 200",[owner])
 return {itens:rows.slice(0,12),mais:rows.length>12,pagina:opt.pagina,total:Number(count.total),materias:subjects.map(row=>row.disciplina),hoje:today()}
}
async function get(owner,id,db=pool){const [[row]]=await db.execute(`SELECT ${fields}${sourceFields} FROM flashcards_estudo f ${sourceJoin} WHERE f.id_flashcard=? AND f.id_usuario=?`,[positive(id),owner]);if(!row)fail(404,'Cartão não disponível nesta conta.');return row}
async function create(owner,body,db=pool){
 const value=content(body),chave=key(body.chave),hash=createHash('sha256').update(JSON.stringify(value)).digest('hex')
 const existing=async()=>{const [[row]]=await db.execute('SELECT id_flashcard,hash_criacao FROM flashcards_estudo WHERE id_usuario=? AND chave_criacao=?',[owner,chave]);if(!row)return null;if(row.hash_criacao!==hash)fail(409,'Este envio já foi recebido com outro texto. Consulte seus cartões antes de criar outra cópia.');return {salvo:true,id:row.id_flashcard}}
 const prior=await existing();if(prior)return prior
 try{const [result]=await db.execute("INSERT INTO flashcards_estudo (id_usuario,frente,verso,disciplina,origem,chave_criacao,hash_criacao,proxima_revisao) VALUES (?,?,?,?,'MANUAL',?,?,?)",[owner,value.pergunta,value.resposta,value.disciplina||null,chave,hash,today()]);return {salvo:true,id:result.insertId}}catch(error){if(error.code==='ER_DUP_ENTRY')return existing();throw error}
}
async function edit(owner,id,body,db=pool){const value=content(body),version=positive(body.versao);const [result]=await db.execute('UPDATE flashcards_estudo SET frente=?,verso=?,disciplina=?,versao=versao+1 WHERE id_flashcard=? AND id_usuario=? AND versao=? AND arquivado=0',[value.pergunta,value.resposta,value.disciplina||null,positive(id),owner,version]);if(!result.affectedRows)fail(409,'O cartão mudou ou foi arquivado. Seu rascunho continua aqui; confira a versão da conta.');return {salvo:true,id:Number(id),versao:version+1}}
async function archive(owner,id,body,db=pool){if(typeof body.arquivado!=='boolean')fail(400,'Escolha arquivar ou restaurar.');const [result]=await db.execute('UPDATE flashcards_estudo SET arquivado=?,versao=versao+1 WHERE id_flashcard=? AND id_usuario=? AND versao=?',[body.arquivado?1:0,positive(id),owner,positive(body.versao)]);if(!result.affectedRows)fail(409,'O cartão mudou. Atualize a lista antes de tentar novamente.');return {salvo:true}}
async function review(owner,id,body,db=pool){
 const cardId=positive(id),version=positive(body.versao),chave=key(body.chave)
 if(!Object.hasOwn(intervals,body.resultado))fail(400,'Escolha como ficou sua lembrança.')
 const days=intervals[body.resultado]
 const date=new Date(today()+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+days);const next=date.toISOString().slice(0,10)
 const [result]=await db.execute('UPDATE flashcards_estudo SET proxima_revisao=?,ultima_avaliacao_chave=?,ultimo_resultado=?,versao=versao+1 WHERE id_flashcard=? AND id_usuario=? AND versao=? AND arquivado=0',[next,chave,body.resultado,cardId,owner,version])
 if(!result.affectedRows){const [[prior]]=await db.execute('SELECT versao,proxima_revisao,ultima_avaliacao_chave,ultimo_resultado,arquivado FROM flashcards_estudo WHERE id_flashcard=? AND id_usuario=?',[cardId,owner]);if(!prior)fail(404,'Cartão não disponível nesta conta.');if(prior.ultima_avaliacao_chave!==chave||prior.ultimo_resultado!==body.resultado)fail(409,'O cartão mudou em outra tela. Confira a versão atual antes de registrar sua revisão.');return {salvo:true,versao:prior.versao,proximaRevisao:prior.proxima_revisao,intervaloDias:days}}
 return {salvo:true,versao:version+1,proximaRevisao:next,intervaloDias:days}
}
async function short(owner,input={},db=pool){
 const minutes=Number(input.minutos??5),limits={3:2,5:3,10:5};if(!Object.hasOwn(limits,minutes))fail(400,'Escolha 3, 5 ou 10 minutos.')
 const date=today(),[[count]]=await db.execute('SELECT COUNT(*) AS total FROM flashcards_estudo WHERE id_usuario=? AND arquivado=0 AND proxima_revisao<=?',[owner,date])
 const [rows]=await db.execute(`SELECT ${fields} FROM flashcards_estudo f WHERE f.id_usuario=? AND f.arquivado=0 AND f.proxima_revisao<=? ORDER BY f.proxima_revisao,f.id_flashcard LIMIT ${limits[minutes]}`,[owner,date])
 return {itens:rows,totalPendentes:Number(count.total),minutos:minutes,minutosEstimados:Math.ceil(rows.length*1.5),hoje:date}
}
module.exports={content,filters,list,get,create,edit,archive,review,short,today}

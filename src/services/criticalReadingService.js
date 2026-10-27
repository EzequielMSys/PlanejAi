const {createHash}=require('crypto');
const jwt=require('jsonwebtoken');
const pool=require('../config/db');
const {getJwtSecret}=require('../config/jwtConfig');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const parse=v=>typeof v==='string'?JSON.parse(v):v;
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const text=(v,max)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)fail(`Preencha o texto com até ${max} caracteres.`);return v.trim();};
const key=v=>{if(typeof v!=='string'||!/^[a-f0-9-]{36}$/i.test(v))fail('Identificador inválido.');return v;};
const categories=require('./productionPracticeService').categories;
async function selection(owner,id,body,db){
  const record=await require('./guidedStudyService').detail(owner,id,db);if(record.kind!=='projeto')fail('Escolha um projeto.');
  const production=await require('./productionPracticeService').production(owner,record,body,db,id);
  const email=text(body.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Informe o e-mail da conta convidada.');
  const [[reader]]=await db.execute('SELECT id_usuario,email,nome FROM usuarios WHERE email=? AND ativo=1 LIMIT 1',[email]);
  if(!reader||String(reader.id_usuario)===String(owner))fail('Escolha o e-mail de outra conta ativa do PlanejAI.');
  if(!Number.isInteger(body.days)||body.days<1||body.days>30)fail('Escolha um prazo de 1 a 30 dias.');
  if(!Array.isArray(body.references)||body.references.length>5||new Set(body.references).size!==body.references.length||body.references.some(id=>!production.sources.some(s=>s.id===id)))fail('Confira as referências que deseja compartilhar.');
  return {reader:Number(reader.id_usuario),email:reader.email,title:text(body.title,120),question:text(body.question,1200),days:body.days,production:{id:production.id,text:production.text,created:production.created},references:production.sources.filter(s=>body.references.includes(s.id)).map(s=>({id:s.id,origin:s.origin,purpose:s.purpose||'',limits:s.limits||'',url:s.url||''}))};
}
async function preview(owner,id,body,db=pool){
  const selected=await selection(owner,id,body,db),expires=new Date(Date.now()+selected.days*86400000).toISOString();
  const receipt=jwt.sign({owner:String(owner),project:id,hash:digest(selected),expires},getJwtSecret(),{algorithm:'HS256',audience:'critical-reading-preview',expiresIn:'15m'});
  return {...selected,expires,receipt};
}
async function comments(id,db){const [rows]=await db.execute('SELECT id,dados FROM leitura_critica_comentarios WHERE leitura=? ORDER BY criado_em,id LIMIT 40',[id]);return rows.map(r=>({id:r.id,...parse(r.dados)}));}
function status(row){return row.revogada_em?'revogada':new Date(Number(row.expira_em)).getTime()<=Date.now()?'expirada':'aberta';}
function publicView(row){const data=parse(row.dados);return {id:row.id,title:data.title,question:data.question,production:data.production,references:data.references,expires:new Date(Number(row.expira_em)).toISOString(),status:status(row),created:row.criada_em};}
async function create(owner,id,body,db=pool){
  key(body.key);let receipt;try{receipt=jwt.verify(body.receipt,getJwtSecret(),{algorithms:['HS256'],audience:'critical-reading-preview'});}catch{fail('A prévia expirou. Confira o conteúdo e o acesso novamente.',409);}
  if(receipt.owner!==String(owner)||receipt.project!==id)fail('Prévia indisponível.',404);
  const conn=await db.getConnection();try{await conn.beginTransaction();
    await require('./guidedStudyService').detail(owner,id,conn,true);
    const selected=await selection(owner,id,body,conn),hash=digest(selected);
    if(receipt.hash!==hash||Date.parse(receipt.expires)<=Date.now())fail('A seleção mudou ou o prazo terminou. Confira uma nova prévia.',409);
    const [[prior]]=await conn.execute('SELECT * FROM leituras_criticas WHERE id=? AND autor=?',[body.key,owner]);
    if(prior){if(prior.hash_envio!==hash)fail('Este envio já foi usado com outra seleção.',409);await conn.commit();return publicView(prior);}
    const [[count]]=await conn.execute('SELECT COUNT(*) AS total FROM leituras_criticas WHERE projeto=? AND autor=?',[id,owner]);if(Number(count.total)>=20)fail('Este projeto chegou a vinte convites. Os registros anteriores permanecem guardados.');
    await conn.execute('INSERT INTO leituras_criticas (id,projeto,autor,leitor,dados,hash_envio,expira_em) VALUES (?,?,?,?,?,?,?)',[body.key,id,owner,selected.reader,JSON.stringify(selected),hash,Date.parse(receipt.expires)]);
    await conn.commit();return {id:body.key,...selected,expires:receipt.expires,status:'aberta'};
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
async function authorList(owner,id,db=pool){await require('./guidedStudyService').detail(owner,id,db);const [rows]=await db.execute('SELECT * FROM leituras_criticas WHERE projeto=? AND autor=? ORDER BY criada_em DESC LIMIT 20',[id,owner]);return Promise.all(rows.map(async row=>({...publicView(row),email:parse(row.dados).email,comments:await comments(row.id,db)})));}
async function inbox(reader,db=pool){const [rows]=await db.execute('SELECT id,dados,expira_em,revogada_em,criada_em FROM leituras_criticas WHERE leitor=? AND revogada_em IS NULL AND expira_em>UNIX_TIMESTAMP()*1000 ORDER BY criada_em DESC LIMIT 50',[reader]);return rows.map(row=>({id:row.id,title:parse(row.dados).title,expires:new Date(Number(row.expira_em)).toISOString(),status:status(row)}));}
async function readable(reader,id,db,lock=false){key(id);const [[row]]=await db.execute('SELECT * FROM leituras_criticas WHERE id=? AND leitor=?'+(lock?' FOR UPDATE':''),[id,reader]);if(!row||status(row)!=='aberta')fail('Leitura indisponível para esta conta ou prazo encerrado.',404);return row;}
async function read(reader,id,db=pool){const row=await readable(reader,id,db);return {...publicView(row),comments:await comments(id,db)};}
async function comment(reader,id,body,db=pool){
  key(body.key);const conn=await db.getConnection();try{await conn.beginTransaction();const row=await readable(reader,id,conn,true),data=parse(row.dados),excerpt=text(body.excerpt,2000);
    if(!data.production.text.includes(excerpt))fail('Copie um trecho literal da versão compartilhada.');if(!Object.hasOwn(categories,body.category))fail('Escolha o tipo de comentário.');
    const value={excerpt,category:body.category,comment:text(body.comment,2500),created:new Date().toISOString()},hash=digest({excerpt,category:value.category,comment:value.comment});
    const [[prior]]=await conn.execute('SELECT id,hash_envio FROM leitura_critica_comentarios WHERE id=? AND leitura=?',[body.key,id]);
    if(prior){if(prior.hash_envio!==hash)fail('Este envio já foi confirmado com outro comentário.',409);await conn.commit();return {saved:true};}
    const [[count]]=await conn.execute('SELECT COUNT(*) AS total FROM leitura_critica_comentarios WHERE leitura=?',[id]);if(Number(count.total)>=40)fail('Esta leitura chegou a quarenta comentários.');
    await conn.execute('INSERT INTO leitura_critica_comentarios (id,leitura,dados,hash_envio) VALUES (?,?,?,?)',[body.key,id,JSON.stringify(value),hash]);await conn.commit();return {saved:true};
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
}
async function revoke(owner,id,db=pool){key(id);const [result]=await db.execute('UPDATE leituras_criticas SET revogada_em=COALESCE(revogada_em,UTC_TIMESTAMP()) WHERE id=? AND autor=?',[id,owner]);if(!result.affectedRows)fail('Leitura indisponível.',404);return {revoked:true};}
async function importComment(owner,data,body,db,project){
  const [[row]]=await db.execute('SELECT * FROM leituras_criticas WHERE id=? AND autor=? AND projeto=?',[key(body.reading),owner,project]);if(!row)fail('Leitura não encontrada neste projeto.',404);
  const found=(await comments(row.id,db)).find(c=>c.id===body.comment);if(!found)fail('Comentário não encontrado.',404);
  if(data.humanComments?.some(c=>c.criticalReading?.comment===found.id))fail('Este comentário já foi levado às suas devolutivas.',409);
  if((data.humanComments?.length||0)>=40)fail('O histórico chegou a quarenta devolutivas.');
  const selected=parse(row.dados);if(!data.entries.some(e=>e.id===selected.production.id&&e.type==='producao'&&e.text===selected.production.text))fail('A produção de origem não está disponível.',409);
  key(body.key);const item={id:body.key,created:new Date().toISOString(),thread:body.key,production:{...selected.production,sources:selected.references},originRole:'outro',origin:`Conta convidada: ${selected.email}`,date:found.created.slice(0,10),category:found.category,excerpt:found.excerpt,comment:found.comment,replaces:null,reason:'',criticalReading:{id:row.id,comment:found.id}};
  item.hash=digest({...body,version:undefined});data.humanComments=[...(data.humanComments||[]),item];return true;
}
module.exports={preview,create,authorList,inbox,read,comment,revoke,importComment};

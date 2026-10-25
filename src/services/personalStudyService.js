const pool = require('../config/db');
const catalog = require('./unifiedSearchService');
const fail = (status,message) => { throw Object.assign(new Error(message),{status}); };
const id = value => { const n=Number(value); if(!Number.isSafeInteger(n)||n<1)fail(400,'Identificador inválido.');return n; };
const owner = user => id(user.id_usuario || user.id);
const TYPES = ['anotacao','duvida','material','redacao'];
async function source(user,type,sourceId,db=pool) {
  if(!TYPES.includes(type))fail(400,'Tipo de item inválido.');
  const key=id(sourceId), account=owner(user);
  if(type==='material')return catalog.content(user,key,db);
  if(type==='anotacao') {
    const [[row]]=await db.execute('SELECT c.id_conteudo,c.titulo,c.disciplina,LEFT(a.texto,240) AS trecho FROM anotacoes_estudo a JOIN conteudos c ON c.id_conteudo=a.id_conteudo WHERE a.id_usuario=? AND a.id_conteudo=? AND CHAR_LENGTH(TRIM(a.texto))>0',[account,key]);
    return row || null;
  }
  if(type==='duvida') {
    const [[row]]=await db.execute("SELECT id,titulo,resolvido FROM diario_aprendizagem WHERE id_usuario=? AND id=? AND tipo='duvida'",[account,key]);return row || null;
  }
  const [[row]]=await db.execute('SELECT id_redacao,tema AS titulo,LEFT(texto,240) AS trecho FROM redacoes WHERE id_usuario=? AND id_redacao=?',[account,key]);return row || null;
}
async function desk(user,db=pool) {
  const [rows]=await db.execute('SELECT id,tipo,id_origem,posicao,criado_em FROM mesa_estudo WHERE id_usuario=? ORDER BY posicao,id LIMIT 6',[owner(user)]);
  const itens=await Promise.all(rows.map(async row=>{
    const item=await source(user,row.tipo,row.id_origem,db);
    return {...row,disponivel:Boolean(item),titulo:item?.titulo || 'Item indisponível',disciplina:item?.disciplina || null,trecho:item?.trecho || null,resolvido:item?.resolvido};
  }));
  return {itens,limite:6};
}
async function pin(user,body,db=pool) {
  if(!TYPES.includes(body?.tipo))fail(400,'Tipo de item inválido.');
  const key=id(body.idOrigem), account=owner(user), conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('SELECT id_usuario FROM usuarios WHERE id_usuario=? FOR UPDATE',[account]);
    if(!await source(user,body.tipo,key,conn))fail(404,'Este item não está disponível na sua conta. Salve o original antes de fixar.');
    const [rows]=await conn.execute('SELECT id,tipo,id_origem,posicao FROM mesa_estudo WHERE id_usuario=? ORDER BY posicao,id',[account]);
    const prior=rows.find(row=>row.tipo===body.tipo && Number(row.id_origem)===key);
    if(prior){await conn.commit();return {id:prior.id,fixado:true};}
    if(rows.length>=6)fail(409,'Sua mesa já tem seis itens. Retire um deles para abrir espaço.');
    const [result]=await conn.execute('INSERT INTO mesa_estudo (id_usuario,tipo,id_origem,posicao) VALUES (?,?,?,?)',[account,body.tipo,key,Math.max(0,...rows.map(row=>row.posicao))+1]);
    await conn.commit();return {id:result.insertId,fixado:true};
  } catch(error){await conn.rollback();throw error;}finally{conn.release();}
}
async function remove(user,pinId,db=pool) {
  const [result]=await db.execute('DELETE FROM mesa_estudo WHERE id=? AND id_usuario=?',[id(pinId),owner(user)]);
  if(!result.affectedRows)fail(404,'Item não encontrado na sua mesa.');
  return {retirado:true};
}
async function move(user,pinId,direction,db=pool) {
  if(!['subir','descer'].includes(direction))fail(400,'Direção inválida.');
  const key=id(pinId),account=owner(user),conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('SELECT id_usuario FROM usuarios WHERE id_usuario=? FOR UPDATE',[account]);
    const [rows]=await conn.execute('SELECT id FROM mesa_estudo WHERE id_usuario=? ORDER BY posicao,id',[account]);
    const index=rows.findIndex(row=>row.id===key);
    if(index<0)fail(404,'Item não encontrado na sua mesa.');
    const target=index+(direction==='subir'?-1:1);
    if(target>=0 && target<rows.length)[rows[index],rows[target]]=[rows[target],rows[index]];
    for(let i=0;i<rows.length;i++)await conn.execute('UPDATE mesa_estudo SET posicao=? WHERE id=? AND id_usuario=?',[i+1,rows[i].id,account]);
    await conn.commit();return {ordenado:true};
  }catch(error){await conn.rollback();throw error;}finally{conn.release();}
}
async function open(user,pinId,db=pool) {
  const [[row]]=await db.execute('SELECT tipo,id_origem FROM mesa_estudo WHERE id=? AND id_usuario=?',[id(pinId),owner(user)]);
  if(!row)fail(404,'Item não encontrado na sua mesa.');
  const item=await source(user,row.tipo,row.id_origem,db);
  if(!item)fail(404,'O original foi removido ou seu acesso mudou. Você pode retirar este atalho da mesa.');
  return {...row,item};
}
async function understanding(user,query={},db=pool) {
  const page=query.pagina===undefined?1:id(query.pagina);
  if(page>1000)fail(400,'Página inválida.');
  const [rows]=await db.execute(`SELECT p.id AS passo,p.id_diario AS registro,d.tipo AS registro_tipo,d.titulo,d.resolvido,
    p.tipo,p.criado_em,LEFT(p.texto,240) AS trecho,
    (SELECT COUNT(*) FROM diario_passos v WHERE v.id_diario=d.id AND v.id_usuario=d.id_usuario AND v.tipo='explicacao' AND v.id<=p.id) AS versao
    FROM diario_passos p JOIN diario_aprendizagem d ON d.id=p.id_diario AND d.id_usuario=p.id_usuario
    WHERE p.id_usuario=? AND (p.tipo='exemplo' OR (p.tipo='resolucao' AND d.resolvido=1)
      OR (p.tipo='explicacao' AND EXISTS (SELECT 1 FROM diario_passos anterior WHERE anterior.id_diario=d.id AND anterior.id_usuario=d.id_usuario AND anterior.tipo='explicacao' AND anterior.id<p.id)))
    ORDER BY p.id DESC LIMIT 21 OFFSET ${(page-1)*20}`,[owner(user)]);
  return {itens:rows.slice(0,20),mais:rows.length>20,pagina:page};
}
async function evidence(user,stepId,db=pool) {
  const account=owner(user);
  const [[step]]=await db.execute(`SELECT p.id,p.id_diario,p.tipo,p.texto,p.criado_em,d.titulo,d.tipo AS registro_tipo,d.resolvido
    FROM diario_passos p JOIN diario_aprendizagem d ON d.id=p.id_diario AND d.id_usuario=p.id_usuario
    WHERE p.id=? AND p.id_usuario=?`,[id(stepId),account]);
  if(!step)fail(404,'Registro não encontrado na sua conta.');
  let anterior=null;
  if(step.tipo==='explicacao') {
    const [[row]]=await db.execute("SELECT id,tipo,texto,criado_em FROM diario_passos WHERE id_diario=? AND id_usuario=? AND tipo='explicacao' AND id<? ORDER BY id DESC LIMIT 1",[step.id_diario,account,step.id]);anterior=row || null;
  }
  return {...step,anterior};
}
module.exports={desk,pin,remove,move,open,understanding,evidence,source};

const pool = require('../config/db');
const {createHash} = require('node:crypto');
const {calcularProximaRevisao} = require('../utils/reviewScheduler');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const owner=user=>Number(user.id_usuario || user.id);
const id=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<=0)fail(400,'Registro inválido.');return n;};
function input(body) {
  if(!body || typeof body.chave!=='string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(body.chave))fail(400,'Identificador de fechamento inválido.');
  if(!['DIFICIL','LEMBREI','DOMINEI'].includes(body.resultado))fail(400,'Escolha como ficou o conteúdo.');
  if(typeof body.proximoPasso!=='string' || body.proximoPasso.length>600)fail(400,'Use até 600 caracteres para seu próximo passo.');
  const started=typeof body.inicio==='string'?Date.parse(body.inicio):NaN;
  if(!Number.isFinite(started)||started>Date.now()+300000)fail(400,'O início da sessão é inválido.');
  const data={chave:body.chave,idItem:body.idItem==null?null:id(body.idItem),idConteudo:body.idConteudo==null?null:id(body.idConteudo),inicio:new Date(started).toISOString(),resultado:body.resultado,proximoPasso:body.proximoPasso.trim()};
  if(!data.idItem&&!data.idConteudo)fail(400,'Escolha um conteúdo para concluir a sessão.');
  return data;
}
function parse(row) {return {...row,sintese:typeof row.sintese==='string'?JSON.parse(row.sintese):row.sintese};}
async function close(user,body,db=pool) {
  const data=input(body),uid=owner(user);
  const hash=createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('SELECT id_usuario FROM usuarios WHERE id_usuario=? FOR UPDATE',[uid]);
    const [[prior]]=await conn.execute('SELECT * FROM fechamentos_estudo WHERE id_usuario=? AND chave=?',[uid,data.chave]);
    if(prior) {
      if(prior.hash_payload!==hash)fail(409,'Este fechamento já foi confirmado com outras informações. Retome o envio original.');
      await conn.commit();return {confirmado:true,fechamento:parse(prior)};
    }
    let content;
    if(data.idItem) {
      const [[item]]=await conn.execute(`SELECT cc.id,cc.id_conteudo,cc.concluido,d.id_dia,d.id_cronograma,d.data_estudo,
        (d.data_estudo>CURDATE()) AS futuro,c.titulo,c.disciplina FROM cronograma_conteudos cc
        JOIN cronograma_dias d ON d.id_dia=cc.id_dia JOIN cronogramas cr ON cr.id_cronograma=d.id_cronograma
        JOIN perfil_estudo p ON p.id_perfil=cr.id_perfil LEFT JOIN conteudos c ON c.id_conteudo=cc.id_conteudo
        WHERE cc.id=? AND p.id_usuario=? AND cr.status='ATIVO' FOR UPDATE`,[data.idItem,uid]);
      if(!item || (data.idConteudo && data.idConteudo!==item.id_conteudo))fail(404,'Conteúdo não disponível no seu cronograma.');
      const [previous]=await conn.execute('SELECT id_dia FROM cronograma_dias WHERE id_cronograma=? AND data_estudo<? AND concluido=0 LIMIT 1',[item.id_cronograma,item.data_estudo]);
      if(previous.length)fail(409,'Conclua os dias anteriores antes de avançar no cronograma.');
      if(item.futuro) {
        const [approved]=await conn.execute("SELECT id_avaliacao FROM cronograma_avaliacoes WHERE id_dia=? AND id_usuario=? AND tipo='ADIANTAMENTO' AND status='APROVADA' LIMIT 1",[item.id_dia,uid]);
        if(!approved.length)fail(409,'Este dia ainda está bloqueado. Faça o desafio de avanço antes de concluir.');
      }
      content=item;
    } else {
      const search=require('./unifiedSearchService');
      content=await search.content(user,data.idConteudo,conn) || await search.content(user,data.idConteudo,conn,true);
      if(!content)fail(404,'Conteúdo não disponível para sua conta.');
    }
    const seconds=Math.max(1,Math.min(43200,Math.round((Date.now()-Date.parse(data.inicio))/1000)));
    const minutes=Math.max(1,Math.round(seconds/60));
    const cid=content.id_conteudo || null;
    if(data.idItem)await conn.execute('UPDATE cronograma_conteudos SET concluido=1 WHERE id=?',[data.idItem]);
    if(cid) {
      const [[state]]=await conn.execute('SELECT * FROM revisoes_estudo WHERE id_usuario=? AND id_conteudo=? FOR UPDATE',[uid,cid]);
      const next=calcularProximaRevisao(state || {},data.resultado);
      await conn.execute(`INSERT INTO revisoes_estudo (id_usuario,id_conteudo,nivel_dominio,repeticoes,intervalo_dias,proxima_revisao,ultima_revisao,ultimo_resultado)
        VALUES (?,?,?,?,?,?,NOW(),?) ON DUPLICATE KEY UPDATE nivel_dominio=VALUES(nivel_dominio),repeticoes=VALUES(repeticoes),intervalo_dias=VALUES(intervalo_dias),proxima_revisao=VALUES(proxima_revisao),ultima_revisao=NOW(),ultimo_resultado=VALUES(ultimo_resultado)`,[uid,cid,next.nivelDominio,next.repeticoes,next.intervaloDias,next.proximaRevisao,data.resultado]);
    }
    const [session]=await conn.execute('INSERT INTO sessoes_estudo (id_usuario,id_conteudo,duracao_minutos,resultado) VALUES (?,?,?,?)',[uid,cid,minutes,data.resultado]);
    const [[counts]]=await conn.execute(`SELECT
      (SELECT COUNT(*) FROM anotacoes_estudo WHERE id_usuario=? AND id_conteudo=? AND TRIM(texto)<>'' AND atualizado_em>=DATE_SUB(NOW(),INTERVAL ? SECOND)) AS anotacoes,
      (SELECT COUNT(*) FROM diario_passos p JOIN diario_aprendizagem d ON d.id=p.id_diario WHERE p.id_usuario=? AND d.id_usuario=? AND d.id_conteudo=? AND p.tipo='explicacao' AND p.criado_em>=DATE_SUB(NOW(),INTERVAL ? SECOND)) AS explicacoes,
      (SELECT COUNT(*) FROM diario_aprendizagem WHERE id_usuario=? AND id_conteudo=? AND tipo='duvida' AND resolvido=0) AS duvidas`,[uid,cid,seconds,uid,uid,cid,seconds,uid,cid]);
    const [doubts]=await conn.execute("SELECT id,titulo FROM diario_aprendizagem WHERE id_usuario=? AND id_conteudo=? AND tipo='duvida' AND resolvido=0 ORDER BY atualizado_em DESC,id DESC LIMIT 3",[uid,cid]);
    const summary={titulo:content.titulo || 'Sessão do cronograma',disciplina:content.disciplina || 'Meu estudo',minutos:minutes,resultado:data.resultado,anotacoes:Number(counts.anotacoes),explicacoes:Number(counts.explicacoes),totalDuvidas:Number(counts.duvidas),duvidas:doubts};
    const [saved]=await conn.execute('INSERT INTO fechamentos_estudo (id_usuario,id_conteudo,id_sessao,chave,hash_payload,sintese,proximo_passo) VALUES (?,?,?,?,?,?,?)',[uid,cid,session.insertId,data.chave,hash,JSON.stringify(summary),data.proximoPasso]);
    if(data.idItem)await conn.execute('DELETE FROM estudo_em_andamento WHERE id_usuario=? AND id_item=?',[uid,data.idItem]);
    await conn.commit();
    return {confirmado:true,fechamento:{id:saved.insertId,id_conteudo:cid,sintese:summary,proximo_passo:data.proximoPasso}};
  }catch(error){await conn.rollback();throw error;}finally{conn.release();}
}
async function resume(user,closureId,db=pool) {
  const [[row]]=await db.execute('SELECT id_conteudo FROM fechamentos_estudo WHERE id=? AND id_usuario=?',[id(closureId),owner(user)]);
  if(!row?.id_conteudo)fail(404,'O conteúdo deste lembrete não está mais disponível.');
  const search=require('./unifiedSearchService');
  const content=await search.content(user,row.id_conteudo,db) || await search.content(user,row.id_conteudo,db,true);
  if(!content)fail(404,'Seu acesso a este conteúdo mudou. O lembrete continua na conta.');
  return {conteudo:content};
}
async function done(uid,closureId,db=pool) {
  const [result]=await db.execute('UPDATE fechamentos_estudo SET retomado_em=COALESCE(retomado_em,NOW()) WHERE id=? AND id_usuario=?',[id(closureId),uid]);
  if(!result.affectedRows)fail(404,'Lembrete não encontrado na sua conta.');
  return {confirmado:true};
}
function recommend(items) {
  if(items.proximoPasso)return {...items.proximoPasso,tipo:'lembrete'};
  if(items.revisao?.atrasada)return {...items.revisao,tipo:'revisao'};
  if(items.explicacao)return {...items.explicacao,tipo:'explicacao'};
  if(items.revisao)return {...items.revisao,tipo:'revisao'};
  return items.duvida?{...items.duvida,tipo:'duvida'}:null;
}
async function pending(uid,db=pool) {
  const [[explanations],[doubts],[reviews],[reminders]]=await Promise.all([
    db.execute(`SELECT d.id,d.titulo,c.disciplina,MAX(p.criado_em) AS ultima FROM diario_aprendizagem d JOIN diario_passos p ON p.id_diario=d.id AND p.id_usuario=d.id_usuario
      LEFT JOIN conteudos c ON c.id_conteudo=d.id_conteudo WHERE d.id_usuario=? AND d.tipo='explicacao' AND p.tipo='explicacao'
      GROUP BY d.id,d.titulo,c.disciplina HAVING MAX(p.criado_em)<=DATE_SUB(NOW(),INTERVAL 3 DAY) ORDER BY ultima ASC,d.id ASC LIMIT 1`,[uid]),
    db.execute("SELECT d.id,d.titulo,c.disciplina FROM diario_aprendizagem d LEFT JOIN conteudos c ON c.id_conteudo=d.id_conteudo WHERE d.id_usuario=? AND d.tipo='duvida' AND d.resolvido=0 ORDER BY d.atualizado_em ASC,d.id ASC LIMIT 1",[uid]),
    db.execute('SELECT r.id_revisao AS id,c.titulo,c.disciplina,(r.proxima_revisao<CURDATE()) AS atrasada FROM revisoes_estudo r JOIN conteudos c ON c.id_conteudo=r.id_conteudo WHERE r.id_usuario=? AND r.proxima_revisao<=CURDATE() ORDER BY r.proxima_revisao ASC,r.nivel_dominio ASC,r.id_revisao ASC LIMIT 1',[uid]),
    db.execute("SELECT f.id,f.proximo_passo AS texto,f.sintese FROM fechamentos_estudo f WHERE f.id_usuario=? AND f.retomado_em IS NULL AND TRIM(f.proximo_passo)<>'' ORDER BY f.criado_em DESC,f.id DESC LIMIT 1",[uid]),
  ]);
  const items={
    explicacao:explanations[0]?{...explanations[0],minutos:5,motivo:'Sua última versão foi salva há pelo menos três dias. Tente explicar novamente antes de consultar a anterior.'}:null,
    duvida:doubts[0]?{...doubts[0],minutos:8,motivo:'Esta é sua dúvida aberta há mais tempo sem um novo registro. Um exemplo ou uma tentativa curta pode ajudar a avançar.'}:null,
    revisao:reviews[0]?{...reviews[0],atrasada:Boolean(reviews[0].atrasada),minutos:10,motivo:reviews[0].atrasada?'A data sugerida de revisão já passou. Uma retomada curta pode ajudar a recuperar o raciocínio.':'Esta revisão está prevista para hoje, conforme suas respostas anteriores.'}:null,
    proximoPasso:reminders[0]?{id:reminders[0].id,titulo:parse(reminders[0]).sintese.titulo,texto:reminders[0].texto,minutos:5,motivo:'Você deixou este próximo passo ao concluir uma sessão. Comece pela intenção que registrou.'}:null,
  };
  return {...items,principal:recommend(items)};
}
module.exports={close,pending,resume,done,input,recommend};

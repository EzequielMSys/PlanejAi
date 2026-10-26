const pool=require('../config/db');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const parse=value=>typeof value==='string'?JSON.parse(value):value;
const positive=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<1)fail('Identificador de origem inválido.');return n;};
const account=(owner,actor)=>({...actor,id:owner,id_usuario:owner,tipo:actor?.tipo||'aluno'});
const snippet=value=>String(value||'').trim().slice(0,1200);
async function resolve(owner,ref,db=pool,actor) {
  if(!ref||!['caminho','diario','erro','nota','material'].includes(ref.type))fail('Escolha um registro original.');
  if(ref.type==='caminho') {
    const record=await require('./guidedStudyService').detail(owner,ref.record,db);
    if(!['evidencia','laboratorio','projeto'].includes(record.kind))fail('Escolha uma tentativa ou registro de investigação.');
    const step=(record.kind==='projeto'?record.entries:record.attempts).find(a=>a.id===ref.step);if(!step)fail('O registro de origem não está nesta conta.',404);
    return {type:ref.type,record:record.id,step:step.id,title:record.title,snippet:snippet(step.text),created:step.created,href:record.kind==='projeto'?`/projetos-investigacao?projeto=${record.id}`:record.kind==='laboratorio'?`/laboratorio?investigacao=${record.id}`:`/meu-entendimento?ciclo=${record.id}`};
  }
  const id=positive(ref.record);
  if(ref.type==='diario') {
    const [[row]]=await db.execute('SELECT p.id,p.id_diario,p.texto,p.criado_em,d.titulo,d.tipo FROM diario_passos p JOIN diario_aprendizagem d ON d.id=p.id_diario AND d.id_usuario=p.id_usuario WHERE p.id_usuario=? AND p.id=?',[owner,id]);
    if(!row)fail('O registro do diário não está disponível nesta conta.',404);
    return {type:ref.type,record:id,title:row.titulo,snippet:snippet(row.texto),created:row.criado_em,href:'/aprendizagem',state:{aba:'diario',registro:row.id_diario,tipo:row.tipo}};
  }
  if(ref.type==='erro') {
    const [[row]]=await db.execute('SELECT e.id_erro,e.reflexao,e.ultimo_erro_em,q.competencia,q.enunciado FROM caderno_erros e JOIN questoes_estudo q ON q.id_questao=e.id_questao WHERE e.id_usuario=? AND e.id_erro=?',[owner,id]);
    if(!row)fail('Esta questão não foi registrada na sua conta.',404);
    return {type:ref.type,record:id,title:row.competencia||'Questão do meu caderno',snippet:snippet(`${row.enunciado}\n${row.reflexao||''}`),created:row.ultimo_erro_em,href:'/aprendizagem',state:{aba:'erros',idErro:id}};
  }
  if(ref.type==='nota') {
    const [[row]]=await db.execute('SELECT a.texto,c.titulo FROM anotacoes_estudo a JOIN conteudos c ON c.id_conteudo=a.id_conteudo WHERE a.id_usuario=? AND a.id_conteudo=? AND CHAR_LENGTH(TRIM(a.texto))>0',[owner,id]);
    if(!row)fail('Anotação não encontrada nesta conta.',404);
    return {type:ref.type,record:id,title:row.titulo,snippet:snippet(row.texto),href:`/busca?q=${encodeURIComponent(row.titulo.slice(0,100))}&tipo=anotacoes`};
  }
  const content=await require('./unifiedSearchService').content(account(owner,actor),id,db);
  if(!content)fail('Material não disponível para esta conta.',404);
  return {type:ref.type,record:id,title:content.titulo,snippet:snippet(content.descricao||content.resumo||content.titulo),href:`/busca?q=${encodeURIComponent(content.titulo.slice(0,100))}&tipo=materiais`};
}
async function options(owner,type='caminho',query='',db=pool,actor) {
  if(typeof query!=='string'||query.length>100)fail('Busque por até 100 caracteres.');
  const pattern=`%${query.trim().replace(/[!%_]/g,c=>'!'+c)}%`;
  if(type==='caminho') {
    const [rows]=await db.execute("SELECT id,tipo,JSON_UNQUOTE(JSON_EXTRACT(dados,'$.title')) titulo,JSON_EXTRACT(dados,CASE WHEN tipo='projeto' THEN '$.entries' ELSE '$.attempts' END) passos FROM percursos_estudo WHERE id_usuario=? AND tipo IN ('evidencia','laboratorio','projeto') AND JSON_UNQUOTE(JSON_EXTRACT(dados,'$.title')) LIKE ? ESCAPE '!' ORDER BY atualizado_em DESC LIMIT 20",[owner,pattern]);
    return rows.flatMap(row=>(parse(row.passos)||[]).slice(-5).reverse().map((a,i)=>({type,record:row.id,step:a.id,title:`${row.titulo} · tentativa ${Math.max(1,(parse(row.passos)||[]).length-i)}`})));
  }
  let sql,params=[owner,pattern];
  if(type==='diario')sql="SELECT p.id AS record,d.titulo AS title FROM diario_passos p JOIN diario_aprendizagem d ON d.id=p.id_diario AND d.id_usuario=p.id_usuario WHERE p.id_usuario=? AND d.titulo LIKE ? ESCAPE '!' ORDER BY p.id DESC LIMIT 40";
  else if(type==='erro')sql="SELECT e.id_erro AS record,COALESCE(q.competencia,LEFT(q.enunciado,100)) AS title FROM caderno_erros e JOIN questoes_estudo q ON q.id_questao=e.id_questao WHERE e.id_usuario=? AND CONCAT_WS(' ',q.competencia,q.enunciado) LIKE ? ESCAPE '!' ORDER BY e.ultimo_erro_em DESC LIMIT 40";
  else if(type==='nota')sql="SELECT a.id_conteudo AS record,c.titulo AS title FROM anotacoes_estudo a JOIN conteudos c ON c.id_conteudo=a.id_conteudo WHERE a.id_usuario=? AND CHAR_LENGTH(TRIM(a.texto))>0 AND c.titulo LIKE ? ESCAPE '!' ORDER BY a.id_conteudo DESC LIMIT 40";
  else if(type==='material') {
    const scope=require('./unifiedSearchService').contentScope(account(owner,actor));
    sql=`SELECT c.id_conteudo AS record,c.titulo AS title FROM conteudos c WHERE (${scope.sql}) AND c.titulo LIKE ? ESCAPE '!' ORDER BY c.id_conteudo DESC LIMIT 40`;params=[...scope.params,pattern];
  } else fail('Tipo de registro inválido.');
  const [rows]=await db.execute(sql,params);return rows.map(r=>({...r,type}));
}
async function open(owner,ref,db=pool,actor) {
  const source=await resolve(owner,ref,db,actor);
  if(!['nota','material'].includes(source.type))return source;
  const content=await require('./unifiedSearchService').content(account(owner,actor),source.record,db,source.type==='nota');
  if(!content)fail('O original foi removido ou seu acesso mudou.',404);
  return {...source,href:'/estudar',state:{conteudo:content,ferramenta:source.type==='nota'?'notes':'guide'}};
}
module.exports={resolve,options,open};

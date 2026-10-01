const pool = require('../config/db');

async function salvarProjeto(idUsuario, dados) {
  const campos = ['tema','tese','argumento_um','argumento_dois','repertorio','intervencao','rascunho','etapa'];
  const etapa = ['TEMA','TESE','ARGUMENTOS','REPERTORIO','INTERVENCAO','RASCUNHO','REVISAO','CONCLUIDO'].includes(dados.etapa) ? dados.etapa : 'TEMA';
  if (!String(dados.tema || '').trim()) throw new Error('O tema é obrigatório.');
  if (dados.idProjeto) {
    await pool.execute(`UPDATE projetos_redacao SET tema=?, tese=?, argumento_um=?, argumento_dois=?, repertorio=?, intervencao=?, rascunho=?, etapa=? WHERE id_projeto=? AND id_usuario=?`,
      [dados.tema, dados.tese || null, dados.argumentoUm || null, dados.argumentoDois || null, dados.repertorio || null, dados.intervencao || null, dados.rascunho || null, etapa, dados.idProjeto, idUsuario]);
    return obterProjeto(idUsuario, dados.idProjeto);
  }
  const [result] = await pool.execute(`INSERT INTO projetos_redacao (id_usuario, tema, tese, argumento_um, argumento_dois, repertorio, intervencao, rascunho, etapa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [idUsuario, dados.tema, dados.tese || null, dados.argumentoUm || null, dados.argumentoDois || null, dados.repertorio || null, dados.intervencao || null, dados.rascunho || null, etapa]);
  return obterProjeto(idUsuario, result.insertId);
}
async function obterProjeto(idUsuario, idProjeto) { const [[row]] = await pool.execute('SELECT * FROM projetos_redacao WHERE id_projeto=? AND id_usuario=?', [idProjeto, idUsuario]); return row || null; }
async function listarProjetos(idUsuario) { const [rows] = await pool.execute('SELECT * FROM projetos_redacao WHERE id_usuario=? ORDER BY atualizado_em DESC', [idUsuario]); return rows; }

async function evolucaoEnem(idUsuario) {
  const [rows] = await pool.execute(`SELECT id_redacao, enviada_em, nota_estimada, competencias_enem FROM redacoes WHERE id_usuario=? AND competencias_enem IS NOT NULL ORDER BY enviada_em`, [idUsuario]);
  return rows.map((row) => { let competencias = row.competencias_enem; try { if (typeof competencias === 'string') competencias = JSON.parse(competencias); } catch { competencias = []; } return { idRedacao: row.id_redacao, data: row.enviada_em, nota: row.nota_estimada, competencias: Array.isArray(competencias) ? competencias.map((c, i) => ({ codigo: Number(c.codigo || i + 1), nota: Number(c.nota || 0) })) : [] }; });
}

async function alertasPedagogicos() {
  const [rows] = await pool.execute(`SELECT u.id_usuario, u.nome,
      COALESCE(ROUND(AVG(t.acertou)*100),0) AS taxa_acerto,
      COUNT(DISTINCT CASE WHEN ce.resolvido=0 THEN ce.id_erro END) AS erros,
      COUNT(DISTINCT CASE WHEN r.proxima_revisao<CURRENT_DATE THEN r.id_revisao END) AS revisoes,
      MAX(COALESCE(t.criado_em, s.concluida_em, u.ultimo_login)) AS ultima_atividade
    FROM usuarios u LEFT JOIN tentativas_questoes t ON t.id_usuario=u.id_usuario
    LEFT JOIN caderno_erros ce ON ce.id_usuario=u.id_usuario
    LEFT JOIN revisoes_estudo r ON r.id_usuario=u.id_usuario
    LEFT JOIN sessoes_estudo s ON s.id_usuario=u.id_usuario
    WHERE u.tipo='aluno' AND u.ativo=1 GROUP BY u.id_usuario`);
  return rows.map((r) => { const motivos=[]; if(Number(r.taxa_acerto)<50) motivos.push('taxa de acerto abaixo de 50%'); if(Number(r.erros)>=5) motivos.push(`${r.erros} erros pendentes`); if(Number(r.revisoes)>=5) motivos.push(`${r.revisoes} revisões atrasadas`); const dias = r.ultima_atividade ? Math.floor((Date.now()-new Date(r.ultima_atividade).getTime())/86400000) : 999; if(dias>=7) motivos.push(`${dias} dias sem prática`); return {...r, nivel: motivos.length>=3?'ALTO':motivos.length>=1?'ATENCAO':'ESTAVEL', motivos}; }).filter((r)=>r.motivos.length).sort((a,b)=>b.motivos.length-a.motivos.length);
}

async function criarIntervencao(criadoPor, dados) {
  if (!dados.idAluno || !dados.motivo || !dados.plano) throw new Error('Aluno, motivo e plano são obrigatórios.');
  const tipo = ['ORIENTACAO','PLANO_REVISAO','CONTATO','ATIVIDADE','ACOMPANHAMENTO'].includes(dados.tipo) ? dados.tipo : 'ORIENTACAO';
  const [result] = await pool.execute(`INSERT INTO intervencoes_pedagogicas (id_aluno, criado_por, tipo, motivo, plano, retorno_em) VALUES (?, ?, ?, ?, ?, ?)`, [dados.idAluno, criadoPor, tipo, dados.motivo, dados.plano, dados.retornoEm || null]);
  return { idIntervencao: result.insertId };
}
async function listarIntervencoes() { const [rows] = await pool.execute(`SELECT i.*, a.nome AS aluno_nome, g.nome AS gestor_nome FROM intervencoes_pedagogicas i JOIN usuarios a ON a.id_usuario=i.id_aluno JOIN usuarios g ON g.id_usuario=i.criado_por ORDER BY i.status, i.retorno_em`); return rows; }

async function sugerirGrupos() {
  const [rows] = await pool.execute(`SELECT c.disciplina, c.nome AS competencia, GROUP_CONCAT(CASE WHEN d.dominio<55 THEN u.id_usuario END) AS aprendizes, GROUP_CONCAT(CASE WHEN d.dominio>=80 THEN u.id_usuario END) AS mentores FROM dominio_competencias d JOIN competencias_estudo c ON c.id_competencia=d.id_competencia JOIN usuarios u ON u.id_usuario=d.id_usuario WHERE u.ativo=1 GROUP BY c.id_competencia HAVING aprendizes IS NOT NULL`);
  return rows.map((r)=>({...r, aprendizes:String(r.aprendizes||'').split(',').filter(Boolean).map(Number), mentores:String(r.mentores||'').split(',').filter(Boolean).map(Number)}));
}
async function criarGrupo(criadoPor, dados) {
  if (!dados.nome || !dados.disciplina || !Array.isArray(dados.aprendizes)) throw new Error('Dados do grupo inválidos.');
  const connection = await pool.getConnection(); try { await connection.beginTransaction(); const [result]=await connection.execute(`INSERT INTO grupos_dinamicos (nome, disciplina, competencia, objetivo, criado_por) VALUES (?, ?, ?, ?, ?)`,[dados.nome,dados.disciplina,dados.competencia||null,dados.objetivo||'Reforçar a competência em grupo',criadoPor]); for(const id of dados.aprendizes) await connection.execute(`INSERT IGNORE INTO grupos_dinamicos_membros VALUES (?, ?, 'APRENDIZ')`,[result.insertId,id]); for(const id of dados.mentores||[]) await connection.execute(`INSERT IGNORE INTO grupos_dinamicos_membros VALUES (?, ?, 'MENTOR_PAR')`,[result.insertId,id]); await connection.commit(); return {idGrupo:result.insertId}; } catch(e){await connection.rollback();throw e;} finally{connection.release();}
}

async function atribuirRevisaoPar(idRedacao, idRevisor) { const [[r]]=await pool.execute('SELECT id_usuario FROM redacoes WHERE id_redacao=?',[idRedacao]); if(!r||Number(r.id_usuario)===Number(idRevisor)) throw new Error('Revisão entre pares inválida.'); await pool.execute(`INSERT IGNORE INTO revisoes_pares (id_redacao,id_autor,id_revisor) VALUES (?,?,?)`,[idRedacao,r.id_usuario,idRevisor]); return {atribuida:true}; }
async function disponibilizarUltimaRedacao(idUsuario) { const [[r]]=await pool.execute('SELECT id_redacao FROM redacoes WHERE id_usuario=? ORDER BY enviada_em DESC LIMIT 1',[idUsuario]); if(!r) throw new Error('Envie uma redação antes de solicitar revisão.'); const [[revisor]]=await pool.execute(`SELECT u.id_usuario FROM usuarios u WHERE u.tipo='aluno' AND u.ativo=1 AND u.id_usuario<>? AND NOT EXISTS (SELECT 1 FROM revisoes_pares rp WHERE rp.id_redacao=? AND rp.id_revisor=u.id_usuario) ORDER BY RAND() LIMIT 1`,[idUsuario,r.id_redacao]); if(!revisor) throw new Error('Ainda não há outro aluno disponível para revisar.'); return atribuirRevisaoPar(r.id_redacao,revisor.id_usuario); }
async function listarRevisoesPar(idUsuario) { const [rows]=await pool.execute(`SELECT rp.id_revisao_par,rp.criterio_foco,r.tema,r.texto FROM revisoes_pares rp JOIN redacoes r ON r.id_redacao=rp.id_redacao WHERE rp.id_revisor=? AND rp.status='PENDENTE'`,[idUsuario]); return rows; }
async function responderRevisaoPar(idUsuario,id,{pontosFortes,sugestaoPrincipal,criterioFoco,rubrica}) { if(!pontosFortes||!sugestaoPrincipal) throw new Error('Preencha os dois campos formativos.'); const criterio=['TESE','ARGUMENTACAO','COESAO','INTERVENCAO','GERAL'].includes(criterioFoco)?criterioFoco:'GERAL';const notas={};for(const key of ['clareza','respeito','utilidade'])notas[key]=Math.max(1,Math.min(5,Number(rubrica?.[key])||3)); const [result]=await pool.execute(`UPDATE revisoes_pares SET pontos_fortes=?,sugestao_principal=?,criterio_foco=?,rubrica=?,status='CONCLUIDA',concluida_em=CURRENT_TIMESTAMP WHERE id_revisao_par=? AND id_revisor=? AND status='PENDENTE'`,[pontosFortes,sugestaoPrincipal,criterio,JSON.stringify(notas),id,idUsuario]); if(!result.affectedRows) throw new Error('Revisão não encontrada.'); return {concluida:true}; }
async function moderacao(){const[rows]=await pool.execute(`SELECT d.*,rp.pontos_fortes,rp.sugestao_principal,a.nome autor_nome,r.nome revisor_nome FROM denuncias_revisao d JOIN revisoes_pares rp ON rp.id_revisao_par=d.id_revisao_par JOIN usuarios a ON a.id_usuario=rp.id_autor JOIN usuarios r ON r.id_usuario=rp.id_revisor WHERE d.status='ABERTA' ORDER BY d.criada_em`);return rows}
async function denunciarRevisao(idUsuario,id,{motivo,detalhes}){const tipo=['OFENSIVO','INADEQUADO','SPAM','OUTRO'].includes(motivo)?motivo:'OUTRO';const[[r]]=await pool.execute('SELECT id_autor FROM revisoes_pares WHERE id_revisao_par=?',[id]);if(!r||Number(r.id_autor)!==Number(idUsuario))throw new Error('Revisão não encontrada.');await pool.execute("INSERT INTO denuncias_revisao(id_revisao_par,denunciado_por,motivo,detalhes) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE motivo=VALUES(motivo),detalhes=VALUES(detalhes),status='ABERTA'",[id,idUsuario,tipo,String(detalhes||'').slice(0,500)||null]);await pool.execute("UPDATE revisoes_pares SET moderacao='SINALIZADA' WHERE id_revisao_par=?",[id]);return{denunciada:true}}
async function moderar(idGestor,id,{decisao}){const status=decisao==='REMOVER'?'PROCEDENTE':'IMPROCEDENTE';await pool.execute('UPDATE denuncias_revisao SET status=?,analisada_por=? WHERE id_denuncia=?',[status,idGestor,id]);await pool.execute(`UPDATE revisoes_pares rp JOIN denuncias_revisao d ON d.id_revisao_par=rp.id_revisao_par SET rp.moderacao=? WHERE d.id_denuncia=?`,[decisao==='REMOVER'?'REMOVIDA':'APROVADA',id]);return{moderada:true}}

module.exports={salvarProjeto,listarProjetos,evolucaoEnem,alertasPedagogicos,criarIntervencao,listarIntervencoes,sugerirGrupos,criarGrupo,atribuirRevisaoPar,disponibilizarUltimaRedacao,listarRevisoesPar,responderRevisaoPar,denunciarRevisao,moderacao,moderar};

const pool=require('../config/db')

// Alphabet minus vowels and visually similar chars (0/O, 1/I/L). Um código de
// turma é ditado em voz alta e digitado à mão; trocar O por 0 gera mais erro do
// que a segurança perdida por alguns bits de entropia.
const ALFABETO_CONVITE='ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const TAMANHO_CONVITE=8
const VALIDADE_CONVITE_DIAS=7

function gerarCodigoConvite(){
  const bytes=require('crypto').randomBytes(TAMANHO_CONVITE)
  let codigo=''
  for(let i=0;i<TAMANHO_CONVITE;i++)codigo+=ALFABETO_CONVITE[bytes[i]%ALFABETO_CONVITE.length]
  return codigo
}

// Aceita o código com ou sem separador: o docente pode exibir "A3F9-K2M7" e o
// aluno digitar "a3f9k2m7". Comparar sempre normalizado evita a falha mais
// irritante possível aqui — o aluno está com o código certo e é recusado.
function normalizarCodigo(valor){return String(valor||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}

async function listar(id,tipo){let sql=`SELECT DISTINCT t.*,u.nome criador_nome,(SELECT COUNT(*) FROM turma_alunos a WHERE a.id_turma=t.id_turma AND a.ativo=1) total_alunos FROM turmas t JOIN usuarios u ON u.id_usuario=t.criado_por`;const params=[];if(tipo==='aluno'){sql+=` JOIN turma_alunos meu ON meu.id_turma=t.id_turma AND meu.id_aluno=? AND meu.ativo=1`;params.push(id)}else if(tipo==='docente'){sql+=` JOIN turma_docentes meu ON meu.id_turma=t.id_turma AND meu.id_docente=?`;params.push(id)}sql+=' WHERE t.ativa=1 ORDER BY t.ano_letivo DESC,t.nome';const[rows]=await pool.execute(sql,params);for(const turma of rows){const[disciplinas]=await pool.execute('SELECT disciplina,id_docente FROM turma_disciplinas WHERE id_turma=? ORDER BY disciplina',[turma.id_turma]);turma.disciplinas=disciplinas}return rows}
async function criar(id,dados){const nome=String(dados.nome||'').trim();if(!nome)throw new Error('Nome da turma é obrigatório.');const codigo=String(dados.codigo||`${nome.slice(0,4)}-${Date.now().toString(36)}`).toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,24);const ano=Math.max(2020,Math.min(2100,Number(dados.anoLetivo)||new Date().getFullYear()));const conn=await pool.getConnection();try{await conn.beginTransaction();const[result]=await conn.execute('INSERT INTO turmas(nome,codigo,ano_letivo,descricao,criado_por) VALUES(?,?,?,?,?)',[nome,codigo,ano,dados.descricao||null,id]);await conn.execute("INSERT INTO turma_docentes VALUES(?,?,'RESPONSAVEL')",[result.insertId,id]);for(const d of [...new Set((dados.disciplinas||[]).map(String).filter(Boolean))])await conn.execute('INSERT INTO turma_disciplinas(id_turma,disciplina,id_docente) VALUES(?,?,?)',[result.insertId,d,id]);await conn.commit();return{idTurma:result.insertId,codigo}}catch(e){await conn.rollback();throw e}finally{conn.release()}}
async function podeGerir(id,tipo,idTurma){if(['dono','admin','adm'].includes(tipo))return true;const[[row]]=await pool.execute('SELECT 1 ok FROM turma_docentes WHERE id_turma=? AND id_docente=?',[idTurma,id]);return Boolean(row)}
async function detalhes(id,tipo,idTurma){const turmas=await listar(id,tipo);const turma=turmas.find(t=>Number(t.id_turma)===Number(idTurma));if(!turma)return null;const[alunos]=await pool.execute(`SELECT u.id_usuario,u.nome,u.email,a.matriculado_em FROM turma_alunos a JOIN usuarios u ON u.id_usuario=a.id_aluno WHERE a.id_turma=? AND a.ativo=1 ORDER BY u.nome`,[idTurma]);const[docentes]=await pool.execute(`SELECT u.id_usuario,u.nome,u.email,d.papel FROM turma_docentes d JOIN usuarios u ON u.id_usuario=d.id_docente WHERE d.id_turma=? ORDER BY u.nome`,[idTurma]);return{...turma,alunos,docentes}}
async function adicionar(idGestor,tipo,idTurma,{idUsuario,papel}){if(!await podeGerir(idGestor,tipo,idTurma))throw new Error('Você não gerencia esta turma.');const[[u]]=await pool.execute('SELECT id_usuario,tipo FROM usuarios WHERE id_usuario=? AND ativo=1',[idUsuario]);if(!u)throw new Error('Usuário não encontrado.');if(papel==='DOCENTE'&&['docente','admin','adm','dono'].includes(u.tipo))await pool.execute("INSERT INTO turma_docentes(id_turma,id_docente,papel) VALUES(?,?,'DOCENTE') ON DUPLICATE KEY UPDATE papel=VALUES(papel)",[idTurma,idUsuario]);else if(papel==='ALUNO'&&u.tipo==='aluno')await pool.execute('INSERT INTO turma_alunos(id_turma,id_aluno) VALUES(?,?) ON DUPLICATE KEY UPDATE ativo=1',[idTurma,idUsuario]);else throw new Error('Perfil incompatível com o vínculo.');return detalhes(idGestor,tipo,idTurma)}
// Entrada por código. O `INSERT ... ON DUPLICATE KEY` reativa quem tinha saído
// em vez de falhar: o mesmo código precisa devolver sempre a mesma turma, mesmo
// para quem saiu semana passada.
async function entrarPorCodigo(id,tipo,codigoInformado){
  if(!['aluno','docente'].includes(tipo))throw new Error('Apenas alunos e docentes participam de turmas.')
  const codigo=normalizarCodigo(codigoInformado)
  if(codigo.length<4)throw new Error('Código de turma incompleto.')
  const[[turma]]=await pool.execute('SELECT id_turma,nome,ativa FROM turmas WHERE codigo=?',[codigo])
  if(!turma)throw new Error('Não encontramos nenhuma turma com esse código.')
  if(!turma.ativa)throw new Error('Essa turma não está mais ativa.')
  if(tipo==='docente')await pool.execute(`INSERT INTO turma_docentes(id_turma,id_docente,papel) VALUES(?,?,'DOCENTE') ON DUPLICATE KEY UPDATE papel='DOCENTE'`,[turma.id_turma,id])
  else await pool.execute('INSERT INTO turma_alunos(id_turma,id_aluno) VALUES(?,?) ON DUPLICATE KEY UPDATE ativo=1',[turma.id_turma,id])
  return detalheDoAluno(id,turma.id_turma)
}

async function candidatos(){const[rows]=await pool.execute("SELECT id_usuario,nome,email,tipo FROM usuarios WHERE ativo=1 AND tipo IN('aluno','docente') ORDER BY tipo,nome");return rows}

async function sair(id,tipo,idTurma){
  if(tipo==='docente'){
    // O responsável não pode remover a si mesmo e deixar a turma órfã; antes
    // precisa passar o papel para outro docente.
    const[[alvo]]=await pool.execute('SELECT papel FROM turma_docentes WHERE id_turma=? AND id_docente=?',[idTurma,id])
    if(!alvo)throw new Error('Você não participa desta turma.')
    if(alvo.papel==='RESPONSAVEL')throw new Error('Transfira a responsabilidade antes de sair.')
    await pool.execute('DELETE FROM turma_docentes WHERE id_turma=? AND id_docente=?',[idTurma,id])
    return
  }
  const[resultado]=await pool.execute('UPDATE turma_alunos SET ativo=0 WHERE id_turma=? AND id_aluno=?',[idTurma,id])
  if(!resultado.affectedRows)throw new Error('Você não participa desta turma.')
}

// Convite: código de uso único com validade. Serve ao docente que prefere não
// repassar o código fixo da turma — assim o convite expira e o acesso acaba.
async function criarConvite(idGestor,tipo,idTurma){
  if(!await podeGerir(idGestor,tipo,idTurma))throw new Error('Você não gerencia esta turma.')
  const expiraEm=new Date(Date.now()+VALIDADE_CONVITE_DIAS*864e5)
  for(let tentativa=0;tentativa<5;tentativa++){
    const codigo=gerarCodigoConvite()
    try{
      const[resultado]=await pool.execute('INSERT INTO turma_convites(id_turma,codigo,criado_por,expira_em) VALUES(?,?,?,?)',[idTurma,codigo,idGestor,expiraEm])
      return{idConvite:resultado.insertId,codigo,expiraEm}
    }catch(e){if(e.code!=='ER_DUP_ENTRY')throw e}
  }
  throw new Error('Não foi possível gerar o convite. Tente novamente.')
}

async function listarConvites(idGestor,tipo,idTurma){
  if(!await podeGerir(idGestor,tipo,idTurma))throw new Error('Você não gerencia esta turma.')
  const[rows]=await pool.execute('SELECT id_convite,codigo,expira_em,usado_em,criado_em FROM turma_convites WHERE id_turma=? AND cancelado_em IS NULL ORDER BY criado_em DESC',[idTurma])
  const agora=Date.now()
  return rows.map(c=>({...c,estado:c.usado_em?'USADO':new Date(c.expira_em).getTime()<agora?'EXPIRADO':'ATIVO'}))
}

async function cancelarConvite(idGestor,tipo,idTurma,idConvite){
  if(!await podeGerir(idGestor,tipo,idTurma))throw new Error('Você não gerencia esta turma.')
  await pool.execute('UPDATE turma_convites SET cancelado_em=CURRENT_TIMESTAMP WHERE id_convite=? AND id_turma=? AND usado_em IS NULL',[idConvite,idTurma])
}

async function usarConvite(id,tipo,codigoInformado){
  const codigo=normalizarCodigo(codigoInformado)
  if(codigo.length!==TAMANHO_CONVITE)throw new Error('Código de convite incompleto.')
  const[[convite]]=await pool.execute('SELECT * FROM turma_convites WHERE codigo=?',[codigo])
  if(!convite)throw new Error('Convite não encontrado. Confira o código.')
  if(convite.cancelado_em)throw new Error('Este convite foi cancelado.')
  if(convite.usado_em)throw new Error('Este convite já foi usado.')
  if(new Date(convite.expira_em).getTime()<Date.now())throw new Error('Este convite expirou. Peça um novo ao professor.')
  await entrarPorCodigo(id,tipo,codigo)
  // Marcar o uso só depois da entrada: se o vínculo falhar no meio, o convite
  // continua válido e o aluno não perde o acesso por causa de uma falha parcial.
  await pool.execute('UPDATE turma_convites SET usado_em=CURRENT_TIMESTAMP,usado_por=? WHERE id_convite=?',[id,convite.id_convite])
}

// Lista do aluno no formato Classroom: as turmas em que ele entrou, com o
// docente responsável e a contagem do que ainda está pendente.
async function minhasTurmas(id){
  const[rows]=await pool.execute(
    `SELECT t.id_turma,t.nome,t.codigo,t.ano_letivo,t.descricao,
       (SELECT GROUP_CONCAT(u.nome ORDER BY u.nome SEPARATOR ', ') FROM turma_docentes d JOIN usuarios u ON u.id_usuario=d.id_docente WHERE d.id_turma=t.id_turma) AS docentes,
       (SELECT u.nome FROM turma_docentes d JOIN usuarios u ON u.id_usuario=d.id_docente WHERE d.id_turma=t.id_turma AND d.papel='RESPONSAVEL' LIMIT 1) AS responsavel,
       (SELECT COUNT(*) FROM atividades at WHERE at.id_turma=t.id_turma AND at.status='PUBLICADA' AND (at.publicar_em IS NULL OR at.publicar_em<=CURRENT_TIMESTAMP)) AS total_atividades,
       (SELECT COUNT(*) FROM respostas_usuario r JOIN atividades at ON at.id_atividade=r.id_atividade WHERE r.id_usuario=? AND r.status IN('ENTREGUE','CORRIGIDA') AND at.id_turma=t.id_turma AND at.status='PUBLICADA') AS feitas,
       (SELECT COUNT(*) FROM avisos av WHERE av.id_turma=t.id_turma) AS total_avisos
     FROM turma_alunos a JOIN turmas t ON t.id_turma=a.id_turma
     WHERE a.id_aluno=? AND a.ativo=1 AND t.ativa=1
     ORDER BY t.nome`,[id,id])
  return rows.map(t=>({...t,pendentes:Math.max(0,t.total_atividades-t.feitas)}))
}

// Detalhe visto pelo aluno: turma, docentes e as atividades já divididas em
// "para fazer" e "já feitas". Dividir no banco evita montar isso em JSX e
// mantém as duas listas coerentes com o estado real das entregas.
async function detalheDoAluno(id,idTurma){
  const[[turma]]=await pool.execute(
    `SELECT t.id_turma,t.nome,t.codigo,t.ano_letivo,t.descricao,
       (SELECT GROUP_CONCAT(u.nome ORDER BY u.nome SEPARATOR ', ') FROM turma_docentes d JOIN usuarios u ON u.id_usuario=d.id_docente WHERE d.id_turma=t.id_turma) AS docentes,
       (SELECT u.nome FROM turma_docentes d JOIN usuarios u ON u.id_usuario=d.id_docente WHERE d.id_turma=t.id_turma AND d.papel='RESPONSAVEL' LIMIT 1) AS responsavel
     FROM turmas t JOIN turma_alunos m ON m.id_turma=t.id_turma AND m.id_aluno=? AND m.ativo=1
     WHERE t.id_turma=?`,[id,idTurma])
  if(!turma)return null
  const[disciplinas]=await pool.execute('SELECT disciplina FROM turma_disciplinas WHERE id_turma=? ORDER BY disciplina',[idTurma])
  const[atividades]=await pool.execute(
    `SELECT at.id_atividade,at.titulo,at.descricao,at.prazo,at.anexos,at.questoes,at.destinatarios,at.atribuicao,at.rubrica,at.permite_reenvio,
       r.status AS meu_status,r.nota AS minha_nota,r.feedback AS meu_feedback,r.respondido_em
     FROM atividades at
     LEFT JOIN respostas_usuario r ON r.id_atividade=at.id_atividade AND r.id_usuario=?
     WHERE at.id_turma=? AND at.status='PUBLICADA' AND (at.publicar_em IS NULL OR at.publicar_em<=CURRENT_TIMESTAMP)
     ORDER BY at.prazo IS NULL,at.prazo ASC,at.id_atividade DESC`,[id,idTurma])
  const[avisos]=await pool.execute(
    `SELECT av.id_aviso,av.titulo,av.mensagem,av.criado_em,u.nome AS criador_nome FROM avisos av LEFT JOIN usuarios u ON u.id_usuario=av.criado_por WHERE av.id_turma=? ORDER BY av.criado_em DESC`,[idTurma])
  const concluidas=['ENTREGUE','CORRIGIDA']
  return{
    ...turma,
    disciplinas:disciplinas.map(d=>d.disciplina),
    avisos,
    pendentes:atividades.filter(a=>!concluidas.includes(a.meu_status)),
    concluidas:atividades.filter(a=>concluidas.includes(a.meu_status))
  }
}

module.exports={listar,criar,detalhes,adicionar,candidatos,entrarPorCodigo,sair,criarConvite,listarConvites,cancelarConvite,usarConvite,minhasTurmas,detalheDoAluno}


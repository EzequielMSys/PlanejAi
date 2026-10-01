const pool = require('../config/db');

async function obterEstatisticas() {
  const [
    [usuarios],
    [atividades],
    [entregas],
    [usuariosRecentes],
    [cronogramasAtivos]
  ] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM usuarios WHERE ativo = 1`),
    pool.execute(`SELECT COUNT(*) AS total FROM atividades WHERE status = 'PUBLICADA'`),
    pool.execute(`SELECT COUNT(*) AS total FROM respostas_usuario WHERE status IN ('ENTREGUE','CORRIGIDA')`),
    pool.execute(`SELECT id_usuario, nome, email, tipo, ultimo_login, data_cadastro FROM usuarios WHERE ativo = 1 ORDER BY data_cadastro DESC LIMIT 10`),
    pool.execute(`SELECT COUNT(*) AS total FROM cronogramas WHERE status = 'ATIVO'`)
  ]);

  const [porTipo] = await pool.execute(`SELECT tipo, COUNT(*) AS total FROM usuarios GROUP BY tipo`);

  const [atividadesPorStatus] = await pool.execute(`SELECT status, COUNT(*) AS total FROM atividades GROUP BY status`);

  return {
    totalUsuarios: usuarios[0]?.total || 0,
    totalAtividadesPublicadas: atividades[0]?.total || 0,
    totalEntregas: entregas[0]?.total || 0,
    totalCronogramasAtivos: cronogramasAtivos[0]?.total || 0,
    porTipo: porTipo || [],
    atividadesPorStatus: atividadesPorStatus || [],
    usuariosRecentes: usuariosRecentes || []
  };
}

async function obterEntregasPendentes() {
  const [rows] = await pool.execute(`SELECT r.id_resposta, r.respondido_em, r.nota, r.status, u.nome AS aluno_nome, u.email AS aluno_email, a.titulo AS atividade_titulo FROM respostas_usuario r JOIN usuarios u ON u.id_usuario = r.id_usuario JOIN atividades a ON a.id_atividade = r.id_atividade WHERE r.status = 'ENTREGUE' ORDER BY r.respondido_em DESC`);
  return rows;
}

async function obterDesempenhoUsuarios() {
  const [rows] = await pool.execute(`SELECT u.id_usuario, u.nome, u.email, u.tipo, COUNT(r.id_resposta) AS total_respostas, AVG(r.nota) AS media_nota, MAX(r.respondido_em) AS ultima_atividade FROM usuarios u LEFT JOIN respostas_usuario r ON r.id_usuario = u.id_usuario GROUP BY u.id_usuario ORDER BY media_nota DESC, total_respostas DESC`);
  return rows;
}

async function obterAprendizagemUsuarios() {
  const [rows] = await pool.execute(
    `SELECT u.id_usuario, u.nome, u.email,
      COUNT(DISTINCT t.id_tentativa) AS tentativas,
      COALESCE(ROUND(AVG(t.acertou) * 100), 0) AS taxa_acerto,
      COUNT(DISTINCT CASE WHEN e.resolvido = 0 THEN e.id_erro END) AS erros_pendentes,
      COUNT(DISTINCT CASE WHEN r.proxima_revisao <= CURRENT_DATE THEN r.id_revisao END) AS revisoes_atrasadas,
      MAX(t.criado_em) AS ultima_pratica
     FROM usuarios u
     LEFT JOIN tentativas_questoes t ON t.id_usuario = u.id_usuario
     LEFT JOIN caderno_erros e ON e.id_usuario = u.id_usuario
     LEFT JOIN revisoes_estudo r ON r.id_usuario = u.id_usuario
     LEFT JOIN privacidade_aprendizagem pa ON pa.id_usuario = u.id_usuario
     WHERE u.tipo = 'aluno' AND u.ativo = 1 AND COALESCE(pa.visibilidade, 'RESUMO') <> 'PRIVADO'
     GROUP BY u.id_usuario ORDER BY revisoes_atrasadas DESC, taxa_acerto ASC`
  );
  return rows;
}

module.exports = {
  obterEstatisticas,
  obterEntregasPendentes,
  obterDesempenhoUsuarios,
  obterAprendizagemUsuarios
};

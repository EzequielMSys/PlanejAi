const pool = require('../config/db');
const config = require('../config/iaConfig');

async function operationalSummary() {
  const [failures] = await pool.execute(`SELECT metodo, SUBSTRING_INDEX(rota, '?', 1) AS rota, status_http, COUNT(*) AS total, MAX(criado_em) AS ultima_ocorrencia FROM auditoria_api WHERE criado_em >= NOW() - INTERVAL 1 DAY AND status_http >= 500 GROUP BY metodo, SUBSTRING_INDEX(rota, '?', 1), status_http ORDER BY total DESC LIMIT 20`);
  const [[usage]] = await pool.execute("SELECT COUNT(*) AS mensagens, COUNT(DISTINCT id_usuario) AS estudantes FROM mensagens_chat_ia WHERE role = 'user' AND criado_em >= CURDATE()");
  const [[support]] = await pool.execute("SELECT COUNT(*) AS abertos FROM suporte_solicitacoes WHERE status <> 'RESOLVIDO'");
  const [flows] = await pool.execute(`SELECT CASE
    WHEN rota = '/api/auth/register' THEN 'CADASTRO'
    WHEN rota = '/api/auth/login' THEN 'LOGIN'
    WHEN rota LIKE '/api/cronograma%' OR rota LIKE '/api/perfil%' THEN 'PLANEJAMENTO'
    WHEN rota = '/api/inteligencia/chat' THEN 'LUMI'
    WHEN rota LIKE '/api/redacao%' OR rota LIKE '/api/aprendizagem/conteudos/%/anotacao' THEN 'TEXTOS'
    ELSE 'OUTROS' END AS fluxo,
    COUNT(*) AS tentativas, SUM(status_http >= 200 AND status_http < 400) AS confirmadas,
    SUM(status_http >= 500) AS falhas_servidor, SUM(status_http = 429) AS limites,
    SUM(status_http >= 400 AND status_http < 500 AND status_http <> 429) AS recusadas
    FROM auditoria_api WHERE criado_em >= NOW() - INTERVAL 1 DAY AND metodo IN ('POST','PUT','PATCH','DELETE')
    GROUP BY fluxo`);
  const [recentFailures] = await pool.execute("SELECT metodo, rota, status_http, request_id, criado_em FROM auditoria_api WHERE criado_em >= NOW() - INTERVAL 1 DAY AND status_http >= 500 ORDER BY id_auditoria DESC LIMIT 10");
  return { failures, flows, recentFailures, support, ia: { configured: Boolean(process.env.OPENAI_API_KEY?.trim()), model: config.model, daily_limit: config.dailyLimit, ...usage }, window: '24 horas; escritas e falhas de leitura do servidor', timezone: 'Relógio do banco de dados' };
}
module.exports = { operationalSummary };

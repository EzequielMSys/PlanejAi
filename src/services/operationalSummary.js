const pool = require('../config/db');
const config = require('../config/iaConfig');

async function operationalSummary() {
  const [failures] = await pool.execute(`SELECT metodo, SUBSTRING_INDEX(rota, '?', 1) AS rota, status_http, COUNT(*) AS total, MAX(criado_em) AS ultima_ocorrencia FROM auditoria_api WHERE criado_em >= NOW() - INTERVAL 1 DAY AND status_http >= 500 GROUP BY metodo, SUBSTRING_INDEX(rota, '?', 1), status_http ORDER BY total DESC LIMIT 20`);
  const [[usage]] = await pool.execute("SELECT COUNT(*) AS mensagens, COUNT(DISTINCT id_usuario) AS estudantes FROM mensagens_chat_ia WHERE role = 'user' AND criado_em >= CURDATE()");
  const [[support]] = await pool.execute("SELECT COUNT(*) AS abertos FROM suporte_solicitacoes WHERE status <> 'RESOLVIDO'");
  return { failures, support, ia: { configured: Boolean(process.env.OPENAI_API_KEY?.trim()), model: config.model, daily_limit: config.dailyLimit, ...usage }, window: '24 horas; falhas em operações de escrita', timezone: 'Relógio do banco de dados' };
}
module.exports = { operationalSummary };

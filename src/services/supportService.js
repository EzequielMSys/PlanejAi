const pool = require('../config/db');
const rateLimitStore = require('./rateLimitStore');

function validateRequest(body) {
  const category = body?.categoria;
  const message = typeof body?.mensagem === 'string' ? body.mensagem.trim() : '';
  if (!['PROBLEMA', 'DUVIDA', 'EXCLUSAO'].includes(category) || message.length < 10 || message.length > 2000) {
    const error = new Error('Escolha o assunto e escreva entre 10 e 2000 caracteres.');
    error.status = 400; throw error;
  }
  if (category === 'EXCLUSAO' && body.confirmacao !== 'SOLICITAR EXCLUSAO') {
    const error = new Error('Confirme o pedido de exclusão.'); error.status = 400; throw error;
  }
  return { category, message };
}

async function create(userId, body) {
  const { category, message } = validateRequest(body);
  const attempts = await rateLimitStore.consume('SUPPORT_REQUEST', String(userId), 24 * 60 * 60 * 1000);
  if (attempts > 5) { const error = new Error('Limite de 5 pedidos por dia atingido. Acompanhe seus pedidos já enviados.'); error.status = 429; throw error; }
  const [result] = await pool.execute('INSERT INTO suporte_solicitacoes (id_usuario, categoria, mensagem) VALUES (?, ?, ?)', [userId, category, message]);
  return { id: result.insertId };
}

async function list(userId, owner = false) {
  const [rows] = await pool.execute(`SELECT s.id, s.categoria, s.mensagem, s.status, s.resposta, s.criado_em, s.atualizado_em${owner ? ', u.nome, u.email' : ''} FROM suporte_solicitacoes s ${owner ? 'JOIN usuarios u ON u.id_usuario = s.id_usuario' : 'WHERE s.id_usuario = ?'} ORDER BY s.id DESC LIMIT 100`, owner ? [] : [userId]);
  return rows;
}

async function reply(id, body) {
  const response = typeof body?.resposta === 'string' ? body.resposta.trim() : '';
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0 || !['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO'].includes(body?.status) || response.length < 10 || response.length > 2000) {
    const error = new Error('Informe um estado e uma resposta entre 10 e 2000 caracteres.'); error.status = 400; throw error;
  }
  const [result] = await pool.execute('UPDATE suporte_solicitacoes SET status = ?, resposta = ? WHERE id = ?', [body.status, response, id]);
  if (!result.affectedRows) { const error = new Error('Pedido não encontrado.'); error.status = 404; throw error; }
}

module.exports = { validateRequest, create, list, reply };

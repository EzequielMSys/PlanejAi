const conteudoModel = require('../models/conteudoModel');

function normalizarMateriais(materiais) {
  if (!Array.isArray(materiais)) return [];
  return materiais.filter((item) => item && typeof item.url === 'string' && /^https?:\/\//i.test(item.url)).map((item) => ({ titulo: String(item.titulo || 'Material complementar').slice(0, 180), tipo: ['VIDEO', 'PDF', 'IMAGEM', 'LINK'].includes(item.tipo) ? item.tipo : 'LINK', url: item.url }));
}
async function listar(req, res) { try { return res.json(await conteudoModel.listarTodos()); } catch { return res.status(500).json({ message: 'Erro ao listar materiais.' }); } }
async function atualizar(req, res) {
  try {
    const atual = await conteudoModel.obterConteudoPorId(req.params.idConteudo);
    if (!atual) return res.status(404).json({ message: 'Conteúdo não encontrado.' });
    const dados = { ...atual, ...req.body, materiais: normalizarMateriais(req.body.materiais), atualizado_por: req.usuario.id_usuario || req.usuario.id };
    return res.json({ conteudo: await conteudoModel.atualizarConteudo(req.params.idConteudo, dados) });
  } catch (error) { return res.status(400).json({ message: error.message || 'Não foi possível atualizar o conteúdo.' }); }
}
module.exports = { listar, atualizar };

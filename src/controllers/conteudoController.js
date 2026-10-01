const conteudoModel = require('../models/conteudoModel');
const { validateDirectResource } = require('../utils/contentLinkPolicy');

function normalizarMateriais(materiais) {
  if (!Array.isArray(materiais)) return [];
  return materiais.filter((item) => item && item.url).map((item) => {
    const tipo = ['VIDEO', 'PDF', 'IMAGEM', 'LINK'].includes(item.tipo) ? item.tipo : 'LINK';
    return { titulo: String(item.titulo || 'Material complementar').slice(0, 180), tipo, url: validateDirectResource(item.url, tipo) };
  });
}
async function listar(req, res) { try { return res.json(await conteudoModel.listarTodos()); } catch { return res.status(500).json({ message: 'Erro ao listar materiais.' }); } }
async function atualizar(req, res) {
  try {
    const atual = await conteudoModel.obterConteudoPorId(req.params.idConteudo);
    if (!atual) return res.status(404).json({ message: 'Conteúdo não encontrado.' });
    const tipo = req.body.tipo || atual.tipo;
    const link = req.body.link === undefined ? atual.link : validateDirectResource(req.body.link, tipo);
    const dados = { ...atual, ...req.body, tipo, link, materiais: normalizarMateriais(req.body.materiais), atualizado_por: req.usuario.id_usuario || req.usuario.id };
    return res.json({ conteudo: await conteudoModel.atualizarConteudo(req.params.idConteudo, dados) });
  } catch (error) { return res.status(400).json({ message: error.message || 'Não foi possível atualizar o conteúdo.' }); }
}
module.exports = { listar, atualizar };

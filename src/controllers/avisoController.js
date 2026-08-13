const avisoModel = require('../models/avisoModel');
const { isGestorPedagogico } = require('../middlewares/authMiddleware');

async function listar(req, res) {
  try {
    const avisos = await avisoModel.listarAvisos();
    return res.json(avisos);
  } catch (error) {
    console.error('[AVISOS]', error);
    return res.status(500).json({ message: 'Erro ao listar avisos.' });
  }
}

async function criar(req, res) {
  try {
    const { titulo, mensagem, destinatarios } = req.body;
    if (!titulo?.trim() || !mensagem?.trim()) {
      return res.status(400).json({ message: 'Título e mensagem são obrigatórios.' });
    }
    const aviso = await avisoModel.criarAviso({
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      criadoPor: req.usuario.id_usuario || req.usuario.id,
      destinatarios: destinatarios || 'todos'
    });
    return res.status(201).json({ aviso });
  } catch (error) {
    console.error('[AVISOS]', error);
    return res.status(500).json({ message: 'Erro ao criar aviso.' });
  }
}

async function deletar(req, res) {
  try {
    await avisoModel.deletarAviso(req.params.idAviso);
    return res.status(204).send();
  } catch (error) {
    console.error('[AVISOS]', error);
    return res.status(500).json({ message: 'Erro ao remover aviso.' });
  }
}

module.exports = { listar, criar, deletar };
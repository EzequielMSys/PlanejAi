const avisoModel = require('../models/avisoModel');
const { isGestorPedagogico } = require('../middlewares/authMiddleware');

async function listar(req, res) {
  try {
    const avisos = await avisoModel.listarAvisos(req.usuario.tipo);
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
    if (!['todos', 'alunos', 'docentes'].includes(destinatarios || 'todos')) {
      return res.status(400).json({ message: 'Grupo de destinatários inválido.' });
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
    const aviso = await avisoModel.obterPorId(req.params.idAviso);
    if (!aviso) return res.status(404).json({ message: 'Aviso não encontrado.' });
    const idUsuario = req.usuario.id_usuario || req.usuario.id;
    if (req.usuario.tipo === 'docente' && Number(aviso.criado_por) !== Number(idUsuario)) {
      return res.status(403).json({ message: 'Você só pode remover avisos criados por você.' });
    }
    await avisoModel.deletarAviso(req.params.idAviso);
    return res.status(204).send();
  } catch (error) {
    console.error('[AVISOS]', error);
    return res.status(500).json({ message: 'Erro ao remover aviso.' });
  }
}

module.exports = { listar, criar, deletar };

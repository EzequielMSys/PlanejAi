const dashboardModel = require('../models/dashboardModel');
const { isGestorPedagogico } = require('../middlewares/authMiddleware');

async function estatisticas(req, res) {
  try {
    const dados = await dashboardModel.obterEstatisticas();
    return res.json(dados);
  } catch (error) {
    console.error('[DASHBOARD]', error);
    return res.status(500).json({ message: 'Erro ao carregar estatísticas.' });
  }
}

async function entregasPendentes(req, res) {
  try {
    const dados = await dashboardModel.obterEntregasPendentes();
    return res.json(dados);
  } catch (error) {
    console.error('[DASHBOARD]', error);
    return res.status(500).json({ message: 'Erro ao carregar entregas pendentes.' });
  }
}

async function desempenhoUsuarios(req, res) {
  try {
    const dados = await dashboardModel.obterDesempenhoUsuarios();
    return res.json(dados);
  } catch (error) {
    console.error('[DASHBOARD]', error);
    return res.status(500).json({ message: 'Erro ao carregar desempenho.' });
  }
}

module.exports = { estatisticas, entregasPendentes, desempenhoUsuarios };
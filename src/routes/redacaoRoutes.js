const express = require('express');
const router = express.Router();
const redacaoController = require('../controllers/redacaoController');
const { authMiddleware, isGestorPedagogico } = require('../middlewares/authMiddleware');

// Enviar redação (qualquer usuário autenticado)
router.post('/', authMiddleware, redacaoController.enviarRedacao);

// Listar redações do próprio usuário
router.get('/', authMiddleware, redacaoController.listarRedacoes);

// Listar todas as redações (admin/dono)
router.get('/todas', authMiddleware, isGestorPedagogico, redacaoController.listarTodasRedacoes);

// Sugerir tema e repertórios de redação
router.post('/sugerir-tema', authMiddleware, redacaoController.sugerirTema);

// Obter redação específica
router.get('/:idRedacao', authMiddleware, redacaoController.obterRedacao);

// Avaliar redação (admin/dono)
router.patch('/:idRedacao/avaliar', authMiddleware, isGestorPedagogico, redacaoController.avaliarRedacao);

module.exports = router;

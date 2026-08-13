const express = require('express');
const router = express.Router();
const redacaoController = require('../controllers/redacaoController');
const { authMiddleware, isGestorPedagogico, isAdminOrDono } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, redacaoController.enviarRedacao);
router.get('/', authMiddleware, redacaoController.listarRedacoes);
router.get('/todas', authMiddleware, isGestorPedagogico, redacaoController.listarTodasRedacoes);
router.post('/sugerir-tema', authMiddleware, redacaoController.sugerirTema);
router.get('/:idRedacao', authMiddleware, redacaoController.obterRedacao);
router.patch('/:idRedacao/avaliar', authMiddleware, isGestorPedagogico, redacaoController.avaliarRedacao);

module.exports = router;

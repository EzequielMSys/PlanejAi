const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, isGestorPedagogico } = require('../middlewares/authMiddleware');

router.get('/estatisticas', authMiddleware, isGestorPedagogico, dashboardController.estatisticas);
router.get('/entregas-pendentes', authMiddleware, isGestorPedagogico, dashboardController.entregasPendentes);
router.get('/desempenho', authMiddleware, isGestorPedagogico, dashboardController.desempenhoUsuarios);
router.get('/aprendizagem', authMiddleware, isGestorPedagogico, dashboardController.aprendizagemUsuarios);

module.exports = router;
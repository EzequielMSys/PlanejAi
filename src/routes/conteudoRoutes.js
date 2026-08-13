const router = require('express').Router();
const controller = require('../controllers/conteudoController');
const { authMiddleware, isGestorPedagogico } = require('../middlewares/authMiddleware');
router.get('/', authMiddleware, isGestorPedagogico, controller.listar);
router.put('/:idConteudo', authMiddleware, isGestorPedagogico, controller.atualizar);
module.exports = router;

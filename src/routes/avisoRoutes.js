const router = require('express').Router();
const avisoController = require('../controllers/avisoController');
const { authMiddleware, isGestorPedagogico } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, avisoController.listar);
router.post('/', authMiddleware, isGestorPedagogico, avisoController.criar);
router.delete('/:idAviso', authMiddleware, isGestorPedagogico, avisoController.deletar);

module.exports = router;
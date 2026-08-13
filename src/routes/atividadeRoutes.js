const router = require('express').Router();
const atividadeController = require('../controllers/atividadeController');
const { authMiddleware, isGestorPedagogico } = require('../middlewares/authMiddleware');
const { uploadAtividade } = require('../middlewares/uploadMiddleware');

router.get('/', authMiddleware, atividadeController.listar);
router.get('/alunos', authMiddleware, isGestorPedagogico, atividadeController.listarAlunos);
router.post('/', authMiddleware, isGestorPedagogico, atividadeController.criar);
router.get('/:idAtividade', authMiddleware, atividadeController.obter);
router.put('/:idAtividade', authMiddleware, isGestorPedagogico, atividadeController.atualizar);
router.post('/:idAtividade/respostas', authMiddleware, atividadeController.responderAtividade);
router.get('/:idAtividade/entregas', authMiddleware, isGestorPedagogico, atividadeController.entregas);
router.patch('/respostas/:idResposta/corrigir', authMiddleware, isGestorPedagogico, atividadeController.corrigirEntrega);
router.post('/upload', authMiddleware, isGestorPedagogico, uploadAtividade.single('file'), atividadeController.uploadImagem);

module.exports = router;

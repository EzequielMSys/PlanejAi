const router = require('express').Router();
const atividadeController = require('../controllers/atividadeController');
const { authMiddleware, isGestorPedagogico } = require('../middlewares/authMiddleware');
const { uploadAtividade } = require('../middlewares/uploadMiddleware');

router.get('/', authMiddleware, atividadeController.listar);
router.get('/alunos', authMiddleware, isGestorPedagogico, atividadeController.listarAlunos);
router.get('/banco-questoes', authMiddleware, isGestorPedagogico, atividadeController.bancoQuestoes);
router.post('/banco-questoes', authMiddleware, isGestorPedagogico, atividadeController.criarQuestaoBanco);
router.post('/banco-questoes/:idQuestao/usar', authMiddleware, isGestorPedagogico, atividadeController.usarQuestaoBanco);
router.delete('/banco-questoes/:idQuestao', authMiddleware, isGestorPedagogico, atividadeController.deletarQuestaoBanco);
router.post('/respostas/upload', authMiddleware, uploadAtividade.single('file'), atividadeController.uploadResposta);
router.post('/', authMiddleware, isGestorPedagogico, atividadeController.criar);
router.put('/rascunhos/:idAtividade', authMiddleware, isGestorPedagogico, atividadeController.autosalvar);
router.get('/:idAtividade', authMiddleware, atividadeController.obter);
router.put('/:idAtividade', authMiddleware, isGestorPedagogico, atividadeController.atualizar);
router.get('/:idAtividade/versoes', authMiddleware, isGestorPedagogico, atividadeController.versoes);
router.put('/:idAtividade/respostas/rascunho', authMiddleware, atividadeController.salvarRascunhoResposta);
router.post('/:idAtividade/respostas', authMiddleware, atividadeController.responderAtividade);
router.get('/:idAtividade/entregas', authMiddleware, isGestorPedagogico, atividadeController.entregas);
router.patch('/respostas/:idResposta/corrigir', authMiddleware, isGestorPedagogico, atividadeController.corrigirEntrega);
router.post('/upload', authMiddleware, isGestorPedagogico, uploadAtividade.single('file'), atividadeController.uploadImagem);

module.exports = router;

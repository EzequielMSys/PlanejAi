const router = require('express').Router();
const controller = require('../controllers/aprendizagemController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/resumo', controller.resumo);
router.get('/evolucao', controller.evolucao);
router.get('/simulado', controller.simulado);
router.post('/questoes/:idQuestao/responder', controller.responder);
router.get('/erros', controller.erros);
router.patch('/erros/:idErro', controller.atualizarErro);
router.get('/revisoes', controller.revisoes);
router.post('/revisoes/:idConteudo', controller.adicionarRevisao);
router.post('/revisoes/:idConteudo/avaliar', controller.avaliarRevisao);
router.post('/sessoes', controller.registrarSessao);
router.get('/meta-semanal', controller.metaSemanal);
router.put('/meta-semanal', controller.atualizarMetaSemanal);
router.get('/redacoes/:idRedacao/versoes', controller.versoes);
router.post('/redacoes/:idRedacao/versoes', controller.criarVersao);

module.exports = router;

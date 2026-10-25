const router = require('express').Router();
const controller = require('../controllers/aprendizagemController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { idempotency } = require('../middlewares/idempotencyMiddleware');

router.use(authMiddleware);
router.use(require('./sessionClosureRoutes'));
router.use('/diario', require('./learningJournalRoutes'));
const continuity = require('../services/studyContinuityService');
for (const [method, operation] of [['get', continuity.current], ['put', continuity.save], ['delete', continuity.clear]]) {
  router[method]('/estudo-em-andamento', async (req, res) => {
    try { const owner = req.usuario.id_usuario || req.usuario.id; res.json(await (method === 'get' ? operation(owner) : operation(owner, req.body?.idItem))) }
    catch (error) { res.status(method === 'get' ? 503 : 400).json({ message: method === 'get' ? 'Não foi possível consultar sua sessão.' : error.message }) }
  });
}
router.get('/resumo', controller.resumo);
router.get('/evolucao', controller.evolucao);
router.get('/jornada', controller.jornada);
router.get('/simulado', controller.simulado);
router.post('/questoes/:idQuestao/responder', idempotency('RESPONDER_QUESTAO'), controller.responder);
router.get('/erros', controller.erros);
router.patch('/erros/:idErro', controller.atualizarErro);
router.get('/revisoes', controller.revisoes);
router.post('/revisoes/:idRevisao/adiar', async (req, res) => {
  try { res.json(await require('../services/reviewPlanningService').postpone(req.usuario.id_usuario || req.usuario.id, req.params.idRevisao, req.body?.dias)); }
  catch (error) { const expected = [400, 404].includes(error.status); res.status(expected ? error.status : 503).json({ message: expected ? error.message : 'Não foi possível confirmar o reagendamento. Atualize a fila antes de tentar novamente.' }); }
});
router.post('/revisoes/:idConteudo', controller.adicionarRevisao);
router.post('/revisoes/:idConteudo/avaliar', controller.avaliarRevisao);
router.post('/sessoes', idempotency('REGISTRAR_SESSAO'), controller.registrarSessao);
router.get('/meta-semanal', controller.metaSemanal);
router.put('/meta-semanal', controller.atualizarMetaSemanal);
router.get('/conteudos/:idConteudo/anotacao', controller.obterAnotacao);
router.put('/conteudos/:idConteudo/anotacao', controller.salvarAnotacao);
router.get('/redacoes/:idRedacao/versoes', controller.versoes);
router.post('/redacoes/:idRedacao/versoes', controller.criarVersao);

module.exports = router;

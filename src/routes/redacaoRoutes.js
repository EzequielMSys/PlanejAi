const express = require('express');
const router = express.Router();
const redacaoController = require('../controllers/redacaoController');
const { authMiddleware, isGestorPedagogico, isAdminOrDono } = require('../middlewares/authMiddleware');
const { idempotency } = require('../middlewares/idempotencyMiddleware');

router.post('/', authMiddleware, idempotency('ENVIAR_REDACAO'), redacaoController.enviarRedacao);
router.get('/', authMiddleware, redacaoController.listarRedacoes);
router.get('/portfolio', authMiddleware, redacaoController.portfolio);
router.get('/todas', authMiddleware, isGestorPedagogico, redacaoController.listarTodasRedacoes);
router.post('/sugerir-tema', authMiddleware, redacaoController.sugerirTema);
router.post('/analisar-rascunho', authMiddleware, redacaoController.analisarRascunho);
router.post('/revisar-intencao', authMiddleware, async(req,res)=>{
  res.set('Cache-Control','no-store');
  try{res.json(await require('../services/essayIntentService').review(req.usuario.id_usuario || req.usuario.id,req.body));}
  catch(error){const expected=[400,429,503].includes(error.status);res.status(expected?error.status:503).json({message:expected?error.message:'Não foi possível revisar o trecho agora. Seu texto não foi alterado.'});}
});
router.get('/:idRedacao', authMiddleware, redacaoController.obterRedacao);
router.get('/:idRedacao/anotacoes', authMiddleware, redacaoController.anotacoes);
router.post('/:idRedacao/anotacoes', authMiddleware, isGestorPedagogico, redacaoController.criarAnotacao);
router.patch('/:idRedacao/avaliar', authMiddleware, isGestorPedagogico, redacaoController.avaliarRedacao);

module.exports = router;

const router = require('express').Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const service = require('../services/unifiedSearchService');
router.use(authMiddleware);
router.use((_req,res,next) => { res.set('Cache-Control','private, no-store'); next(); });
router.get('/', async (req,res) => {
  try { res.json(await service.search(req.usuario,req.query)); }
  catch (error) { res.status(error.status === 400 ? 400 : 503).json({ message: error.status === 400 ? error.message : 'Não foi possível consultar a busca. Tente novamente.' }); }
});
router.get('/conteudos/:id', async (req,res) => {
  try { const content = await service.content(req.usuario,req.params.id,undefined,req.query.anotacao === '1'); content ? res.json(content) : res.status(404).json({message:'Conteúdo não encontrado para esta conta.'}); }
  catch { res.status(503).json({message:'Não foi possível abrir este conteúdo. Tente novamente.'}); }
});
module.exports = router;

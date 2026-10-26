const router = require('express').Router();
const service = require('../services/guidedStudyService');
const wrap = handler => async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { res.json(await handler(req, req.usuario.id_usuario || req.usuario.id)); }
  catch (error) { const expected = [400,404,409,429,503].includes(error.status); res.status(expected ? error.status : 503).json({ message: expected ? error.message : 'Não foi possível confirmar a operação. Seu rascunho permanece neste aparelho; tente novamente.' }); }
};
router.get('/hoje', wrap((req, owner) => service.overview(owner)));
router.get('/', wrap((req, owner) => { if (!['prova','evidencia'].includes(req.query.tipo)) throw Object.assign(new Error('Tipo inválido.'),{status:400}); return service.list(owner, req.query.tipo); }));
router.post('/:tipo', wrap((req, owner) => service.create(owner, req.params.tipo, req.body)));
router.get('/:id', wrap((req, owner) => service.detail(owner, req.params.id)));
router.get('/:id/revisao-final', wrap((req, owner) => service.finalReview(owner, req.params.id)));
router.patch('/:id', wrap((req, owner) => service.change(owner, req.params.id, req.body)));
router.post('/:id/lumi', wrap((req, owner) => service.assist(owner, req.params.id, req.body)));
module.exports = router;

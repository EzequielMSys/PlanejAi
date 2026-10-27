const router = require('express').Router();
const service = require('../services/guidedStudyService');
const wrap = handler => async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { res.json(await handler(req, req.usuario.id_usuario || req.usuario.id)); }
  catch (error) { const expected = [400,404,409,429,503].includes(error.status); res.status(expected ? error.status : 503).json({ message: expected ? error.message : 'Não foi possível confirmar a operação. Seu rascunho permanece neste aparelho; tente novamente.' }); }
};
router.get('/hoje', wrap((req, owner) => service.overview(owner)));
router.get('/laboratorio/catalogo',wrap(()=>require('../services/studyLabCatalog').cards()));
router.get('/portfolio/opcoes',wrap((req,owner)=>require('../services/researchPortfolioService').options(owner,req.query.q||'')));
router.post('/portfolio/origem',wrap((req,owner)=>require('../services/researchPortfolioService').resolve(owner,req.body)));
router.get('/projetos/modelos',wrap(()=>{const paths=require('../services/personalLearningPaths');return {templates:paths.templates,stages:paths.stages,criteria:paths.criteria};}));
router.get('/fontes/opcoes',wrap((req,owner)=>require('../services/studyPathSources').options(owner,req.query.tipo,req.query.q||'',require('../config/db'),req.usuario)));
router.post('/fontes/conferir',wrap((req,owner)=>require('../services/studyPathSources')[req.body.open===true?'open':'resolve'](owner,req.body,require('../config/db'),req.usuario)));
router.get('/estrategias/sugestoes',wrap((req,owner)=>require('../services/personalLearningPaths').suggestions(owner,req.query.tema||'',req.query.dificuldade||'',require('../config/db'))));
router.get('/', wrap((req, owner) => { if (!['prova','evidencia','laboratorio','estrategia','projeto','portfolio'].includes(req.query.tipo)) throw Object.assign(new Error('Tipo inválido.'),{status:400}); return service.list(owner, req.query.tipo); }));
router.post('/:tipo', wrap((req, owner) => service.create(owner, req.params.tipo, req.body,require('../config/db'),req.usuario)));
router.get('/:id', wrap((req, owner) => service.detail(owner, req.params.id)));
router.get('/:id/revisao-final', wrap((req, owner) => service.finalReview(owner, req.params.id)));
router.patch('/:id', wrap((req, owner) => service.change(owner, req.params.id, req.body,require('../config/db'),req.usuario)));
router.post('/:id/lumi', wrap((req, owner) => service.assist(owner, req.params.id, req.body)));
router.post('/:id/recuperacao/previa',wrap((req,owner)=>service.recoveryPreview(owner,req.params.id,req.body)));
router.post('/:id/guardar',wrap((req,owner)=>require('../services/studyLabService').saveAs(owner,req.params.id,req.body,require('../config/db'))));
module.exports = router;

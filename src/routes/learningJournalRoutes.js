const router = require('express').Router();
const service = require('../services/learningJournalService');
const wrap = operation => async (req,res) => {
  res.set('Cache-Control','no-store');
  try { res.json(await operation(req,req.usuario.id_usuario || req.usuario.id)); }
  catch(error) {
    const expected = [400,404,409,429,503].includes(error.status);
    res.status(expected ? error.status : 503).json({message:expected ? error.message : 'Não foi possível confirmar o registro. Preserve seu texto e tente novamente.'});
  }
};
router.get('/',wrap((req,owner)=>service.list(owner,req.query)));
router.post('/',wrap((req,owner)=>service.write(owner,null,req.body)));
router.get('/:id',wrap((req,owner)=>service.detail(owner,req.params.id,req.query.antes)));
router.post('/:id/passos',wrap((req,owner)=>service.write(owner,req.params.id,req.body)));
router.post('/:id/lumi',wrap((req,owner)=>service.assist(owner,req.params.id,req.body?.passos)));
router.delete('/:id',wrap((req,owner)=>service.remove(owner,req.params.id)));
module.exports = router;

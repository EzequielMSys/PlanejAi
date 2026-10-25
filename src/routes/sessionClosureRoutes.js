const router=require('express').Router();
const service=require('../services/sessionClosureService');
const wrap=operation=>async(req,res)=>{
  res.set('Cache-Control','no-store');
  try{res.json(await operation(req));}catch(error){const expected=[400,404,409].includes(error.status);res.status(expected?error.status:503).json({message:expected?error.message:'Não foi possível confirmar com o servidor. Seus registros não foram apagados; tente novamente.'});}
};
router.get('/retomadas',wrap(req=>service.pending(req.usuario.id_usuario || req.usuario.id)));
router.post('/fechamentos',wrap(req=>service.close(req.usuario,req.body)));
router.get('/fechamentos/:id/retomar',wrap(req=>service.resume(req.usuario,req.params.id)));
router.post('/fechamentos/:id/retomado',wrap(req=>service.done(req.usuario.id_usuario || req.usuario.id,req.params.id)));
module.exports=router;

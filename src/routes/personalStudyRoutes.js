const router=require('express').Router();
const service=require('../services/personalStudyService');
const wrap=operation=>async(req,res)=>{
  res.set('Cache-Control','no-store');
  try{res.json(await operation(req));}
  catch(error){const expected=[400,404,409].includes(error.status);res.status(expected?error.status:503).json({message:expected?error.message:'Não foi possível consultar seu espaço agora. Tente novamente; seus registros continuam na conta.'});}
};
router.get('/mesa',wrap(req=>service.desk(req.usuario)));
router.post('/mesa',wrap(req=>service.pin(req.usuario,req.body)));
router.delete('/mesa/:id',wrap(req=>service.remove(req.usuario,req.params.id)));
router.post('/mesa/:id/mover',wrap(req=>service.move(req.usuario,req.params.id,req.body?.direcao)));
router.get('/mesa/:id/abrir',wrap(req=>service.open(req.usuario,req.params.id)));
router.get('/entendimento',wrap(req=>service.understanding(req.usuario,req.query)));
router.get('/entendimento/:id',wrap(req=>service.evidence(req.usuario,req.params.id)));
module.exports=router;

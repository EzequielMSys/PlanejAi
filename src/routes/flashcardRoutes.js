const router=require('express').Router(),service=require('../services/flashcardService'),limits=require('../services/rateLimitStore')
const owner=req=>req.usuario.id_usuario||req.usuario.id
router.use((req,res,next)=>{res.set('Cache-Control','private, no-store');next()})
const run=operation=>async(req,res)=>{try{if(req.method!=='GET'&&await limits.consume('FLASHCARD_WRITE',String(owner(req)),60000)>60)return res.status(429).json({message:'Aguarde um minuto antes de tentar novamente. Seu texto continua aqui.'});res.json(await operation(req))}catch(error){const expected=[400,404,409].includes(error.status);res.status(expected?error.status:503).json({message:expected?error.message:'Não foi possível confirmar seus cartões. Seu estudo continua preservado; tente novamente.'})}}
router.get('/',run(req=>service.list(owner(req),req.query)))
router.get('/curta',run(req=>service.short(owner(req),req.query)))
router.get('/:id/historico',run(req=>service.history(owner(req),req.params.id,req.query)))
router.get('/:id',run(req=>service.get(owner(req),req.params.id)))
router.post('/',run(req=>service.create(owner(req),req.body)))
router.put('/:id',run(req=>service.edit(owner(req),req.params.id,req.body)))
router.patch('/:id/arquivo',run(req=>service.archive(owner(req),req.params.id,req.body)))
router.post('/:id/avaliar',run(req=>service.review(owner(req),req.params.id,req.body)))
module.exports=router

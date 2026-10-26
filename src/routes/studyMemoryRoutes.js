const router=require('express').Router(),service=require('../services/studyMemoryService'),limits=require('../services/rateLimitStore')
const owner=req=>req.usuario.id_usuario||req.usuario.id
const run=operation=>async(req,res)=>{try{if(req.method!=='GET'&&await limits.consume('STUDY_MEMORY_WRITE',String(owner(req)),60000)>60)return res.status(429).json({message:'Aguarde um minuto antes de salvar novamente. Seu texto continua nesta tela.'});res.json(await operation(req))}catch(error){const expected=[400,404,409].includes(error.status);res.status(expected?error.status:503).json({message:expected?error.message:'Não foi possível confirmar o registro na conta. Seu rascunho continua na tela; tente novamente.'})}}
router.get('/destaques',run(req=>service.listHighlights(owner(req),req.query.materialKey,req.query.arquivados==='1')))
router.post('/destaques',run(req=>service.saveHighlight(owner(req),req.body)))
router.put('/destaques/:id',run(req=>service.saveHighlight(owner(req),req.body,req.params.id)))
router.patch('/destaques/:id/arquivo',run(req=>service.archive(owner(req),req.params.id,req.body.versao,req.body.arquivado,'highlight')))
router.get('/conversas',run(req=>service.listConversations(owner(req),req.query.pagina||1,req.query.arquivados==='1')))
router.get('/conversas/:id',run(req=>service.getConversation(owner(req),req.params.id)))
router.post('/conversas',run(req=>service.saveConversation(owner(req),req.body)))
router.put('/conversas/:id',run(req=>service.saveConversation(owner(req),req.body,req.params.id)))
router.patch('/conversas/:id/arquivo',run(req=>service.archive(owner(req),req.params.id,req.body.versao,req.body.arquivado,'conversation')))
module.exports=router

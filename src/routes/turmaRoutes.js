const r=require('express').Router();const c=require('../controllers/turmaController');const{authMiddleware,isGestorPedagogico}=require('../middlewares/authMiddleware');r.use(authMiddleware);r.get('/',c.listar);r.get('/candidatos',isGestorPedagogico,c.candidatos);r.post('/',isGestorPedagogico,c.criar);r.post('/:id/membros',isGestorPedagogico,c.adicionar);
const followup = require('../services/classFollowupService')

// Entrada por código: liberada para aluno e docente porque as duas pontas do
// Classroom precisam disso. `isGestorPedagogico` aqui obrigaria o aluno a
// pedir inclusion manual, que é exatamente o que esta rota substitui.
r.get('/:id/acompanhamento',isGestorPedagogico,async(req,res,next)=>{
  res.set('Cache-Control','private, no-store')
  try {
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(404).json({message:'Turma não encontrada.'})
    const result=await followup.overview(id,req.usuario.id_usuario||req.usuario.id,req.usuario.tipo)
    return result ? res.json(result) : res.status(404).json({message:'Turma não encontrada.'})
  } catch(error){return next(error)}
})
r.post('/entrar',c.entrar);
r.post('/convites/usar',c.usarConvite);

// A visão do aluno. Fica separada de /:id porque aquela exige gerenciar a turma
// e devolveria a lista completa de alunos, que o aluno não deve enxergar.
// Precisa vir antes de /:id para o "minhas" não ser lido como id de turma.
r.get('/minhas',c.minhas);
r.get('/minhas/:id',c.minhaTurma);
r.get('/:id',isGestorPedagogico,c.detalhes);
r.post('/:id/sair',c.sair);

// Convites de entrada são geridos por quem responde pela turma.
r.get('/:id/convites',isGestorPedagogico,c.listarConvites);
r.post('/:id/convites',isGestorPedagogico,c.criarConvite);
r.delete('/:id/convites/:idConvite',isGestorPedagogico,c.cancelarConvite);module.exports=r

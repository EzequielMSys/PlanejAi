const r=require('express').Router();const c=require('../controllers/turmaController');const{authMiddleware,isGestorPedagogico}=require('../middlewares/authMiddleware');r.use(authMiddleware);r.get('/',c.listar);r.get('/candidatos',isGestorPedagogico,c.candidatos);r.post('/',isGestorPedagogico,c.criar);r.get('/:id',c.detalhes);r.post('/:id/membros',isGestorPedagogico,c.adicionar);

// Entrada por código: liberada para aluno e docente porque as duas pontas do
// Classroom precisam disso. `isGestorPedagogico` aqui obrigaria o aluno a
// pedir inclusion manual, que é exatamente o que esta rota substitui.
r.post('/entrar',c.entrar);
r.post('/convites/usar',c.usarConvite);

// A visão do aluno. Fica separada de /:id porque aquela exige gerenciar a turma
// e devolveria a lista completa de alunos, que o aluno não deve enxergar.
// Precisa vir antes de /:id para o "minhas" não ser lido como id de turma.
r.get('/minhas',c.minhas);
r.get('/minhas/:id',c.minhaTurma);
r.post('/:id/sair',c.sair);

// Convites de entrada são geridos por quem responde pela turma.
r.get('/:id/convites',isGestorPedagogico,c.listarConvites);
r.post('/:id/convites',isGestorPedagogico,c.criarConvite);
r.delete('/:id/convites/:idConvite',isGestorPedagogico,c.cancelarConvite);module.exports=r

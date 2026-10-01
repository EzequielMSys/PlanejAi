import{createApiClient}from'./apiClient';
const api=createApiClient('/api/turmas');
export default{
  listar:()=>api.get('/').then(r=>r.data),
  detalhes:id=>api.get(`/${id}`).then(r=>r.data),
  criar:d=>api.post('/',d).then(r=>r.data),
  candidatos:()=>api.get('/candidatos').then(r=>r.data),
  adicionar:(id,d)=>api.post(`/${id}/membros`,d).then(r=>r.data),
  // Entrada por código da turma: o caminho que o aluno usa sem depender de o
  // professor adicioná-lo manualmente.
  entrar:codigo=>api.post('/entrar',{codigo}).then(r=>r.data),
  usarConvite:codigo=>api.post('/convites/usar',{codigo}).then(r=>r.data),
  sair:id=>api.post(`/${id}/sair`).then(r=>r.data),
  // A visão do aluno é separada de /detalhes: aquela exige gerenciar a turma e
  // traria a lista de alunos, que o aluno não deve enxergar.
  minhas:()=>api.get('/minhas').then(r=>r.data),
  minhaTurma:id=>api.get(`/minhas/${id}`).then(r=>r.data),
  // Convites são geridos por quem responde pela turma.
  listarConvites:id=>api.get(`/${id}/convites`).then(r=>r.data),
  criarConvite:id=>api.post(`/${id}/convites`).then(r=>r.data),
  cancelarConvite:(id,idConvite)=>api.delete(`/${id}/convites/${idConvite}`).then(r=>r.data)
}

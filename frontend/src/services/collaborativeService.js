import { createApiClient } from './apiClient'
const api=createApiClient('/api/colaborativo')
export default {
  projetos:()=>api.get('/redacao/projetos').then(r=>r.data), salvarProjeto:(d)=>api.post('/redacao/projetos',d).then(r=>r.data), evolucao:()=>api.get('/redacao/evolucao-enem').then(r=>r.data),
  revisoes:()=>api.get('/revisoes-pares').then(r=>r.data), disponibilizar:()=>api.post('/revisoes-pares/disponibilizar').then(r=>r.data), responderRevisao:(id,d)=>api.patch(`/revisoes-pares/${id}`,d).then(r=>r.data),
  denunciarRevisao:(id,d)=>api.post(`/revisoes-pares/${id}/denunciar`,d).then(r=>r.data),
  alertas:()=>api.get('/gestao/alertas').then(r=>r.data), intervencoes:()=>api.get('/gestao/intervencoes').then(r=>r.data), criarIntervencao:(d)=>api.post('/gestao/intervencoes',d).then(r=>r.data), grupos:()=>api.get('/gestao/grupos/sugestoes').then(r=>r.data), criarGrupo:(d)=>api.post('/gestao/grupos',d).then(r=>r.data)
}

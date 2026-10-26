import {createApiClient} from './apiClient'
const api=createApiClient('/api/aprendizagem/cartoes')
export default {
 list:(params,signal)=>api.get('',{params,signal,cache:false}).then(r=>r.data),
 get:(id,signal)=>api.get(`/${id}`,{signal,cache:false}).then(r=>r.data),
 history:(id,pagina=1,signal)=>api.get(`/${id}/historico`,{params:{pagina},signal,cache:false}).then(r=>r.data),
 create:(body,owner)=>api.post('',body,{expectedOwner:owner}).then(r=>r.data),
 edit:(id,body,owner)=>api.put(`/${id}`,body,{expectedOwner:owner}).then(r=>r.data),
 archive:(id,body,owner)=>api.patch(`/${id}/arquivo`,body,{expectedOwner:owner}).then(r=>r.data),
 review:(id,body,owner)=>api.post(`/${id}/avaliar`,body,{expectedOwner:owner}).then(r=>r.data),
 short:(minutos,signal,colecao)=>api.get('/curta',{params:{minutos,...(colecao?{colecao}:{})},signal,cache:false}).then(r=>r.data),
 flag:(id,body,owner)=>api.patch(`/${id}/melhoria`,body,{expectedOwner:owner}).then(r=>r.data),
 collections:signal=>api.get('/colecoes',{signal,cache:false}).then(r=>r.data),
 createCollection:(body,owner)=>api.post('/colecoes',body,{expectedOwner:owner}).then(r=>r.data),
 editCollection:(id,body,owner)=>api.put(`/colecoes/${id}`,body,{expectedOwner:owner}).then(r=>r.data),
 removeCollection:(id,owner)=>api.delete(`/colecoes/${id}`,{expectedOwner:owner}).then(r=>r.data),
 memberships:(id,signal)=>api.get(`/${id}/colecoes`,{signal,cache:false}).then(r=>r.data),
 member:(collection,id,incluir,owner)=>api.put(`/colecoes/${collection}/cartoes/${id}`,{incluir},{expectedOwner:owner}).then(r=>r.data),
 addMany:(collection,cartoes,owner)=>api.put(`/colecoes/${collection}/cartoes`,{cartoes},{expectedOwner:owner}).then(r=>r.data),
 removeMany:(collection,cartoes,owner)=>api.post(`/colecoes/${collection}/retirar`,{cartoes},{expectedOwner:owner}).then(r=>r.data),
 pin:(collection,fixada,owner)=>api.patch(`/colecoes/${collection}/fixada`,{fixada},{expectedOwner:owner}).then(r=>r.data),
 reorder:(anterior,ordem,owner)=>api.put('/colecoes/ordem',{anterior,ordem},{expectedOwner:owner}).then(r=>r.data),
}

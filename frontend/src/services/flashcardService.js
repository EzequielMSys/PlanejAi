import {createApiClient} from './apiClient'
const api=createApiClient('/api/aprendizagem/cartoes')
export default {
 list:(params,signal)=>api.get('',{params,signal,cache:false}).then(r=>r.data),
 get:(id,signal)=>api.get(`/${id}`,{signal,cache:false}).then(r=>r.data),
 create:(body,owner)=>api.post('',body,{expectedOwner:owner}).then(r=>r.data),
 edit:(id,body,owner)=>api.put(`/${id}`,body,{expectedOwner:owner}).then(r=>r.data),
 archive:(id,body,owner)=>api.patch(`/${id}/arquivo`,body,{expectedOwner:owner}).then(r=>r.data),
 review:(id,body,owner)=>api.post(`/${id}/avaliar`,body,{expectedOwner:owner}).then(r=>r.data),
 short:(minutos,signal)=>api.get('/curta',{params:{minutos},signal,cache:false}).then(r=>r.data),
}

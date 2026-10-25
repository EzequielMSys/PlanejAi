import { createApiClient } from './apiClient'
import { currentUser } from '../utils/offlineStore'
const api=createApiClient('/api/aprendizagem')
const get=(path,signal,params)=>api.get(path,{signal,params,cache:false}).then(r=>r.data)
const post=(path,data)=>api.post(path,data,{expectedOwner:currentUser()}).then(r=>r.data)
export default {
  desk:signal=>get('/mesa',signal),
  pin:(tipo,idOrigem)=>post('/mesa',{tipo,idOrigem}),
  remove:id=>api.delete(`/mesa/${id}`,{expectedOwner:currentUser()}).then(r=>r.data),
  move:(id,direcao)=>post(`/mesa/${id}/mover`,{direcao}),
  open:(id,signal)=>get(`/mesa/${id}/abrir`,signal),
  understanding:(pagina,signal)=>get('/entendimento',signal,{pagina}),
  evidence:(id,signal)=>get(`/entendimento/${id}`,signal),
}

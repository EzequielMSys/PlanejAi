import {createApiClient} from './apiClient'
const api=createApiClient('/api/aprendizagem')
export default {
  close:(data,expectedOwner)=>api.post('/fechamentos',data,{timeout:30000,expectedOwner}).then(r=>r.data),
  pending:signal=>api.get('/retomadas',{cache:false,signal}).then(r=>r.data),
  resume:id=>api.get(`/fechamentos/${id}/retomar`,{cache:false}).then(r=>r.data),
  done:id=>api.post(`/fechamentos/${id}/retomado`).then(r=>r.data),
}

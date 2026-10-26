import {createApiClient} from './apiClient'
const api=createApiClient('/api/aprendizagem/registros')
export const newRecordKey=()=>window.crypto.randomUUID().replaceAll('-','')
export default {
 highlights:(materialKey,archived=false,signal)=>api.get('/destaques',{params:{materialKey,...(archived?{arquivados:'1'}:{})},cache:false,signal}).then(r=>r.data),
 saveHighlight:(body,id,owner)=>api[id?'put':'post'](id?`/destaques/${id}`:'/destaques',body,{expectedOwner:owner}).then(r=>r.data),
 conversations:(page=1,archived=false,signal)=>api.get('/conversas',{params:{pagina:page,...(archived?{arquivados:'1'}:{})},cache:false,signal}).then(r=>r.data),
 conversation:(id,signal)=>api.get(`/conversas/${id}`,{cache:false,signal}).then(r=>r.data),
 saveConversation:(body,id,owner)=>api[id?'put':'post'](id?`/conversas/${id}`:'/conversas',body,{expectedOwner:owner}).then(r=>r.data),
 archive:(type,id,version,archived,owner)=>api.patch(`/${type==='highlight'?'destaques':'conversas'}/${id}/arquivo`,{versao:version,arquivado:archived},{expectedOwner:owner}).then(r=>r.data),
}

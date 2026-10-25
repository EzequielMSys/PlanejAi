const types = new Set(['materia','sessao','duvida','anotacao','redacao','registro'])
const clean = (value, limit) => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim().slice(0,limit) : ''
function normalizeChoice(value) {
  if(value === undefined)return null // Compatibility with clients published before explicit selection.
  if(!value || value.versao!==1 || !Array.isArray(value.itens) || !Array.isArray(value.historico)) {
    const error=new Error('Confira os itens de contexto antes de enviar.');error.code='ERR_CONTEXT_CHOICE';throw error
  }
  const itens=value.itens.slice(0,8).filter(item=>item && types.has(item.tipo)).map(item=>({tipo:item.tipo,titulo:clean(item.titulo,160),texto:clean(item.texto,1500)})).filter(item=>item.texto)
  const historico=value.historico.slice(-12).filter(item=>item && ['user','assistant'].includes(item.role)).map(item=>({role:item.role,content:clean(item.content,2000)})).filter(item=>item.content)
  return {itens,historico}
}
module.exports={normalizeChoice}

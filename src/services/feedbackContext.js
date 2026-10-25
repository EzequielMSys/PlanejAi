const {isAcceptedSignature}=require('./uploadSecurity')
const MAX_IMAGE=700*1024
const fail=message=>{throw Object.assign(new Error(message),{status:400})}
function validateContext(body){
  if(body.pagina===undefined && body.captura===undefined && body.detalhes===undefined && body.categoria!=='MELHORIA')return null
  if(!['PROBLEMA','MELHORIA'].includes(body.categoria))fail('O contexto de feedback exige problema ou melhoria.')
  const pagina=typeof body.pagina==='string'?body.pagina:''
  if(!/^\/[a-zA-Z0-9/_-]{0,180}$/.test(pagina)||pagina.startsWith('//'))fail('Informe somente a página do PlanejAI, sem endereço externo ou parâmetros.')
  const detalhes=typeof body.detalhes==='string'?body.detalhes.trim():''
  if(detalhes.length>1000)fail('As informações adicionais devem ter até 1000 caracteres.')
  let image=null,mime=null
  if(body.captura){
    mime=body.captura.mime
    const extension={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'}[mime],base64=body.captura.base64
    if(!extension || typeof base64!=='string' || base64.length>Math.ceil(MAX_IMAGE/3)*4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64))fail('Use uma captura PNG, JPG ou WEBP de até 700 KB.')
    image=Buffer.from(base64,'base64')
    if(!image.length || image.length>MAX_IMAGE || image.toString('base64')!==base64 || !isAcceptedSignature(extension,image))fail('A captura não corresponde ao formato informado.')
  }
  return {tipo:body.categoria,pagina,detalhes,image,mime}
}
module.exports={validateContext,MAX_IMAGE}

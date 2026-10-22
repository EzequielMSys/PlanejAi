const crypto = require('crypto')

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

// Uma instalação anterior aplicou add_avisos.sql antes de sua versão ser
// estabilizada no repositório. Os hashes são específicos dessa instalação e
// desta versão do arquivo: alterações futuras continuam a bloquear o boot.
const AVISOS_LEGADO = {
  aplicado: '08a609e011aca4de89367065ca6a9f8d51a83d48074338255cda90a7d263d62a',
  atual: 'ef212a541529da694be801a3aa5d30d8e36b55dfd3c04adca8db66faffdcb852',
}

function tipoCompatibilidade(file, contents, registrado) {
  if (sha256(contents.replace(/\r?\n/g, '\r\n')) === registrado) return 'quebra-de-linha'
  if (file === 'add_avisos.sql' && registrado === AVISOS_LEGADO.aplicado && sha256(contents) === AVISOS_LEGADO.atual) return 'avisos-legado'
  return null
}

async function verificarAvisosLegado(connection) {
  const [rows] = await connection.query('SHOW CREATE TABLE avisos')
  const schema = rows[0]?.['Create Table'] || ''
  const obrigatorios = ['`id_aviso`', '`titulo`', '`mensagem`', '`criado_por`', '`destinatarios`', '`criado_em`', '`atualizado_em`', 'fk_avisos_criado_por']
  return obrigatorios.every((item) => schema.includes(item))
}

module.exports = { tipoCompatibilidade, verificarAvisosLegado }

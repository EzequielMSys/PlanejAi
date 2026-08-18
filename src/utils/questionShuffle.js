const crypto = require('crypto')
const { getJwtSecret } = require('../config/jwtConfig')

function assinatura(payload) {
  return crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('base64url')
}

function embaralharQuestao(questao, random = Math.random, agora = Date.now()) {
  const ordem = questao.alternativas.map((_, indice) => indice)
  for (let i = ordem.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[ordem[i], ordem[j]] = [ordem[j], ordem[i]]
  }
  const dados = Buffer.from(JSON.stringify({ id: Number(questao.id_questao), ordem, exp: agora + 2 * 60 * 60 * 1000 })).toString('base64url')
  return {
    ...questao,
    alternativas: ordem.map((indice) => questao.alternativas[indice]),
    embaralhamento: `${dados}.${assinatura(dados)}`
  }
}

function validarEmbaralhamento(token, idQuestao, agora = Date.now()) {
  const [dados, recebida] = String(token || '').split('.')
  if (!dados || !recebida) throw new Error('Ordem das alternativas inválida.')
  const esperada = assinatura(dados)
  if (recebida.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(recebida), Buffer.from(esperada))) {
    throw new Error('Ordem das alternativas adulterada.')
  }
  const payload = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8'))
  if (payload.id !== Number(idQuestao) || payload.exp < agora || !Array.isArray(payload.ordem) || payload.ordem.length !== 4) {
    throw new Error('Ordem das alternativas expirada ou inválida.')
  }
  return payload.ordem
}

module.exports = { embaralharQuestao, validarEmbaralhamento }

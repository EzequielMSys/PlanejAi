const crypto = require('crypto')
const { getJwtSecret } = require('../config/jwtConfig')

function assinatura(payload) {
  return crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('base64url')
}

function embaralharLista(lista, random) {
  const resultado = [...lista]
  for (let i = resultado.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[resultado[i], resultado[j]] = [resultado[j], resultado[i]]
  }
  return resultado
}

function criarQuestaoEmbaralhada(questao, ordem, agora) {
  const dados = Buffer.from(JSON.stringify({ id: Number(questao.id_questao), ordem, exp: agora + 2 * 60 * 60 * 1000 })).toString('base64url')
  return {
    ...questao,
    alternativas: ordem.map((indice) => questao.alternativas[indice]),
    embaralhamento: `${dados}.${assinatura(dados)}`
  }
}

function embaralharQuestao(questao, random = Math.random, agora = Date.now()) {
  const ordem = embaralharLista(questao.alternativas.map((_, indice) => indice), random)
  return criarQuestaoEmbaralhada(questao, ordem, agora)
}

function destinosEquilibrados(quantidade, random) {
  const restantes = Array(4).fill(Math.floor(quantidade / 4))
  for (const indice of embaralharLista([0, 1, 2, 3], random).slice(0, quantidade % 4)) restantes[indice] += 1

  const destinos = []
  let anterior = null
  while (destinos.length < quantidade) {
    const maior = Math.max(...restantes)
    let candidatos = restantes
      .map((restante, indice) => ({ restante, indice }))
      .filter(({ restante, indice }) => restante === maior && restante > 0 && indice !== anterior)
    if (!candidatos.length) {
      candidatos = restantes
        .map((restante, indice) => ({ restante, indice }))
        .filter(({ restante }) => restante === maior && restante > 0)
    }
    const escolhido = candidatos[Math.floor(random() * candidatos.length)].indice
    destinos.push(escolhido)
    restantes[escolhido] -= 1
    anterior = escolhido
  }
  return destinos
}

function embaralharSimulado(questoes, random = Math.random, agora = Date.now()) {
  const destinos = destinosEquilibrados(questoes.length, random)
  return questoes.map((questao, indice) => {
    const respostaCorreta = Number(questao.resposta_correta)
    const indices = questao.alternativas.map((_, alternativa) => alternativa)
    const distratores = embaralharLista(indices.filter((alternativa) => alternativa !== respostaCorreta), random)
    const ordem = [...distratores]
    ordem.splice(destinos[indice], 0, respostaCorreta)
    const { resposta_correta, explicacao, ...questaoPublica } = questao
    return criarQuestaoEmbaralhada(questaoPublica, ordem, agora)
  })
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

module.exports = { embaralharQuestao, embaralharSimulado, validarEmbaralhamento }

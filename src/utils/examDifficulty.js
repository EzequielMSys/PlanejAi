const LEVELS = ['FACIL', 'MEDIA', 'DIFICIL']

function distribuirQuestoes(total, disponiveis) {
  const alvo = { FACIL: Math.floor(total * 0.3), MEDIA: Math.floor(total * 0.4) }
  alvo.DIFICIL = total - alvo.FACIL - alvo.MEDIA
  const alocacao = Object.fromEntries(LEVELS.map((nivel) => [nivel, Math.min(alvo[nivel], Math.max(0, Number(disponiveis[nivel]) || 0))]))
  let restante = total - Object.values(alocacao).reduce((soma, quantidade) => soma + quantidade, 0)
  const ordem = ['MEDIA', 'FACIL', 'DIFICIL']
  let cursor = 0
  while (restante > 0) {
    const proximo = ordem.findIndex((_, deslocamento) => {
      const nivel = ordem[(cursor + deslocamento) % ordem.length]
      return alocacao[nivel] < Number(disponiveis[nivel] || 0)
    })
    if (proximo < 0) break
    cursor = (cursor + proximo) % ordem.length
    const nivel = ordem[cursor]
    alocacao[nivel] += 1
    restante -= 1
    cursor = (cursor + 1) % ordem.length
  }
  return alocacao
}

module.exports = { distribuirQuestoes }

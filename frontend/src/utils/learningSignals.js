export function learningSignals(summary, reviews = [], evolution = []) {
  const pending = reviews.slice(0, 3)
  const weak = (summary?.porDisciplina || []).filter(item => Number(item.tentativas) >= 3 && Number(item.acerto) < 70)
    .sort((a, b) => Number(a.acerto) - Number(b.acerto))[0]
  const improved = evolution.filter(item => item.comparavel === true && Number(item.amostra_atual) >= 3 && Number(item.amostra_anterior) >= 3 && Number(item.variacao) >= 5)
    .sort((a, b) => Number(b.variacao) - Number(a.variacao))[0]
  return { pending, weak, improved, reviewCount: Number(summary?.revisoesHoje ?? reviews.length) || 0 }
}

export function metricasDeSessoes(sessoes) {
  const lista = Array.isArray(sessoes) ? sessoes : []
  const totalMinutos = lista.reduce((acc, sessao) => acc + (Number(sessao?.minutes) || 0), 0)
  const totalSessoes = lista.length
  const materias = [...new Set(lista.map((sessao) => sessao?.title || sessao?.titulo || sessao?.disciplina || '').filter(Boolean))]
  const datasValidas = lista.map((sessao) => new Date(sessao?.finishedAt).getTime()).filter(Number.isFinite)
  const ultimaAtividade = datasValidas.length ? new Date(Math.max(...datasValidas)).toISOString() : null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const sessoesHoje = datasValidas.filter((data) => data >= hoje.getTime()).length

  return {
    totalMinutos,
    totalSessoes,
    materias,
    ultimaAtividade,
    sessoesHoje,
    mediaMinutosPorSessao: totalSessoes ? Math.round(totalMinutos / totalSessoes) : 0,
  }
}

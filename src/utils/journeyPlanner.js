function clampMinutes(value) {
  return Math.max(10, Math.min(180, Math.round(Number(value) || 25)))
}

function planJourney(minutesAvailable, signals = {}) {
  const total = clampMinutes(minutesAvailable)
  const blocks = []
  let remaining = total

  const add = (type, title, minutes, path, detail, payload = null) => {
    const duration = Math.min(minutes, remaining)
    if (duration < 3) return
    blocks.push({ id: `${type.toLowerCase()}-${blocks.length + 1}`, type, title, minutes: duration, path, detail, payload })
    remaining -= duration
  }

  if (total >= 25) add('AQUECIMENTO', 'Prepare o foco', 5, null, 'Respire, silencie distrações e relembre o objetivo desta sessão.')
  if (signals.reviews > 0) add('REVISAO', `Revisar ${signals.reviewTitle || 'conteúdo pendente'}`, total >= 45 ? 12 : 8, '/aprendizagem', `${signals.reviews} revisão(ões) aguardando consolidação.`)
  if (signals.errors > 0 && remaining >= 10) add('ERROS', `Corrigir um erro de ${signals.criticalDiscipline || 'aprendizagem'}`, total >= 60 ? 15 : 10, '/aprendizagem', `${signals.errors} ponto(s) ainda precisam de recuperação.`)

  const reserveClosing = total >= 20 ? 5 : 0
  const focusMinutes = Math.max(0, remaining - reserveClosing)
  if (focusMinutes >= 3) {
    if (signals.nextContent) add('CONTEUDO', signals.nextContent.titulo || 'Continuar o cronograma', focusMinutes, '/estudar', signals.nextContent.disciplina || 'Próximo conteúdo do seu plano.', signals.nextContent)
    else if (signals.writingProject) add('REDACAO', `Avançar: ${signals.writingProject.tema}`, focusMinutes, '/redacoes', `Retomar a etapa ${signals.writingProject.etapa || 'RASCUNHO'}.`, signals.writingProject)
    else add('PRATICA', 'Treino adaptativo', focusMinutes, '/aprendizagem', 'Resolva questões para o sistema conhecer melhor seu nível.')
  }
  if (remaining > 0) add('FECHAMENTO', 'Registrar o que aprendeu', remaining, null, 'Resuma uma ideia e marque sua percepção de domínio.')

  return { totalMinutes: total, plannedMinutes: blocks.reduce((sum, block) => sum + block.minutes, 0), blocks }
}

module.exports = { clampMinutes, planJourney }

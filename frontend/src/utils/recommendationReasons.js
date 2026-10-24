export function reviewReason(item) {
  if (item.ultimo_resultado === 'DIFICIL') return 'Você marcou este conteúdo como difícil na última avaliação. Ele voltou para uma nova tentativa.'
  if (item.ultimo_resultado === 'ESQUECI') return 'Você marcou que esqueceu na última avaliação. Esta revisão oferece outra oportunidade de lembrar.'
  if (['LEMBREI', 'DOMINEI'].includes(item.ultimo_resultado)) return 'O intervalo calculado após sua última avaliação chegou ao fim. Revisitar o conteúdo ajuda a conferir o que ficou.'
  return 'A data de revisão salva na sua conta chegou. Ainda não há uma avaliação anterior registrada para explicar a dificuldade.'
}

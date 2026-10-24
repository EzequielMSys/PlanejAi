function normalizarPratica(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (!['pista', 'feedback', 'resolucao'].includes(value.modo)) return null
  const clean = (text, max) => typeof text === 'string' ? text.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max) : ''
  const pergunta = clean(value.pergunta, 800)
  if (!pergunta) return null
  const tentativa = clean(value.tentativa, 1000)
  const nivel = Number(value.nivelPista)
  return { modo: value.modo === 'resolucao' && !tentativa ? 'feedback' : value.modo, pergunta, tentativa, nivelPista: Number.isInteger(nivel) ? Math.max(1, Math.min(3, nivel)) : 1 }
}
function orientacaoPratica(pratica) {
  if (!pratica) return ''
  const modes = {
    pista: `Dê uma única pista de nível ${pratica.nivelPista}: 1 orienta o conceito; 2 indica uma operação ou relação; 3 mostra somente o próximo passo incompleto. Não revele o resultado, a alternativa correta nem a solução completa. Peça que o estudante tente esse passo.`,
    feedback: pratica.tentativa ? 'Comente a tentativa: cite um trecho real dela, identifique o que está correto e o primeiro ponto que precisa de ajuste. Dê uma pista específica e proponha uma nova tentativa. Não entregue a resposta final, não invente erros e não elogie uma resposta incorreta como correta. Se a tentativa já estiver correta, confirme e explique brevemente por quê.' : 'Peça uma tentativa curta antes de corrigir. Ofereça uma pista inicial sem revelar a resposta.',
    resolucao: 'O estudante apresentou uma tentativa e pediu explicitamente a resolução. Mostre a solução comentada, confira o resultado e relacione cada passo à tentativa. Distinga uma escolha correta de uma justificativa ainda incompleta.',
  }
  return '\n\nModo de prática selecionado pelo servidor:\n' + modes[pratica.modo]
}
module.exports = { normalizarPratica, orientacaoPratica }


const clean = (value, max = 180) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const rows = value => Array.isArray(value) ? value : []
export function lumiSuggestions(context, subject = '') {
  const chosen = clean(subject, 80)
  const matches = row => row && (!chosen || row.disciplina === chosen)
  const recent = rows(context?.recentes).filter(matches).sort((a,b) => (Date.parse(b.data)||0) - (Date.parse(a.data)||0))
  const difficulties = rows(context?.dificuldades).filter(row => matches(row) && Number(row.erros) > 0).sort((a,b) => Number(b.erros)-Number(a.erros))
  const seen = new Set(), result = []
  const add = (row, topic, reason, prompt) => {
    const title = clean(topic), discipline = clean(row?.disciplina,80)
    if (!title || !discipline) return
    const key = (discipline+' '+title).toLocaleLowerCase('pt-BR')
    if (seen.has(key)) return
    seen.add(key); result.push({title, reason, discipline, prompt:prompt(title,discipline), personal:true})
  }
  const difficultRecent = recent.find(row => row.resultado === 'DIFICIL')
  if (difficultRecent) add(difficultRecent,difficultRecent.titulo,'Você marcou esta sessão como difícil',(t,d)=>'Quero retomar '+t+' em '+d+'. Comece com uma pergunta para identificar onde estou com dificuldade.')
  for (const row of difficulties) add(row,row.competencia,'Para retomar questões em que você errou',(t,d)=>'Quero praticar '+t+' em '+d+'. Faça uma pergunta por vez e espere minha tentativa antes de explicar.')
  const first = result.shift()
  const recentSuggestions = []
  for (const row of recent) {
    const before = result.length
    add(row,row.titulo,'De uma sessão que você concluiu',(t,d)=>'Estudei '+t+' em '+d+'. Faça uma pergunta curta para eu tentar explicar sem consultar e espere minha resposta.')
    if (result.length > before) recentSuggestions.push(result.pop())
  }
  const suggestions = [first, ...recentSuggestions.slice(0,1), ...result, ...recentSuggestions.slice(1)].filter(Boolean).slice(0,2)
  if (!suggestions.length) return [
    {title:'Entender uma dificuldade',reason:'Conte qual assunto está difícil',prompt:'Quero entender melhor um assunto. Pergunte o que estou estudando e onde travei.',personal:false},
    {title:'Revisar o que estudei',reason:'Escolha um assunto para começar',prompt:'Quero revisar o que estudei. Pergunte o assunto e depois faça uma pergunta por vez.',personal:false}
  ]
  return suggestions
}

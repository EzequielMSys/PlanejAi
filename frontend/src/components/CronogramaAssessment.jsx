import { useState } from 'react'

export default function CronogramaAssessment({ assessment, onSubmit, onClose }) {
  const storageKey = `planejai:avaliacao:${assessment.id_avaliacao}`
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const ready = assessment.questoes.every((question) => answers[question.id_questao] !== undefined)

  async function submit() {
    if (!ready) return
    setSending(true)
    try {
      const response = await onSubmit(assessment.id_avaliacao, assessment.questoes.map((question) => ({ idQuestao: question.id_questao, resposta: answers[question.id_questao], embaralhamento: question.embaralhamento })))
      localStorage.removeItem(storageKey)
      setResult(response)
    } finally { setSending(false) }
  }

  return <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#100A18]/85 p-3 backdrop-blur-md sm:p-8">
    <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 text-[#21162F] shadow-2xl dark:bg-[#1C1626] dark:text-white sm:p-8" role="dialog" aria-modal="true" aria-label="Avaliação do cronograma">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-5 dark:border-white/10"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#7C3AED]">{assessment.tipo === 'FINAL' ? 'Prova final do cronograma' : 'Desafio de avanço'}</p><h2 className="mt-1 text-2xl font-black">{assessment.total} questões · mínimo de {assessment.minimoAcertos} acertos</h2><p className="mt-2 text-sm opacity-65">Responda sem consultar o gabarito. O resultado só aparece ao enviar tudo.</p>{!result && <p className="mt-2 text-xs font-semibold text-[#6D28D9]">Você pode fechar e retomar depois. Suas escolhas ficam salvas neste aparelho até o envio.</p>}</div><button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm font-bold">Fechar e retomar depois</button></header>
      {result ? <div className={`mt-6 rounded-2xl p-6 ${result.aprovada ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100' : 'bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100'}`}><h3 className="text-2xl font-black">{result.aprovada ? 'Avaliação aprovada!' : 'Ainda não foi dessa vez.'}</h3><p className="mt-2">Você acertou {result.acertos} de {result.total} questões ({result.percentual}%). {result.aprovada ? 'O próximo passo foi liberado.' : 'Revise os conteúdos do dia e tente novamente em outro momento.'}</p><div className="mt-6 grid gap-3">{result.correcoes?.map((correcao, index) => <article key={correcao.idQuestao} className="rounded-2xl border border-current/15 bg-white/45 p-4 dark:bg-black/10"><p className="text-xs font-black uppercase tracking-wider">Questão {index + 1} · {correcao.acertou ? 'Raciocínio confirmado' : 'Ponto para revisar'}</p><h4 className="mt-2 font-bold">{correcao.enunciado}</h4><p className="mt-2 text-sm">Sua resposta: <b>{String.fromCharCode(65 + correcao.respostaMarcada)}</b> · Correta: <b>{String.fromCharCode(65 + correcao.respostaCorreta)}</b></p><p className="mt-2 text-sm leading-6">{correcao.explicacao}</p><p className="mt-2 text-xs opacity-70">{correcao.fonte ? <a href={correcao.fonte} target="_blank" rel="noreferrer" className="font-bold underline">Abrir {correcao.origem}</a> : `Fonte: ${correcao.origem}`}</p></article>)}</div><button type="button" onClick={onClose} className="mt-5 rounded-full bg-[#4B4C9D] px-5 py-3 font-black text-white">Voltar ao cronograma</button></div> : <><div className="mt-6 grid gap-5">{assessment.questoes.map((question, index) => <article key={question.id_questao} className="rounded-2xl border border-[#7C4DFF]/20 p-5"><p className="text-xs font-black text-[#7C3AED]">Questão {index + 1} · {question.disciplina} · {question.dificuldade}</p><h3 className="mt-2 font-bold leading-6">{question.enunciado}</h3><div className="mt-4 grid gap-2">{question.alternativas.map((alternative, alternativeIndex) => <button type="button" key={alternative} onClick={() => setAnswers((current) => { const next = { ...current, [question.id_questao]: alternativeIndex }; localStorage.setItem(storageKey, JSON.stringify(next)); return next })} className={`rounded-xl border p-3 text-left text-sm ${answers[question.id_questao] === alternativeIndex ? 'border-[#7C3AED] bg-[#F0E8FA] dark:bg-[#392653]' : 'border-black/10 dark:border-white/10'}`}><b className="mr-2 text-[#7C3AED]">{String.fromCharCode(65 + alternativeIndex)}.</b>{alternative}</button>)}</div></article>)}</div><button type="button" disabled={!ready || sending} onClick={submit} className="mt-6 rounded-full bg-[#4B4C9D] px-6 py-3 font-black text-white disabled:opacity-50">{sending ? 'Corrigindo com segurança…' : ready ? 'Enviar avaliação' : `Responda as ${assessment.total} questões`}</button></>}
    </section>
  </div>
}

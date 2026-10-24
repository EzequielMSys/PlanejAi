import { useState } from 'react'
import './LumiPractice.css'

export default function LumiPractice({ context, loading, onSend }) {
  const [question, setQuestion] = useState(context?.pergunta || '')
  const [attempt, setAttempt] = useState(context?.tentativa || '')
  const [expanded, setExpanded] = useState(Boolean(context))
  const [reviewed, setReviewed] = useState('')
  const [hint, setHint] = useState(1)
  async function send(mode) {
    if (!question.trim() || (mode !== 'pista' && !attempt.trim())) return
    const sent = await onSend({ modo: mode, pergunta: question.trim(), tentativa: attempt.trim(), nivelPista: hint })
    if (sent) {
      if (mode === 'pista') setHint(value => Math.min(3, value + 1))
      if (attempt.trim()) setReviewed(attempt.trim())
    }
  }
  return <details className="lumi-practice" open={expanded}><summary onClick={event => { event.preventDefault(); setExpanded(value => !value) }}>Praticar com pistas <span>{expanded ? '−' : '+'}</span></summary>{expanded && <div><p>Mostre como pensou. A Lumi aponta um próximo passo antes de revelar a resolução.</p><label>Questão ou dúvida<textarea rows={2} maxLength={800} value={question} disabled={loading} onChange={event => { setQuestion(event.target.value); setReviewed(''); setHint(1) }} /></label><label>Minha tentativa<textarea rows={2} maxLength={1000} value={attempt} disabled={loading} placeholder="Escreva seu raciocínio, mesmo que esteja incompleto." onChange={event => { setAttempt(event.target.value); setReviewed('') }} /></label><div className="lumi-practice-actions"><button type="button" disabled={loading || !question.trim()} onClick={() => send('pista')}>{hint > 1 ? 'Pedir outra pista' : 'Pedir uma pista'}</button><button type="button" disabled={loading || !question.trim() || !attempt.trim()} onClick={() => send('feedback')}>Conferir minha tentativa</button>{reviewed && reviewed === attempt.trim() && <button type="button" disabled={loading} onClick={() => send('resolucao')}>Ver resolução comentada</button>}</div><small>Feedback de IA pode conter erros. Confira os passos e a fonte de estudo.</small></div>}</details>
}

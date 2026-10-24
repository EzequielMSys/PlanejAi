import { useState } from 'react'
import { toast } from 'react-hot-toast'
import cronogramaService from '../services/cronogramaService'
import { dailyStudy } from '../utils/dailyStudy'
import './DailyPlanActions.css'

export default function DailyPlanActions({ schedules, onSaved }) {
  const { day, pending, canAdjust } = dailyStudy(schedules)
  const [choice, setChoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  if (!canAdjust) return confirmation ? <p className="daily-adjust-saved" role="status">✓ {confirmation}</p> : null
  const select = value => { setChoice(value); setError(''); setConfirmation('') }
  async function save() {
    setSaving(true); setError('')
    try {
      const result = await cronogramaService.ajustarDia(day.id_dia, choice)
      setChoice(null)
      setConfirmation(result.message)
      toast.success('Rotina ajustada e salva na sua conta.')
      await onSaved()
    } catch (failure) {
      setError(failure.response?.data?.message || 'Não foi possível confirmar o ajuste. Tente novamente.')
    } finally { setSaving(false) }
  }
  return <section className="daily-adjust" aria-label="Ajustar minha rotina">
    <div className="daily-adjust-heading"><span>UMA ROTINA POSSÍVEL</span><h2>Seu dia mudou?</h2><p>Ajuste o plano sem começar de novo.</p></div>
    <div className="daily-adjust-options"><button type="button" disabled={saving} aria-pressed={choice === 'REDUZIR'} onClick={() => select('REDUZIR')}><span aria-hidden="true">◷</span><strong>Hoje só tenho 20 minutos</strong><small>Focar em um conteúdo</small></button><button type="button" disabled={saving} aria-pressed={choice === 'ADIAR'} onClick={() => select('ADIAR')}><span aria-hidden="true">↪</span><strong>Não consegui estudar</strong><small>Encontrar o próximo dia disponível</small></button></div>
    {choice && <div className="daily-adjust-preview" role="region" aria-label="Conferir ajuste"><h3>{choice === 'REDUZIR' ? 'Um passo menor para hoje' : 'Retome sem acumular tudo amanhã'}</h3><p>{choice === 'REDUZIR' ? `Você fica com “${pending[0]?.titulo || 'o primeiro conteúdo'}” e 20 minutos previstos hoje. ${pending.length > 1 ? 'Os outros conteúdos e as etapas seguintes serão distribuídos nos seus próximos dias disponíveis, sem sobrepor as etapas.' : 'As outras datas continuam como estão.'}` : 'Os conteúdos pendentes passam para o próximo dia disponível no seu perfil. As etapas seguintes avançam quando necessário para manter a ordem.'} O que você já concluiu será preservado. A data final pode ser estendida.</p><div><button type="button" disabled={saving} onClick={save}>{saving ? 'Salvando ajuste…' : 'Confirmar ajuste'}</button><button type="button" disabled={saving} onClick={() => setChoice(null)}>Cancelar</button></div></div>}
    {error && <p role="alert" className="daily-adjust-error">{error}</p>}
    {confirmation && <p role="status" className="daily-adjust-saved">✓ {confirmation}</p>}
  </section>
}

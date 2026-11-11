import { useEffect, useRef, useState } from 'react'
import usuarioService from '../services/usuarioService'
import './AccountUsagePanel.css'

const units = [
  ['year', 365 * 86400], ['month', 30 * 86400], ['week', 7 * 86400],
  ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]
].map(([unit, seconds]) => [new Intl.NumberFormat('pt-BR', { style: 'unit', unit, unitDisplay: 'long' }), seconds])
const months = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const shortDate = value => value.split('-').reverse().join('/')

function duration(seconds) {
  const parts = []
  for (const [format, size] of units) {
    const amount = Math.floor(seconds / size)
    if (amount) parts.push(format.format(amount))
    seconds %= size
  }
  return parts.join(', ') || '0 segundos'
}

function Trend({ title, series, field }) {
  const canvas = useRef(null)
  const peak = Math.max(1, ...series.map(item => item[field] ?? 0))
  const best = series.filter(item => item[field] > 0 && item[field] === peak)
  const formatMonth = item => months.format(new Date(item.mes + '-01T00:00Z'))

  useEffect(() => {
    if (!window.CanvasRenderingContext2D) return
    const element = canvas.current
    const ctx = element.getContext('2d')
    if (!ctx) return
    const { width, height } = element
    const inset = 14
    const point = (index, value) => [
      inset + index * (width - 2 * inset) / (series.length - 1),
      height - inset - (height - 2 * inset) * value / peak
    ]
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = 'rgba(133, 135, 161, .35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const fraction of [0, .5, 1]) {
      const [, y] = point(0, peak * fraction)
      ctx.moveTo(inset, y)
      ctx.lineTo(width - inset, y)
    }
    ctx.stroke()
    ctx.strokeStyle = ctx.fillStyle = '#8272ed'
    ctx.lineWidth = 4
    ctx.beginPath()
    let previous = false
    for (const [index, item] of series.entries()) {
      if (item[field] === null) { previous = false; continue }
      const [x, y] = point(index, item[field])
      if (previous) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
      previous = true
    }
    ctx.stroke()
    for (const [index, item] of series.entries()) {
      if (item[field] === null) continue
      const [x, y] = point(index, item[field])
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
  }, [series, field, peak])

  return <figure className="account-usage-trend">
    <figcaption>{title}</figcaption>
    <canvas ref={canvas} width={640} height={150} aria-hidden="true" />
    <div className="account-usage-axis" aria-hidden="true">
      {series.filter((_, i) => [0, 4, 8, 11].includes(i)).map(item => <span key={item.mes}>{formatMonth(item)}</span>)}
    </div>
    {best.length > 0 && <small>Pico de {field === 'segundos' ? duration(peak) : `${peak} ${peak === 1 ? 'entrega' : 'entregas'}`} em {best.map(formatMonth).join(', ')}.</small>}
    {best.length === 0 && <small>{field === 'segundos' ? 'Sem tempo registrado no período.' : 'Sem entregas no período.'}</small>}
  </figure>
}

function ActivityList({ title, activity, dateLabel }) {
  if (!activity) return null
  return <section className="account-usage-list">
    <h3>{title} <span>{activity.total}</span></h3>
    {activity.itens.length ? <ul>{activity.itens.map(item => <li key={item.id_atividade}>
      <strong>{item.titulo}</strong>
      <small>{item.data ? `${dateLabel} ${shortDate(item.data)}` : 'Sem prazo'}</small>
    </li>)}</ul> : <p>Nenhuma atividade.</p>}
    {activity.total > activity.itens.length && <small>Exibindo {activity.itens.length} de {activity.total} atividades.</small>}
  </section>
}

export default function AccountUsagePanel({ id, name, onClose }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const heading = useRef(null)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  useEffect(() => {
    const abort = new AbortController()
    usuarioService.acompanhamento(id, abort.signal).then(data => {
      if (!abort.signal.aborted) setReport(data)
    }).catch(() => {
      if (!abort.signal.aborted) setError(true)
    })
    return () => abort.abort()
  }, [id, attempt])

  return <section id="account-usage" className="account-usage" aria-labelledby="account-usage-heading">
    <header>
      <h2 ref={heading} tabIndex={-1} id="account-usage-heading">Acompanhamento de {name}</h2>
      <button type="button" onClick={onClose}>Fechar acompanhamento</button>
    </header>
    {error && <p role="alert">Não foi possível carregar o acompanhamento. <button type="button" onClick={() => { setError(false); setAttempt(value => value + 1) }}>Tentar novamente</button></p>}
    {!error && !report && <p role="status">Carregando acompanhamento…</p>}
    {report && <>
      <div className="account-usage-total">
        <h3>Tempo ativo estimado</h3>
        <strong>{report.inicio ? duration(report.segundos) : 'Sem tempo registrado'}</strong>
        {report.inicio && <small>Primeiro registro em {shortDate(report.inicio)}. Meses e anos equivalem a 30 e 365 dias.</small>}
        <p>A medição começa após o login. Conta intervalos de 15 segundos com a aba em foco e pausa após 1 minuto sem interação.</p>
      </div>
      <section aria-labelledby="account-usage-months">
        <h3 id="account-usage-months">Evolução nos últimos 12 meses</h3>
        <div className="account-usage-grid">
          <Trend title="Tempo ativo por mês" series={report.meses} field="segundos" />
          <Trend title="Atividades entregues por mês" series={report.meses} field="entregues" />
        </div>
        <details>
          <summary>Ver valores por mês</summary>
          <table>
            <thead><tr><th scope="col">Mês</th><th scope="col">Tempo ativo</th><th scope="col">Entregues</th></tr></thead>
            <tbody>{report.meses.map(item => <tr key={item.mes}>
              <th scope="row">{months.format(new Date(item.mes + '-01T00:00Z'))}</th>
              <td>{item.segundos === null ? 'Sem medição' : duration(item.segundos)}</td>
              <td>{item.entregues}</td>
            </tr>)}</tbody>
          </table>
        </details>
      </section>
      <div className="account-usage-grid">
        <ActivityList title="Atividades entregues" activity={report.entregues} dateLabel="Entregue em" />
        <ActivityList title="Atividades pendentes" activity={report.pendentes} dateLabel="Prazo em" />
      </div>
    </>}
  </section>
}

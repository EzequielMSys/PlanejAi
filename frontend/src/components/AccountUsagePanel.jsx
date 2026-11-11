import { useEffect, useRef, useState } from 'react'
import usuarioService from '../services/usuarioService'
import './AccountUsagePanel.css'

const units = [
  ['year', 365 * 86400], ['month', 30 * 86400], ['week', 7 * 86400],
  ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]
].map(([unit, seconds]) => [new Intl.NumberFormat('pt-BR', { style: 'unit', unit, unitDisplay: 'long' }), seconds])
const months = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const shortDate = value => value.split('-').reverse().join('/')
const periodKey = item => item.dia || item.mes
const formatPeriod = item => item.dia ? item.dia.slice(5).split('-').reverse().join('/') : months.format(new Date(item.mes + '-01T00:00Z'))
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })

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
  const axisIndices = [...new Set(Array.from({ length: 4 }, (_, i) => Math.round(i * (series.length - 1) / 3)))]

  useEffect(() => {
    if (!window.CanvasRenderingContext2D) return
    const element = canvas.current
    const ctx = element.getContext('2d')
    if (!ctx) return
    const { width, height } = element
    const inset = 14
    const point = (index, value) => [
      inset + index * (width - 2 * inset) / Math.max(1, series.length - 1),
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
      {axisIndices.map(index => <span key={periodKey(series[index])}>{formatPeriod(series[index])}</span>)}
    </div>
    {best.length > 0 && <small>Pico de {field === 'segundos' ? duration(peak) : `${peak} ${peak === 1 ? 'entrega' : 'entregas'}`} em {best.map(formatPeriod).join(', ')}.</small>}
    {best.length === 0 && <small>{field === 'segundos' ? 'Sem tempo registrado no período.' : 'Sem entregas no período.'}</small>}
  </figure>
}

function ActivityList({ title, activity, dateLabel }) {
  if (!activity) return null
  return <section className="account-usage-list">
    <h3>{title} <span>{activity.total}</span></h3>
    {activity.itens.length ? <ul>{activity.itens.map(item => <li key={item.id_atividade}>
      <strong>{item.titulo}{item.atrasada ? ' · Atrasada' : ''}</strong>
      <small>{item.data ? `${dateLabel} ${shortDate(item.data)}` : 'Sem prazo'}</small>
    </li>)}</ul> : <p>Nenhuma atividade.</p>}
    {activity.total > activity.itens.length && <small>Exibindo {activity.itens.length} de {activity.total} atividades.</small>}
  </section>
}

export default function AccountUsagePanel({ id, name, onClose }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [period, setPeriod] = useState('dias')
  const [range, setRange] = useState({ start: '', end: '' })
  const [selectedPoint, setSelectedPoint] = useState('')
  const history = report?.historico_diario || report?.dias || []
  const daily = period !== 'meses' && Boolean(history.length)
  const start = range.start || report?.dias?.[0]?.dia
  const end = range.end || history.at(-1)?.dia
  const series = !daily ? report?.meses : period === 'semana' ? history.slice(-7)
    : period === 'personalizado' ? history.filter(item => item.dia >= start && item.dia <= end) : report.dias
  const unit = daily ? 'dia' : 'mês'
  const measured = series?.some(item => item.segundos !== null)
  const secondsInPeriod = series?.reduce((total, item) => total + (item.segundos ?? 0), 0)
  const deliveriesInPeriod = series?.reduce((total, item) => total + item.entregues, 0)
  const point = series?.find(item => periodKey(item) === selectedPoint)
  const refresh = () => { setError(false); setReport(null); setAttempt(value => value + 1) }
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
      <h1 ref={heading} tabIndex={-1} id="account-usage-heading">Acompanhamento de {name}</h1>
      <button type="button" onClick={onClose}>Fechar acompanhamento</button>
    </header>
    {error && <p role="alert">Não foi possível consultar o acompanhamento. <button type="button" onClick={refresh}>Tentar novamente</button></p>}
    {!error && !report && <p role="status">Carregando acompanhamento…</p>}
    {report && <>
      {report.consultado_em && <p>Atualizado em {dateTime.format(new Date(report.consultado_em))} <button type="button" onClick={refresh}>Atualizar dados</button></p>}
      <div className="account-usage-grid">
      <div className="account-usage-total account-usage-list">
        <h2>Tempo ativo estimado</h2>
        <strong>{measured ? `${duration(secondsInPeriod)} no período` : 'Sem histórico de medição no período'}</strong>
        {report.medicao_desde && <small>Medição disponível desde {shortDate(report.medicao_desde)}.</small>}
        {report.inicio && <small>Primeiro registro da conta em {shortDate(report.inicio)}. Total acumulado de {duration(report.segundos)}.</small>}
        <p>A medição começa após o login. Conta intervalos de 15 segundos com a aba em foco e pausa após 1 minuto sem interação.</p>
      </div>
      <div className="account-usage-list"><h2>Último registro</h2><p>{report.ultimo_registro ? dateTime.format(new Date(report.ultimo_registro)) : 'Sem registro nesta conta'}</p></div>
      <div className="account-usage-list"><h2>Entregues no período</h2><p>{deliveriesInPeriod}</p></div>
      {report.pendentes && <div className="account-usage-list"><h2>Pendências atuais</h2><p>{report.pendentes.total} pendentes · {report.pendentes.atrasadas ?? 0} atrasadas</p></div>}
      </div>
      <section aria-labelledby="account-usage-months">
        <h3 id="account-usage-months">Evolução do acompanhamento</h3>
        <label>Período <select value={daily ? 'dias' : 'meses'} onChange={event => setPeriod(event.target.value)}>
          <option value="dias" disabled={!report.dias?.length}>Mês atual · dia a dia</option>
          <option value="semana" disabled={!history.length}>Últimos 7 dias</option>
          <option value="meses">Últimos 12 meses</option>
          <option value="personalizado" disabled={!history.length}>Personalizado</option>
        </select></label>
        {period === 'personalizado' && <div>
          <label>De <input type="date" min={history[0]?.dia} max={end} value={start || ''} onChange={event => setRange({ ...range, start: event.target.value })} /></label>
          <label>Até <input type="date" min={start} max={history.at(-1)?.dia} value={end || ''} onChange={event => setRange({ ...range, end: event.target.value })} /></label>
        </div>}
        {!series.length && <p role="status">Selecione um intervalo válido dentro dos últimos 12 meses.</p>}
        {series.length > 0 && <>
        <p>{daily ? shortDate(series[0].dia) : `01/${series[0].mes.slice(5)}/${series[0].mes.slice(0, 4)}`} a {report.hoje && !daily ? shortDate(report.hoje) : daily ? shortDate(series.at(-1).dia) : formatPeriod(series.at(-1))}</p>
        <div className="account-usage-grid">
          <Trend title={`Tempo ativo por ${unit}`} series={series} field="segundos" />
          <Trend title={`Atividades entregues por ${unit}`} series={series} field="entregues" />
        </div>
        <label>Consultar ponto <select value={point ? selectedPoint : ''} onChange={event => setSelectedPoint(event.target.value)}>
          <option value="">Selecione uma data</option>
          {series.map(item => <option key={periodKey(item)} value={periodKey(item)}>{formatPeriod(item)}</option>)}
        </select></label>
        {point && <p role="status">{formatPeriod(point)} · {point.segundos === null ? 'Sem medição' : duration(point.segundos)} · {point.entregues} {point.entregues === 1 ? 'entrega' : 'entregas'}</p>}
        <details>
          <summary>Ver valores por {unit}</summary>
          <table>
            <thead><tr><th scope="col">{daily ? 'Dia' : 'Mês'}</th><th scope="col">Tempo ativo</th><th scope="col">Entregues</th></tr></thead>
            <tbody>{series.map(item => <tr key={periodKey(item)}>
              <th scope="row">{daily ? shortDate(item.dia) : formatPeriod(item)}</th>
              <td>{item.segundos === null ? 'Sem medição' : duration(item.segundos)}</td>
              <td>{item.entregues}</td>
            </tr>)}</tbody>
          </table>
        </details>
        </>}
      </section>
      <div className="account-usage-grid">
        <ActivityList title="Atividades entregues" activity={report.entregues} dateLabel="Entregue em" />
        <ActivityList title="Atividades pendentes" activity={report.pendentes} dateLabel="Prazo em" />
      </div>
    </>}
  </section>
}

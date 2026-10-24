import { useState } from 'react'
import './ExternalOperations.css'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const base = 'https://github.com/EzequielMSys/PlanejAi/actions/workflows/'
const workflows = [
  { file: 'database-backup.yml', title: 'Cópia e restauração', detail: 'Diariamente, às 03h17 de Brasília. Retenção de 14 dias.', maxAge: 36 },
  { file: 'availability.yml', title: 'Disponibilidade externa', detail: 'Verificação a cada 30 minutos, mesmo com seu computador desligado.', maxAge: 2 },
]
export default function ExternalOperations() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const values = await Promise.all(workflows.map(async workflow => {
        const response = await fetchWithTimeout(`https://api.github.com/repos/EzequielMSys/PlanejAi/actions/workflows/${workflow.file}/runs?per_page=10`, { cache: 'no-store' }, 10000)
        if (!response.ok) throw new Error('unavailable')
        const data = await response.json()
        return { latest: data.workflow_runs?.[0], success: data.workflow_runs?.find(run => run.conclusion === 'success') }
      }))
      setResults(values)
    } catch { setError('Não foi possível consultar o GitHub. Abra os históricos abaixo para conferir as execuções.') }
    finally { setLoading(false) }
  }
  return <section className="owner-panel external-operations" aria-labelledby="external-operations-title">
    <div className="external-operations-heading"><div><span className="owner-kicker">PROTEÇÃO FORA DO COMPUTADOR</span><h2 id="external-operations-title">Cópias e disponibilidade</h2><p>Consulte as execuções reais antes de considerar a proteção em dia.</p></div><button type="button" onClick={refresh} disabled={loading}>{loading ? 'Consultando…' : 'Consultar proteção'}</button></div>
    {error && <p role="alert">{error}</p>}
    <div className="external-operations-grid">{workflows.map((workflow, index) => {
      const result = results?.[index]
      const stale = result?.success && Date.now() - Date.parse(result.success.updated_at) > workflow.maxAge * 3600000
      const failed = result?.latest?.conclusion && result.latest.conclusion !== 'success'
      return <article key={workflow.file}><h3>{workflow.title}</h3><p>{workflow.detail}</p><p role="status"><strong>{!results ? 'Aguardando consulta' : !result?.latest ? 'Sem execução registrada' : result.latest.status !== 'completed' ? 'Execução em andamento' : failed ? 'Última execução precisa de atenção' : stale ? 'Último sucesso está desatualizado' : 'Última execução concluída'}</strong></p><p>Último sucesso: {result?.success ? new Date(result.success.updated_at).toLocaleString('pt-BR') : 'ainda não confirmado nesta consulta'}.</p><a href={base + workflow.file} target="_blank" rel="noreferrer">{index === 0 ? 'Abrir cópias e recuperação' : 'Abrir verificações'} ↗</a></article>
    })}</div>
    <p className="external-operations-note">Horários podem atrasar no GitHub. O monitor detecta falhas; não liga o Aiven automaticamente. O plano gratuito pode ser suspenso por inatividade. Confira os avisos do provedor e habilite notificações de falha do GitHub Actions.</p>
  </section>
}

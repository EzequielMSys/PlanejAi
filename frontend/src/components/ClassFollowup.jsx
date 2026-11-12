import { useEffect, useState } from 'react'
import service from '../services/turmaService'
import AccountUsagePanel from './AccountUsagePanel'

const metrics = [
  { key: 'entregues', label: 'Entregas', matches: student => Number(student.entregues) > 0 },
  { key: 'atrasadas', label: 'Atrasos', matches: student => Number(student.atrasadas) > 0 },
  { key: 'sem_uso', label: 'Sem uso em 7 dias', matches: student => Number(student.sem_uso) === 1 }
]

export default function ClassFollowup({ turma, fullAccess }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const request = new window.AbortController()
    service.acompanhamento(turma.id_turma, request.signal).then(result => {
      if (!request.signal.aborted) setData(result)
    }).catch(() => {
      if (!request.signal.aborted) setError(true)
    })
    return () => request.abort()
  }, [turma, retry])

  const active = metrics.find(metric => metric.key === filter)
  const students = data?.alunos || []
  const visible = active ? students.filter(active.matches) : students

  return <section className="class-followup" aria-label="Acompanhamento da turma">
    <h3>Acompanhamento da turma</h3>
    {error && <p role="alert">Não foi possível consultar o acompanhamento. <button type="button" onClick={() => { setError(false); setRetry(value => value + 1) }}>Tentar novamente</button></p>}
    {!data && !error && <p role="status">Carregando indicadores da turma…</p>}
    {data && <>
      <div className="class-metrics" role="group" aria-label="Filtrar alunos da turma">
        {metrics.map(metric => <button key={metric.key} type="button" aria-pressed={filter === metric.key} onClick={() => {
          setSelected(null)
          setFilter(filter === metric.key ? '' : metric.key)
        }}>
          <strong>{students.reduce((sum, student) => sum + Number(student[metric.key] || 0), 0)}</strong> {metric.label}
        </button>)}
      </div>
      {filter === 'sem_uso' && students.some(student => student.sem_uso == null) && <p>Há alunos sem cobertura de medição para os sete dias completos.</p>}
      <h4>{active ? active.label : 'Alunos ativos'}</h4>
      {visible.length ? <ul>{visible.map(student => <li key={student.id_usuario}>
        <button type="button" aria-expanded={selected?.id_usuario === student.id_usuario} onClick={() => setSelected(student)}>{student.nome}</button>
        <span>{student.entregues} entregas · {student.atrasadas} atrasos</span>
      </li>)}</ul> : <p>Nenhum aluno neste grupo.</p>}
      {selected && (fullAccess
        ? <AccountUsagePanel key={selected.id_usuario} id={selected.id_usuario} name={selected.nome} onClose={() => setSelected(null)} />
        : <section aria-label={`Acompanhamento de ${selected.nome}`}>
          <h4>{selected.nome}</h4>
          <p>{selected.entregues} entregas e {selected.atrasadas} atividades atrasadas nesta turma.</p>
          <p>{selected.sem_uso == null ? 'Sem cobertura completa nos últimos 7 dias.' : Number(selected.sem_uso) === 1 ? 'Sem uso registrado nos últimos 7 dias.' : 'Uso registrado nos últimos 7 dias.'}</p>
          <button type="button" onClick={() => setSelected(null)}>Fechar acompanhamento</button>
        </section>)}
    </>}
  </section>
}

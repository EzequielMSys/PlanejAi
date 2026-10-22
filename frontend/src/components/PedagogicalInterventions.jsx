import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import collaborative from '../services/collaborativeService'
import './PedagogicalInterventions.css'

export default function PedagogicalInterventions() {
  const [alertas, setAlertas] = useState([])
  const [grupos, setGrupos] = useState([])
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [emAcao, setEmAcao] = useState(null)
  const [concluidos, setConcluidos] = useState([])

  useEffect(() => {
    Promise.allSettled([collaborative.alertas(), collaborative.grupos()]).then(([a, g]) => {
      if (a.status === 'fulfilled') setAlertas(Array.isArray(a.value) ? a.value : [])
      if (g.status === 'fulfilled') setGrupos(Array.isArray(g.value) ? g.value : [])
    })
  }, [])

  async function intervir(alerta) {
    const chave = `aluno-${alerta.id_usuario}`
    setEmAcao(chave)
    try {
      await collaborative.criarIntervencao({ idAluno: alerta.id_usuario, tipo: 'PLANO_REVISAO', motivo: (alerta.motivos || []).join('; '), plano: 'Revisar erros pendentes e realizar sessão adaptativa acompanhada.' })
      setConcluidos(atuais => [...atuais, chave])
      toast.success('Plano de intervenção registrado.')
    } catch (error) { toast.error(error?.response?.data?.message || 'Não foi possível registrar a intervenção.') }
    finally { setEmAcao(null) }
  }
  async function criar(grupo) {
    const chave = `grupo-${grupo.disciplina}-${grupo.competencia}`
    setEmAcao(chave)
    try {
      await collaborative.criarGrupo({ nome: `Reforço · ${grupo.competencia}`, disciplina: grupo.disciplina, competencia: grupo.competencia, aprendizes: grupo.aprendizes || [], mentores: grupo.mentores || [] })
      setConcluidos(atuais => [...atuais, chave])
      toast.success('Grupo de apoio criado.')
    } catch (error) { toast.error(error?.response?.data?.message || 'Não foi possível criar o grupo.') }
    finally { setEmAcao(null) }
  }

  const visiveis = mostrarTodos ? alertas : alertas.slice(0, 3)
  return <div className="pedagogy-interventions">
    <article className="pedagogy-intervention-panel"><header><div><span>ACOMPANHAMENTO INDIVIDUAL</span><h3>Estudantes que pedem atenção</h3></div><strong>{alertas.length}</strong></header>
      {visiveis.length ? <div className="pedagogy-alert-list">{visiveis.map((alerta, indice) => { const chave = `aluno-${alerta.id_usuario}`; const feito = concluidos.includes(chave); return <div key={alerta.id_usuario} className="pedagogy-alert"><span className="pedagogy-alert-index">{String(indice + 1).padStart(2, '0')}</span><div><b>{alerta.nome}</b><p>{(alerta.motivos || []).join(' · ') || 'Acompanhar a trajetória recente.'}</p><button type="button" onClick={() => intervir(alerta)} disabled={feito || emAcao === chave}>{feito ? 'Plano registrado' : emAcao === chave ? 'Registrando…' : 'Criar plano de intervenção'} <span aria-hidden="true">→</span></button></div></div> })}</div> : <p className="pedagogy-panel-empty">Nenhum alerta no momento. Continue acompanhando os indicadores de aprendizagem.</p>}
      {alertas.length > 3 && <button className="pedagogy-show-all" type="button" onClick={() => setMostrarTodos(valor => !valor)}>{mostrarTodos ? 'Mostrar menos' : `Ver todos os ${alertas.length} alertas`}</button>}
    </article>
    <article className="pedagogy-intervention-panel"><header><div><span>APRENDER EM CONJUNTO</span><h3>Grupos sugeridos</h3></div><strong>{grupos.length}</strong></header>
      {grupos.length ? <div className="pedagogy-group-list">{grupos.slice(0, mostrarTodos ? undefined : 3).map(grupo => { const chave = `grupo-${grupo.disciplina}-${grupo.competencia}`; const feito = concluidos.includes(chave); return <div key={chave} className="pedagogy-group"><span className="pedagogy-group-mark" aria-hidden="true">↗</span><div><b>{grupo.competencia}</b><p>{grupo.disciplina} · {(grupo.aprendizes || []).length} aluno(s) · {(grupo.mentores || []).length} mentor(es)</p><button type="button" onClick={() => criar(grupo)} disabled={feito || emAcao === chave}>{feito ? 'Grupo criado' : emAcao === chave ? 'Criando…' : 'Criar grupo de apoio'} <span aria-hidden="true">→</span></button></div></div> })}</div> : <p className="pedagogy-panel-empty">As sugestões de grupo aparecem depois que houver evidências suficientes das práticas.</p>}
    </article>
  </div>
}

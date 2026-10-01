import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import service from '../services/turmaService'
import { Button, EmptyState, Field, PageHeader, Surface } from '../components/ui/PlanejUI'
import './Turmas.css'

const initialForm = () => ({ nome: '', codigo: '', anoLetivo: new Date().getFullYear(), descricao: '', disciplinas: '' })

export default function Turmas() {
  const { isGestor } = useAuth()
  const [turmas, setTurmas] = useState([])
  const [selected, setSelected] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try { setTurmas(await service.listar()) }
    catch { toast.error('Não foi possível carregar as turmas.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    if (isGestor) service.candidatos().then(setCandidatos).catch(() => {})
  }, [isGestor])

  async function create(event) {
    event.preventDefault()
    try {
      await service.criar({ ...form, disciplinas: form.disciplinas.split(',').map((item) => item.trim()).filter(Boolean) })
      setForm(initialForm())
      await load()
      toast.success('Turma criada.')
    } catch (error) { toast.error(error.response?.data?.message || 'Não foi possível criar.') }
  }

  async function open(id) {
    try { setSelected(await service.detalhes(id)) }
    catch { toast.error('Não foi possível abrir os detalhes da turma.') }
  }

  async function add(idUsuario, papel) {
    try {
      setSelected(await service.adicionar(selected.id_turma, { idUsuario, papel }))
      toast.success('Participante adicionado.')
    } catch (error) { toast.error(error.response?.data?.message || 'Não foi possível vincular.') }
  }

  return (
    <main className="pj-page classes-page">
      <div className="pj-wrap">
        <PageHeader eyebrow="Comunidade de aprendizagem" title="Turmas com contexto, não só listas." description="Acompanhe disciplinas, docentes e alunos em um espaço com acesso controlado e pronto para receber atividades e avisos." icon="T+" />

        <section className="classes-layout">
          <div className="class-list">
            {loading && <Surface className="class-loading">Carregando suas turmas…</Surface>}
            {!loading && !turmas.length && <EmptyState eyebrow="Primeiro espaço" title="Nenhuma turma vinculada ainda." description="Crie a primeira turma para organizar alunos, professores, atividades e comunicação." icon="T" />}
            {turmas.map((turma) => (
              <button type="button" onClick={() => open(turma.id_turma)} key={turma.id_turma} className="class-card" data-selected={selected?.id_turma === turma.id_turma}>
                <span className="class-card-code">{turma.codigo || 'SEM CÓDIGO'} · {turma.ano_letivo}</span>
                <strong>{turma.nome}</strong>
                <small>{turma.disciplinas?.map((item) => item.disciplina).join(' · ') || 'Disciplinas ainda não definidas'}</small>
                <b>{turma.total_alunos || 0} alunos <i>→</i></b>
              </button>
            ))}

            {selected && <Surface as="article" className="class-details">
              <header><div><span className="ui-eyebrow">{selected.codigo || 'Turma'}</span><h2>{selected.nome}</h2></div><Button variant="quiet" onClick={() => setSelected(null)}>Fechar</Button></header>
              <div className="class-people-grid">
                <section><h3>Docentes <span>{selected.docentes?.length || 0}</span></h3>{selected.docentes?.map((item) => <p key={item.id_usuario}><i>{item.nome?.charAt(0)}</i><span><b>{item.nome}</b><small>{item.papel}</small></span></p>)}</section>
                <section><h3>Alunos <span>{selected.alunos?.length || 0}</span></h3>{selected.alunos?.map((item) => <p key={item.id_usuario}><i>{item.nome?.charAt(0)}</i><span><b>{item.nome}</b><small>{item.email}</small></span></p>)}</section>
              </div>
              {isGestor && <section className="class-candidates"><h3>Adicionar participante</h3><p>Selecione uma pessoa para criar o vínculo com esta turma.</p><div>{candidatos.slice(0, 40).map((item) => <button type="button" onClick={() => add(item.id_usuario, item.tipo === 'aluno' ? 'ALUNO' : 'DOCENTE')} key={item.id_usuario}><i>{item.nome?.charAt(0)}</i><span><b>{item.nome}</b><small>{item.tipo}</small></span><strong>+</strong></button>)}</div></section>}
            </Surface>}
          </div>

          {isGestor && <Surface as="form" onSubmit={create} className="class-form">
            <div><span className="ui-eyebrow">Novo espaço</span><h2>Criar turma</h2><p>Você poderá adicionar participantes e atividades logo depois.</p></div>
            <Field label="Nome da turma"><input required placeholder="Ex.: 3º ano A" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></Field>
            <div className="class-form-row"><Field label="Código"><input placeholder="Ex.: 3A-2026" value={form.codigo} onChange={(event) => setForm({ ...form, codigo: event.target.value })} /></Field><Field label="Ano letivo"><input type="number" min="2020" max="2100" value={form.anoLetivo} onChange={(event) => setForm({ ...form, anoLetivo: event.target.value })} /></Field></div>
            <Field label="Descrição"><textarea placeholder="Objetivo ou contexto da turma" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /></Field>
            <Field label="Disciplinas" hint="Separe os nomes por vírgulas."><input placeholder="Matemática, Física, Química" value={form.disciplinas} onChange={(event) => setForm({ ...form, disciplinas: event.target.value })} /></Field>
            <Button type="submit">Criar turma <span>→</span></Button>
          </Surface>}
        </section>
      </div>
    </main>
  )
}

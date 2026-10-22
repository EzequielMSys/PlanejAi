import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import service from '../services/turmaService'
import { Button, EmptyState, Field, Surface } from '../components/ui/PlanejUI'
import './Turmas.css'

const initialForm = () => ({ nome: '', codigo: '', anoLetivo: new Date().getFullYear(), descricao: '', disciplinas: '' })

export default function Turmas() {
  const { isGestor } = useAuth()
  const [turmas, setTurmas] = useState([])
  const [selected, setSelected] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const load = async () => {
    try { const resultado = await service.listar(); setTurmas(Array.isArray(resultado) ? resultado : []) }
    catch { toast.error('Não foi possível carregar as turmas.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    if (isGestor) service.candidatos().then(setCandidatos).catch(() => {})
  }, [isGestor])

  async function create(event) {
    event.preventDefault()
    setSalvando(true)
    try {
      await service.criar({ ...form, disciplinas: form.disciplinas.split(',').map((item) => item.trim()).filter(Boolean) })
      setForm(initialForm())
      await load()
      setCriando(false)
      toast.success('Turma criada.')
    } catch (error) { toast.error(error.response?.data?.message || 'Não foi possível criar.') }
    finally { setSalvando(false) }
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

  const turmasVisiveis = turmas.filter(turma => `${turma.nome || ''} ${turma.codigo || ''} ${(turma.disciplinas || []).map(item => item.disciplina || item).join(' ')}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')))
  const totalAlunos = turmas.reduce((total, turma) => total + Number(turma.total_alunos || 0), 0)

  return (
    <main className="pj-page classes-page">
      <div className="pj-wrap">
        <header className="classes-hero"><div><span className="classes-eyebrow">PLANEJAI · COMUNIDADE DE APRENDIZAGEM</span><h1>Turmas que aproximam pessoas e estudos.</h1><p>Organize disciplinas, acompanhe participantes e prepare um espaço para atividades e avisos.</p><div className="classes-hero-facts"><span><strong>{turmas.length}</strong> {turmas.length === 1 ? 'turma' : 'turmas'}</span><span><strong>{totalAlunos}</strong> alunos vinculados</span></div></div><div className="classes-hero-action"><span>SEU PRÓXIMO PASSO</span><p>{turmas.length ? 'Abra uma turma para ver quem participa e ampliar a comunidade.' : 'Crie a primeira turma e convide seus estudantes.'}</p>{isGestor && <button type="button" onClick={() => setCriando(valor => !valor)} aria-expanded={criando}>{criando ? 'Fechar formulário' : 'Criar turma'} <b aria-hidden="true">↗</b></button>}</div></header>

        {isGestor && criando && <Surface as="form" onSubmit={create} className="class-form">
          <header><div><span className="classes-eyebrow">NOVO ESPAÇO</span><h2>Crie uma turma</h2><p>Comece pelo essencial. Participantes e atividades podem ser adicionados depois.</p></div><button type="button" onClick={() => setCriando(false)} aria-label="Fechar formulário de criação">×</button></header>
          <div className="class-form-fields"><Field label="Nome da turma"><input required placeholder="Ex.: 3º ano A" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></Field><Field label="Código"><input placeholder="Ex.: 3A-2026" value={form.codigo} onChange={(event) => setForm({ ...form, codigo: event.target.value })} /></Field><Field label="Ano letivo"><input type="number" min="2020" max="2100" value={form.anoLetivo} onChange={(event) => setForm({ ...form, anoLetivo: event.target.value })} /></Field><Field label="Disciplinas" hint="Separe os nomes por vírgulas."><input placeholder="Matemática, Física, Química" value={form.disciplinas} onChange={(event) => setForm({ ...form, disciplinas: event.target.value })} /></Field><Field label="Descrição"><textarea placeholder="Objetivo ou contexto da turma" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /></Field></div>
          <div className="class-form-actions"><button type="button" onClick={() => setCriando(false)}>Cancelar</button><Button type="submit" disabled={salvando}>{salvando ? 'Criando…' : 'Criar turma'} <span>→</span></Button></div>
        </Surface>}

        <section className="classes-layout" aria-label="Turmas cadastradas">
          <div className="class-list">
            <div className="classes-list-heading"><div><span className="classes-eyebrow">SEUS ESPAÇOS</span><h2>Encontre a turma certa</h2><p>Escolha uma turma para ver docentes, estudantes e detalhes.</p></div><label>Buscar turma<input type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Nome, código ou disciplina" /></label></div>
            {loading && <Surface className="class-loading">Carregando suas turmas…</Surface>}
            {!loading && !turmas.length && <EmptyState eyebrow="Primeiro espaço" title="Nenhuma turma vinculada ainda." description="Crie a primeira turma para organizar alunos, professores, atividades e comunicação." icon="T" />}
            {!loading && turmas.length > 0 && !turmasVisiveis.length && <p className="classes-no-results">Nenhuma turma corresponde à busca. Tente outro nome ou disciplina.</p>}
            <div className="classes-card-grid">{turmasVisiveis.map((turma) => (
              <button type="button" onClick={() => open(turma.id_turma)} key={turma.id_turma} className="class-card" data-selected={selected?.id_turma === turma.id_turma} aria-expanded={selected?.id_turma === turma.id_turma}>
                <span className="class-card-top"><span className="class-card-code">{turma.codigo || 'SEM CÓDIGO'} · {turma.ano_letivo}</span><i aria-hidden="true">↗</i></span><strong>{turma.nome}</strong><small>{turma.disciplinas?.map((item) => item.disciplina || item).join(' · ') || 'Disciplinas ainda não definidas'}</small><span className="class-card-footer"><b>{turma.total_alunos || 0} {Number(turma.total_alunos) === 1 ? 'aluno' : 'alunos'}</b><span>{selected?.id_turma === turma.id_turma ? 'Detalhes abertos' : 'Abrir turma'}</span></span>
              </button>
            ))}</div>

            {selected && <Surface as="article" className="class-details">
              <header><div><span className="ui-eyebrow">{selected.codigo || 'Turma'}</span><h2>{selected.nome}</h2></div><Button variant="quiet" onClick={() => setSelected(null)}>Fechar</Button></header>
              <div className="class-people-grid">
                <section><h3>Docentes <span>{selected.docentes?.length || 0}</span></h3>{selected.docentes?.map((item) => <p key={item.id_usuario}><i>{item.nome?.charAt(0)}</i><span><b>{item.nome}</b><small>{item.papel}</small></span></p>)}</section>
                <section><h3>Alunos <span>{selected.alunos?.length || 0}</span></h3>{selected.alunos?.map((item) => <p key={item.id_usuario}><i>{item.nome?.charAt(0)}</i><span><b>{item.nome}</b><small>{item.email}</small></span></p>)}</section>
              </div>
              {isGestor && <section className="class-candidates"><h3>Adicionar participante</h3><p>Selecione uma pessoa para criar o vínculo com esta turma.</p><div>{candidatos.slice(0, 40).map((item) => <button type="button" onClick={() => add(item.id_usuario, item.tipo === 'aluno' ? 'ALUNO' : 'DOCENTE')} key={item.id_usuario}><i>{item.nome?.charAt(0)}</i><span><b>{item.nome}</b><small>{item.tipo}</small></span><strong>+</strong></button>)}</div></section>}
            </Surface>}
          </div>
        </section>
      </div>
    </main>
  )
}

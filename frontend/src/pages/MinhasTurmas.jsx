import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import turmaService from '../services/turmaService'
import { PageHeader, Surface, Button, EmptyState, StatCard, StatGrid, Loading, TextLink } from '../components/ui/PlanejUI'
import { EntrarComCodigo } from '../components/EntrarComCodigo'

// Onde o aluno entra por código, como no Classroom. Fora daqui, não há como
// descobrir a turma: o professor precisa gerar o código ou um convite.
export default function MinhasTurmas() {
  const [turmas, setTurmas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [formAberto, setFormAberto] = useState(false)

  async function carregar() {
    try {
      const dados = await turmaService.minhas()
      setTurmas(Array.isArray(dados) ? dados : [])
    } catch {
      toast.error('Não foi possível carregar suas turmas.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const totais = turmas.reduce(
    (acc, t) => ({
      pendentes: acc.pendentes + Number(t.pendentes || 0),
      feitas: acc.feitas + Number(t.feitas || 0)
    }),
    { pendentes: 0, feitas: 0 }
  )

  return (
    <div className="minhas-turmas">
      <PageHeader
        eyebrow="Minhas turmas"
        title="As salas onde você estuda"
        description="Entre com o código que o professor passou. Tudo que ele publicar aparece aqui."
        actions={
          <Button onClick={() => setFormAberto(v => !v)} aria-expanded={formAberto}>
            {formAberto ? 'Cancelar' : 'Entrar com código'}
          </Button>
        }
      />

      {formAberto && (
        <EntrarComCodigo
          aoEntrar={() => { setFormAberto(false); carregar() }}
        />
      )}

      {carregando ? (
        <Loading>Carregando suas turmas…</Loading>
      ) : turmas.length === 0 ? (
        <EmptyState
          eyebrow="Nenhuma turma ainda"
          title="Você ainda não entrou em nenhuma turma"
          description="Peça o código ao professor e use o botão acima. Também dá para usar um convite."
          action={() => setFormAberto(true)}
          actionLabel="Entrar com código"
          icon="◈"
        />
      ) : (
        <>
          <StatGrid>
            <StatCard label="Turmas" value={turmas.length} />
            <StatCard label="Pendentes" value={totais.pendentes} tone={totais.pendentes ? 'strong' : 'default'} />
            <StatCard label="Já entregues" value={totais.feitas} />
          </StatGrid>

          <ul className="minhas-turmas-lista">
            {turmas.map(turma => (
              <li key={turma.id_turma}>
                <TurmaCard turma={turma} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function TurmaCard({ turma }) {
  const pendentes = Number(turma.pendentes || 0)
  const feitas = Number(turma.feitas || 0)
  const total = pendentes + feitas
  // A barra mostra quanto da turma já foi vencido. Com zero atividade, 0/0
  // seria divisão por zero; tratar como 0% é o que o usuário espera ver.
  const progresso = total ? Math.round((feitas / total) * 100) : 0

  return (
    <Surface as="article" className="minha-turma">
      <div className="minha-turma-topo">
        <div>
          <h2>{turma.nome}</h2>
          <p className="minha-turma-docente">
            {turma.responsavel ? `Responsável: ${turma.responsavel}` : 'Sem responsável definido'}
            {turma.ano_letivo ? ` · ${turma.ano_letivo}` : ''}
          </p>
        </div>
        <TextLink to={`/minhas-turmas/${turma.id_turma}`}>Abrir turma</TextLink>
      </div>

      {turma.descricao && <p className="minha-turma-descricao">{turma.descricao}</p>}

      <div
        className="minha-turma-progresso"
        role="progressbar"
        aria-valuenow={progresso}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso em ${turma.nome}`}
      >
        <span style={{ width: `${progresso}%` }} />
      </div>

      <p className="minha-turma-resumo">
        {pendentes > 0
          ? `${pendentes} ${pendentes === 1 ? 'atividade pendente' : 'atividades pendentes'}`
          : 'Nada pendente por aqui.'}
        {total > 0 && ` · ${feitas} de ${total} entregues`}
      </p>
    </Surface>
  )
}

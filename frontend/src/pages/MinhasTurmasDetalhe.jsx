import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import turmaService from '../services/turmaService'
import { PageHeader, Surface, Button, EmptyState, StatCard, StatGrid, Loading, TextLink } from '../components/ui/PlanejUI'

const ABAS = [
  { chave: 'pendentes', rotulo: 'Para fazer' },
  { chave: 'concluidas', rotulo: 'Feitas' },
  { chave: 'avisos', rotulo: 'Avisos' },
]

export default function MinhasTurmasDetalhe() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [turma, setTurma] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState('pendentes')

  const carregar = useCallback(async () => {
    try {
      const dados = await turmaService.minhaTurma(id)
      setTurma(dados)
      setErro('')
    } catch (falha) {
      setErro(falha.response?.data?.message || 'Não foi possível carregar esta turma.')
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function sairDaTurma() {
    if (!window.confirm(`Sair de "${turma.nome}"? Você poderá entrar de novo com o código.`)) return
    try {
      await turmaService.sair(id)
      toast.success('Você saiu da turma.')
      navegar('/minhas-turmas')
    } catch (falha) {
      toast.error(falha.response?.data?.message || 'Não foi possível sair da turma.')
    }
  }

  if (carregando) return <Loading>Carregando a turma…</Loading>

  if (erro || !turma) {
    return (
      <EmptyState
        eyebrow="Turma indisponível"
        title={erro || 'Turma não encontrada'}
        description="Você pode ter saído dela, ou o vínculo ainda não foi liberado."
        action={() => navegar('/minhas-turmas')}
        actionLabel="Voltar para minhas turmas"
        icon="◈"
      />
    )
  }

  const contagens = {
    pendentes: turma.pendentes.length,
    concluidas: turma.concluidas.length,
    avisos: turma.avisos.length,
  }


  return (
    <div className="minha-turma-detalhe">
      <PageHeader
        eyebrow={turma.ano_letivo ? `${turma.ano_letivo}` : 'Turma'}
        title={turma.nome}
        description={turma.descricao || undefined}
        actions={
          <>
            <TextLink to="/minhas-turmas">Minhas turmas</TextLink>
            <Button variant="secondary" onClick={sairDaTurma}>Sair da turma</Button>
          </>
        }
      />

      <dl className="minha-turma-meta">
        {turma.responsavel && (
          <div><dt>Responsável</dt><dd>{turma.responsavel}</dd></div>
        )}
        {turma.docentes && (
          <div><dt>Docentes</dt><dd>{turma.docentes}</dd></div>
        )}
        {turma.disciplinas?.length > 0 && (
          <div><dt>Disciplinas</dt><dd>{turma.disciplinas.join(', ')}</dd></div>
        )}
      </dl>

      <StatGrid>
        <StatCard label="Pendentes" value={contagens.pendentes} tone={contagens.pendentes ? 'strong' : 'default'} />
        <StatCard label="Entregues" value={contagens.concluidas} />
        <StatCard label="Avisos" value={contagens.avisos} />
      </StatGrid>

      {/* aria-selected e aria-controls ligam o botão à região que ele abre:
          sem isso, um leitor de tela não anuncia qual seção está visível. */}
      <div className="abas" role="tablist" aria-label="Conteúdo da turma">
        {ABAS.map(item => (
          <button
            key={item.chave}
            type="button"
            role="tab"
            id={`aba-${item.chave}`}
            aria-selected={aba === item.chave}
            aria-controls="painel-aba"
            className={`aba ${aba === item.chave ? 'aba-ativa' : ''}`}
            onClick={() => setAba(item.chave)}
          >
            {item.rotulo}
            <span className="aba-contagem">{contagens[item.chave]}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id="painel-aba" aria-labelledby={`aba-${aba}`} tabIndex={0} className="painel-aba">
        {aba === 'pendentes' && <ListaAtividades atividades={turma.pendentes} vazio="Nenhuma atividade pendente. Bom trabalho." />}
        {aba === 'concluidas' && <ListaAtividades atividades={turma.concluidas} vazio="Você ainda não entregou nada aqui." />}
        {aba === 'avisos' && <ListaAvisos avisos={turma.avisos} />}
      </div>
    </div>
  )
}

function ListaAtividades({ atividades, vazio }) {
  if (!atividades.length) return <p className="pn-dica">{vazio}</p>
  return (
    <ul className="turma-atividades">
      {atividades.map(atividade => {
        const atrasada = atividade.prazo && new Date(atividade.prazo) < new Date() && !atividade.meu_status
        return (
          <li key={atividade.id_atividade}>
            <Surface as="article" className="turma-atividade">
              <div className="turma-atividade-topo">
                <h2>{atividade.titulo}</h2>
                {atividade.meu_status === 'CORRIGIDA' && <span className="selo selo-ok">Corrigida</span>}
                {atividade.meu_status === 'ENTREGUE' && <span className="selo">Entregue</span>}
                {atrasada && <span className="selo selo-alerta">Atrasada</span>}
              </div>
              {atividade.descricao && <p>{atividade.descricao}</p>}
              <p className="turma-atividade-prazo">
                {atividade.prazo ? `Prazo: ${new Date(atividade.prazo).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}
                {atividade.minha_nota != null && ` · Nota: ${atividade.minha_nota}`}
              </p>
              {atividade.meu_feedback && (
                <p className="turma-atividade-feedback"><strong>Feedback:</strong> {atividade.meu_feedback}</p>
              )}
            </Surface>
          </li>
        )
      })}
    </ul>
  )
}

function ListaAvisos({ avisos }) {
  if (!avisos.length) return <p className="pn-dica">Nenhum aviso nesta turma ainda.</p>
  return (
    <ul className="turma-avisos">
      {avisos.map(aviso => (
        <li key={aviso.id_aviso}>
          <Surface as="article" className="turma-aviso">
            <h2>{aviso.titulo}</h2>
            <p>{aviso.mensagem}</p>
            <p className="turma-aviso-meta">
              {aviso.criador_nome ? `${aviso.criador_nome} · ` : ''}
              {new Date(aviso.criado_em).toLocaleDateString('pt-BR')}
            </p>
          </Surface>
        </li>
      ))}
    </ul>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import inteligencia from '../services/inteligenciaService'
import RecoveryState from './RecoveryState'

const formatarTempo = (totalSegundos) => {
  const seguro = Math.max(0, totalSegundos)
  const horas = Math.floor(seguro / 3600)
  const minutos = Math.floor((seguro % 3600) / 60)
  const segundos = seguro % 60
  return [horas, minutos, segundos].map((item) => String(item).padStart(2, '0')).join(':')
}

const questoesNoNivel = (item, dificuldade) => {
  if (!item) return 0
  const campos = { FACIL: 'questoes_faceis', MEDIA: 'questoes_medias', DIFICIL: 'questoes_dificeis' }
  return Number(item[dificuldade === 'TODAS' ? 'questoes_disponiveis' : campos[dificuldade]] || 0)
}
const niveis = [
  { id: 'TODAS', nome: 'Equilibrado', descricao: '30% fundamentos · 40% intermediário · 30% avançado' },
  { id: 'FACIL', nome: 'Fundamentos', descricao: 'Conceitos essenciais e aplicação direta' },
  { id: 'MEDIA', nome: 'Intermediário', descricao: 'Interpretação e combinação de conceitos' },
  { id: 'DIFICIL', nome: 'Avançado', descricao: 'Mais etapas e raciocínio aprofundado' }
]

export default function ExamArena({ onSessionChange }) {
  const [catalogo, setCatalogo] = useState([])
  const [historico, setHistorico] = useState([])
  const [config, setConfig] = useState({ idCatalogo: '', dificuldade: 'TODAS', quantidade: 45 })
  const [simulado, setSimulado] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [revisao, setRevisao] = useState([])
  const [resultado, setResultado] = useState(null)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('salvo')
  const [agora, setAgora] = useState(Date.now())
  const primeiraSincronizacao = useRef(true)

  const carregar = async () => {
    setLoading(true)
    try {
      const [provas, tentativas] = await Promise.all([inteligencia.catalogoProvas(), inteligencia.historicoSimulados()])
      if (!Array.isArray(provas) || !Array.isArray(tentativas)) throw new Error('Resposta inválida ao consultar as provas.')
      setCatalogo(provas)
      setHistorico(tentativas)
      setLoadError(false)
      setConfig((atual) => ({ ...atual, idCatalogo: atual.idCatalogo || String(provas[0]?.id_catalogo || '') }))
    } catch {
      setLoadError(true)
      toast.error('Não foi possível carregar o catálogo de simulados.')
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])
  useEffect(() => { onSessionChange?.(Boolean(simulado)) }, [simulado, onSessionChange])

  useEffect(() => {
    if (!simulado || resultado) return undefined
    const timer = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [simulado, resultado])

  useEffect(() => {
    if (!simulado || resultado) return undefined
    if (primeiraSincronizacao.current) {
      primeiraSincronizacao.current = false
      return undefined
    }
    setSaveStatus('salvando')
    const timer = window.setTimeout(async () => {
      try {
        await inteligencia.salvarProgressoSimulado(simulado.idSimulado, respostas, revisao)
        setSaveStatus('salvo')
      } catch {
        setSaveStatus('erro')
      }
    }, 550)
    return () => window.clearTimeout(timer)
  }, [respostas, resultado, revisao, simulado])

  const iniciarSessao = (data) => {
    primeiraSincronizacao.current = true
    setSimulado(data)
    setRespostas(data.respostas || {})
    setRevisao(data.revisao || [])
    setResultado(null)
    setIndiceAtual(0)
    setSaveStatus('salvo')
    setAgora(Date.now())
  }

  const gerar = async () => {
    try {
      setBusyId('novo')
      const disponivel = questoesNoNivel(catalogo.find((item) => String(item.id_catalogo) === String(config.idCatalogo)), config.dificuldade)
      if (!disponivel) return toast.error('Essa coleção ainda não tem questões neste nível. Escolha outra.')
      const quantidade = Math.min(disponivel, Math.max(1, Number(config.quantidade) || 45))
      setConfig((atual) => ({ ...atual, quantidade }))
      iniciarSessao(await inteligencia.gerarSimulado({ ...config, quantidade }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível gerar o simulado.')
    } finally { setBusyId(null) }
  }

  const retomar = async (idSimulado) => {
    try {
      setBusyId(idSimulado)
      iniciarSessao(await inteligencia.obterSimulado(idSimulado))
      toast.success('Tentativa restaurada.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível retomar a tentativa.')
    } finally { setBusyId(null) }
  }

  const concluir = async () => {
    const primeiraPendente = simulado.questoes.findIndex((item) => respostas[item.id_questao] === undefined)
    if (primeiraPendente >= 0) { setIndiceAtual(primeiraPendente); return toast.error('Falta responder esta questão antes de corrigir.') }
    try {
      setBusyId('concluir')
      const data = await inteligencia.concluirSimulado(simulado.idSimulado, respostas, revisao)
      setResultado(data)
      setSaveStatus('salvo')
      await carregar()
      toast.success(`Simulado concluído: ${data.nota}%`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível corrigir o simulado.')
    } finally { setBusyId(null) }
  }

  const respondidas = Object.keys(respostas).length
  const marcarParaRevisao = (idQuestao) => setRevisao((atuais) => atuais.includes(idQuestao) ? atuais.filter((id) => id !== idQuestao) : [...atuais, idQuestao])
  const catalogoSelecionado = catalogo.find((item) => String(item.id_catalogo) === String(config.idCatalogo))
  const maximoSelecionado = Math.min(180, questoesNoNivel(catalogoSelecionado, config.dificuldade))
  const progresso = simulado?.questoes.length ? (respondidas / simulado.questoes.length) * 100 : 0
  const questaoAtual = simulado?.questoes[indiceAtual]
  const correcaoAtual = resultado?.correcoes.find((item) => Number(item.idQuestao) === Number(questaoAtual?.id_questao))
  const indicesNavegacao = simulado ? [...new Set([0, simulado.questoes.length - 1, ...Array.from({ length: 7 }, (_, deslocamento) => indiceAtual + deslocamento - 3)].filter((indice) => indice >= 0 && indice < simulado.questoes.length))].sort((a, b) => a - b) : []
  const tempoDecorrido = useMemo(() => {
    if (!simulado?.iniciadoEm) return 0
    return Math.floor((agora - new Date(simulado.iniciadoEm).getTime()) / 1000)
  }, [agora, simulado?.iniciadoEm])

  if (loading) return <section className="exam-arena exam-loading">Preparando laboratório de provas…</section>
  if (loadError && !simulado) return <RecoveryState title="Não conseguimos consultar suas provas." onRetry={carregar}>Seu catálogo e suas tentativas não puderam ser carregados. Tente novamente para retomar de onde parou.</RecoveryState>

  return (
    <section className="exam-arena">
      <header><div><span>LABORATÓRIO DE PROVAS</span><h2>Treine para a prova que você quer vencer.</h2><p>Escolha uma coleção, ajuste o nível e receba uma prova montada e corrigida dentro do PlanejAI.</p></div><strong>β</strong></header>

      {!simulado ? <>
        <div className="exam-catalog">
          {catalogo.map((item) => <button type="button" key={item.id_catalogo} data-selected={String(item.id_catalogo) === String(config.idCatalogo)} onClick={() => setConfig((atual) => ({ ...atual, idCatalogo: String(item.id_catalogo), quantidade: Math.min(Number(atual.quantidade) || 1, Math.max(1, questoesNoNivel(item, atual.dificuldade))) }))}><small>{item.instituicao} · {item.referencia_ano || 'Coleção'}</small><b>{item.titulo}</b><p>{item.descricao}</p><span>{item.questoes_disponiveis} questões disponíveis</span></button>)}
        </div>
        <div className="exam-builder">
          <div className="exam-levels" role="group" aria-label="Nível do simulado"><span>Escolha seu nível</span><div>{niveis.map((nivel) => { const disponiveis = questoesNoNivel(catalogoSelecionado, nivel.id); return <button type="button" key={nivel.id} aria-pressed={config.dificuldade === nivel.id} disabled={!disponiveis} onClick={() => setConfig((atual) => ({ ...atual, dificuldade: nivel.id, quantidade: Math.min(Number(atual.quantidade) || 1, disponiveis) }))}><strong>{nivel.nome}</strong><small>{nivel.descricao}</small><em>{disponiveis} questões</em></button> })}</div></div>
          <label>Questões<input type="number" min="1" max={maximoSelecionado} value={config.quantidade} onChange={(event) => setConfig({ ...config, quantidade: event.target.value })} /><small>até {maximoSelecionado} nesta coleção</small></label>
          <div className="exam-quantity-presets" aria-label="Quantidade de questões"><span>Formato</span>{[20, 45, 60, 90, 180].filter((quantidade) => quantidade <= maximoSelecionado).map((quantidade) => <button type="button" key={quantidade} data-selected={Number(config.quantidade) === quantidade} onClick={() => setConfig({ ...config, quantidade })}>{quantidade} questões</button>)}</div>
          <button type="button" disabled={!config.idCatalogo || maximoSelecionado === 0 || busyId === 'novo'} onClick={gerar}>{busyId === 'novo' ? 'Montando…' : maximoSelecionado === 0 ? 'Sem questões neste nível' : 'Gerar minha prova'} <span>→</span></button>
        </div>
        {historico.length > 0 && <div className="exam-history"><h3>Últimas tentativas</h3>{historico.slice(0, 5).map((item) => <div key={item.id_simulado}><span>{item.instituicao}</span><b>{item.titulo}</b><strong>{item.status === 'CONCLUIDO' ? `${Number(item.nota).toFixed(0)}%` : 'Em andamento'}</strong>{item.status === 'EM_ANDAMENTO' && <button type="button" disabled={busyId === item.id_simulado} onClick={() => retomar(item.id_simulado)}>{busyId === item.id_simulado ? 'Abrindo…' : 'Retomar'}</button>}</div>)}</div>}
      </> : <div className="exam-session">
        <div className="exam-session-title"><div><small>{simulado.catalogo.instituicao}</small><h3>{simulado.catalogo.titulo}</h3></div><div className="exam-session-metrics"><span>{respondidas}/{simulado.questoes.length} respondidas · {revisao.length} para revisar</span><b>{formatarTempo(tempoDecorrido)}</b><small className="exam-save-status" aria-live="polite">{saveStatus === 'salvando' ? 'Salvando…' : saveStatus === 'erro' ? 'Falha ao salvar' : 'Progresso salvo'}</small></div></div>
        <div className="exam-progress" aria-label={`${Math.round(progresso)}% respondido`}><i style={{ width: `${progresso}%` }} /></div>
        <nav className="exam-question-nav" aria-label="Navegação entre questões">{indicesNavegacao.map((index, posicao) => { const questao = simulado.questoes[index]; return <span key={questao.id_questao} className="exam-nav-item">{posicao > 0 && index - indicesNavegacao[posicao - 1] > 1 && <span aria-hidden="true">…</span>}<button type="button" aria-label={`Questão ${index + 1}${respostas[questao.id_questao] !== undefined ? ', respondida' : ''}${revisao.includes(questao.id_questao) ? ', marcada para revisão' : ''}`} aria-current={indiceAtual === index ? 'step' : undefined} data-current={indiceAtual === index} data-answered={respostas[questao.id_questao] !== undefined} data-review={revisao.includes(questao.id_questao)} onClick={() => setIndiceAtual(index)}>{index + 1}</button></span> })}</nav>
        {questaoAtual && <fieldset key={questaoAtual.id_questao} disabled={Boolean(resultado)} data-correct={correcaoAtual ? String(correcaoAtual.acertou) : undefined}><legend><span>{indiceAtual + 1}</span><div><small>{questaoAtual.disciplina} · {questaoAtual.dificuldade}</small>{questaoAtual.enunciado}</div></legend><button type="button" className="exam-review-toggle" aria-pressed={revisao.includes(questaoAtual.id_questao)} onClick={() => marcarParaRevisao(questaoAtual.id_questao)}>{revisao.includes(questaoAtual.id_questao) ? '✓ Marcada para revisar' : 'Marcar para revisar'}</button><div>{questaoAtual.alternativas.map((alternativa, indice) => <label key={`${questaoAtual.id_questao}-${indice}`}><input type="radio" name={`exam-${questaoAtual.id_questao}`} checked={Number(respostas[questaoAtual.id_questao]) === indice} onChange={() => setRespostas((atuais) => ({ ...atuais, [questaoAtual.id_questao]: indice }))} /><span><i>{String.fromCharCode(65 + indice)}</i>{alternativa}</span></label>)}</div>{correcaoAtual && <p>{correcaoAtual.acertou ? 'Resposta correta.' : `Resposta correta: ${String.fromCharCode(65 + correcaoAtual.respostaCorreta)}.`} {correcaoAtual.explicacao}</p>}</fieldset>}
        <div className="exam-session-actions"><button type="button" disabled={indiceAtual === 0} onClick={() => setIndiceAtual((atual) => atual - 1)}>← Anterior</button><button type="button" disabled={indiceAtual >= simulado.questoes.length - 1} onClick={() => setIndiceAtual((atual) => atual + 1)}>Próxima →</button></div>
        <footer>{resultado ? <><div><strong>{resultado.nota}%</strong><span>{resultado.acertos} de {resultado.total} acertos</span></div><div className="exam-result-breakdown"><b>Resultado por disciplina</b>{resultado.resumoPorDisciplina?.map((item) => <span key={item.disciplina}>{item.disciplina}: <strong>{item.percentual}%</strong> ({item.acertos}/{item.total})</span>)}</div><button type="button" onClick={() => { setSimulado(null); setResultado(null) }}>Novo simulado</button></> : <button type="button" disabled={busyId === 'concluir'} onClick={concluir}>{busyId === 'concluir' ? 'Corrigindo…' : 'Finalizar e corrigir'}</button>}</footer>
      </div>}
    </section>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function ExamArena({ area, onSessionChange }) {
  const [modalidade, setModalidade] = useState('colecao')
  const [busca, setBusca] = useState('')
  const [custom, setCustom] = useState(false)
  const [lumi, setLumi] = useState({ ano: '', disciplina: '', assunto: '', dificuldade: 'Equilibrado', quantidade: '10', formato: 'múltipla escolha' })
  const [catalogo, setCatalogo] = useState([])
  const [historico, setHistorico] = useState([])
  const [config, setConfig] = useState({ idCatalogo: '', dificuldade: 'TODAS', quantidade: 45 })
  const [simulado, setSimulado] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [revisao, setRevisao] = useState([])
  const [resultado, setResultado] = useState(null)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [catalogStatus, setCatalogStatus] = useState('loading')
  const [historyStatus, setHistoryStatus] = useState('loading')
  const [busyId, setBusyId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('salvo')
  const [agora, setAgora] = useState(Date.now())
  const primeiraSincronizacao = useRef(true)
  const sessionHeading = useRef(null)
  const requestLock = useRef(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!simulado) return
    sessionHeading.current?.scrollIntoView({ block: 'start' })
    sessionHeading.current?.focus({ preventScroll: true })
  }, [simulado])

  const carregarCatalogo = async () => {
    setCatalogStatus('loading')
    try {
      const provas = await inteligencia.catalogoProvas()
      if (!Array.isArray(provas)) throw new Error('Catálogo inválido.')
      setCatalogo(provas)
      setConfig(atual => {
        if (atual.idCatalogo || !provas.length) return atual
        return { ...atual, idCatalogo: String(provas[0].id_catalogo), quantidade: Math.min(atual.quantidade, questoesNoNivel(provas[0], atual.dificuldade)) }
      })
      setCatalogStatus('ready')
    } catch {
      setCatalogStatus('error')
    }
  }

  const carregarHistorico = async () => {
    setHistoryStatus('loading')
    try {
      const tentativas = await inteligencia.historicoSimulados()
      if (!Array.isArray(tentativas)) throw new Error('Histórico inválido.')
      setHistorico(tentativas)
      setHistoryStatus('ready')
    } catch {
      setHistoryStatus('error')
    }
  }

  useEffect(() => {
    carregarCatalogo()
    carregarHistorico()
  }, [])
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
    if (!data?.idSimulado || !data.catalogo || !Array.isArray(data.questoes) || !data.questoes.length) throw new Error('Tentativa inválida')
    primeiraSincronizacao.current = true
    setSimulado(data)
    setRespostas(data.respostas || {})
    setRevisao(data.revisao || [])
    setResultado(null)
    const pendente = data.questoes.findIndex(item => (data.respostas || {})[item.id_questao] === undefined)
    setIndiceAtual(Math.max(0, pendente))
    setSaveStatus('salvo')
    setAgora(Date.now())
  }

  const gerar = async () => {
    if (requestLock.current) return
    requestLock.current = true
    setActionError('')
    try {
      setBusyId('novo')
      const disponivel = questoesNoNivel(catalogo.find((item) => String(item.id_catalogo) === String(config.idCatalogo)), config.dificuldade)
      if (!disponivel) return toast.error('Essa coleção ainda não tem questões neste nível. Escolha outra.')
      const quantidade = Math.min(disponivel, Math.max(1, Number(config.quantidade) || 45))
      setConfig((atual) => ({ ...atual, quantidade }))
      iniciarSessao(await inteligencia.gerarSimulado({ ...config, quantidade }))
    } catch (error) {
      setActionError(error.response?.data?.message || 'Não foi possível montar sua prova. Suas escolhas foram mantidas; tente novamente.')
      toast.error(error.response?.data?.message || 'Não foi possível gerar o simulado.')
    } finally { setBusyId(null); requestLock.current = false }
  }

  const retomar = async (idSimulado) => {
    if (requestLock.current) return
    requestLock.current = true
    setActionError('')
    try {
      setBusyId(idSimulado)
      iniciarSessao(await inteligencia.obterSimulado(idSimulado))
      toast.success('Tentativa restaurada.')
    } catch (error) {
      setActionError(error.response?.data?.message || 'Não foi possível retomar sua prova. Tente novamente.')
      toast.error(error.response?.data?.message || 'Não foi possível retomar a tentativa.')
    } finally { setBusyId(null); requestLock.current = false }
  }

  const concluir = async () => {
    const primeiraPendente = simulado.questoes.findIndex((item) => respostas[item.id_questao] === undefined)
    if (primeiraPendente >= 0) { setIndiceAtual(primeiraPendente); return toast.error('Falta responder esta questão antes de corrigir.') }
    try {
      setBusyId('concluir')
      const data = await inteligencia.concluirSimulado(simulado.idSimulado, respostas, revisao)
      setResultado(data)
      setSaveStatus('salvo')
      await carregarHistorico()
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


  return (
    <section className="exam-arena">
      <ol className="exam-route" aria-label="Percurso da prova">{['Preparar', 'Responder', 'Conferir e revisar'].map((label, index) => <li key={label} aria-current={(resultado ? 2 : simulado ? 1 : 0) === index ? 'step' : undefined}><span>0{index + 1}</span>{label}</li>)}</ol>

      {!simulado ? <>
        {actionError && <p className="exam-action-error" role="alert">{actionError}</p>}
        {area === 'tentativas' ? (
          historyStatus === 'loading' ? <p role="status">Carregando tentativas…</p>
            : historyStatus === 'error' ? <RecoveryState title="Não foi possível carregar suas tentativas." onRetry={carregarHistorico}>Tente novamente para retomar de onde parou.</RecoveryState>
              : <section className="exam-attempts">
          <h2>Minhas tentativas</h2>
          {historico.some(item => item.status === 'EM_ANDAMENTO') && <p>Continue de onde parou. Suas respostas salvas serão recuperadas.</p>}
          {['EM_ANDAMENTO','CONCLUIDO'].map(status => <div className="exam-history" key={status}>
            <h3>{status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Concluídos'}</h3>
            {!historico.some(item => item.status === status) && <p>Nenhuma tentativa nesta situação.</p>}
            {historico.filter(item => item.status === status).map(item => <div key={item.id_simulado}>
              <span>{item.instituicao}</span><b>{item.titulo}</b>
              <span>{item.total_questoes != null && `${item.total_questoes} questões`}{item.iniciado_em && ` · ${new Date(item.iniciado_em).toLocaleDateString('pt-BR')}`}</span>
              {status === 'CONCLUIDO' ? <strong>{Number(item.nota).toFixed(0)}%{item.acertos != null && ` · ${item.acertos} acertos`}</strong> : <button type="button" disabled={busyId !== null} onClick={() => retomar(item.id_simulado)}>{busyId === item.id_simulado ? 'Abrindo…' : 'Retomar'}</button>}
            </div>)}
          </div>)}
        </section>) : <>
          <div className="exam-segments" role="group" aria-label="Modalidade de prática">
            <button type="button" aria-pressed={modalidade === 'colecao'} onClick={() => setModalidade('colecao')}>Por instituição ou vestibular</button>
            <button type="button" aria-pressed={modalidade === 'lumi'} onClick={() => setModalidade('lumi')}>Por disciplina e assunto · Lumi</button>
          </div>
          {modalidade === 'lumi' ? <div className="exam-builder exam-compact-fields">
            <h2>Prepare uma prática com a Lumi</h2>
            <p>O pedido abre no chat para revisão e envio. Esta prática é feita na conversa.</p>
            {[['ano','Ano escolar'],['disciplina','Disciplina'],['assunto','Assunto']].map(([id,label]) => <label key={id}>{label}<input maxLength={100} value={lumi[id]} onChange={event => setLumi({ ...lumi, [id]: event.target.value })}/></label>)}
            <label>Dificuldade<select value={lumi.dificuldade} onChange={event => setLumi({ ...lumi, dificuldade: event.target.value })}>{niveis.map(nivel => <option key={nivel.id}>{nivel.nome}</option>)}</select></label>
            <label>Quantidade<input type="number" min="1" max="20" value={lumi.quantidade} onChange={event => setLumi({ ...lumi, quantidade: event.target.value })}/></label>
            <label>Tipo de questão<select value={lumi.formato} onChange={event => setLumi({ ...lumi, formato: event.target.value })}>{['múltipla escolha','resposta aberta','verdadeiro ou falso'].map(formato => <option key={formato}>{formato}</option>)}</select></label>
            {lumi.ano.trim() && lumi.disciplina.trim() && lumi.assunto.trim() && Number.isInteger(Number(lumi.quantidade)) && Number(lumi.quantidade) >= 1 && Number(lumi.quantidade) <= 20 && <Link to="/lumi" state={{ perguntaInicial: `Prepare ${lumi.quantidade} questões originais de ${lumi.formato} para ${lumi.ano}, de ${lumi.disciplina} sobre ${lumi.assunto}, em nível ${lumi.dificuldade}. Confira se os dados são suficientes e guarde o gabarito até eu tentar. Depois, comente minhas respostas e sugira revisões.` }}>Preparar pedido na Lumi →</Link>}
          </div> : catalogStatus === 'loading' ? <p role="status">Carregando coleções…</p>
            : catalogStatus === 'error' ? <RecoveryState title="Não foi possível carregar as coleções." onRetry={carregarCatalogo}>Tente novamente para consultar o catálogo.</RecoveryState>
              : <div className="exam-builder exam-compact-fields">
            <h2>Escolha sua coleção.</h2>
            <p>Os simulados do PlanejAI são atividades autorais, inspiradas em diferentes perfis de avaliação.</p>
            <label>Buscar coleção<input type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Ex.: ENEM ou FUVEST"/></label>
            <label>Coleção<select value={config.idCatalogo} onChange={event => {
              const idCatalogo = event.target.value
              const item = catalogo.find(entry => String(entry.id_catalogo) === idCatalogo)
              setConfig(atual => ({ ...atual, idCatalogo, quantidade: Math.min(Number(atual.quantidade) || 1, Math.max(1, questoesNoNivel(item, atual.dificuldade))) }))
            }}>
              <option value="">Selecione uma coleção</option>
              {catalogo.filter(item => String(item.id_catalogo) === config.idCatalogo || `${item.instituicao} ${item.titulo}`.toLowerCase().includes(busca.trim().toLowerCase())).map(item => <option key={item.id_catalogo} value={item.id_catalogo}>{item.instituicao} · {item.titulo}</option>)}
            </select></label>
            {catalogoSelecionado && <>
              <p>{catalogoSelecionado.descricao}</p>
              <label>Dificuldade<select value={config.dificuldade} onChange={event => {
                const dificuldade = event.target.value
                setConfig(atual => ({ ...atual, dificuldade, quantidade: Math.min(Number(atual.quantidade) || 1, questoesNoNivel(catalogoSelecionado, dificuldade)) }))
              }}>{niveis.map(nivel => <option key={nivel.id} value={nivel.id} disabled={!questoesNoNivel(catalogoSelecionado, nivel.id)}>{nivel.nome}</option>)}</select><small>{niveis.find(nivel => nivel.id === config.dificuldade)?.descricao}</small></label>
              <label>Quantidade<select value={custom || ![20,45,60,90,180].includes(Number(config.quantidade)) ? 'custom' : config.quantidade} onChange={event => {
                const value = event.target.value
                setCustom(value === 'custom')
                if (value !== 'custom') setConfig({ ...config, quantidade: Number(value) })
              }}>{[20,45,60,90,180].map(value => <option key={value} value={value} disabled={value > maximoSelecionado}>{value} questões</option>)}<option value="custom">Personalizada</option></select></label>
              {(custom || ![20,45,60,90,180].includes(Number(config.quantidade))) && <label>Questões<input type="number" min="1" max={maximoSelecionado} value={config.quantidade} onChange={event => setConfig({ ...config, quantidade: event.target.value })}/></label>}
              <p role="status">{maximoSelecionado} questões disponíveis neste nível{Number(config.quantidade) > maximoSelecionado ? '. Escolha uma quantidade dentro do limite.' : '.'}</p>
              <button type="button" disabled={!Number.isInteger(Number(config.quantidade)) || Number(config.quantidade) < 1 || Number(config.quantidade) > maximoSelecionado || busyId === 'novo'} onClick={gerar}>{busyId === 'novo' ? 'Montando…' : 'Começar simulado'} <span aria-hidden="true">→</span></button>
            </>}
          </div>}
        </>}
      </> : <div className="exam-session">
        <h2 ref={sessionHeading} tabIndex={-1} className="exam-session-heading">{resultado ? 'Confira suas respostas.' : respondidas ? 'Continue de onde parou.' : 'Sua prova está pronta. Vamos começar?'}</h2>
        <p className="exam-instruction">{resultado ? 'Percorra as questões para ler cada explicação.' : `Questão ${indiceAtual + 1} de ${simulado.questoes.length}. Escolha uma alternativa e avance no seu ritmo.`}</p>
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

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import inteligencia from '../services/inteligenciaService'

const formatarTempo = (totalSegundos) => {
  const seguro = Math.max(0, totalSegundos)
  const horas = Math.floor(seguro / 3600)
  const minutos = Math.floor((seguro % 3600) / 60)
  const segundos = seguro % 60
  return [horas, minutos, segundos].map((item) => String(item).padStart(2, '0')).join(':')
}

export default function ExamArena() {
  const [catalogo, setCatalogo] = useState([])
  const [historico, setHistorico] = useState([])
  const [config, setConfig] = useState({ idCatalogo: '', dificuldade: 'TODAS', quantidade: 10 })
  const [simulado, setSimulado] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('salvo')
  const [agora, setAgora] = useState(Date.now())
  const primeiraSincronizacao = useRef(true)

  const carregar = async () => {
    try {
      const [provas, tentativas] = await Promise.all([inteligencia.catalogoProvas(), inteligencia.historicoSimulados()])
      setCatalogo(provas)
      setHistorico(tentativas)
      setConfig((atual) => ({ ...atual, idCatalogo: atual.idCatalogo || String(provas[0]?.id_catalogo || '') }))
    } catch {
      toast.error('Não foi possível carregar o catálogo de simulados.')
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

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
        await inteligencia.salvarProgressoSimulado(simulado.idSimulado, respostas)
        setSaveStatus('salvo')
      } catch {
        setSaveStatus('erro')
      }
    }, 550)
    return () => window.clearTimeout(timer)
  }, [respostas, resultado, simulado])

  const iniciarSessao = (data) => {
    primeiraSincronizacao.current = true
    setSimulado(data)
    setRespostas(data.respostas || {})
    setResultado(null)
    setSaveStatus('salvo')
    setAgora(Date.now())
  }

  const gerar = async () => {
    try {
      setBusyId('novo')
      iniciarSessao(await inteligencia.gerarSimulado(config))
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
    if (Object.keys(respostas).length !== simulado.questoes.length) return toast.error('Responda todas as questões.')
    try {
      setBusyId('concluir')
      const data = await inteligencia.concluirSimulado(simulado.idSimulado, respostas)
      setResultado(data)
      setSaveStatus('salvo')
      await carregar()
      toast.success(`Simulado concluído: ${data.nota}%`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível corrigir o simulado.')
    } finally { setBusyId(null) }
  }

  const respondidas = Object.keys(respostas).length
  const progresso = simulado?.questoes.length ? (respondidas / simulado.questoes.length) * 100 : 0
  const tempoDecorrido = useMemo(() => {
    if (!simulado?.iniciadoEm) return 0
    return Math.floor((agora - new Date(simulado.iniciadoEm).getTime()) / 1000)
  }, [agora, simulado?.iniciadoEm])

  if (loading) return <section className="exam-arena exam-loading">Preparando laboratório de provas…</section>

  return (
    <section className="exam-arena">
      <header><div><span>LABORATÓRIO DE PROVAS</span><h2>Treine para a prova que você quer vencer.</h2><p>Escolha uma coleção, ajuste o nível e receba uma prova montada e corrigida dentro do PlanejAI.</p></div><strong>β</strong></header>

      {!simulado ? <>
        <div className="exam-catalog">
          {catalogo.map((item) => <button type="button" key={item.id_catalogo} data-selected={String(item.id_catalogo) === String(config.idCatalogo)} onClick={() => setConfig({ ...config, idCatalogo: String(item.id_catalogo) })}><small>{item.instituicao} · {item.referencia_ano || 'Coleção'}</small><b>{item.titulo}</b><p>{item.descricao}</p><span>{item.questoes_disponiveis} questões disponíveis</span></button>)}
        </div>
        <div className="exam-builder">
          <label>Nível<select value={config.dificuldade} onChange={(event) => setConfig({ ...config, dificuldade: event.target.value })}><option value="TODAS">Misturado</option><option value="FACIL">Fundamentos</option><option value="MEDIA">Intermediário</option><option value="DIFICIL">Avançado</option></select></label>
          <label>Questões<input type="number" min="1" max="40" value={config.quantidade} onChange={(event) => setConfig({ ...config, quantidade: event.target.value })} /></label>
          <button type="button" disabled={!config.idCatalogo || busyId === 'novo'} onClick={gerar}>{busyId === 'novo' ? 'Montando…' : 'Gerar minha prova'} <span>→</span></button>
        </div>
        {historico.length > 0 && <div className="exam-history"><h3>Últimas tentativas</h3>{historico.slice(0, 5).map((item) => <div key={item.id_simulado}><span>{item.instituicao}</span><b>{item.titulo}</b><strong>{item.status === 'CONCLUIDO' ? `${Number(item.nota).toFixed(0)}%` : 'Em andamento'}</strong>{item.status === 'EM_ANDAMENTO' && <button type="button" disabled={busyId === item.id_simulado} onClick={() => retomar(item.id_simulado)}>{busyId === item.id_simulado ? 'Abrindo…' : 'Retomar'}</button>}</div>)}</div>}
      </> : <div className="exam-session">
        <div className="exam-session-title"><div><small>{simulado.catalogo.instituicao}</small><h3>{simulado.catalogo.titulo}</h3></div><div className="exam-session-metrics"><span>{respondidas}/{simulado.questoes.length} respondidas</span><b>{formatarTempo(tempoDecorrido)}</b><small className="exam-save-status" aria-live="polite">{saveStatus === 'salvando' ? 'Salvando…' : saveStatus === 'erro' ? 'Falha ao salvar' : 'Progresso salvo'}</small></div></div>
        <div className="exam-progress" aria-label={`${Math.round(progresso)}% respondido`}><i style={{ width: `${progresso}%` }} /></div>
        <nav className="exam-question-nav" aria-label="Navegação entre questões">{simulado.questoes.map((questao, index) => <button type="button" key={questao.id_questao} data-answered={respostas[questao.id_questao] !== undefined} onClick={() => document.getElementById(`questao-${questao.id_questao}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{index + 1}</button>)}</nav>
        {simulado.questoes.map((questao, index) => {
          const correcao = resultado?.correcoes.find((item) => Number(item.idQuestao) === Number(questao.id_questao))
          return <fieldset id={`questao-${questao.id_questao}`} key={questao.id_questao} disabled={Boolean(resultado)} data-correct={correcao ? String(correcao.acertou) : undefined}><legend><span>{index + 1}</span><div><small>{questao.disciplina} · {questao.dificuldade}</small>{questao.enunciado}</div></legend><div>{questao.alternativas.map((alternativa, indice) => <label key={alternativa}><input type="radio" name={`exam-${questao.id_questao}`} checked={Number(respostas[questao.id_questao]) === indice} onChange={() => setRespostas((atuais) => ({ ...atuais, [questao.id_questao]: indice }))} /><span><i>{String.fromCharCode(65 + indice)}</i>{alternativa}</span></label>)}</div>{correcao && <p>{correcao.acertou ? 'Resposta correta.' : `Resposta correta: ${String.fromCharCode(65 + correcao.respostaCorreta)}.`} {correcao.explicacao}</p>}</fieldset>
        })}
        <footer>{resultado ? <><div><strong>{resultado.nota}%</strong><span>{resultado.acertos} de {resultado.total} acertos</span></div><button type="button" onClick={() => { setSimulado(null); setResultado(null) }}>Novo simulado</button></> : <button type="button" disabled={busyId === 'concluir'} onClick={concluir}>{busyId === 'concluir' ? 'Corrigindo…' : 'Finalizar e corrigir'}</button>}</footer>
      </div>}
    </section>
  )
}

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import inteligencia from '../services/inteligenciaService'

export default function ExamArena() {
  const [catalogo, setCatalogo] = useState([])
  const [historico, setHistorico] = useState([])
  const [config, setConfig] = useState({ idCatalogo: '', dificuldade: 'TODAS', quantidade: 10 })
  const [simulado, setSimulado] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const gerar = async () => {
    try {
      const data = await inteligencia.gerarSimulado(config)
      setSimulado(data); setRespostas({}); setResultado(null)
    } catch (error) { toast.error(error.response?.data?.message || 'Não foi possível gerar o simulado.') }
  }

  const concluir = async () => {
    if (Object.keys(respostas).length !== simulado.questoes.length) return toast.error('Responda todas as questões.')
    try {
      const data = await inteligencia.concluirSimulado(simulado.idSimulado, respostas)
      setResultado(data); await carregar(); toast.success(`Simulado concluído: ${data.nota}%`)
    } catch (error) { toast.error(error.response?.data?.message || 'Não foi possível corrigir o simulado.') }
  }

  if (loading) return <section className="exam-arena exam-loading">Preparando laboratório de provas…</section>

  return (
    <section className="exam-arena">
      <header><div><span>LABORATÓRIO DE PROVAS</span><h2>Treine para a prova que você quer vencer.</h2><p>Escolha uma coleção, ajuste o nível e receba uma prova montada e corrigida dentro do PlanejAI.</p></div><strong>β</strong></header>

      {!simulado ? <>
        <div className="exam-catalog">
          {catalogo.map((item) => <button type="button" key={item.id_catalogo} data-selected={String(item.id_catalogo) === String(config.idCatalogo)} onClick={() => setConfig({ ...config, idCatalogo: String(item.id_catalogo) })}><small>{item.instituicao} · {item.referencia_ano || 'Coleção'}</small><b>{item.titulo}</b><p>{item.descricao}</p><span>{item.questoes_disponiveis} questões disponíveis</span></button>)}
        </div>
        <div className="exam-builder">
          <label>Nível<select value={config.dificuldade} onChange={(e) => setConfig({ ...config, dificuldade: e.target.value })}><option value="TODAS">Misturado</option><option value="FACIL">Fundamentos</option><option value="MEDIA">Intermediário</option><option value="DIFICIL">Avançado</option></select></label>
          <label>Questões<input type="number" min="1" max="40" value={config.quantidade} onChange={(e) => setConfig({ ...config, quantidade: e.target.value })} /></label>
          <button type="button" disabled={!config.idCatalogo} onClick={gerar}>Gerar minha prova <span>→</span></button>
        </div>
        {historico.length > 0 && <div className="exam-history"><h3>Últimos resultados</h3>{historico.slice(0, 4).map((item) => <div key={item.id_simulado}><span>{item.instituicao}</span><b>{item.titulo}</b><strong>{item.status === 'CONCLUIDO' ? `${Number(item.nota).toFixed(0)}%` : 'Em andamento'}</strong></div>)}</div>}
      </> : <div className="exam-session">
        <div className="exam-session-title"><div><small>{simulado.catalogo.instituicao}</small><h3>{simulado.catalogo.titulo}</h3></div><span>{simulado.questoes.length} questões · {simulado.catalogo.duracaoMinutos} min sugeridos</span></div>
        {simulado.questoes.map((questao, index) => {
          const correcao = resultado?.correcoes.find((item) => Number(item.idQuestao) === Number(questao.id_questao))
          return <fieldset key={questao.id_questao} disabled={Boolean(resultado)} data-correct={correcao ? String(correcao.acertou) : undefined}><legend><span>{index + 1}</span><div><small>{questao.disciplina} · {questao.dificuldade}</small>{questao.enunciado}</div></legend><div>{questao.alternativas.map((alternativa, indice) => <label key={alternativa}><input type="radio" name={`exam-${questao.id_questao}`} checked={Number(respostas[questao.id_questao]) === indice} onChange={() => setRespostas({ ...respostas, [questao.id_questao]: indice })} /><span><i>{String.fromCharCode(65 + indice)}</i>{alternativa}</span></label>)}</div>{correcao && <p>{correcao.acertou ? 'Resposta correta.' : `Resposta correta: ${String.fromCharCode(65 + correcao.respostaCorreta)}.`} {correcao.explicacao}</p>}</fieldset>
        })}
        <footer>{resultado ? <><div><strong>{resultado.nota}%</strong><span>{resultado.acertos} de {resultado.total} acertos</span></div><button type="button" onClick={() => { setSimulado(null); setResultado(null) }}>Novo simulado</button></> : <button type="button" onClick={concluir}>Finalizar e corrigir</button>}</footer>
      </div>}
    </section>
  )
}

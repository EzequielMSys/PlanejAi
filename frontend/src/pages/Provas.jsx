import AreaSignature from '../components/AreaSignature'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ExamArena from '../components/ExamArena'
import SectionLink from '../components/SectionLink'
import './Provas.css'

const acervo = {
  ENEM: { indice: 'https://www.curso-objetivo.br/vestibular/resolucao-comentada/enem.aspx', etapas: [{ nome: '1º dia', sufixo: '1dia' }, { nome: '2º dia', sufixo: '2dia' }] },
  FUVEST: { indice: 'https://www.curso-objetivo.br/vestibular/resolucao-comentada/fuvest.aspx', etapas: [{ nome: '1ª fase', sufixo: '1fase' }] }
}
const anos = [2025, 2024, 2023, 2022]

export default function Provas() {
  const navigate = useNavigate()
  const [emProva, setEmProva] = useState(false)
  const [instituicao, setInstituicao] = useState('ENEM')
  const [ano, setAno] = useState(2024)
  const fonte = acervo[instituicao]

  return <main className="exam-studio-page">
    {!emProva && <AreaSignature area="exams"/>}
    {!emProva && <header className="exam-studio-hero">
      <div className="exam-studio-nav"><span>PLANEJAI / PROVAS E SIMULADOS</span><button type="button" onClick={() => navigate('/ferramentas-estudo')}>Metas e ferramentas <span aria-hidden="true">↗</span></button></div>
      <div className="exam-studio-heading"><div><span>PRÁTICA COM DIREÇÃO</span><h1>Seu próximo treino,<br /><em>uma questão por vez.</em></h1><p>Monte uma prova autoral ou retome uma tentativa. Depois, confira as respostas e suas explicações.</p><SectionLink target="laboratorio-provas">Montar meu simulado <span aria-hidden="true">→</span></SectionLink></div><aside aria-label="Como funciona"><span>SEU PERCURSO</span><ol><li><b>01</b> Escolha uma coleção</li><li><b>02</b> Responda no seu ritmo</li><li><b>03</b> Revise cada explicação</li></ol></aside></div>
    </header>}
    <section className="exam-studio-arena" id="laboratorio-provas"><ExamArena onSessionChange={setEmProva} /></section>
    {!emProva && <><details className="exam-other-paths"><summary>Outras maneiras de se preparar</summary><Link to="/preparacao-provas">Planejar os estudos até uma prova →</Link><Link to="/laboratorio">Investigar um problema no laboratório →</Link></details><details className="exam-source"><summary>Consultar provas anteriores na fonte original</summary><section aria-labelledby="exam-source-title"><div className="exam-source-heading"><span>ACERVO EXTERNO</span><h2 id="exam-source-title">Provas reais, ano por ano.</h2><p>Explore as resoluções comentadas no Curso Objetivo. As provas históricas abrem na fonte original; o treino corrigido dentro do PlanejAI usa questões autorais.</p></div><div className="exam-source-filters"><div role="group" aria-label="Instituição">{Object.keys(acervo).map((nome) => <button type="button" key={nome} aria-pressed={instituicao === nome} onClick={() => setInstituicao(nome)}>{nome}</button>)}</div><div role="group" aria-label="Ano da prova">{anos.map((valor) => <button type="button" key={valor} aria-pressed={ano === valor} onClick={() => setAno(valor)}>{valor}</button>)}</div></div><div className="exam-source-grid">{fonte.etapas.map((etapa) => <a key={etapa.sufixo} href={`https://www.curso-objetivo.br/vestibular/resolucao-comentada/${instituicao.toLowerCase()}/${instituicao.toLowerCase()}${ano}_${etapa.sufixo}.aspx`} target="_blank" rel="noopener noreferrer"><small>{instituicao} · {ano}</small><strong>{etapa.nome}</strong><span>Resolução comentada no site do Curso Objetivo</span><b>Abrir prova <i aria-hidden="true">↗</i></b></a>)}<a href={fonte.indice} target="_blank" rel="noopener noreferrer"><small>MAIS ANOS</small><strong>Arquivo {instituicao}</strong><span>Veja outras edições na fonte original</span><b>Explorar acervo <i aria-hidden="true">↗</i></b></a></div></section></details></>}
  </main>
}

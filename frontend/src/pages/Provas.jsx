import AreaSignature from '../components/AreaSignature'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ExamArena from '../components/ExamArena'
import SectionLink from '../components/SectionLink'
import './Provas.css'

const acervos = [
  { instituicao: 'ENEM', organizadora: 'Inep', tipo: 'Nacional', descricao: 'Cadernos de prova e gabaritos oficiais, organizados por edição desde 1998.', url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos' },
  { instituicao: 'FUVEST · USP', organizadora: 'Fundação Universitária para o Vestibular', tipo: 'São Paulo', descricao: 'Acervo de provas e gabaritos da primeira e segunda fases por ano.', url: 'https://www.fuvest.br/acervo-vestibular/' },
  { instituicao: 'UNESP', organizadora: 'Vunesp', tipo: 'São Paulo', descricao: 'Acesse as edições anteriores do vestibular e abra “Provas e Gabaritos”.', url: 'https://www.vunesp.com.br/Institucional/EstatisticaVestibular' },
  { instituicao: 'UNICAMP', organizadora: 'Comvest', tipo: 'São Paulo', descricao: 'Provas anteriores, respostas esperadas e informações de cada ingresso.', url: 'https://www.comvest.unicamp.br/vestibulares-anteriores/' },
  { instituicao: 'UERJ', organizadora: 'DSEA · UERJ', tipo: 'Rio de Janeiro', descricao: 'Exames de qualificação e discursivos com questões comentadas pela banca.', url: 'https://www.revista.vestibular.uerj.br/questao/' },
  { instituicao: 'UFPR', organizadora: 'Núcleo de Concursos', tipo: 'Paraná', descricao: 'Processos seletivos anteriores com acesso aos arquivos por edição.', url: 'https://terra.nc.ufpr.br/PortalNC/VestibularesAnteriores' },
  { instituicao: 'UFRGS', organizadora: 'COPERSE · UFRGS', tipo: 'Rio Grande do Sul', descricao: 'Consulte o portal oficial da comissão de seleção e os concursos anteriores.', url: 'https://www.ufrgs.br/coperse/concurso-vestibular/' },
  { instituicao: 'Outras universidades', organizadora: 'Curso Objetivo', tipo: 'Resoluções comentadas', descricao: 'Provas, gabaritos e comentários para diversos vestibulares, incluindo UNESP e UNICAMP.', url: 'https://www.curso-objetivo.br/vestibular/resolucao-comentada.aspx' }
]

export default function Provas() {
  const navigate = useNavigate()
  const [emProva, setEmProva] = useState(false)
  const [buscaAcervo, setBuscaAcervo] = useState('')
  const acervosFiltrados = acervos.filter(({ instituicao, organizadora, tipo }) => `${instituicao} ${organizadora} ${tipo}`.toLocaleLowerCase('pt-BR').includes(buscaAcervo.trim().toLocaleLowerCase('pt-BR')))

  return <main className="exam-studio-page">
    {!emProva && <AreaSignature area="exams"/>}
    {!emProva && <header className="exam-studio-hero">
      <div className="exam-studio-nav"><span>PLANEJAI / PROVAS E SIMULADOS</span><button type="button" onClick={() => navigate('/ferramentas-estudo')}>Metas e ferramentas <span aria-hidden="true">↗</span></button></div>
      <div className="exam-studio-heading"><div><span>PRÁTICA COM DIREÇÃO</span><h1>Seu próximo treino,<br /><em>uma questão por vez.</em></h1><p>Monte uma prova autoral ou retome uma tentativa. Depois, confira as respostas e suas explicações.</p><SectionLink target="laboratorio-provas">Montar meu simulado <span aria-hidden="true">→</span></SectionLink></div><aside aria-label="Como funciona"><span>SEU PERCURSO</span><ol><li><b>01</b> Escolha uma coleção</li><li><b>02</b> Responda no seu ritmo</li><li><b>03</b> Revise cada explicação</li></ol></aside></div>
    </header>}
    <section className="exam-studio-arena" id="laboratorio-provas"><ExamArena onSessionChange={setEmProva} /></section>
    {!emProva && <><details className="exam-other-paths"><summary>Outras maneiras de se preparar</summary><Link to="/preparacao-provas">Planejar os estudos até uma prova →</Link><Link to="/laboratorio">Investigar um problema no laboratório →</Link></details><section className="exam-source" aria-labelledby="exam-source-title"><div className="exam-source-heading"><span>PROVAS OFICIAIS E COMENTADAS</span><h2 id="exam-source-title">Pratique com provas de outras universidades.</h2><p>Abra os arquivos mantidos pelas próprias instituições e bancas. Os simulados corrigidos dentro do PlanejAI continuam identificados como autorais.</p></div><label className="exam-source-search">Buscar instituição ou banca<input type="search" value={buscaAcervo} onChange={(event) => setBuscaAcervo(event.target.value)} placeholder="Ex.: Unesp, UFRGS, Comvest" /></label><div className="exam-source-grid">{acervosFiltrados.map(({ instituicao, organizadora, tipo, descricao, url }) => <a key={instituicao} href={url} target="_blank" rel="noopener noreferrer"><small>{tipo}</small><strong>{instituicao}</strong><span>{descricao}</span><em>{organizadora}</em><b>Acessar provas <i aria-hidden="true">↗</i></b></a>)}{acervosFiltrados.length === 0 && <p className="exam-source-empty">Nenhum acervo encontrado. Tente o nome da universidade ou da banca.</p>}</div></section></>}
  </main>
}

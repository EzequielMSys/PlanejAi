import { Link } from 'react-router-dom'
import './FirstStudySteps.css'

export default function FirstStudySteps({ prepared }) {
  return <section className="first-study" aria-labelledby="first-study-title">
    <div className="first-study-intro"><span>ESSE ESPAÇO VAI GANHAR A SUA HISTÓRIA</span><h2 id="first-study-title">Seu primeiro passo pode ser pequeno.</h2><p>Você não precisa organizar tudo agora. Escolha um caminho e experimente no seu ritmo.</p></div>
    <div className="first-study-paths">
      <article><span aria-hidden="true">01 / ORGANIZAR</span><h3>{prepared ? 'Seu perfil já está preparado.' : 'Um plano que cabe no seu dia.'}</h3><p>{prepared ? 'Revise suas escolhas e gere seu primeiro cronograma quando quiser começar.' : 'Escolha as matérias e os dias disponíveis. Você pode ajustar essas escolhas depois.'}</p><Link className="first-study-primary" to={prepared ? '/cronograma' : '/onboarding'}>{prepared ? 'Criar meu primeiro cronograma' : 'Escolher matérias e horários'} <span aria-hidden="true">→</span></Link></article>
      <article><span aria-hidden="true">02 / DESCOBRIR</span><h3>Traga uma dúvida para a Lumi.</h3><p>Por exemplo: “Não entendi a diferença entre mitose e meiose”. Conte o que já tentou para receber uma orientação com contexto.</p><Link to="/lumi">Tirar minha primeira dúvida <span aria-hidden="true">→</span></Link></article>
      <article><span aria-hidden="true">03 / EXPLORAR</span><h3>Encontre uma boa leitura.</h3><p>Conheça fontes por matéria, provas oficiais e recursos de redação. Cada opção informa seu tipo de acesso.</p><Link to="/fontes-estudo">Explorar fontes de estudo <span aria-hidden="true">→</span></Link></article>
    </div><p className="first-study-footnote">Seu progresso aparece conforme você estuda e responde às atividades. Não há uma sequência obrigatória para explorar.</p>
  </section>
}

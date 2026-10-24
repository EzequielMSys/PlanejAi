import { useNavigate } from 'react-router-dom'
import { learningSignals } from '../utils/learningSignals'
import './LearningSignals.css'

export default function LearningSignals({ summary, reviews = [], evolution = [], onAction }) {
  const navigate = useNavigate()
  const { pending, weak, improved, reviewCount } = learningSignals(summary, reviews, evolution)
  const act = (aba, disciplina) => onAction ? onAction(aba, disciplina) : navigate('/aprendizagem', { state: { aba, disciplina } })
  return <section className="learning-signals" aria-labelledby="learning-signals-title">
    <header><span>SEU APRENDIZADO DEIXA PISTAS</span><h2 id="learning-signals-title">O que vale fazer a seguir.</h2><p>Revisões e respostas registradas ajudam a escolher o próximo passo.</p></header>
    <div className="learning-signals-grid">
      <article><span className="learning-signal-label">RETOMAR AGORA</span><h3>{reviewCount ? `${reviewCount} ${reviewCount === 1 ? 'revisão pronta' : 'revisões prontas'}` : summary ? 'Revisões em dia' : 'Seu histórico está se formando'}</h3>{pending.length > 0 ? <ul>{pending.map((item, index) => <li key={item.id_revisao || index}><strong>{item.titulo || 'Conteúdo para retomar'}</strong><small>{item.disciplina || 'Seu plano'} · {item.ultimo_resultado === 'DIFICIL' || item.ultimo_resultado === 'ESQUECI' ? 'pediu outra revisão' : 'revisão agendada'}</small></li>)}</ul> : <p>{reviewCount ? 'Abra a fila para consultar os conteúdos que voltaram para revisão.' : 'Conclua sessões e registre como o conteúdo ficou. Ele volta na hora de revisar.'}</p>}<button type="button" onClick={() => act('revisoes')}>Abrir fila de revisões →</button></article>
      <article><span className="learning-signal-label">MERECE ATENÇÃO</span><h3>{weak ? weak.disciplina : 'Descubra o que precisa de prática'}</h3><p>{weak ? `${weak.acerto}% de acerto em ${weak.tentativas} respostas registradas. Experimente uma prática curta desta matéria e revise a explicação dos erros.` : 'Ainda não há uma dificuldade destacada com pelo menos 3 respostas. Isso não significa domínio: pratique para reunir mais evidências.'}</p><button type="button" onClick={() => act('simulado', weak?.disciplina)}>{weak ? `Praticar ${weak.disciplina}` : 'Preparar uma prática'} →</button></article>
      <article className="learning-signal-progress"><span className="learning-signal-label">EVIDÊNCIA DE AVANÇO</span><h3>{improved ? `Mais acertos em ${improved.disciplina}` : 'Cada tentativa conta uma parte'}</h3><p>{improved ? `De ${improved.anterior}% para ${improved.atual}% de acerto: +${improved.variacao} pontos percentuais.` : 'Uma comparação aparece quando houver pelo menos 3 respostas em cada período e um aumento de 5 pontos percentuais.'}</p>{improved && <small>{improved.amostra_atual} respostas nos últimos 30 dias · {improved.amostra_anterior} nos 30 dias anteriores. As questões podem ter dificuldades diferentes; acompanhe também as revisões.</small>}<button type="button" onClick={() => act('dominio')}>Entender meu progresso →</button></article>
    </div>
  </section>
}

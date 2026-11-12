import PracticeMark from './PracticeMark'
import { SimulationSteps } from './SimulatorSetup'
import './SimulationReport.css'

export default function SimulationReport({ report, onRetry, onClose }) {
  const graded = report.items.filter(item => typeof item.acertou === 'boolean')
  const pending = report.items.length - graded.length
  const correct = graded.filter(item => item.acertou).length
  const percentage = graded.length ? Math.round((correct / graded.length) * 100) : null
  return <section className="simulation-report">
    <SimulationSteps step={2}/>
    <header><span className="practice-eyebrow">FECHAMENTO DO SEU CADERNO</span><h2>{report.reason === 'tempo' ? 'O tempo terminou.' : report.reason === 'encerrado' ? 'Uma pausa também faz parte.' : 'Cada tentativa deixa uma pista.'}</h2><p>{report.items.length} de {report.total} questões respondidas. {report.reason === 'tempo' ? 'Confira o que você conseguiu fazer.' : 'Escolha o que vale levar para a próxima prática.'}</p></header>
    <dl className="simulation-balance"><div><dt>Acertos confirmados</dt><dd>{correct}<small> / {graded.length} corrigidas</small></dd></div><div><dt>Para tentar de novo</dt><dd>{graded.length - correct}</dd></div><div><dt>Aproveitamento</dt><dd>{percentage === null ? '—' : `${percentage}%`}</dd></div></dl>
    {pending > 0 && <p className="practice-error" role="status">{pending} {pending === 1 ? 'resposta aguarda' : 'respostas aguardam'} sincronização neste aparelho e ainda não {pending === 1 ? 'entrou' : 'entraram'} na correção.</p>}
    {!report.items.length && <p className="simulation-empty">Você encerrou antes de enviar uma resposta. Nenhum acerto ou erro foi registrado.</p>}
    <div className="simulation-report-actions"><button className="practice-primary" type="button" onClick={onRetry}>Praticar mais questões <PracticeMark/></button><button className="practice-text-button" type="button" onClick={onClose}>Ver meu progresso</button></div>
    {report.items.length > 0 && <div className="simulation-review-list"><h3>Reabra o seu raciocínio.</h3>{report.items.map((item, index) => <details key={`${item.id}-${index}`} className={item.acertou === null ? 'is-pending' : item.acertou ? 'is-correct' : 'is-wrong'}><summary><span aria-hidden="true">{String(index + 1).padStart(2,'0')}</span><div><b>{item.disciplina}</b><small>{item.acertou === null ? 'Aguardando sincronização' : item.acertou ? 'Resposta correta' : 'Retomar no caderno de erros'}</small></div><span className="simulation-expand" aria-hidden="true">+</span></summary><p>{item.enunciado}</p><div><span>Sua resposta: <b>{String.fromCharCode(65 + Number(item.answer))}</b></span>{item.acertou !== null && <span>Correta: <b>{String.fromCharCode(65 + Number(item.correctAnswer))}</b></span>}</div>{item.explanation && <blockquote>{item.explanation}</blockquote>}</details>)}</div>}
    {graded.length > 0 && <footer>As respostas corrigidas já estão registradas no seu progresso.</footer>}
  </section>
}

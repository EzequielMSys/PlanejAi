import './SimulationReport.css'

export default function SimulationReport({ report, onRetry, onClose }) {
  const correct = report.items.filter((item) => item.acertou).length
  const percentage = report.total ? Math.round((correct / report.total) * 100) : 0
  return <section className="simulation-report">
    <header><div><span>RELATÓRIO DA SESSÃO</span><h2>{percentage}% de acerto</h2><p>{correct} respostas corretas em {report.total} questões.</p></div><div className="simulation-score" style={{ '--score': `${percentage * 3.6}deg` }}><b>{percentage}</b></div></header>
    <div className="simulation-report-actions"><button type="button" onClick={onRetry}>Treinar novamente</button><button type="button" onClick={onClose}>Ver mapa de domínio</button></div>
    <div className="simulation-review-list"><h3>Revisão questão por questão</h3>{report.items.map((item, index) => <details key={`${item.id}-${index}`} className={item.acertou ? 'is-correct' : 'is-wrong'}><summary><span>{item.acertou ? '✓' : '!'}</span><div><b>Questão {index + 1} · {item.disciplina}</b><small>{item.acertou ? 'Raciocínio confirmado' : 'Adicionada ao caderno de erros'}</small></div></summary><p>{item.enunciado}</p><div><span>Sua resposta: <b>{String.fromCharCode(65 + Number(item.answer))}</b></span><span>Correta: <b>{String.fromCharCode(65 + Number(item.correctAnswer))}</b></span></div><blockquote>{item.explanation}</blockquote></details>)}</div>
    <footer>O resultado já alimentou seu mapa de domínio e a fila de retomada.</footer>
  </section>
}

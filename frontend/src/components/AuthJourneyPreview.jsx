import ConnectedPages from './ConnectedPages'
import { useState } from 'react'

const etapas = [
  {
    nome: 'Planeje', numero: '01', titulo: 'Um plano que acompanha você.',
    descricao: 'Veja o próximo passo e organize o tempo de estudo sem perder o que já construiu.',
    etiqueta: 'Seu dia de estudos', itens: ['Retomar a próxima lição', 'Revisar no momento certo', 'Acompanhar a semana'], progresso: 38
  },
  {
    nome: 'Pratique', numero: '02', titulo: 'Prática que revela o caminho.',
    descricao: 'Questões e simulados mostram o que você já domina e onde vale concentrar energia.',
    etiqueta: 'Seu laboratório', itens: ['Escolher um desafio', 'Responder no seu ritmo', 'Entender cada correção'], progresso: 67
  },
  {
    nome: 'Evolua', numero: '03', titulo: 'Cada tentativa conta.',
    descricao: 'Lições, redações e revisões se conectam para tornar seu progresso mais visível.',
    etiqueta: 'Sua evolução', itens: ['Rever suas redações', 'Perceber conquistas', 'Decidir o próximo passo'], progresso: 84
  }
]

export default function AuthJourneyPreview({ variant = 'login' }) {
  const [etapaAtual, setEtapaAtual] = useState(0)
  const etapa = etapas[etapaAtual]

  return <div className="auth-journey">
    <div className="auth-journey-top"><span>PLANEJAI / {variant === 'login' ? 'CONTINUE SUA JORNADA' : 'SEU ESPAÇO COMEÇA AQUI'}</span><span>{etapa.numero} / 03</span></div>
    <ConnectedPages className="auth-journey-thread"/>
    <div className="auth-journey-copy" key={etapa.numero} aria-live="polite">
      <span className="auth-journey-kicker">Uma etapa de cada vez</span>
      <h2>{etapa.titulo}</h2>
      <p>{etapa.descricao}</p>
    </div>
    <div className="auth-journey-card" aria-label={`Prévia: ${etapa.etiqueta}`}>
      <div className="auth-journey-card-head"><span className="auth-journey-mark" aria-hidden="true">✦</span><span>{etapa.etiqueta}</span><span>↗</span></div>
      <div className="auth-journey-progress" aria-hidden="true"><span style={{ width: `${etapa.progresso}%` }} /></div>
      <ul>{etapa.itens.map((item, index) => <li key={item}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{item}<span aria-hidden="true">→</span></li>)}</ul>
    </div>
    <div className="auth-journey-tabs" role="group" aria-label="Explorar o PlanejAI">
      {etapas.map((item, index) => <button type="button" key={item.numero} aria-pressed={etapaAtual === index} onClick={() => setEtapaAtual(index)}><span>{item.numero}</span>{item.nome}</button>)}
    </div>
    <p className="auth-journey-foot">Seu estudo tem história. O próximo capítulo começa por aqui.</p>
  </div>
}

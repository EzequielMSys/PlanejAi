import PracticeMark from './PracticeMark'
import { useState } from 'react'
import { SimulationSteps } from './SimulatorSetup'

export default function SimulatorSession({ question, index, total, answer, onAnswer, feedback, busy, error, confidence, onConfidence, hints, hintBusy, onHint, remaining, onConfirm, onNext, onFinish }) {
  const [ending, setEnding] = useState(false)
  return <div className="practice-session" aria-busy={busy}>
    <SimulationSteps step={1}/>
    <header className="practice-session-top"><div><span className="practice-eyebrow">SEU CADERNO EM ANDAMENTO</span><p>Questão {index + 1} de {total} · {question.disciplina}</p></div>{remaining !== null && <span className={`practice-clock ${remaining < 60 ? 'is-ending' : ''}`} aria-label="Tempo restante">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span>}</header>
    <div className="practice-progress" aria-hidden="true"><span style={{width:`${((index + (feedback ? 1 : 0)) / total) * 100}%`}}/></div>
    <span className="practice-eyebrow">{question.competencia} · {{FACIL:'Fácil',MEDIA:'Média',DIFICIL:'Difícil'}[question.dificuldade] || question.dificuldade}</span>
    <h2 className="practice-question-heading" tabIndex={-1} id="practice-question-heading">{question.enunciado}</h2>
    <fieldset className="practice-alternatives" disabled={Boolean(feedback) || busy}><legend className="sr-only">Escolha uma alternativa</legend>{question.alternativas.map((alternative, i) => <label className="practice-alternative" key={`${question.id_questao}-${i}`}><input type="radio" name={`question-${question.id_questao}`} checked={answer === i} onChange={() => onAnswer(i)}/><span aria-hidden="true">{String.fromCharCode(65 + i)}</span><div>{alternative}</div></label>)}</fieldset>
    {!feedback && <div className="practice-support"><fieldset disabled={busy}><legend>Como você chegou à resposta?</legend>{[['CHUTEI','Chutei'],['DUVIDA','Tenho dúvida'],['CERTEZA','Tenho certeza']].map(([id,label]) => <button type="button" key={id} aria-pressed={confidence === id} onClick={() => onConfidence(id)}>{label}</button>)}</fieldset><button type="button" onClick={onHint} disabled={hints.length >= 3 || hintBusy || busy}>{hintBusy ? 'Buscando pista…' : `Pedir pista (${hints.length}/3)`}</button></div>}
    {hints.map((hint, i) => <p key={hint} className="practice-hint"><b>Pista {i + 1}:</b> {hint}</p>)}
    {feedback && <div className="practice-feedback" role="status"><b>{feedback.offline ? 'Resposta guardada neste aparelho' : feedback.acertou ? 'Você encontrou o caminho.' : `Vamos rever: a alternativa correta é ${String.fromCharCode(65 + Number(feedback.respostaCorreta))}.`}</b><p>{feedback.explicacao}</p>{feedback.dominio && <small>Indicador de domínio atualizado: {feedback.dominio.dominio}%</small>}</div>}
    {error && <div className="practice-error" role="alert">{error}</div>}
    <div className="practice-session-actions"><button type="button" className="practice-primary" disabled={busy || (!feedback && answer === null)} onClick={feedback ? onNext : onConfirm}>{busy ? 'Registrando resposta…' : feedback ? index + 1 === total ? 'Ver meu resultado' : 'Ir para a próxima questão' : 'Conferir minha resposta'}<PracticeMark/></button><button type="button" className="practice-text-button" disabled={busy} onClick={() => setEnding(true)}>Encerrar por aqui</button></div>
    {ending && <div className="practice-end-confirm"><b>Encerrar esta tentativa?</b><p>As respostas enviadas permanecem registradas. As questões não respondidas ficam fora da correção.</p><div><button type="button" className="practice-primary" disabled={busy} onClick={onFinish}>Encerrar e ver resultado</button><button type="button" className="practice-text-button" onClick={() => setEnding(false)}>Continuar estudando</button></div></div>}
  </div>
}

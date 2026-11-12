import PracticeMark from './PracticeMark'
import { useState } from 'react'
import './Simulator.css'

const DISCIPLINAS = ['Matemática', 'Física', 'Química', 'Biologia', 'Português', 'Literatura', 'História', 'Geografia', 'Sociologia', 'Filosofia', 'Inglês']

export function SimulationSteps({ step = 0 }) {
  return <ol className="practice-path" aria-label="Etapas da prática">{['Preparar', 'Resolver', 'Rever'].map((label, i) => <li key={label} aria-current={step === i ? 'step' : undefined}><span aria-hidden="true">0{i + 1}</span>{label}</li>)}</ol>
}

export default function SimulatorSetup({ onStart, errosPendentes = 0, initialDisciplina = '', initialOptions, busy = false, error = '' }) {
  const [opcoes, setOpcoes] = useState(initialOptions || { quantidade: 10, disciplina: DISCIPLINAS.includes(initialDisciplina) ? initialDisciplina : '', dificuldade: '', minutos: 15, origem: '' })
  const alterar = (campo, valor) => setOpcoes(atual => ({ ...atual, [campo]: valor }))
  return <div className="practice-studio" aria-busy={busy}>
    <SimulationSteps />
    <header className="practice-heading"><span className="practice-eyebrow">CADERNO DE PRÁTICA / PLANEJAI</span><h2>Questões <em>no seu ritmo.</em></h2><p>Escolha o seu foco. A primeira questão está a poucos passos.</p></header>
    <form className="practice-desk" onSubmit={e => { e.preventDefault(); if (!busy) onStart(opcoes) }}>
      <fieldset className="practice-sheet" disabled={busy}><legend className="sr-only">Configuração da prática</legend>
        <div className="practice-field"><span className="practice-index" aria-hidden="true">01</span><label>Disciplina<select value={opcoes.disciplina} onChange={e => alterar('disciplina', e.target.value)}><option value="">Todas as áreas</option>{DISCIPLINAS.map(item => <option key={item}>{item}</option>)}</select></label></div>
        <div className="practice-field"><span className="practice-index" aria-hidden="true">02</span><label>Dificuldade<select value={opcoes.dificuldade} onChange={e => alterar('dificuldade', e.target.value)}><option value="">Mista</option><option value="FACIL">Fácil</option><option value="MEDIA">Média</option><option value="DIFICIL">Difícil</option></select></label></div>
        <fieldset className="practice-quantity"><legend><span className="practice-index" aria-hidden="true">03</span> Quantidade de questões</legend><div>{[5,10,15,20,30].map(n => <label key={n}><input type="radio" name="practice-count" checked={opcoes.quantidade === n} onChange={() => alterar('quantidade', n)} value={n}/><span>{n}</span></label>)}</div></fieldset>
      </fieldset>
      <aside className="practice-ticket" aria-label="Resumo da sua prática"><div className="practice-ticket-top"><span>SEU TREINO DE HOJE</span><span aria-hidden="true">P / {String(opcoes.quantidade).padStart(2, '0')}</span></div><strong className="practice-number">{opcoes.quantidade}<small>questões</small></strong><p>{opcoes.disciplina || 'Todas as áreas'} · {opcoes.dificuldade ? {FACIL:'Fácil',MEDIA:'Média',DIFICIL:'Difícil'}[opcoes.dificuldade] : 'Níveis mistos'}</p><label>Seu tempo<select disabled={busy} value={opcoes.minutos} onChange={e => alterar('minutos', Number(e.target.value))}><option value="0">Sem cronômetro</option>{[10,15,30,60].map(n => <option key={n} value={n}>{n} minutos</option>)}</select></label><button className="practice-primary" type="submit" disabled={busy}>{busy ? 'Preparando questões…' : 'Preparar questões'}<PracticeMark/></button><small>{busy ? 'Aguarde aqui. As questões vão aparecer nesta tela.' : 'Depois de montar, você confere e começa aqui mesmo.'}</small></aside>
    </form>
    {error && <div className="practice-error" role="alert"><b>A prática ainda não começou.</b><p>{error}</p><span>Suas escolhas foram mantidas. Ajuste o filtro ou tente novamente.</span></div>}
    {errosPendentes > 0 && <footer className="practice-return"><div><b>Retome o que ficou em aberto.</b><span>{errosPendentes} {errosPendentes === 1 ? 'questão para tentar de novo' : 'questões para tentar de novo'}.</span></div><button type="button" disabled={busy} onClick={() => onStart({ ...opcoes, disciplina: '', dificuldade: '', origem: 'erros', quantidade: Math.min(20, errosPendentes) })}>Praticar meus erros <PracticeMark/></button></footer>}
  </div>
}

export function SimulationReady({ count, requested, options, onBegin, onEdit }) {
  return <section className="practice-studio practice-ready"><SimulationSteps/><span className="practice-eyebrow">QUESTÕES SELECIONADAS</span><h2>Sua prática<br/><em>está pronta.</em></h2><p>{options.disciplina || 'Todas as áreas'} · {count} {count === 1 ? 'questão' : 'questões'} · {Number(options.minutos) > 0 ? `${options.minutos} minutos` : 'Sem cronômetro'}</p>{count < requested && <p className="practice-shortage">Encontramos {count} das {requested} questões solicitadas para esse filtro. Você pode começar com elas ou ajustar a seleção.</p>}<div className="practice-ready-actions"><button className="practice-primary" type="button" onClick={onBegin}>Começar a primeira questão <PracticeMark/></button><button className="practice-text-button" type="button" onClick={onEdit}>Ajustar seleção</button></div><small>O cronômetro só começa quando você iniciar. Ao terminar, seu resultado aparece aqui.</small></section>
}

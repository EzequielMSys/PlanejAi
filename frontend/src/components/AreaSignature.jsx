import './AreaSignature.css'
const AREAS = {
  today:['Seu ponto de partida','Um próximo passo possível.'],
  study:['Sua mesa de estudo','Tempo para dar sentido.'],
  learning:['Seu diário de aprendizagem','O que você aprende deixa pistas.'],
  writing:['Seu ateliê de escrita','Toda versão tem algo a dizer.'],
  lumi:['Uma conversa com a Lumi','Perguntar também é avançar.'],
}
export default function AreaSignature({area}) {
  const [title,description]=AREAS[area]||AREAS.study
  return <div className={`area-signature area-signature--${area}`}><svg viewBox="0 0 96 32" aria-hidden="true"><path d="M2 24h22c8 0 8-16 16-16h18c8 0 8 16 16 16h8"/><circle cx="89" cy="24" r="4"/></svg><span>{title}</span><small>{description}</small></div>
}

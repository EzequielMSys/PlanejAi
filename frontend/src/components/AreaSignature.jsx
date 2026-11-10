import './AreaSignature.css'
import InstitutionalCat from './InstitutionalCat'
import CatReadingIcon from './CatReadingIcon'
const AREAS = {
  today:['Seu ponto de partida','Um próximo passo possível.'],
  study:['Sua mesa de estudo','Tempo para dar sentido.'],
  learning:['Seu diário de aprendizagem','O que você aprende deixa pistas.'],
  writing:['Seu ateliê de escrita','Toda versão tem algo a dizer.'],
  lumi:['Uma conversa com a Lumi','Perguntar também é avançar.'],
  desk:['Sua mesa pessoal','O essencial ganha um lugar.'],
  understanding:['Seu percurso em palavras','Uma ideia amadurece em outra.'],
  search:['Seu acervo conectado','Encontre a ideia que quer retomar.'],
  schedule:['Sua semana em movimento','Um passo encontra o próximo.'],
  exams:['Seu espaço de prática','Cada tentativa abre uma pista.'],
  sources:['Suas fontes de estudo','Uma leitura abre outros caminhos.'],
}
export default function AreaSignature({area}) {
  const [title,description]=AREAS[area]||AREAS.study
  const Icon = area === 'understanding' ? CatReadingIcon : InstitutionalCat
  return <div className={`area-signature area-signature--${area}`}><Icon/><span>{title}</span><small>{description}</small></div>
}

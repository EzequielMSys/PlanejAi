import './TutorLumi.css'

const lumiTransparent = `${import.meta.env.BASE_URL}images/lumi-transparent.png`

/** Retrato da Lumi com transparência real ao redor do rosto. */
export default function TutorLumi({ tamanho = 40, rotulo }) {
  return <span className="lumi-cat" style={{ width: tamanho, height: tamanho }} aria-hidden={rotulo ? undefined : 'true'}>
    <img src={lumiTransparent} alt={rotulo || ''} width={tamanho} height={tamanho} />
  </span>
}

import './TutorLumi.css'

const lumiOriginal = `${import.meta.env.BASE_URL}images/lumi-original.png`

/** Retrato original da Lumi, sem expressões reativas ou animações. */
export default function TutorLumi({ tamanho = 40, rotulo }) {
  return <span className="lumi-cat" style={{ width: tamanho, height: tamanho }} aria-hidden={rotulo ? undefined : 'true'}>
    <img src={lumiOriginal} alt={rotulo || ''} width={tamanho} height={tamanho} />
  </span>
}

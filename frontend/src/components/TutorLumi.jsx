import './TutorLumi.css'

/**
 * Lumi, o mascote gatinho do PlanejAI.
 *
 * Personagem 100% em SVG + CSS: sem imagem, sem fonte extra e sem framer-motion.
 * Animações de gato (pisca, orelha, respiração, inclinação de cabeça, rabo)
 * respeitam `prefers-reduced-motion` e pausam quando a aba perde o foco.
 *
 * Estados de humor via prop `humor`:
 *  - 'neutro' (padrão): expressão calma
 *  - 'feliz': boca sorridente, olhos brilhantes
 *  - 'pensando': cabeça inclinada, corpo balançando
 *  - 'sonolento': olhos semi-fechados, respiração lenta
 *  - 'surpreso': olhos arregalados, boca pequena
 *
 * Acessibilidade: por padrão é decorativo (`aria-hidden`). Passe `rotulo`
 * quando o mascote for o único portador de sentido (ex.: botão do chat).
 */
export default function TutorLumi({ tamanho = 40, humor = 'neutro', rotulo }) {
  const pensando = humor === 'pensando'
  const feliz = humor === 'feliz'
  const sonolento = humor === 'sonolento'
  const surpreso = humor === 'surpreso'

  return (
    <span
      className={`lumi lumi-humor-${humor}${pensando ? ' lumi-pensando' : ''}`}
      style={{ width: tamanho, height: tamanho }}
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo || undefined}
      aria-hidden={rotulo ? undefined : 'true'}
    >
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Rabo */}
        <path className="lumi-rabo" d="M42 38 Q46 38 46 30 Q45 22 40 25" />

        {/* Orelhas */}
        <path className="lumi-orelha lumi-orelha-esq" d="M11 17 L13.5 6.5 L22 12.5 Z" />
        <path className="lumi-orelha lumi-orelha-dir" d="M37 17 L34.5 6.5 L26 12.5 Z" />
        <path className="lumi-orelha-int" d="M13.8 14.2 L15.2 9.4 L19.4 12.6 Z" />
        <path className="lumi-orelha-int" d="M34.2 14.2 L32.8 9.4 L28.6 12.6 Z" />

        {/* Cabeça */}
        <circle className="lumi-cabeca" cx="24" cy="26.5" r="13.5" />

        {/* Olhos com pupilas */}
        <g className="lumi-olhos">
          <g className="lumi-olho-grupo" transform="translate(19, 25)">
            <circle className="lumi-olho-branco" cx="0" cy="0" r="2.6" />
            <circle className="lumi-pupila" cx="0" cy={sonolento ? 0.5 : 0} r={sonolento ? 0.4 : 1} />
          </g>
          <g className="lumi-olho-grupo" transform="translate(29, 25)">
            <circle className="lumi-olho-branco" cx="0" cy="0" r="2.6" />
            <circle className="lumi-pupila" cx="0" cy={sonolento ? 0.5 : 0} r={sonolento ? 0.4 : 1} />
          </g>
        </g>

        {/* Nariz e boca */}
        <path className="lumi-nariz" d="M23 29.6 L25 29.6 L24 31.2 Z" />
        {feliz ? (
          <path className="lumi-boca lumi-boca-feliz" d="M22 32 q-1.5 1.5 -2 0 M22 32 q1.5 1.5 2 0" />
        ) : surpreso ? (
          <path className="lumi-boca lumi-boca-surpreso" d="M23 32.5 A1 1 0 1 0 25 32.5" />
        ) : (
          <path className="lumi-boca lumi-boca-neutro" d="M24 31.2 q-1.6 1.9 -3.3 .5 M24 31.2 q1.6 1.9 3.3 .5" />
        )}

        {/* Bigodes */}
        <path className="lumi-bigode" d="M9.5 26.5 L15 27.5 M9.8 30 L15.2 29.3 M38.5 26.5 L33 27.5 M38.2 30 L32.8 29.3" />
      </svg>
    </span>
  )
}

import './TutorLumi.css'

const HUMORES = new Set(['neutro', 'feliz', 'pensando', 'sonolento', 'surpreso'])

/** Lumi sentada; nos avatares pequenos o enquadramento mostra só o rosto. */
export default function TutorLumi({ tamanho = 40, humor = 'neutro', rotulo }) {
  const estado = HUMORES.has(humor) ? humor : 'neutro'
  const compacto = tamanho <= 40

  return (
    <span
      className={`lumi lumi-${compacto ? 'compacta' : 'inteira'} lumi-humor-${estado}`}
      style={{ width: tamanho, height: tamanho }}
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo || undefined}
      aria-hidden={rotulo ? undefined : 'true'}
    >
      <svg viewBox={compacto ? '7 3 82 67' : '0 0 96 96'} fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <g className="lumi-corpo">
          <path className="lumi-cauda" d="M72 79 C85 84 91 74 87 64 C85 58 79 57 76 61" />
          <path className="lumi-quadril" d="M34 61 C22 66 21 83 29 90 Q37 94 49 90 L67 91 Q78 82 68 65 Z" />
          <path className="lumi-peito" d="M39 58 Q48 64 57 58 C63 68 60 80 56 87 L39 87 C35 78 34 67 39 58 Z" />
          <path className="lumi-perna" d="M39 68 Q36 78 37 88 L47 89 L47 72 M56 69 Q59 79 57 88 L67 89 L65 72" />
          <path className="lumi-pata" d="M34 87 Q38 84 46 86 Q50 88 48 92 L35 92 Q32 91 34 87 Z M55 86 Q63 84 69 87 Q72 91 69 92 L56 92 Q53 90 55 86 Z" />
          <path className="lumi-dedos" d="M39 87 V91 M44 87 V91 M61 87 V91 M66 87 V91" />
          <path className="lumi-coleira" d="M34 60 Q48 68 62 60" />
          <path className="lumi-medalha" d="M48 65 L51 69 L48 73 L45 69 Z" />
        </g>

        <g className="lumi-cabeca-grupo">
          <path className="lumi-orelha" d="M20 32 L16 7 Q16 4 19 6 L37 18 Q48 14 59 18 L77 6 Q80 4 80 7 L76 32 Z" />
          <path className="lumi-orelha-interna" d="M23 24 L21 13 L33 22 Z M73 24 L75 13 L63 22 Z" />
          <path className="lumi-cabeca" d="M18 31 Q23 17 48 17 Q73 17 78 31 L78 42 L82 47 L76 49 L79 54 L72 55 Q66 65 48 66 Q30 65 24 55 L17 54 L20 49 L14 47 L18 42 Z" />
          <path className="lumi-face" d="M27 42 Q31 36 38 38 Q43 41 48 42 Q53 41 58 38 Q65 36 69 42 Q70 56 60 61 Q54 64 48 64 Q42 64 36 61 Q26 56 27 42 Z" />
          <path className="lumi-listras" d="M40 24 L43 32 M48 22 V31 M56 24 L53 32 M24 35 L30 39 M72 35 L66 39" />

          {estado === 'feliz' || estado === 'sonolento' ? (
            <path className="lumi-olhos-fechados" d="M31 42 Q37 47 43 42 M53 42 Q59 47 65 42" />
          ) : estado === 'surpreso' ? (
            <g className="lumi-olhos"><ellipse className="lumi-iris" cx="37" cy="43" rx="5" ry="6" /><ellipse className="lumi-iris" cx="59" cy="43" rx="5" ry="6" /><ellipse className="lumi-pupila" cx="37" cy="43" rx="1.8" ry="4" /><ellipse className="lumi-pupila" cx="59" cy="43" rx="1.8" ry="4" /></g>
          ) : (
            <g className="lumi-olhos" transform={estado === 'pensando' ? 'translate(0 -2)' : undefined}>
              <path className="lumi-iris" d="M29 43 Q36 37 44 42 Q39 49 32 46 Z M52 42 Q60 37 67 43 L64 46 Q57 49 52 42 Z" />
              <ellipse className="lumi-pupila" cx="37" cy="43" rx="1.7" ry="3.5" />
              <ellipse className="lumi-pupila" cx="59" cy="43" rx="1.7" ry="3.5" />
            </g>
          )}

          <ellipse className="lumi-focinho" cx="42" cy="54" rx="8" ry="6" />
          <ellipse className="lumi-focinho" cx="54" cy="54" rx="8" ry="6" />
          <path className="lumi-nariz" d="M44 49 Q48 47 52 49 Q52 51 48 54 Q44 51 44 49 Z" />
          <path className="lumi-filtro" d="M48 54 V57" />
          {estado === 'surpreso' ? <ellipse className="lumi-boca-surpresa" cx="48" cy="60" rx="2" ry="2.5" /> :
            <path className="lumi-boca" d={estado === 'feliz' ? 'M41 57 Q45 63 48 57 Q51 63 55 57' : 'M43 57 Q46 60 48 57 Q50 60 53 57'} />}
          <path className="lumi-pontos" d="M38 52 H38.2 M40 56 H40.2 M58 52 H58.2 M56 56 H56.2" />
          <path className="lumi-bigodes" d="M33 53 L10 48 M33 56 L10 57 M33 59 L13 65 M63 53 L86 48 M63 56 L86 57 M63 59 L83 65" />
        </g>

        {estado === 'feliz' && <path className="lumi-reacao" d="M84 22 L86 26 L90 28 L86 30 L84 34 L82 30 L78 28 L82 26 Z" />}
        {estado === 'pensando' && <g className="lumi-reacao"><circle cx="80" cy="12" r="2" /><circle cx="86" cy="7" r="1" /></g>}
      </svg>
    </span>
  )
}

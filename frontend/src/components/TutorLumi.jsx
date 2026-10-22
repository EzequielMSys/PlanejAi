import './TutorLumi.css'

const HUMORES = new Set(['neutro', 'feliz', 'pensando', 'sonolento', 'surpreso', 'raiva'])

/** Uma única ilustração vetorial da Lumi, com expressões legíveis também no chat. */
export default function TutorLumi({ tamanho = 40, humor = 'neutro', rotulo }) {
  const estado = HUMORES.has(humor) ? humor : 'neutro'
  const feliz = estado === 'feliz'
  const raiva = estado === 'raiva'
  const surpresa = estado === 'surpreso'
  const sonolento = estado === 'sonolento'
  const pensando = estado === 'pensando'
  const olhosFechados = feliz || sonolento

  return <span className={`lumi-cat lumi-cat--${estado}${tamanho <= 36 ? ' lumi-cat--small' : ''}`} style={{ width: tamanho, height: tamanho }} role={rotulo ? 'img' : undefined} aria-label={rotulo || undefined} aria-hidden={rotulo ? undefined : 'true'}>
    <svg viewBox="0 0 240 210" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <g className="lumi-cat-head">
        <path className="lumi-cat-fur" d="M39 109 C32 80 39 43 54 25 Q64 14 74 30 L88 52 Q120 44 152 52 L168 27 Q178 12 189 24 C207 43 215 82 206 109 C218 129 211 155 194 170 Q168 190 120 190 Q70 190 46 172 C27 158 22 133 39 109 Z" />
        <path className="lumi-cat-patch" d="M152 52 L168 27 Q178 12 189 24 C207 43 215 82 206 109 Q202 117 194 121 Q176 108 163 81 Q153 61 143 52 Z" />
        <path className="lumi-cat-inner-ear" d="M49 75 C48 51 54 32 61 29 Q69 27 79 56 Q63 61 49 75 Z" />
        <path className="lumi-cat-ear-mark" d="M57 60 Q56 43 61 36 Q67 38 69 54" />

        <g className="lumi-cat-eyes">
          {olhosFechados ? <>
            <path className="lumi-cat-closed-eye" d={feliz ? 'M49 119 Q69 103 94 119 M146 119 Q171 103 191 119' : 'M49 116 Q70 126 94 117 M146 117 Q170 126 191 116'} />
          </> : <>
            <path className="lumi-cat-eye-white" d={surpresa ? 'M47 119 Q60 99 84 105 Q97 109 101 120 Q88 139 67 136 Q53 133 47 119 Z' : raiva ? 'M48 112 Q69 114 99 122 Q85 139 63 135 Q51 131 48 112 Z' : 'M48 119 Q61 105 78 105 Q92 105 101 120 Q89 133 72 133 Q57 132 48 119 Z'} />
            <path className="lumi-cat-eye-white" d={surpresa ? 'M193 119 Q180 99 156 105 Q143 109 139 120 Q152 139 173 136 Q187 133 193 119 Z' : raiva ? 'M192 112 Q171 114 141 122 Q155 139 177 135 Q189 131 192 112 Z' : 'M192 119 Q179 105 162 105 Q148 105 139 120 Q151 133 168 133 Q183 132 192 119 Z'} />
            <ellipse className="lumi-cat-eye-ink" cx={pensando ? '76' : '72'} cy={surpresa ? '119' : '120'} rx={surpresa ? '5.5' : '4.5'} ry={surpresa ? '10' : '8.5'} />
            <ellipse className="lumi-cat-eye-ink" cx={pensando ? '164' : '168'} cy={surpresa ? '119' : '120'} rx={surpresa ? '5.5' : '4.5'} ry={surpresa ? '10' : '8.5'} />
            {surpresa && <><circle className="lumi-cat-glint" cx="65" cy="115" r="2.3" /><circle className="lumi-cat-glint" cx="175" cy="115" r="2.3" /></>}
            {raiva && <path className="lumi-cat-brows" d="M50 103 Q69 107 91 117 M149 117 Q171 107 190 103" />}
          </>}
        </g>

        <path className="lumi-cat-nose" d="M112 140 Q120 136 128 140 Q125 147 120 149 Q115 147 112 140 Z" />
        <path className="lumi-cat-mouth" d={feliz ? 'M120 149 V157 Q114 164 108 158 M120 157 Q126 164 132 158' : raiva ? 'M120 149 V157 M110 166 Q120 158 130 166' : surpresa ? 'M120 149 V154 M115 160 Q120 156 125 160 Q125 168 120 169 Q115 168 115 160 Z' : 'M120 149 V162 M120 162 L108 169 M120 162 L132 169'} />
        <path className="lumi-cat-whiskers" d="M67 139 Q48 132 29 135 M66 147 Q46 145 27 150 M69 155 Q51 161 36 169 M173 139 Q192 132 211 135 M174 147 Q194 145 213 150 M171 155 Q189 161 204 169" />
        {pensando && <g className="lumi-cat-thought"><circle cx="211" cy="36" r="5" /><circle cx="225" cy="21" r="2.8" /></g>}
      </g>
    </svg>
  </span>
}

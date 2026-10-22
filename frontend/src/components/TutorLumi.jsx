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
            <path className="lumi-cat-eye-white" d={surpresa ? 'M48 119 Q63 99 88 108 Q98 116 92 131 Q71 143 53 131 Q49 126 48 119 Z' : raiva ? 'M49 111 Q70 115 96 124 Q84 139 62 135 Q51 130 49 111 Z' : 'M48 119 Q62 104 81 106 Q94 107 99 119 Q89 132 71 134 Q55 132 48 119 Z'} />
            <path className="lumi-cat-eye-white" d={surpresa ? 'M152 108 Q177 99 192 119 Q191 126 187 131 Q169 143 148 131 Q142 116 152 108 Z' : raiva ? 'M144 124 Q170 115 191 111 Q189 130 178 135 Q158 139 144 124 Z' : 'M141 119 Q146 107 159 106 Q178 104 192 119 Q185 132 169 134 Q151 132 141 119 Z'} />
            <path className="lumi-cat-eye-ink" d={surpresa ? 'M54 118 Q66 105 79 111 Q88 116 88 126 Q79 134 68 130 Q58 127 54 118 Z' : 'M54 118 Q65 108 75 110 Q86 112 89 121 Q82 130 71 130 Q60 128 54 118 Z'} transform={pensando ? 'translate(4 0)' : undefined} />
            <path className="lumi-cat-eye-ink" d={surpresa ? 'M186 118 Q174 105 161 111 Q152 116 152 126 Q161 134 172 130 Q182 127 186 118 Z' : 'M186 118 Q175 108 165 110 Q154 112 151 121 Q158 130 169 130 Q180 128 186 118 Z'} transform={pensando ? 'translate(-4 0)' : undefined} />
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

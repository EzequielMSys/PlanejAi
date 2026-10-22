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
        <path className="lumi-cat-shadow" d="M39 112 C31 82 38 43 54 25 Q64 14 74 30 L88 52 Q120 44 152 52 L168 27 Q178 12 189 24 C207 43 215 82 206 112 C219 131 212 158 195 172 Q169 192 120 192 Q70 192 45 174 C26 160 21 135 39 112 Z" />
        <path className="lumi-cat-fur" d="M39 109 C32 80 39 43 54 25 Q64 14 74 30 L88 52 Q120 44 152 52 L168 27 Q178 12 189 24 C207 43 215 82 206 109 C218 129 211 155 194 170 Q168 190 120 190 Q70 190 46 172 C27 158 22 133 39 109 Z" />
        <path className="lumi-cat-patch" d="M152 52 L168 27 Q178 12 189 24 C207 43 215 82 206 109 Q202 117 194 121 Q176 108 163 81 Q153 61 143 52 Z" />
        <path className="lumi-cat-inner-ear" d="M49 75 C48 51 54 32 61 29 Q69 27 79 56 Q63 61 49 75 Z" />
        <path className="lumi-cat-ear-mark" d="M57 60 Q56 43 61 36 Q67 38 69 54" />

        <g className="lumi-cat-eyes">
          {olhosFechados ? <>
            <path className="lumi-cat-closed-eye" d={feliz ? 'M50 120 Q70 103 91 120 M149 120 Q170 103 190 120' : 'M50 119 Q71 125 92 118 M148 118 Q169 125 190 119'} />
            {feliz && <path className="lumi-cat-lashes" d="M51 119 L47 114 M189 119 L193 114" />}
          </> : <>
            <path className="lumi-cat-eye-white" d={surpresa ? 'M48 119 Q63 99 88 108 Q98 116 92 131 Q71 143 53 131 Q49 126 48 119 Z' : raiva ? 'M49 111 Q70 115 92 124 Q82 139 62 135 Q51 130 49 111 Z' : 'M48 119 Q62 101 84 105 Q96 108 94 122 Q91 135 74 138 Q55 137 48 119 Z'} />
            <path className="lumi-cat-eye-white" d={surpresa ? 'M152 108 Q177 99 192 119 Q191 126 187 131 Q169 143 148 131 Q142 116 152 108 Z' : raiva ? 'M148 124 Q170 115 191 111 Q189 130 178 135 Q158 139 148 124 Z' : 'M146 122 Q144 108 156 105 Q178 101 192 119 Q185 137 166 138 Q149 135 146 122 Z'} />
            <ellipse className="lumi-cat-iris" cx={pensando ? '74' : '71'} cy={surpresa ? '118' : '120'} rx={surpresa ? '10' : '11'} ry={surpresa ? '14' : '13'} />
            <ellipse className="lumi-cat-iris" cx={pensando ? '166' : '169'} cy={surpresa ? '118' : '120'} rx={surpresa ? '10' : '11'} ry={surpresa ? '14' : '13'} />
            <ellipse className="lumi-cat-pupil" cx={pensando ? '74' : '71'} cy={surpresa ? '118' : '120'} rx="5" ry="9" />
            <ellipse className="lumi-cat-pupil" cx={pensando ? '166' : '169'} cy={surpresa ? '118' : '120'} rx="5" ry="9" />
            <circle className="lumi-cat-glint" cx={pensando ? '70' : '67'} cy="115" r="3.2" />
            <circle className="lumi-cat-glint" cx={pensando ? '162' : '165'} cy="115" r="3.2" />
            {raiva && <path className="lumi-cat-brows" d="M50 102 Q70 104 91 112 M149 112 Q170 104 190 102" />}
          </>}
        </g>

        <g className={`lumi-cat-cheeks${feliz ? ' lumi-cat-cheeks--happy' : ''}`}><ellipse cx="51" cy="143" rx={feliz ? '12' : '8'} ry={feliz ? '5' : '3'} /><ellipse cx="189" cy="143" rx={feliz ? '12' : '8'} ry={feliz ? '5' : '3'} /></g>
        <path className="lumi-cat-nose" d="M114 140 Q120 136 126 140 Q126 145 120 149 Q114 145 114 140 Z" />
        <path className="lumi-cat-mouth" d={feliz ? 'M120 149 V156 Q113 167 105 158 M120 156 Q127 167 135 158' : raiva ? 'M120 149 V157 M110 168 Q120 160 130 168' : surpresa ? 'M120 149 V154 M113 163 Q120 157 127 163 Q127 173 120 175 Q113 173 113 163 Z' : 'M120 149 V156 Q113 164 107 158 M120 156 Q127 164 133 158'} />
        <path className="lumi-cat-whiskers" d="M48 142 Q29 136 12 139 M47 151 Q27 150 11 155 M49 159 Q31 164 18 171 M192 142 Q211 136 228 139 M193 151 Q213 150 229 155 M191 159 Q209 164 222 171" />
        {pensando && <g className="lumi-cat-thought"><circle cx="211" cy="36" r="5" /><circle cx="225" cy="21" r="2.8" /></g>}
        {feliz && <path className="lumi-cat-spark" d="M213 44 L217 52 L225 56 L217 60 L213 68 L209 60 L201 56 L209 52 Z" />}
      </g>
    </svg>
  </span>
}

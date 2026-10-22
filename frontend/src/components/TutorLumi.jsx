import './TutorLumi.css'

const HUMORES = new Set(['neutro', 'feliz', 'pensando', 'sonolento', 'surpreso', 'raiva'])

/** Rosto felino da Lumi: a mesma personagem em todos os tamanhos da interface. */
export default function TutorLumi({ tamanho = 40, humor = 'neutro', rotulo }) {
  const estado = HUMORES.has(humor) ? humor : 'neutro'
  const feliz = estado === 'feliz'
  const raiva = estado === 'raiva'
  const surpreso = estado === 'surpreso'
  const sonolento = estado === 'sonolento'

  return <span className={`lumi-cat lumi-cat--${estado}`} style={{ width: tamanho, height: tamanho }} role={rotulo ? 'img' : undefined} aria-label={rotulo || undefined} aria-hidden={rotulo ? undefined : 'true'}>
    <svg viewBox="0 0 240 190" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <g className="lumi-cat-head">
        <path className="lumi-cat-fur" d="M25 101 C23 66 35 31 52 17 Q64 11 82 42 Q119 38 157 42 Q173 10 190 17 C216 27 224 71 216 108 Q225 120 217 144 C208 172 163 180 121 180 C72 181 32 172 23 145 Q17 125 25 101 Z" />
        <path className="lumi-cat-patch" d="M157 42 Q173 10 190 17 C216 27 224 71 216 108 L209 124 Q187 108 168 86 Q148 63 135 42 Z" />
        <path className="lumi-cat-ear-detail" d="M48 68 Q49 40 58 30 Q67 24 73 58 M57 57 L54 49 M63 55 L61 42" />
        <g className="lumi-cat-eyes">
          {feliz ? <><path d="M44 112 Q66 89 92 112 M147 112 Q172 88 197 112" className="lumi-cat-eye-line" /><path d="M49 114 Q68 130 90 114 M150 114 Q172 130 193 114" className="lumi-cat-eye-soft" /></> :
            sonolento ? <><path d="M45 111 Q67 119 92 110 M147 110 Q171 119 196 111" className="lumi-cat-eye-line" /></> :
            <><path d={raiva ? 'M45 101 Q70 109 94 119 Q69 128 45 112 Z' : surpreso ? 'M48 103 Q68 87 92 103 Q86 126 69 128 Q53 123 48 103 Z' : 'M44 110 Q67 86 94 113 Q72 134 48 118 Z'} className="lumi-cat-eye-white" /><path d={raiva ? 'M146 119 Q170 108 196 101 L195 112 Q170 128 146 119 Z' : surpreso ? 'M148 103 Q171 86 193 103 Q188 126 172 128 Q154 123 148 103 Z' : 'M146 113 Q172 86 197 110 L193 118 Q169 134 146 113 Z'} className="lumi-cat-eye-white" /><path className="lumi-cat-pupil" d={surpreso ? 'M62 99 Q70 96 77 101 L77 122 Q70 129 63 119 Z M164 100 Q171 96 179 100 L178 122 Q172 129 165 119 Z' : 'M57 99 Q69 96 77 104 Q78 115 70 122 Q58 119 57 99 Z M163 104 Q172 96 185 99 Q184 119 173 122 Q164 115 163 104 Z'} /></>}
        </g>
        <path className="lumi-cat-nose" d="M110 132 Q120 128 130 132 Q129 139 120 143 Q111 139 110 132 Z" />
        <path className="lumi-cat-mouth" d={feliz ? 'M120 143 V151 Q109 166 97 151 M120 151 Q132 166 143 151' : raiva ? 'M120 143 V151 M108 159 Q120 148 132 159' : surpreso ? 'M120 143 V149 M113 158 Q120 151 127 158 Q127 167 120 169 Q113 167 113 158 Z' : 'M120 143 V155 M108 164 Q120 153 132 164'} />
        <path className="lumi-cat-whiskers" d="M43 132 Q27 128 10 132 M44 144 Q24 142 12 150 M47 154 Q29 159 20 169 M197 132 Q213 128 230 132 M196 144 Q216 142 228 150 M193 154 Q211 159 220 169" />
        {raiva && <path className="lumi-cat-brow" d="M47 88 Q68 98 88 102 M153 102 Q173 97 194 88" />}
        {estado === 'pensando' && <g className="lumi-cat-thought"><circle cx="209" cy="31" r="5" /><circle cx="223" cy="17" r="3" /></g>}
        {feliz && <path className="lumi-cat-spark" d="M216 30 L219 37 L226 40 L219 43 L216 50 L213 43 L206 40 L213 37 Z" />}
      </g>
    </svg>
  </span>
}

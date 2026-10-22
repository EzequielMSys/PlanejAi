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
        <path className="lumi-cat-shadow" d="M38 118 C25 85 38 38 58 18 Q69 8 83 51 Q120 44 156 51 Q175 8 188 16 C211 29 218 78 209 113 C221 139 207 177 182 188 Q153 202 117 199 C72 199 38 184 29 153 Q25 135 38 118 Z" />
        <path className="lumi-cat-fur" d="M37 112 C31 77 40 37 58 18 Q69 8 84 52 Q120 46 156 52 Q175 8 188 16 C210 29 217 76 210 112 C220 135 211 168 187 181 Q160 197 119 196 C77 197 44 185 32 160 Q24 135 37 112 Z" />
        <path className="lumi-cat-patch" d="M156 52 Q176 8 188 16 C210 29 217 76 210 112 Q207 121 203 125 C183 110 170 94 160 76 Q149 57 142 51 Z" />
        <path className="lumi-cat-inner-ear" d="M49 78 Q50 42 60 29 Q66 25 75 59 Q61 62 49 78 Z" />
        <path className="lumi-cat-ear-mark" d="M57 61 Q57 44 62 36 Q67 38 68 56 M54 69 Q58 65 62 64" />
        <path className="lumi-cat-forehead" d="M106 60 Q120 58 134 60" />

        <g className="lumi-cat-eyes">
          {olhosFechados ? <>
            <path className="lumi-cat-closed-eye" d={feliz ? 'M48 116 Q71 91 96 117 M145 117 Q169 91 192 116' : 'M49 116 Q72 122 96 115 M145 115 Q169 122 192 116'} />
            {feliz && <path className="lumi-cat-lashes" d="M49 116 L44 109 M191 116 L196 109" />}
          </> : <>
            <path className="lumi-cat-eye-white" d={surpresa ? 'M47 116 Q63 94 91 111 Q96 130 73 138 Q53 136 47 116 Z' : raiva ? 'M47 109 Q70 112 96 124 Q82 139 61 134 Q50 128 47 109 Z' : 'M46 117 Q67 98 96 116 Q86 137 68 137 Q53 134 46 117 Z'} />
            <path className="lumi-cat-eye-white" d={surpresa ? 'M146 111 Q174 94 193 116 Q187 136 167 138 Q144 130 146 111 Z' : raiva ? 'M145 124 Q171 112 193 109 Q190 128 178 134 Q158 139 145 124 Z' : 'M145 116 Q174 98 194 117 Q187 134 172 137 Q153 137 145 116 Z'} />
            <ellipse className="lumi-cat-iris" cx={pensando ? '75' : '72'} cy={surpresa ? '119' : '122'} rx={surpresa ? '9' : '10'} ry={surpresa ? '13' : '11'} />
            <ellipse className="lumi-cat-iris" cx={pensando ? '176' : '169'} cy={surpresa ? '119' : '122'} rx={surpresa ? '9' : '10'} ry={surpresa ? '13' : '11'} />
            <ellipse className="lumi-cat-pupil" cx={pensando ? '75' : '72'} cy={surpresa ? '119' : '122'} rx="3.3" ry="8" />
            <ellipse className="lumi-cat-pupil" cx={pensando ? '176' : '169'} cy={surpresa ? '119' : '122'} rx="3.3" ry="8" />
            <circle className="lumi-cat-glint" cx={pensando ? '72' : '69'} cy="117" r="2.6" />
            <circle className="lumi-cat-glint" cx={pensando ? '173' : '166'} cy="117" r="2.6" />
            {raiva && <path className="lumi-cat-brows" d="M49 97 Q70 99 92 108 M149 108 Q171 99 191 97" />}
          </>}
        </g>

        {feliz && <g className="lumi-cat-blush"><ellipse cx="50" cy="145" rx="12" ry="5" /><ellipse cx="190" cy="145" rx="12" ry="5" /></g>}
        <path className="lumi-cat-nose" d="M110 145 Q120 141 130 145 Q130 151 120 155 Q110 151 110 145 Z" />
        <path className="lumi-cat-mouth" d={feliz ? 'M120 155 V163 Q108 177 98 161 M120 163 Q132 177 142 161' : raiva ? 'M120 155 V163 M108 174 Q120 165 132 174' : surpresa ? 'M120 155 V160 M112 171 Q120 163 128 171 Q128 181 120 183 Q112 181 112 171 Z' : 'M120 155 V163 M108 169 Q114 175 120 165 Q127 175 133 169'} />
        <path className="lumi-cat-whiskers" d="M47 145 Q26 137 9 139 M46 155 Q23 154 9 161 M49 164 Q29 171 19 181 M193 145 Q214 137 231 139 M194 155 Q217 154 231 161 M191 164 Q211 171 221 181" />
        {pensando && <g className="lumi-cat-thought"><circle cx="211" cy="36" r="5" /><circle cx="225" cy="21" r="2.8" /></g>}
        {feliz && <path className="lumi-cat-spark" d="M213 44 L217 52 L225 56 L217 60 L213 68 L209 60 L201 56 L209 52 Z" />}
      </g>
    </svg>
  </span>
}

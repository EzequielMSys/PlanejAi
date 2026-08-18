import { useState, useEffect } from 'react'

// Matérias padrão comuns em vestibulares, agrupadas por área de conhecimento
const MATERIAS_PADRAO = [
  { area: 'Exatas', materias: ['Matemática', 'Física', 'Química'] },
  {
    area: 'Linguagens',
    materias: ['Português', 'Literatura', 'Redação', 'Inglês', 'Espanhol']
  },
  {
    area: 'Humanas',
    materias: ['História', 'Geografia', 'Filosofia', 'Sociologia']
  },
  { area: 'Biológicas', materias: ['Biologia'] }
]

const OUTRA_LABEL = 'Outra'

/**
 * Converte uma string de áreas de foco (separadas por vírgula) em um array.
 */
export function areasFocoParaLista(areasFoco) {
  if (!areasFoco) return []
  return areasFoco
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
}

/**
 * Converte um array de matérias em uma string separada por vírgula.
 */
export function listaParaAreasFoco(lista) {
  return lista.join(', ')
}

/**
 * Checklist de matérias comuns de vestibular + opção "Outra" para customizadas.
 *
 * Props:
 *  - value: string (areas_foco) ou array de matérias
 *  - onChange: (string) => void  (recebe a string separada por vírgula)
 *  - max: número máximo de seleções (opcional; default 10)
 */
export default function ChecklistMaterias({ value, onChange, max = 10 }) {
  const listaInicial = Array.isArray(value) ? value : areasFocoParaLista(value)

  const [selecionadas, setSelecionadas] = useState(listaInicial)
  const [mostrarOutra, setMostrarOutra] = useState(false)
  const [outrasText, setOutrasText] = useState('')

  // Sincroniza quando o value externo muda (ex.: carregamento do perfil)
  useEffect(() => {
    const lista = Array.isArray(value) ? value : areasFocoParaLista(value)
    setSelecionadas(lista)

    const customizadas = lista.filter(
      (m) => !MATERIAS_PADRAO.some((g) => g.materias.includes(m))
    )
    setOutrasText(customizadas.join(', '))
    setMostrarOutra(customizadas.length > 0)
  }, [value])

  const emitir = (novaLista) => {
    onChange(listaParaAreasFoco(novaLista))
  }

  const toggleMateria = (materia) => {
    setSelecionadas((prev) => {
      let nova
      if (prev.includes(materia)) {
        nova = prev.filter((m) => m !== materia)
      } else {
        if (prev.length >= max) return prev
        nova = [...prev, materia]
      }

      // Remove correspondências da lista "outras" caso a matéria seja padrão
      const outrasAtualizadas = outrasText
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o && !precisaRemover(o, nova))
        .join(', ')

      if (outrasAtualizadas !== outrasText) {
        setOutrasText(outrasAtualizadas)
      }

      emitir(nova)
      return nova
    })
  }

  const precisaRemover = (item, listaBase) => {
    // Se o item digitado nas "outras" já existe como opção padrão, não duplicar
    return MATERIAS_PADRAO.some((g) => g.materias.includes(item))
  }

  const toggleOutra = () => {
    const proximo = !mostrarOutra
    setMostrarOutra(proximo)

    if (!proximo) {
      // Ao desmarcar "Outra", limpa as customizadas
      const novas = selecionadas.filter((m) =>
        MATERIAS_PADRAO.some((g) => g.materias.includes(m))
      )
      setSelecionadas(novas)
      setOutrasText('')
      emitir(novas)
    }
  }

  const handleOutrasChange = (texto) => {
    setOutrasText(texto)

    const digitadas = texto
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)

    // Mantém as selecionadas padrão + as digitadas em "outras"
    const padrao = selecionadas.filter((m) =>
      MATERIAS_PADRAO.some((g) => g.materias.includes(m))
    )
    const unicas = [...new Set([...padrao, ...digitadas])]
    setSelecionadas(unicas)
    emitir(unicas)
  }

  const todasPadraoFlatten = MATERIAS_PADRAO.flatMap((g) => g.materias)

  return (
    <div className="w-full rounded-2xl border border-[#E4E3F0] bg-[#FAFAFD] p-4 sm:p-5">
      <div className="space-y-5">
        {MATERIAS_PADRAO.map((grupo) => (
          <div key={grupo.area}>
            <p className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#7774A4]">
              {grupo.area}
            </p>
            <div className="flex flex-wrap gap-2">
              {grupo.materias.map((materia) => {
                const ativa = selecionadas.includes(materia)
                return (
                  <button
                    key={materia}
                    type="button"
                    onClick={() => toggleMateria(materia)}
                    aria-pressed={ativa}
                    className={`rounded-xl border px-3.5 py-2 text-sm font-bold transition-all duration-200 ${
                      ativa
                        ? 'border-[#6157D9] bg-[#6157D9] text-white shadow-md shadow-indigo-200'
                        : 'border-[#DDDCEB] bg-white text-[#55526B] hover:-translate-y-0.5 hover:border-[#8B7CF6] hover:text-[#3F36A5]'
                    }`}
                  >
                    {materia}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Opção "Outra" */}
      <div className="mt-5 border-t border-[#E6E5F0] pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mostrarOutra}
            onChange={toggleOutra}
            className="h-5 w-5 accent-[#6157D9]"
          />
          <span className="text-sm font-bold text-[#34314D]">
            {OUTRA_LABEL} (digitar matérias que não estão na lista)
          </span>
        </label>

        {mostrarOutra && (
          <input
            type="text"
            className="mt-3 w-full rounded-xl border border-[#DADAF0] bg-white px-4 py-3 text-[#25233D] placeholder-black/35 outline-none transition focus:border-[#6157D9] focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex.: Artes, Educação Física, Informática"
            value={outrasText}
            onChange={(e) => handleOutrasChange(e.target.value)}
          />
        )}
      </div>

      {/* Contador / selecionadas */}
      <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[#77758F]">
        {selecionadas.length > 0 ? (
          <>
            <span className="font-black text-[#6157D9]">
              {selecionadas.length}
            </span>{' '}
            {selecionadas.length === 1 ? 'matéria selecionada' : 'matérias selecionadas'}
            {selecionadas.length >= max && (
              <span className="text-amber-600 ml-2">
                (máximo de {max} atingido)
              </span>
            )}
          </>
        ) : (
          'Selecione pelo menos uma matéria'
        )}
      </div>
    </div>
  )
}

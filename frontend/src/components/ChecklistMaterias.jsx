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
    <div className="w-full">
      <div className="space-y-4">
        {MATERIAS_PADRAO.map((grupo) => (
          <div key={grupo.area}>
            <p className="text-xs font-black uppercase tracking-wider text-[#4B4C9D] mb-2">
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
                    className={`px-4 py-2 rounded-full border text-sm font-bold transition-all duration-200 ${
                      ativa
                        ? 'bg-[#4B4C9D] text-white border-[#4B4C9D] shadow-md'
                        : 'bg-[#F7F7FB] text-black/70 border-[#9394CF]/40 hover:border-[#4B4C9D] hover:text-black'
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
      <div className="mt-5 pt-4 border-t border-[#9394CF]/20">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mostrarOutra}
            onChange={toggleOutra}
            className="w-5 h-5 accent-[#4B4C9D]"
          />
          <span className="text-black font-bold">
            {OUTRA_LABEL} (digitar matérias que não estão na lista)
          </span>
        </label>

        {mostrarOutra && (
          <input
            type="text"
            className="mt-3 w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
            placeholder="Ex: Artes, Educação Física, ¡Informática"
            value={outrasText}
            onChange={(e) => handleOutrasChange(e.target.value)}
          />
        )}
      </div>

      {/* Contador / selecionadas */}
      <div className="mt-4 text-sm text-black/60 font-semibold">
        {selecionadas.length > 0 ? (
          <>
            <span className="text-[#4B4C9D] font-black">
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

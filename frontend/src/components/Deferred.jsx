import { useEffect, useState } from 'react'

/**
 * Renderiza os filhos somente depois da primeira pintura, em momento de
 * ociosidade do navegador.
 *
 * Existe para tirar widgets "bonitus mas não críticos" (central de áudio,
 * chatbot, cronômetro de foco, barra de acessibilidade) do bundle de entrada:
 * sem isto, eles entram no JS que toda página precisa baixar e executar antes
 * da primeira pintura, derrubando FCP/LCP no Lighthouse. Com o Deferred, esses
 * componentes são importados de forma lazy e montados logo após o paint,
 * sem prender o carregamento principal.
 */
export default function Deferred({ children }) {
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const usarIdle = typeof window.requestIdleCallback === 'function'
    // Safari antigo não tem requestIdleCallback: um timeout curto é um
    // fallback aceitável — o objetivo é apenas sair do caminho crítico.
    const handle = usarIdle
      ? window.requestIdleCallback(() => setPronto(true), { timeout: 2000 })
      : window.setTimeout(() => setPronto(true), 200)
    return () => {
      if (usarIdle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [])

  if (!pronto) return null
  return children
}

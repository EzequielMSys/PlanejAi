import { lazy, Suspense, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TutorLumi from './TutorLumi'
import './Chatbot.css'

// Interface só é baixada quando o estudante ABRE o chat: tira ~9 kB do
// caminho crítico de toda página autenticada.
const ChatInterface = lazy(() => import('./ChatInterface'))

/**
 * Widget flutuante da Lumi, a gatinha tutora. Fica fixa no canto inferior
 * direito, acima dos botões "Aa" (acessibilidade) e "Foco", e não cobre a
 * sidebar. A conversa é persistente no backend.
 */
export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Na tela dedicada o chat já ocupa a página inteira.
  if (pathname.startsWith('/chat')) return null

  return (
    <div className="fixed bottom-36 right-4 z-[80] flex flex-col items-end">
      {open && (
        <div className="chatbot-painel absolute bottom-full right-0 mb-3 grid">
          <div className="flex h-[34rem] max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-study-line/25 bg-study-paper dark:bg-study-paper dark:text-white/90 shadow-[0_24px_70px_-30px_rgba(0,0,0,.55)]">
            <header className="flex items-center gap-2.5 border-b border-study-line/15 bg-study-tint dark:bg-study-paper px-4 py-2.5">
              <TutorLumi tamanho={30} />
              <div className="grid leading-tight">
                <h3 className="text-sm font-black text-study-accent dark:text-white">Lumi</h3>
                <small className="text-[11px] text-black/50 dark:text-white/50">sua parceira de estudos</small>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar conversa com a Lumi"
                className="ml-auto rounded-lg p-1 text-study-accent dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            <Suspense
              fallback={
                <div role="status" className="grid flex-1 place-items-center p-6 text-xs font-bold text-study-accent dark:text-white/70">
                  Preparando a Lumi…
                </div>
              }
            >
              <ChatInterface className="flex-1" />
            </Suspense>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Fechar conversa com a Lumi' : 'Abrir conversa com a Lumi'}
        className="flex h-14 items-center justify-center gap-2 rounded-full bg-study-accent px-3 text-white transition-transform hover:scale-105 active:scale-95 shadow-[0_14px_36px_-18px_rgba(76,29,149,.7)]"
      >
        <TutorLumi tamanho={34} />
        <span className="hidden text-xs font-black sm:inline">Pergunte à Lumi</span>
      </button>
    </div>
  )
}

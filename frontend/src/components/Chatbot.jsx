import { lazy, Suspense, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Interface só é baixada quando o estudante ABRE o chat: tira ~9 kB do
// caminho crítico de toda página autenticada.
const ChatInterface = lazy(() => import('./ChatInterface'))

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M9.05 21a7.5 7.5 0 1 1-5.06-12.75 5.5 5.5 0 0 1 8.3-.9L15.5 10a6 6 0 1 0-6.45 9.9"
    />
  </svg>
)

/**
 * Widget flutuante de chatbot. Fica fixo no canto inferior direito, acima dos
 * botões "Aa" (acessibilidade) e "Foco", e não cobre a sidebar. A conversa é
 * persistente no backend.
 */
export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Na tela dedicada o chat já ocupa a página inteira.
  if (pathname.startsWith('/chat')) return null

  return (
    <div className="fixed bottom-36 right-4 z-[80] flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-full right-0 mb-3 grid w-80 sm:w-96"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 240 }}
          >
            <motion.div
              className="flex h-[34rem] max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-[#7C4DFF]/25 bg-white/95 dark:bg-[#211A2D] dark:text-white/90 shadow-[0_24px_70px_-30px_rgba(0,0,0,.55)]"
              layout
            >
              <header className="flex items-center justify-between border-b border-[#7C4DFF]/15 bg-[#F2EAFB] dark:bg-[#2C203C] px-4 py-2.5">
                <h3 className="text-sm font-black text-[#5b21b6] dark:text-white">ASSISTENTE DE IA</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar chat"
                  className="rounded-lg p-1 text-[#5b21b6] dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </header>
              <Suspense
                fallback={
                  <div role="status" className="grid flex-1 place-items-center p-6 text-xs font-bold text-[#5b21b6] dark:text-white/70">
                    Carregando assistente…
                  </div>
                }
              >
                <ChatInterface className="flex-1" />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Fechar chat' : 'Abrir assistente de IA'}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6D3EC5] text-white shadow-[0_14px_36px_-18px_rgba(76,29,149,.7)]"
        whileTap={{ scale: 0.92 }}
      >
        <ChatIcon />
      </motion.button>
    </div>
  )
}

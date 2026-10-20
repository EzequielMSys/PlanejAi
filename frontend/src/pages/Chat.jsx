import { useNavigate } from 'react-router-dom'
import ChatInterface from '../components/ChatInterface'
import TutorLumi from '../components/TutorLumi'

/**
 * Tela dedicada à Lumi, a gatinha tutora de estudos.
 * Rode /chat para testar o fluxo completo de tutoria da Lumi.
 */
export default function Chat() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <header className="flex items-center justify-between border-b border-study-line/15 px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-black text-study-accent dark:text-white"
          aria-label="Voltar"
        >
          ← <TutorLumi tamanho={24} /> Lumi
        </button>
        <span className="text-xs text-black/45 dark:text-white/45">Responde em português · foco em estudos</span>
      </header>
      <ChatInterface className="flex-1" />
    </div>
  )
}

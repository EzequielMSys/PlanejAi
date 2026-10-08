import { useNavigate } from 'react-router-dom'
import ChatInterface from '../components/ChatInterface'

/**
 * Tela dedicada ao assistente de IA.
 * Rode /chat para testar o funcionamento completo do backend OpenAI.
 */
export default function Chat() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <header className="flex items-center justify-between border-b border-[#7C4DFF]/15 px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-black text-[#5b21b6] dark:text-white"
          aria-label="Voltar"
        >
          ← Assistente de IA
        </button>
        <span className="text-xs text-black/45 dark:text-white/45">Responde em português · foco em estudos</span>
      </header>
      <ChatInterface className="flex-1" />
    </div>
  )
}

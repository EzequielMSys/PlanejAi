import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import inteligencia from '../services/inteligenciaService'

const SUGESTOES_INICIO = [
  'Como estudar funções do 2º grau de forma prática?',
  'Qual a diferença entre mitose e meiose?',
  'Qual a técnica para não perder pontos na redação do ENEM?',
  'Como resolver um problema de cinemática?',
]

const DISCIPLINAS = ['Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Português', 'Inglês']

function formatarHora(data) {
  try {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function Mensagem({ mensagem }) {
  const ehUsuario = mensagem.role === 'user'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`flex ${ehUsuario ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          ehUsuario
            ? 'bg-[#6D3EC5] text-white rounded-br-md'
            : 'bg-[#F3E8FF] dark:bg-[#2C203C] text-[#2C1a3d] dark:text-white/90 border border-[#7C4DFF]/15 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{mensagem.content}</p>
        {mensagem.criado_em && (
          <time dateTime={mensagem.criado_em} className="block translate-y-0.5 text-[10px] opacity-50">
            {formatarHora(mensagem.criado_em)}
          </time>
        )}
      </div>
    </motion.div>
  )
}

export default function ChatInterface({ className = '' }) {
  const [mensagens, setMensagens] = useState([])
  const [input, setInput] = useState('')
  const [materia, setMateria] = useState('')
  const [loading, setLoading] = useState(false)
  const fimRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inteligencia
      .chatHistory()
      .then((data) =>
        setMensagens(
          (data || []).map((m) => ({
            role: m.role,
            content: m.conteudo,
            disciplina: m.disciplina,
            criado_em: m.criado_em,
          })),
        ),
      )
      .catch(() => {
        /* sem histórico ainda */
      })
  }, [])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagens, loading])

  function append(mensagem) {
    setMensagens((prev) => [...prev, { ...mensagem, id: Date.now() + Math.random() }])
  }

  async function enviar(texto) {
    const mensagem = (texto || input).trim()
    if (!mensagem || loading) return
    append({
      role: 'user',
      content: mensagem,
      disciplina: materia || null,
      criado_em: new Date().toISOString(),
    })
    setInput('')
    setLoading(true)
    try {
      const data = await inteligencia.chatSend(mensagem, materia || undefined)
      if (data?.offline || data?.queued) {
        toast(data.message || 'Sem conexão: a mensagem será enviada quando você ficar online.')
      } else if (data?.mensagens) {
        setMensagens(
          data.mensagens.map((m) => ({
            role: m.role,
            content: m.conteudo,
            disciplina: m.disciplina,
            criado_em: m.criado_em,
          })),
        )
      } else if (data?.conteudo) {
        append({
          role: 'assistant',
          content: data.conteudo,
          disciplina: materia || null,
          criado_em: new Date().toISOString(),
        })
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Não foi possível conversar com a IA agora.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function limparConversa() {
    if (!window.confirm('Limpar toda a conversa com a IA?')) return
    try {
      await inteligencia.chatClear()
      setMensagens([])
      toast.success('Conversa limpa.')
    } catch {
      toast.error('Não foi possível limpar a conversa.')
    }
  }

  return (
    <div className={`flex min-h-0 flex-col h-full ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-[#7C4DFF]/10 px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-bold text-black/60 dark:text-white/60">
          Matéria
          <select
            value={materia}
            onChange={(event) => setMateria(event.target.value)}
            className="rounded-lg border border-[#7C4DFF]/25 bg-white px-2 py-1 text-xs font-semibold text-[#2C1a3d] dark:bg-[#2C203C] dark:text-white"
          >
            <option value="">Todas</option>
            {DISCIPLINAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={limparConversa}
          disabled={!mensagens.length || loading}
          className="rounded-lg px-2 py-1 text-xs font-bold text-[#5b21b6] hover:bg-[#7C4DFF]/10 disabled:opacity-40 dark:text-white/80"
        >
          Limpar conversa
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
        {!mensagens.length && !loading && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-6 text-center">
            <p className="text-base font-black text-[#5b21b6] dark:text-white">Olá! Sou seu assistente de estudos.</p>
            <p className="text-sm text-black/60 dark:text-white/60">
              Pergunte sobre qualquer matéria. Eu explico o raciocínio passo a passo.
            </p>
            <div className="flex w-full flex-col gap-2">
              {SUGESTOES_INICIO.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => enviar(sugestao)}
                  className="rounded-xl border border-[#7C4DFF]/25 bg-white px-3 py-2 text-left text-sm font-semibold text-[#5b21b6] transition hover:bg-[#F3E8FF] dark:bg-[#2C203C] dark:text-white dark:hover:bg-[#3a2a50]"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mensagens.map((mensagem, index) => (
            <Mensagem key={mensagem.id || `${mensagem.role}-${index}`} mensagem={mensagem} />
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start" role="status" aria-label="A IA está digitando">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-[#7C4DFF]/15 bg-[#F3E8FF] px-4 py-3 dark:bg-[#2C203C]">
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  className="h-2 w-2 rounded-full bg-[#6D3EC5] dark:bg-white/70"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          enviar()
        }}
        className="flex items-end gap-2 border-t border-[#7C4DFF]/15 p-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              enviar()
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Digite sua dúvida..."
          aria-label="Mensagem para o assistente de IA"
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-[#7C4DFF]/25 bg-white px-3 py-2 text-sm text-[#2C1a3d] outline-none focus:border-[#6D3EC5] dark:bg-[#2C203C] dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-[#6D3EC5] px-4 py-2 text-sm font-black text-white transition hover:bg-[#5b21b6] disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

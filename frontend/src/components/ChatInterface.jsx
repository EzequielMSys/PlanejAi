import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import inteligencia from '../services/inteligenciaService'
import TutorLumi from './TutorLumi'
import LumiMessage from './LumiMessage'

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
    <div className={`flex items-start gap-2 ${ehUsuario ? 'lumi-message--user justify-end' : 'justify-start'}`}>
      {!ehUsuario && <TutorLumi tamanho={28} humor={mensagem.reacao || 'neutro'} />}
      <div
        className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 text-[.94rem] shadow-sm sm:max-w-[82%] ${
          ehUsuario
            ? 'bg-study-accent text-white rounded-br-md'
            : 'bg-study-tint dark:bg-study-paper text-study-ink dark:text-white/90 border border-study-line/15 rounded-bl-md'
        }`}
      >
        {ehUsuario ? <p className="whitespace-pre-wrap break-words leading-relaxed">{mensagem.content}</p> : <LumiMessage content={mensagem.content} />}
        {mensagem.criado_em && (
          <time dateTime={mensagem.criado_em} className="block translate-y-0.5 text-[10px] opacity-50">
            {formatarHora(mensagem.criado_em)}
          </time>
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({ className = '', onEstadoChange, redacaoSelecionada, perguntaInicial = '' }) {
  const [mensagens, setMensagens] = useState([])
  const [input, setInput] = useState(perguntaInicial)
  const [materia, setMateria] = useState('')
  const [loading, setLoading] = useState(false)
  const [humorLumi, setHumorLumi] = useState('neutro')
  const [contexto, setContexto] = useState(null)
  const [sendError, setSendError] = useState('')
  const fimRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    onEstadoChange?.(loading ? 'pensando' : humorLumi)
  }, [humorLumi, loading, onEstadoChange])

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
    if (mensagens.length) fimRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagens, loading])

  useEffect(() => {
    inteligencia.chatContext().then(setContexto).catch(() => {})
  }, [])

  function append(mensagem) {
    setMensagens((prev) => [...prev, { ...mensagem, id: Date.now() + Math.random() }])
  }

  async function enviar(texto) {
    const mensagem = (texto || input).trim()
    if (!mensagem || loading) return
    const envioId = Date.now() + Math.random()
    setSendError('')
    setMensagens((prev) => [...prev, {
      id: envioId,
      role: 'user',
      content: mensagem,
      disciplina: materia || null,
      criado_em: new Date().toISOString(),
    }])
    setInput('')
    setLoading(true)
    setHumorLumi('pensando')
    try {
      const data = await inteligencia.chatSend(mensagem, materia || undefined, redacaoSelecionada?.id)
      if (data?.offline || data?.queued) {
        toast(data.message || 'Sem conexão: a mensagem será enviada quando você ficar online.')
        setHumorLumi('neutro')
      } else if (data?.mensagens) {
        setMensagens(
          data.mensagens.map((m, index) => ({
            role: m.role,
            content: m.conteudo,
            disciplina: m.disciplina,
            criado_em: m.criado_em,
            reacao: index === data.mensagens.length - 1 ? data.reacao : undefined,
          }))
        )
        setHumorLumi(data.reacao || 'neutro')
      } else if (data?.conteudo) {
        append({
          role: 'assistant',
          content: data.conteudo,
          disciplina: materia || null,
          criado_em: new Date().toISOString(),
          reacao: data.reacao,
        })
        setHumorLumi(data.reacao || 'neutro')
      }
    } catch (error) {
      const aviso = error?.response?.data?.message || 'Não foi possível conversar com a Lumi agora.'
      setMensagens((atuais) => atuais.filter((item) => item.id !== envioId))
      setInput(mensagem)
      setSendError(aviso)
      toast.error(aviso)
      setHumorLumi('neutro')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function limparConversa() {
    if (!window.confirm('Limpar toda a conversa com a Lumi?')) return
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
      <div className="flex items-center justify-between gap-2 border-b border-study-line/10 px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-bold text-black/60 dark:text-white/60">
          Matéria
          <select
            value={materia}
            onChange={(event) => setMateria(event.target.value)}
            className="rounded-lg border border-study-line/25 bg-study-paper px-2 py-1 text-xs font-semibold text-study-ink dark:bg-study-paper dark:text-white"
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
          className="rounded-lg px-2 py-1 text-xs font-bold text-study-accent hover:bg-study-accent/10 disabled:opacity-40 dark:text-white/80"
        >
          Limpar conversa
        </button>
      </div>

      {redacaoSelecionada?.id && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-study-line/10 px-3 py-2 text-xs">
          <span className="text-study-ink/70 dark:text-white/70">Redação selecionada: <strong>{redacaoSelecionada.tema}</strong></span>
          <button type="button" onClick={() => enviar('Quero revisar esta redação com você. Comece pela competência que mais precisa de atenção e cite um trecho específico.')} disabled={loading} className="font-bold text-study-accent disabled:opacity-50">Revisar com a Lumi</button>
        </div>
      )}

      {contexto && (contexto.areasFoco || contexto.licoes?.length > 0 || contexto.dificuldades?.length > 0 || contexto.redacoes?.length > 0) && (
        <div className="border-b border-study-line/10 px-3 py-2 text-xs text-study-ink/70 dark:text-white/70" aria-label="Contexto de estudos disponível para a Lumi">
          <span className="font-bold">Lumi conhece seus estudos:</span>{' '}
          {contexto.areasFoco && <span>áreas de foco · </span>}
          {contexto.licoes?.length > 0 && <span>{contexto.licoes.length} lições recentes · </span>}
          {contexto.cronograma?.total > 0 && <span>{contexto.cronograma.concluidas}/{contexto.cronograma.total} lições concluídas · </span>}
          {contexto.dificuldades?.length > 0 && <span>{contexto.dificuldades.length} dificuldades identificadas · </span>}
          {contexto.redacoes?.length > 0 && <span>{contexto.redacoes.length} redação(ões) recente(s)</span>}
        </div>
      )}

      <div className="lumi-feed flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
        {!mensagens.length && !loading && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-6 text-center">
            <TutorLumi tamanho={76} humor={humorLumi} />
            <p className="text-base font-black text-study-accent dark:text-white">
              Olá! Eu sou a Lumi, sua parceira de estudos.
            </p>
            <p className="text-sm text-black/60 dark:text-white/60">
              Posso explicar matérias, retomar suas lições e praticar o que está difícil.
            </p>
            <div className="lumi-starters flex w-full flex-col gap-2">
              {contexto?.licoes?.[0]?.titulo && <button type="button" onClick={() => enviar(`Me ajude a estudar a lição ${contexto.licoes[0].titulo}. Comece pelo conceito principal.`)} className="rounded-xl border border-study-line/25 bg-study-paper px-3 py-2 text-left text-sm font-semibold text-study-accent transition hover:bg-study-tint dark:bg-study-paper dark:text-white">Retomar minha lição: {contexto.licoes[0].titulo}</button>}
              {contexto?.dificuldades?.[0]?.disciplina && <button type="button" onClick={() => enviar(`Tenho tido dificuldade em ${contexto.dificuldades[0].disciplina}${contexto.dificuldades[0].competencia ? `, especialmente ${contexto.dificuldades[0].competencia}` : ''}. Explique de outra forma e proponha um exercício curto.`)} className="rounded-xl border border-study-line/25 bg-study-paper px-3 py-2 text-left text-sm font-semibold text-study-accent transition hover:bg-study-tint dark:bg-study-paper dark:text-white">Trabalhar uma dificuldade em {contexto.dificuldades[0].disciplina}</button>}
              {contexto?.redacoes?.[0]?.tema && <button type="button" onClick={() => enviar('Quero revisar minha redação mais recente. Mostre a competência mais fraca, cite um trecho do meu texto e sugira uma reescrita curta para eu tentar.')} className="rounded-xl border border-study-line/25 bg-study-paper px-3 py-2 text-left text-sm font-semibold text-study-accent transition hover:bg-study-tint dark:bg-study-paper dark:text-white">Revisar minha redação: {contexto.redacoes[0].tema}</button>}
              {SUGESTOES_INICIO.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => { setInput(sugestao); inputRef.current?.focus() }}
                  className="rounded-xl border border-study-line/25 bg-study-paper px-3 py-2 text-left text-sm font-semibold text-study-accent transition hover:bg-study-tint dark:bg-study-paper dark:text-white dark:hover:bg-[#3a2a50]"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((mensagem, index) => (
          <Mensagem key={mensagem.id || `${mensagem.role}-${index}`} mensagem={mensagem} />
        ))}

        {loading && (
          <div className="flex items-start gap-2 justify-start" role="status" aria-label="Lumi está pensando na resposta">
            <TutorLumi tamanho={28} humor="pensando" />
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-study-line/15 bg-study-tint px-4 py-3 dark:bg-study-paper">
              <span className="text-xs text-study-ink/70 dark:text-white/70">Lumi está pensando</span>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-2 w-2 rounded-full bg-study-accent motion-safe:animate-bounce dark:bg-white/70"
                  style={{ animationDelay: `${dot * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {sendError && <p role="alert" className="px-3 text-xs text-red-700 dark:text-red-300">{sendError}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          enviar()
        }}
        className="flex items-end gap-2 border-t border-study-line/15 p-3"
      >
        <textarea
          id="lumi-message"
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
          aria-label="Mensagem para a Lumi"
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-study-line/25 bg-study-paper px-3 py-2 text-sm text-study-ink outline-none focus:border-study-line dark:bg-study-paper dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-study-accent px-4 py-2 text-sm font-black text-white transition hover:bg-study-accent disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

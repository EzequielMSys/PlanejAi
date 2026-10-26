import LumiConversations from './LumiConversations'
import LumiContextPicker from './LumiContextPicker'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import inteligencia from '../services/inteligenciaService'
import TutorLumi from './TutorLumi'
function PlainLumiMessage({ content }) {
  return <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
}
const LumiMessage = lazy(() => import('./LumiMessage').catch(() => ({ default: PlainLumiMessage })))
import LumiPractice from './LumiPractice'

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
    <div className={`flex items-start gap-2 ${ehUsuario ? 'lumi-message--user justify-end' : 'lumi-message--assistant justify-start'}`}>
      {!ehUsuario && <TutorLumi tamanho={28} />}
      <div
        className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 text-[.94rem] shadow-sm sm:max-w-[82%] ${
          ehUsuario
            ? 'bg-study-accent text-white rounded-br-md'
            : 'bg-study-tint dark:bg-study-paper text-study-ink dark:text-white/90 border border-study-line/15 rounded-bl-md'
        }`}
      >
        {ehUsuario ? <p className="whitespace-pre-wrap break-words leading-relaxed">{mensagem.content}</p> : <Suspense fallback={<PlainLumiMessage content={mensagem.content} />}><LumiMessage content={mensagem.content} /></Suspense>}
        {mensagem.criado_em && (
          <time dateTime={mensagem.criado_em} className="block translate-y-0.5 text-[10px] opacity-50">
            {formatarHora(mensagem.criado_em)}
          </time>
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({ className = '', redacaoSelecionada, perguntaInicial = '', estudoAtual, compacto = false, praticaAtual, anotacaoAtual, conversaSolicitada }) {
  const [mensagens, setMensagens] = useState([])
  const [input, setInput] = useState(perguntaInicial)
  const [materia, setMateria] = useState(estudoAtual?.disciplina || '')
  const [loading, setLoading] = useState(false)
  const [contexto, setContexto] = useState(null)
  const [sendError, setSendError] = useState('')
  const [history,setHistory]=useState(null)
  const [historyBusy,setHistoryBusy]=useState(false)
  const fimRef = useRef(null)
  const inputRef = useRef(null)
  const sendingRef = useRef(false)
  const [practiceEpoch,setPracticeEpoch]=useState(0)
  const [conversationEpoch,setConversationEpoch]=useState(0)
  const [items,setItems]=useState(()=>estudoAtual?.titulo?[{id:'session',tipo:'sessao',titulo:'Sessão atual',texto:[estudoAtual.disciplina,estudoAtual.titulo].filter(Boolean).join(' · ')}]:[])
  const resetItems=next=>{if(sendingRef.current)return;setConversationEpoch(value=>value+1);setItems(next);setMensagens([]);setHistory(null);setSendError('')}
  const fresh=()=>{if(sendingRef.current)return;resetItems([]);setMateria('');setInput('');setPracticeEpoch(value=>value+1)}
  const candidates=[...(estudoAtual?.titulo?[{id:'session',tipo:'sessao',titulo:'Sessão atual',texto:[estudoAtual.disciplina,estudoAtual.titulo].filter(Boolean).join(' · ')}]:[]),...(anotacaoAtual?.trim()?[{id:'note',tipo:'anotacao',titulo:'Anotação da sessão',texto:anotacaoAtual.slice(0,1500)}]:[]),...(redacaoSelecionada?.tema?[{id:'essay',tipo:'redacao',titulo:'Tema da redação selecionada',texto:redacaoSelecionada.tema.slice(0,1500)}]:[]),...(Array.isArray(contexto?.licoes)?contexto.licoes:[]).slice(0,4).map((item,index)=>({id:'lesson-'+index,tipo:'registro',titulo:'Lição: '+item.titulo,texto:item.disciplina+' · '+item.titulo}))]


  useEffect(() => {
    if (mensagens.length) fimRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagens, loading])

  useEffect(() => {
    let active=true
    inteligencia.chatContext().then(value=>{if(active)setContexto(value)}).catch(() => {})
    return()=>{active=false}
  }, [])

  function append(mensagem) {
    setMensagens((prev) => [...prev, { ...mensagem, id: Date.now() + Math.random() }])
  }
  async function viewHistory(){
    if(history){setHistory(null);return}
    setHistoryBusy(true)
    try{const rows=await inteligencia.chatHistory();setHistory(Array.isArray(rows)?rows:[])}
    catch{toast.error('Não foi possível consultar o histórico. A conversa atual continua disponível.')}
    finally{setHistoryBusy(false)}
  }

  async function enviar(texto, disciplinaOverride, pratica) {
    const mensagem = (texto || input).trim()
    if (!mensagem || sendingRef.current) return
    sendingRef.current = true
    const envioId = Date.now() + Math.random()
    setSendError('')
    setMensagens((prev) => [...prev, {
      id: envioId,
      role: 'user',
      content: mensagem,
      disciplina: disciplinaOverride || materia || null,
      criado_em: new Date().toISOString(),
    }])
    setInput('')
    setLoading(true)
    try {
      const data = await inteligencia.chatSend(mensagem, disciplinaOverride || materia || undefined, undefined, items.some(item=>item.id==='session') ? estudoAtual : undefined, pratica, {versao:1,itens:items.map(({tipo,titulo,texto})=>({tipo,titulo,texto})),historico:mensagens.filter(item=>['user','assistant'].includes(item.role)).map(({role,content})=>({role,content})).slice(-12)})
      if (data?.offline || data?.queued) {
        toast(data.message || 'Sem conexão: a mensagem será enviada quando você ficar online.')
      } else if (data?.mensagens) {
        setMensagens(
          data.mensagens.map((m) => ({
            role: m.role,
            content: m.conteudo,
            disciplina: m.disciplina,
            criado_em: m.criado_em,
          }))
        )
      } else if (data?.conteudo) {
        append({
          role: 'assistant',
          content: data.conteudo,
          disciplina: disciplinaOverride || materia || null,
          criado_em: new Date().toISOString(),
        })
      }
      return !data?.offline && !data?.queued
    } catch (error) {
      const aviso = error?.response?.data?.message || 'Não foi possível conversar com a Lumi agora.'
      setMensagens((atuais) => atuais.filter((item) => item.id !== envioId))
      setInput(mensagem)
      setSendError(aviso)
      toast.error(aviso)
      return false
    } finally {
      sendingRef.current = false
      setLoading(false)
      if (!pratica) inputRef.current?.focus()
    }
  }

  async function limparConversa() {
    if (!window.confirm('Limpar o histórico geral e esta conversa da tela? As conversas guardadas por objetivo serão preservadas.')) return
    try {
      await inteligencia.chatClear()
      setMensagens([])
      setHistory(null)
      toast.success('Conversa limpa.')
    } catch {
      toast.error('Não foi possível limpar a conversa.')
    }
  }

  return (
    <div className={`flex min-h-0 flex-col h-full ${className}`}>
      <div className="lumi-controls flex items-center justify-between gap-2 border-b border-study-line/10 px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-bold text-black/60 dark:text-white/60">
          Matéria
          <select
            value={materia}
            disabled={loading} onChange={(event) => {resetItems(items);setMateria(event.target.value)}}
            className="rounded-lg border border-study-line/25 bg-study-paper px-2 py-1 text-xs font-semibold text-study-ink dark:bg-study-paper dark:text-white"
          >
            <option value="">Todas</option>
            {[...new Set([...DISCIPLINAS, estudoAtual?.disciplina].filter(Boolean))].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        {!compacto && <button type="button" disabled={historyBusy || loading} onClick={viewHistory}>{historyBusy?'Consultando…':history?'Fechar histórico':'Ver histórico salvo'}</button>}
        {!compacto && <button
          type="button"
          onClick={limparConversa}
          disabled={(!mensagens.length && !history?.length) || loading}
          className="rounded-lg px-2 py-1 text-xs font-bold text-study-accent hover:bg-study-accent/10 disabled:opacity-40 dark:text-white/80"
        >
          Limpar histórico geral
        </button>}
      </div>

      <LumiConversations requestedId={conversationEpoch===0?conversaSolicitada:undefined} key={conversationEpoch} snapshot={{itens:items,materia,mensagens}} draftMessage={input} busy={loading} onRestore={record=>{setItems(record.itens.map((item,index)=>({...item,id:`conversation-${index}`})));setMateria(record.materia);setMensagens(record.mensagens);setInput('');setHistory(null);setSendError('');setPracticeEpoch(value=>value+1)}} />
      <LumiContextPicker items={items} candidates={candidates} onChange={resetItems} onFresh={fresh} busy={loading} materia={materia} onRemoveSubject={()=>{resetItems(items);setMateria('')}} />

      <div className="lumi-feed flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
        {history && <section className="lumi-history-readonly" aria-label="Histórico salvo, apenas para consulta"><h3>Histórico salvo · apenas consulta</h3><p>Estas mensagens não são incluídas no contexto desta conversa.</p>{!history.length && <p>Nenhuma mensagem foi encontrada.</p>}{history.map((message,index)=><Mensagem key={index} mensagem={{role:message.role,content:message.conteudo,criado_em:message.criado_em}}/>)}</section>}
        {!mensagens.length && !loading && (
          <div className="lumi-welcome-content">
            <div className="lumi-welcome-top"><TutorLumi tamanho={compacto ? 38 : 64} /><div><strong>{compacto && items.some(item=>item.id==='session') && estudoAtual?.titulo ? `Vamos estudar ${estudoAtual.titulo}` : 'Por onde começamos?'}</strong><span>{compacto ? 'Pergunte qualquer coisa ou comece pelo tema de hoje.' : 'Escolha um caminho ou escreva sua própria pergunta abaixo.'}</span></div></div>
            {compacto && items.some(item=>item.id==='session') && estudoAtual?.titulo && <div className="lumi-starter-section"><div className="lumi-starters"><button type="button" onClick={() => { setInput(`Me ensine ${estudoAtual.titulo}${estudoAtual.disciplina ? ` em ${estudoAtual.disciplina}` : ''} passo a passo, com um exemplo e uma pergunta curta para eu praticar.`); inputRef.current?.focus() }}>Começar por este conteúdo →</button></div></div>}
            {!compacto && <div className="lumi-starter-section"><span>EXPLORAR UMA DÚVIDA</span><div className="lumi-starters">
              {SUGESTOES_INICIO.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => { setInput(sugestao); inputRef.current?.focus() }}
                >
                  {sugestao}
                </button>
              ))}
            </div></div>}
          </div>
        )}

        {mensagens.map((mensagem, index) => (
          <Mensagem key={mensagem.id || `${mensagem.role}-${index}`} mensagem={mensagem} />
        ))}

        {loading && (
          <div className="flex items-start gap-2 justify-start" role="status" aria-label="Lumi está pensando na resposta">
            <TutorLumi tamanho={28} />
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

      {compacto && items.some(item=>item.id==='session') && estudoAtual?.titulo && <div className="session-lumi-shortcuts" aria-label="Estudar este conteúdo com a Lumi"><p>Sobre <strong>{estudoAtual.titulo}</strong></p><div>{[
        ['Explique de outro jeito', `Explique ${estudoAtual.titulo} de outro jeito. Se já explicou nesta conversa, mude a abordagem. Use linguagem simples, em passos curtos, e confira minha dúvida antes de avançar.`],
        ['Dê um exemplo', `Dê um exemplo concreto sobre ${estudoAtual.titulo}. Resolva passo a passo e conecte cada passo ao conceito. Termine propondo uma pequena variação para eu tentar.`],
        ['Confira se entendi', `Faça uma única pergunta curta sobre ${estudoAtual.titulo} para conferir se entendi. Não revele a resposta agora. Espere minha tentativa e depois explique o que acertei e o que devo revisar.`],
      ].map(([label, prompt]) => <button type="button" key={label} disabled={loading} onClick={() => enviar(prompt, estudoAtual.disciplina)}>{label}</button>)}</div><small>O atalho envia uma pergunta sobre a sessão atual.</small></div>}
      {sendError && <p role="alert" className="px-3 text-xs text-red-700 dark:text-red-300">{sendError}</p>}
      <LumiPractice key={`${praticaAtual?.id || 'livre'}:${practiceEpoch}`} context={practiceEpoch ? undefined : praticaAtual} loading={loading} onSend={pratica => enviar(`${pratica.modo === 'pista' ? 'Quero uma pista' : pratica.modo === 'feedback' ? 'Confira minha tentativa' : 'Quero ver a resolução comentada'}: ${pratica.pergunta}${pratica.tentativa ? `\nMinha tentativa: ${pratica.tentativa}` : ''}`, materia || undefined, pratica)} />

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

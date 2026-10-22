import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import inteligencia from '../services/inteligenciaService'
import LumiMark from './LumiMark'
import Icon from './Icons'
import StudyText from './StudyText'
import './Lumi.css'

const SUBJECTS = ['Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Português', 'Inglês', 'Redação']
export const LUMI_STARTERS = [
  { icon: 'book', title: 'Entender um assunto', text: 'Uma explicação clara, com exemplos do dia a dia.', prompt: 'Quero entender um assunto passo a passo. Primeiro, pergunte o que estou estudando e o que já sei sobre ele.' },
  { icon: 'exam', title: 'Treinar com questões', text: 'Raciocine primeiro. Confira a resposta depois.', prompt: 'Quero treinar com uma questão de cada vez, sem mostrar a resposta antes da minha tentativa. Pergunte qual assunto e dificuldade eu prefiro.' },
  { icon: 'route', title: 'Revisar o que aprendi', text: 'Conecte as ideias e descubra o que falta fixar.', prompt: 'Me ajude a revisar ativamente. Pergunte qual assunto estudei e depois faça perguntas curtas para verificar meu entendimento.' },
  { icon: 'pen', title: 'Desenvolver uma redação', text: 'Organize a tese e fortaleça seus argumentos.', prompt: 'Quero construir minha própria redação, sem que você escreva por mim. Pergunte meu tema e me ajude a desenvolver uma tese e argumentos.' },
]
const normalize = rows => (Array.isArray(rows) ? rows : []).map((m, index) => ({ id: m.id || `history-${index}`, role: m.role, content: String(m.conteudo ?? m.content ?? ''), criado_em: m.criado_em })).filter(m => ['user', 'assistant'].includes(m.role))
export default function ChatInterface({ className = '', compact = false, initialPrompt = '', initialDiscipline = '' }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialPrompt)
  const [subject, setSubject] = useState(initialDiscipline)
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [sendError, setSendError] = useState('')
  const [clearing, setClearing] = useState(false)
  const inputRef = useRef(null)
  const feedRef = useRef(null)
  const busy = useRef(false)
  const historyVersion = useRef(0)
  const mounted = useRef(true)
  const loadHistory = useCallback(async () => {
    const version = ++historyVersion.current
    setHistoryLoading(true); setHistoryError('')
    try { const data = await inteligencia.chatHistory(); if (mounted.current && version === historyVersion.current) setMessages(normalize(data)) }
    catch { if (mounted.current && version === historyVersion.current) setHistoryError('Não conseguimos carregar a conversa anterior.') }
    finally { if (mounted.current && version === historyVersion.current) setHistoryLoading(false) }
  }, [])
  useEffect(() => { mounted.current = true; loadHistory(); return () => { mounted.current = false; historyVersion.current++ } }, [loadHistory])
  useEffect(() => { if (initialPrompt) { setInput(initialPrompt); inputRef.current?.focus() } }, [initialPrompt])
  useEffect(() => { const feed = feedRef.current; if (feed) feed.scrollTop = messages.length || loading ? feed.scrollHeight : 0 }, [messages, loading])
  function choosePrompt(prompt) { setInput(prompt); setSendError(''); inputRef.current?.focus() }
  async function send(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy.current || historyLoading || clearing) return
    busy.current = true
    const pendingId = window.crypto.randomUUID?.() || `pending-${Date.now()}`
    setMessages(current => [...current, { id: pendingId, role: 'user', content: text }])
    setInput(''); setLoading(true); setSendError('')
    try {
      const data = await inteligencia.chatSend(text, subject || undefined)
      if (!mounted.current) return
      if (Array.isArray(data?.mensagens)) setMessages(normalize(data.mensagens))
      else if (data?.conteudo) setMessages(current => [...current, { id: `answer-${pendingId}`, role: 'assistant', content: data.conteudo }])
      else throw new Error('A Lumi não conseguiu concluir a resposta. Tente novamente.')
    } catch (error) {
      if (!mounted.current) return
      setMessages(current => current.filter(message => message.id !== pendingId))
      setInput(text)
      setSendError(error.response?.data?.message || error.message || 'Não foi possível conversar com a Lumi agora.')
    } finally { busy.current = false; if (mounted.current) { setLoading(false); inputRef.current?.focus() } }
  }
  async function clear() {
    if (busy.current || clearing || !window.confirm('Apagar o histórico desta conversa com a Lumi?')) return
    setClearing(true)
    try { await inteligencia.chatClear(); if (mounted.current) { setMessages([]); setSendError(''); setHistoryError('') } }
    catch { toast.error('Não foi possível apagar a conversa. Seu histórico foi preservado.') }
    finally { if (mounted.current) setClearing(false) }
  }
  async function copy(text) {
    try { await window.navigator.clipboard.writeText(text); toast.success('Resposta copiada.') }
    catch { toast.error('Não foi possível copiar. Você pode selecionar o texto da resposta.') }
  }
  return <section className={`lumi-chat ${compact ? 'lumi-chat--compact' : ''} ${className}`} aria-label="Conversa com a Lumi">
    <div className="lumi-chat-toolbar"><label><Icon name="book" size={17} /><span>Matéria</span><select aria-label="Matéria da conversa" value={subject} onChange={event => setSubject(event.target.value)} disabled={loading}><option value="">Todas as matérias</option>{SUBJECTS.map(item => <option key={item}>{item}</option>)}</select></label><button type="button" onClick={clear} disabled={!messages.length || loading || clearing || historyLoading}>{clearing ? 'Apagando…' : 'Limpar conversa'}</button></div>
    {historyError && <div className="lumi-notice" role="alert"><p>{historyError}</p><button type="button" onClick={loadHistory} disabled={loading}>Tentar novamente</button></div>}
    <div className="lumi-feed" ref={feedRef} role="log" aria-label="Mensagens da conversa" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
      {historyLoading ? <div className="lumi-history-loading" role="status"><LumiMark /><p>Preparando nossa conversa…</p></div> : !messages.length && <div className="lumi-welcome"><LumiMark size={62} /><span className="sd-eyebrow">UM ESPAÇO PARA SUAS PERGUNTAS</span><h2>Vamos descobrir juntos?</h2><p>Sou a Lumi. Posso explicar de outro jeito, ajudar você a praticar ou organizar o que aprendeu. Por onde começamos?</p><div className="lumi-starters">{LUMI_STARTERS.map(starter => <button type="button" key={starter.title} onClick={() => choosePrompt(starter.prompt)}><Icon name={starter.icon} /><strong>{starter.title}</strong>{!compact && <span>{starter.text}</span>}<Icon name="arrow" size={16} /></button>)}</div></div>}
      {messages.map(message => <article key={message.id} className={`lumi-message lumi-message--${message.role}`}><div className="lumi-message-author">{message.role === 'assistant' && <LumiMark size={24} />}<strong>{message.role === 'user' ? 'Você' : 'Lumi'}</strong></div><StudyText>{message.content}</StudyText>{message.role === 'assistant' && <button className="lumi-copy" type="button" onClick={() => copy(message.content)} aria-label="Copiar resposta da Lumi"><Icon name="copy" size={14} />Copiar</button>}</article>)}
      {loading && <div className="lumi-thinking" role="status"><LumiMark size={26} /><span>A Lumi está preparando uma explicação…</span><i /></div>}
    </div>
    {sendError && <div className="lumi-notice lumi-notice--error" role="alert"><p>{sendError}</p><small>Sua pergunta continua no campo abaixo. Você pode tentar enviar novamente.</small></div>}
    <form className="lumi-composer" onSubmit={send}><label className="sr-only" htmlFor={compact ? 'lumi-widget-message' : 'lumi-message'}>Sua pergunta para a Lumi</label><textarea id={compact ? 'lumi-widget-message' : 'lumi-message'} ref={inputRef} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(event) } }} rows={compact ? 2 : 3} maxLength={2000} placeholder="Qual ideia você quer entender hoje?" disabled={historyLoading || clearing || loading} /><div><span>{input.length}/2000 <small>· Enter envia. Shift + Enter cria uma linha.</small></span><button type="submit" className="sd-button sd-button--primary" disabled={loading || historyLoading || clearing || !input.trim()}><span>{loading ? 'Pensando…' : 'Enviar'}</span><Icon name="send" size={17} /></button></div></form>
    <p className="lumi-footnote">A Lumi pode cometer erros. Confira informações importantes no seu material de estudo.</p>
  </section>
}

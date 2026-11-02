import { useEffect, useId, useRef, useState } from 'react'
import inteligencia from '../services/inteligenciaService'
import prepareActivityPhoto from '../utils/prepareActivityPhoto'
import './LumiPhoto.css'

export default function LumiPhoto({ file, onCancel, onUse, prepare = prepareActivityPhoto }) {
  const uid = useId(), dialog = useRef(null), textField = useRef(null), request = useRef(null), generation = useRef(0)
  const [photo, setPhoto] = useState(null), [phase, setPhase] = useState('preparing'), [error, setError] = useState('')
  const [text, setText] = useState(''), [warnings, setWarnings] = useState([]), [checked, setChecked] = useState(false)
  useEffect(() => {
    const element = dialog.current
    element?.showModal?.()
    return () => { request.current?.abort(); element?.close?.() }
  }, [])
  useEffect(() => {
    const version = ++generation.current
    let url
    setPhase('preparing'); setError(''); setPhoto(null); setText(''); setWarnings([]); setChecked(false)
    prepare(file).then(blob => {
      if (version !== generation.current) return
      url = URL.createObjectURL(blob); setPhoto({ blob, url }); setPhase('ready')
    }).catch(err => { if (version === generation.current) { setError(err.message); setPhase('error') } })
    return () => { generation.current++; request.current?.abort(); if (url) URL.revokeObjectURL(url) }
  }, [file, prepare])

  useEffect(() => { if (phase === 'review') { textField.current?.focus({preventScroll:true}); textField.current?.scrollIntoView({block:'nearest',behavior:'auto'}) } }, [phase])

  async function read() {
    if (!photo || phase === 'reading') return
    const version = generation.current
    request.current = new window.AbortController(); setPhase('reading'); setError('')
    try {
      const result = await inteligencia.chatReadPhoto(photo.blob, request.current.signal)
      if (version !== generation.current) return
      setText(result.texto); setWarnings(result.conferir); setChecked(false); setPhase('review')
    } catch (err) {
      if (version !== generation.current || request.current?.signal.aborted) return
      setError(err.response?.data?.message || 'Não foi possível ler a foto. Sua prévia continua aqui; tente novamente.'); setPhase('ready')
    }
  }
  const unresolved = /\[ileg[ií]vel\]/i.test(text)
  const preview = photo && <figure><img src={photo.url} alt="Prévia da atividade escolhida"/><figcaption>Confira se o enunciado, as figuras e as alternativas estão inteiros.</figcaption></figure>
  return <dialog ref={dialog} className="lumi-photo" aria-labelledby={`${uid}-title`} onCancel={event => { event.preventDefault(); onCancel() }}>
    <header><div><span>DA FOTO PARA O SEU ESTUDO</span><h2 id={`${uid}-title`}>Conferir atividade</h2></div><button type="button" onClick={onCancel} aria-label="Fechar prévia da foto">Fechar</button></header>
    <ol className="lumi-photo-steps" aria-label="Etapas da foto"><li aria-current={phase !== 'review' ? 'step' : undefined}>01 · Ler a foto</li><li aria-current={phase === 'review' ? 'step' : undefined}>02 · Conferir o texto</li><li>03 · Conversar</li></ol>
    {phase === 'preparing' && <p role="status">Preparando a foto…</p>}
    {photo && (phase === 'review' ? <details className="lumi-photo-original"><summary>Conferir com a foto original</summary>{preview}</details> : preview)}
    {phase !== 'review' && photo && <div className="lumi-photo-read"><p>A foto será enviada ao serviço de IA para transcrição. Ela não é salva no histórico do PlanejAI. Só o texto que você conferir poderá entrar na conversa.</p><button type="button" disabled={phase === 'reading'} onClick={read}>{phase === 'reading' ? 'Lendo enunciado…' : 'Ler enunciado'}</button></div>}
    {phase === 'review' && <section className="lumi-photo-review"><h3>O que a Lumi conseguiu ler</h3><p>Corrija o texto, especialmente números, sinais e unidades.</p>{warnings.length > 0 && <div className="lumi-photo-warnings" role="status"><b>Pontos para conferir</b><ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}<label htmlFor={`${uid}-text`}>Enunciado reconhecido<textarea ref={textField} id={`${uid}-text`} value={text} maxLength={1800} rows={7} onChange={event => { setText(event.target.value); setChecked(false); setError('') }}/></label><small>{text.length}/1800 caracteres · Uma questão por foto</small>{unresolved && <p className="lumi-photo-warnings">Complete os trechos [ilegível] antes de usar o enunciado.</p>}<label className="lumi-photo-confirm"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)}/>Conferi o enunciado, os números e os pontos sinalizados.</label><button type="button" disabled={!checked || !text.trim() || unresolved} onClick={() => { const message = onUse(text.trim()); if (message) setError(message) }}>Usar enunciado na mensagem</button><p className="lumi-photo-footnote">Isso preenche sua mensagem. Você ainda escolhe quando enviar à Lumi.</p></section>}
    {error && <p className="lumi-photo-error" role="alert">{error}</p>}
    <footer><button type="button" onClick={onCancel}>Voltar sem usar a foto</button><span>Para outra foto, feche esta prévia e anexe novamente.</span></footer>
  </dialog>
}

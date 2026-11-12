import { useEffect, useRef, useState } from 'react'
import inteligencia from '../services/inteligenciaService'
import './LumiPhoto.css'

const MAX_EXCERPT = 1800

export default function LumiAttachment({ file, onCancel, onUse }) {
  const dialog = useRef(null)
  const video = useRef(null)
  const [url, setUrl] = useState('')
  const [page, setPage] = useState(1)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const request = useRef(null)
  const pdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf'
  const plain = /\.(txt|md|csv|json|srt|vtt)$/i.test(file.name)
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name) && !file.type.startsWith('audio/')

  useEffect(() => {
    const element = dialog.current
    element.showModal?.()
    const preview = isVideo ? URL.createObjectURL(file) : ''
    setUrl(preview)
    return () => {
      request.current?.abort()
      element.close?.()
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [file, isVideo])

  async function read(mode) {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    try {
      let result
      if (pdf) {
        const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
          import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')
        ])
        GlobalWorkerOptions.workerSrc = worker.default
        const task = getDocument({ data: await file.arrayBuffer(), isEvalSupported: false })
        try {
          const document = await task.promise
          if (!Number.isInteger(page) || page < 1 || page > document.numPages) throw new Error(`Escolha uma página entre 1 e ${document.numPages}.`)
          const sheet = await document.getPage(page)
          const content = await sheet.getTextContent()
          const extracted = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('').trim()
          if (extracted && mode !== 'visual') result = { texto: extracted.slice(0, 12000), truncated: extracted.length > 12000 }
          else {
            const size = sheet.getViewport({ scale: 1 })
            const viewport = sheet.getViewport({ scale: 1600 / Math.max(size.width, size.height) })
            const canvas = window.document.createElement('canvas')
            canvas.width = Math.ceil(viewport.width)
            canvas.height = Math.ceil(viewport.height)
            await sheet.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise
            result = await readCanvas(canvas, controller.signal)
          }
        } finally { await task.destroy() }
      } else if (plain) {
        const texto = (await file.text()).trim()
        result = { texto: texto.slice(0, 12000), truncated: texto.length > 12000 }
      } else if (mode === 'frame') {
        const element = video.current
        if (!element?.videoWidth || element.seeking) throw new Error('Carregue o vídeo e pause no quadro que deseja ler.')
        element.pause()
        const canvas = window.document.createElement('canvas')
        const scale = Math.min(1, 1600 / Math.max(element.videoWidth, element.videoHeight))
        canvas.width = Math.round(element.videoWidth * scale)
        canvas.height = Math.round(element.videoHeight * scale)
        canvas.getContext('2d').drawImage(element, 0, 0, canvas.width, canvas.height)
        result = await readCanvas(canvas, controller.signal)
      } else {
        result = await inteligencia.chatTranscribe(file, controller.signal)
      }
      if (controller.signal.aborted) return
      if (!result.texto?.trim()) throw new Error('Nenhum texto foi reconhecido.')
      setText(result.texto)
      setNotice([...(result.conferir || []), ...(result.truncated ? ['O texto excedeu o limite da prévia.'] : [])].join(' '))
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.response?.data?.message || (failure instanceof Error && !failure.isAxiosError ? failure.message : 'Não foi possível ler este arquivo.'))
    } finally {
      request.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return <dialog ref={dialog} className="lumi-photo" aria-label="Conferir arquivo" onCancel={event => { event.preventDefault(); onCancel() }}>
    <header><h2>Conferir arquivo</h2><button type="button" onClick={onCancel}>Fechar</button></header>
    <p>{file.name}</p>
    {pdf && <label>Página <input type="number" min="1" step="1" value={page} disabled={busy} onChange={event => setPage(Number(event.target.value))} /></label>}
    {isVideo && url && <video ref={video} src={url} controls playsInline preload="metadata" style={{ maxWidth: '100%', maxHeight: '35vh' }} />}
    {!plain && <p>{pdf ? 'Páginas digitalizadas e a leitura visual usam o serviço de IA.' : isVideo ? 'Transcrição de vídeos de até 4 MB. A leitura de quadro envia apenas a imagem selecionada ao serviço de IA.' : 'A transcrição envia o áudio ao serviço de IA.'}</p>}
    <div className="lumi-photo-read">
      <button type="button" disabled={busy || (pdf && (!Number.isInteger(page) || page < 1)) || (!pdf && !plain && file.size > 4 * 1024 * 1024)} onClick={() => read('text')}>{busy ? 'Lendo…' : pdf || plain ? 'Ler texto' : 'Transcrever áudio'}</button>
      {pdf && <button type="button" disabled={busy || page < 1} onClick={() => read('visual')}>Ler página como imagem</button>}
      {isVideo && <button type="button" disabled={busy} onClick={() => read('frame')}>Ler quadro atual</button>}
    </div>
    {notice && <p role="status">{notice}</p>}
    {text && <section className="lumi-photo-review">
      <label>Texto reconhecido<textarea rows={8} value={text} onChange={event => setText(event.target.value)} /></label>
      <p>Confira o conteúdo e mantenha até {MAX_EXCERPT} caracteres para incluir na mensagem.</p>
      <button type="button" disabled={busy || !text.trim() || text.trim().length > MAX_EXCERPT} onClick={() => setError(onUse(text.trim()) || '')}>Usar texto na mensagem</button>
    </section>}
    {error && <p role="alert">{error}</p>}
  </dialog>
}

async function readCanvas(canvas, signal) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!blob) throw new Error('Não foi possível preparar a imagem para leitura.')
  if (signal.aborted) throw new DOMException('Leitura cancelada.', 'AbortError')
  return inteligencia.chatReadPhoto(blob, signal)
}

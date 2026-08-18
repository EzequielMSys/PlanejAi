import { useEffect, useMemo, useState } from 'react'
import { resolveBackendAsset } from '../config/api'

function youtubeEmbed(url) {
  try {
    const parsed = new window.URL(url)
    const id = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v')
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  } catch {
    return null
  }
}

function wikipediaTitle(url) {
  try {
    const parsed = new window.URL(url)
    if (parsed.hostname !== 'pt.wikipedia.org' || !parsed.pathname.startsWith('/wiki/')) return null
    return decodeURIComponent(parsed.pathname.replace('/wiki/', ''))
  } catch {
    return null
  }
}

export default function MaterialViewer({ material, onClose }) {
  const [article, setArticle] = useState(null)
  const [articleError, setArticleError] = useState(false)
  const url = resolveBackendAsset(material?.url || '')
  const wikiTitle = useMemo(() => wikipediaTitle(url), [url])
  const embedUrl = useMemo(() => youtubeEmbed(url), [url])
  const type = String(material?.tipo || '').toUpperCase()
  const isPdf = type === 'PDF' || type.includes('PDF') || /\.pdf(?:$|[?#])/i.test(url)
  const isVideoFile = type.includes('VIDEO') && /\.(mp4|webm|ogg)(?:$|[?#])/i.test(url)

  useEffect(() => {
    if (!material) return undefined
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [material, onClose])

  useEffect(() => {
    if (!wikiTitle) return
    setArticle(null)
    setArticleError(false)
    fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`)
      .then((response) => {
        if (!response.ok) throw new Error('Leitura indisponível')
        return response.json()
      })
      .then(setArticle)
      .catch(() => setArticleError(true))
  }, [wikiTitle])

  if (!material) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#100A18]/80 p-3 backdrop-blur-md sm:p-6" onMouseDown={onClose}>
      <section className="material-viewer" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label={material.titulo}>
        <header className="material-viewer-header">
          <div>
            <p>PLANEJAI / SALA DE ESTUDO</p>
            <h2>{material.titulo || 'Material de estudo'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar material">×</button>
        </header>

        <div className="material-viewer-body">
          {embedUrl ? (
            <iframe src={embedUrl} title={material.titulo} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : isVideoFile ? (
            <video src={url} controls autoPlay className="h-full w-full bg-black" />
          ) : isPdf ? (
            <iframe src={`${url}#view=FitH`} title={material.titulo} />
          ) : wikiTitle ? (
            <article className="material-article">
              {article?.thumbnail?.source && <img src={article.thumbnail.source} alt="" />}
              <span>Leitura orientada</span>
              <h3>{article?.title || material.titulo}</h3>
              {article ? <p>{article.extract}</p> : articleError ? <p>Não foi possível carregar esta leitura agora.</p> : <p>Preparando conteúdo…</p>}
              <small>Conteúdo introdutório da Wikipédia, disponibilizado sob CC BY-SA.</small>
            </article>
          ) : (
            <iframe src={url} title={material.titulo} />
          )}
        </div>

        <footer className="material-viewer-footer">
          <span>Pressione Esc para fechar</span>
          <a href={url} target="_blank" rel="noopener noreferrer">Abrir externamente se necessário ↗</a>
        </footer>
      </section>
    </div>
  )
}

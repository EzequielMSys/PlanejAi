import { useEffect, useMemo } from 'react'
import { resolveBackendAsset } from '../config/api'
import StudyGuide, { isExternalStudySource } from './StudyGuide'

export default function MaterialViewer({ material, onClose }) {
  const url = resolveBackendAsset(material?.url || material?.link || '')
  const externalSource = useMemo(() => isExternalStudySource(url), [url])
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
          {externalSource ? (
            <StudyGuide material={material} sourceUrl={url} />
          ) : isVideoFile ? (
            <video src={url} controls autoPlay className="h-full w-full bg-black" />
          ) : isPdf ? (
            <iframe src={`${url}#view=FitH`} title={material.titulo} />
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

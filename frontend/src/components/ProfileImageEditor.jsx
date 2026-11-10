import { useEffect, useRef, useState } from 'react'

const FORMATS = {
  avatar: { width: 512, height: 512, title: 'Ajustar foto de perfil' },
  banner: { width: 1400, height: 450, title: 'Ajustar banner' }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function drawImage(canvas, image, mode, zoom, rotation, offset) {
  const { width, height } = FORMATS[mode]
  const context = canvas.getContext('2d')
  if (!context) return

  canvas.width = width
  canvas.height = height
  const quarterTurn = Math.abs(rotation % 180) === 90
  const rotatedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth
  const rotatedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight
  const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * zoom
  const maxX = Math.max(0, (rotatedWidth * scale - width) / 2)
  const maxY = Math.max(0, (rotatedHeight * scale - height) / 2)

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.translate(width / 2 + clamp(offset.x, -maxX, maxX), height / 2 + clamp(offset.y, -maxY, maxY))
  context.rotate(rotation * Math.PI / 180)
  context.scale(scale, scale)
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
}

function canvasBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

export default function ProfileImageEditor({ file, mode, onCancel, onSave, saving }) {
  const canvasRef = useRef(null)
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const dragRef = useRef(null)
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const nextImage = new window.Image()
    nextImage.onload = () => setImage(nextImage)
    nextImage.onerror = () => setError('Não foi possível abrir esta imagem. Escolha outra.')
    nextImage.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (image && canvasRef.current) drawImage(canvasRef.current, image, mode, zoom, rotation, offset)
  }, [image, mode, zoom, rotation, offset])

  useEffect(() => {
    titleRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onCancel()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, saving])

  const onPointerDown = (event) => {
    if (!image || saving) return
    dragRef.current = { x: event.clientX, y: event.clientY, offset }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (!dragRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const { width, height } = FORMATS[mode]
    setOffset({
      x: dragRef.current.offset.x + (event.clientX - dragRef.current.x) * width / rect.width,
      y: dragRef.current.offset.y + (event.clientY - dragRef.current.y) * height / rect.height
    })
  }

  const save = async () => {
    if (!image || !canvasRef.current) return
    setError('')
    let blob = await canvasBlob(canvasRef.current, 0.88)
    if (blob?.size > 2 * 1024 * 1024) blob = await canvasBlob(canvasRef.current, 0.72)
    if (!blob || blob.size > 2 * 1024 * 1024) {
      setError('A imagem ficou grande demais. Escolha outra foto.')
      return
    }
    await onSave(new window.File([blob], `${mode === 'banner' ? 'banner' : 'perfil'}.jpg`, { type: 'image/jpeg' }))
  }

  return (
    <div className="profile-image-overlay">
      <div ref={dialogRef} className="profile-image-dialog" role="dialog" aria-modal="true" aria-label={FORMATS[mode].title}>
        <div className="profile-image-dialog-head">
          <h2 ref={titleRef} tabIndex={-1}>{FORMATS[mode].title}</h2>
          <button type="button" onClick={onCancel} disabled={saving} aria-label="Fechar ajuste da imagem">×</button>
        </div>
        <p>Arraste para enquadrar. Ajuste o tamanho e gire antes de salvar.</p>
        <div className={`profile-image-stage profile-image-stage-${mode}`}>
          <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }} aria-label="Prévia da imagem ajustada" role="img" />
        </div>
        <div className="profile-image-controls">
          <label>Tamanho <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} aria-label="Tamanho da imagem" /></label>
          <div role="group" aria-label="Rotação da imagem">
            <button type="button" onClick={() => { setRotation((value) => value - 90); setOffset({ x: 0, y: 0 }) }}>Girar à esquerda</button>
            <button type="button" onClick={() => { setRotation((value) => value + 90); setOffset({ x: 0, y: 0 }) }}>Girar à direita</button>
          </div>
        </div>
        {error && <p className="profile-image-error" role="alert">{error}</p>}
        <div className="profile-image-dialog-actions">
          <button type="button" onClick={onCancel} disabled={saving} className="profile-secondary-button">Cancelar</button>
          <button type="button" onClick={save} disabled={!image || saving} className="profile-primary-button">{saving ? 'Salvando…' : 'Salvar imagem'}</button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { PALETTES } from '../theme/palettes.js'
import { oklchToHex } from '../theme/color.js'

// Amostras fixes do seletor. A matiz é o que o usuário enxerga, então basta
// uma rampa curta de tons reconhecíveis — e ela existe para dar um ponto de
// partida rápido, não para limitar as escolhas.
const AMOSTRAS = [
  { nome: 'Amétis', hex: '#7c3aed' },
  { nome: 'Violeta', hex: '#9333ea' },
  { nome: 'Indigo', hex: '#4f46e5' },
  { nome: 'Lagoa', hex: '#0ea5e9' },
  { nome: 'Floresta', hex: '#10b981' },
  { nome: 'Brasa', hex: '#f59e0b' },
  { nome: 'Coral', hex: '#f43f5e' },
  { nome: 'Grafite', hex: '#475569' },
]

export default function ColorPicker() {
  const { paleta, escolherPaleta, corCustom, escolherCor, usarCorPadrao, paletas } = useTheme()
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef(null)

  // Fecha ao clicar fora e com Escape: um painel de configuração que não
  // fecha é um painel que atrapalha.
  useEffect(() => {
    if (!aberto) return
    const cliqueFora = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setAberto(false)
    }
    const tecla = (e) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', cliqueFora)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', cliqueFora)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberto])

  const corAtual = corCustom || oklchToHex(0.55, paletas[paleta]?.chroma ?? 0.155, paletas[paleta]?.hue ?? 288)

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className="pn-btn pn-btn-fantasma"
        style={{ padding: '.5rem .75rem' }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '1.15rem', height: '1.15rem', borderRadius: '50%',
            background: corAtual, border: '2px solid var(--pn-superficie)',
            boxShadow: '0 0 0 1px var(--pn-borda-forte)',
          }}
        />
        <span className="sr-only sm:not-sr-only">Mudar cor</span>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            role="dialog"
            aria-label="Personalizar aparência"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="pn-folha"
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + .5rem)',
              width: 'min(19rem, calc(100vw - 2rem))', padding: '1rem', zIndex: 70,
            }}
          >
            <p className="pn-sobrancelha" style={{ marginBottom: '.6rem' }}>Paletas</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.4rem' }}>
              {Object.values(paletas).map((p) => {
                const ativa = !corCustom && p.id === paleta
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => escolherPaleta(p.id)}
                    aria-pressed={ativa}
                    className="pn-folha-plana"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.5rem',
                      padding: '.5rem', textAlign: 'left', fontSize: '.78rem',
                      borderColor: ativa ? 'var(--pn-primaria)' : 'var(--pn-borda)',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{ width: '1rem', height: '1rem', borderRadius: '50%', flex: 'none', background: oklchToHex(0.55, p.chroma, p.hue) }}
                    />
                    <span style={{ fontWeight: 650, color: 'var(--pn-texto)' }}>{p.nome}</span>
                  </button>
                )
              })}
            </div>

            <p className="pn-sobrancelha" style={{ margin: '1rem 0 .5rem' }}>Sua cor</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <input
                type="color"
                value={corCustom || corAtual}
                onChange={(e) => escolherCor(e.target.value)}
                aria-label="Escolher uma cor personalizada"
                style={{ width: '3rem', height: '2.4rem', border: 0, background: 'none', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                {AMOSTRAS.map((a) => (
                  <button
                    key={a.hex}
                    type="button"
                    onClick={() => escolherCor(a.hex)}
                    title={a.nome}
                    aria-label={`Usar a cor ${a.nome}`}
                    style={{
                      width: '1.35rem', height: '1.35rem', borderRadius: '.4rem',
                      background: a.hex,
                      border: corCustom === a.hex ? '2px solid var(--pn-texto)' : '1px solid var(--pn-borda)',
                    }}
                  />
                ))}
              </div>
            </div>

            {corCustom && (
              <button type="button" onClick={usarCorPadrao} className="pn-btn pn-btn-fantasma" style={{ width: '100%', marginTop: '.8rem', padding: '.5rem' }}>
                Voltar para {paletas[paleta]?.nome}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
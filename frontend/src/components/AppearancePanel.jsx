import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { oklchToHex } from '../theme/color'
import Icon from './Icons'

export default function AppearancePanel() {
  const { paletas, paleta, corCustom, escolherPaleta, escolherCor, usarCorPadrao, isDark, toggleTheme } = useTheme()
  const current = corCustom || oklchToHex(.55, paletas[paleta].chroma, paletas[paleta].hue)
  const [draft, setDraft] = useState(current)
  const [error, setError] = useState('')
  useEffect(() => { setDraft(current) }, [current])
  function apply(event) {
    event.preventDefault()
    if (!/^#[a-f0-9]{6}$/i.test(draft)) return setError('Use uma cor hexadecimal de seis dígitos, como #52796F.')
    escolherCor(draft); setError('')
  }
  return <section className="sd-settings-section" aria-labelledby="appearance-title"><div className="sd-section-heading"><Icon name="palette" /><div><h2 id="appearance-title">Um espaço com a sua cor</h2><p>Escolha uma paleta ou crie a sua. O contraste do texto é ajustado automaticamente.</p></div></div>
    <fieldset className="sd-theme-options"><legend>Iluminação</legend>{[['light', 'Claro', 'Um ambiente leve para o dia.'], ['dark', 'Escuro', 'Menos brilho para estudar à noite.']].map(([id, label, text]) => <label key={id} data-selected={(isDark ? 'dark' : 'light') === id}><input type="radio" name="appearance-mode" checked={(isDark ? 'dark' : 'light') === id} onChange={() => { if ((id === 'dark') !== isDark) toggleTheme() }} /><span><strong>{label}</strong><small>{text}</small></span></label>)}</fieldset>
    <fieldset className="sd-palette-options"><legend>Paletas prontas</legend>{Object.values(paletas).map(p => <label key={p.id} data-selected={paleta === p.id && !corCustom}><input type="radio" name="appearance-palette" checked={paleta === p.id && !corCustom} onChange={() => escolherPaleta(p.id)} /><i style={{ background: oklchToHex(.55, p.chroma, p.hue) }} /><span>{p.nome}</span></label>)}</fieldset>
    <form className="sd-custom-color" onSubmit={apply}><div><label htmlFor="custom-color-hex">Sua própria cor</label><p>Use o seletor ou digite um código.</p></div><input aria-label="Selecionar uma cor personalizada" type="color" value={/^#[a-f0-9]{6}$/i.test(draft) ? draft : current} onChange={event => setDraft(event.target.value)} /><input id="custom-color-hex" value={draft} maxLength={7} onChange={event => setDraft(event.target.value)} spellCheck="false" /><button className="sd-button sd-button--primary">Aplicar cor</button>{corCustom && <button type="button" className="sd-text-button" onClick={usarCorPadrao}>Restaurar paleta</button>}{error && <p className="sd-form-error" role="alert">{error}</p>}</form>
  </section>
}

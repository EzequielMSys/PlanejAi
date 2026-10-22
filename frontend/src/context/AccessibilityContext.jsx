import { createContext, useContext, useEffect, useState } from 'react'
import { normalizeReadingPreferences, READING_DEFAULTS } from '../utils/readingPreferences'
const Context = createContext(null)
export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => { try { return normalizeReadingPreferences(JSON.parse(localStorage.getItem('planejai:accessibility') || '{}')) } catch { return { ...READING_DEFAULTS } } })
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--a11y-font-scale', `${settings.fontScale}%`)
    root.style.setProperty('--a11y-line-height', settings.lineHeight)
    root.style.setProperty('--study-font', settings.dyslexicFont ? 'Verdana, Arial, sans-serif' : settings.readingFont === 'serif' ? 'Georgia, Cambria, serif' : 'system-ui, -apple-system, Segoe UI, sans-serif')
    root.style.setProperty('--study-width', { narrow: '60ch', balanced: '72ch', wide: '88ch' }[settings.readingWidth])
    root.dataset.readingSurface = settings.readingSurface
    for (const [key, className] of Object.entries({ highContrast: 'a11y-high-contrast', reducedMotion: 'a11y-reduced-motion', dyslexicFont: 'a11y-dyslexic', focusMode: 'a11y-focus', hoverReader: 'a11y-hover-reader' })) root.classList.toggle(className, settings[key])
    try { localStorage.setItem('planejai:accessibility', JSON.stringify(settings)) } catch { /* Preferences still apply when browser storage is unavailable. */ }
  }, [settings])
  function update(key, value) { setSettings(current => normalizeReadingPreferences({ ...current, [key]: value })) }
  return <Context.Provider value={{ settings, update, reset: () => setSettings({ ...READING_DEFAULTS }) }}>{children}</Context.Provider>
}
export const useAccessibility = () => useContext(Context)

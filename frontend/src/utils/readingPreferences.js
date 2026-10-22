export const READING_DEFAULTS = { fontScale: 100, lineHeight: 1.75, highContrast: false, reducedMotion: false, dyslexicFont: false, focusMode: false, hoverReader: false, readingFont: 'system', readingWidth: 'balanced', readingSurface: 'default' }
export function normalizeReadingPreferences(value = {}) {
  const source = value && typeof value === 'object' ? value : {}
  const result = { ...READING_DEFAULTS }
  for (const key of ['highContrast', 'reducedMotion', 'dyslexicFont', 'focusMode', 'hoverReader']) result[key] = source[key] === true
  for (const [key, min, max] of [['fontScale', 90, 140], ['lineHeight', 1.5, 2.2]]) {
    if (source[key] !== undefined && Number.isFinite(Number(source[key]))) result[key] = Math.max(min, Math.min(max, Number(source[key])))
  }
  for (const [key, allowed] of Object.entries({ readingFont: ['system', 'serif'], readingWidth: ['narrow', 'balanced', 'wide'], readingSurface: ['default', 'paper'] })) if (allowed.includes(source[key])) result[key] = source[key]
  return result
}

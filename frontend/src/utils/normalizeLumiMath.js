// Convert the delimiters used by older replies before Markdown consumes their
// backslashes. Code examples stay literal, and ordinary brackets stay text.
const unitSymbols = {
  ampere: 'A', celsius: '{}^\\circ\\mathrm{C}', gram: 'g', joule: 'J', kelvin: 'K', kilogram: 'kg',
  meter: 'm', metre: 'm', newton: 'N', ohm: '\\Omega', pascal: 'Pa', second: 's', volt: 'V', watt: 'W'
}

function normalizeUnit(unit) {
  const notation = unit
    .replace(/\\(ampere|celsius|gram|joule|kelvin|kilogram|meter|metre|newton|ohm|pascal|second|volt|watt)\b/g, (_, name) => unitSymbols[name])
    .replace(/\\per\b/g, '/')
    .replace(/\\squared\b/g, '^{2}')
    .replace(/\\cubed\b/g, '^{3}')
    .replace(/\\degree\b/g, '{}^\\circ')
  return `\\mathrm{${notation}}`
}

function normalizeCommonNotation(formula) {
  return formula
    // siunitx is frequent in physics answers but is not part of KaTeX. These
    // simple forms carry the same readable value and unit without a plugin.
    .replace(/\\(?:SI|qty)\{([^{}]*)\}\{([^{}]*)\}/g, (_, value, unit) => `${value}\\,${normalizeUnit(unit)}`)
    .replace(/\\unit\{([^{}]*)\}/g, (_, unit) => normalizeUnit(unit))
    .replace(/\\ang\{([^{}]*)\}/g, (_, value) => `${value}{}^\\circ`)
    // AI answers occasionally put display-only environments inside `$...$`.
    // `aligned` works in both inline and display math without changing rows.
    .replace(/\\begin\{(?:align\*?|alignedat\*?)\}/g, '\\begin{aligned}')
    .replace(/\\end\{(?:align\*?|alignedat\*?)\}/g, '\\end{aligned}')
    .replace(/\\begin\{(?:equation\*?|displaymath)\}|\\end\{(?:equation\*?|displaymath)\}/g, '')
}

function normalizeFormula(formula) {
  // Some responses cross the JSON/Markdown boundary twice, leaving commands
  // such as `\\\\text` and `\\\\xrightarrow` in the formula. KaTeX reads the
  // first slash as a line break command, rather than as the command itself.
  // Keep intentional LaTeX line breaks intact (they are followed by a newline)
  // and only collapse repeated slashes immediately before a command or symbol.
  const normalized = normalizeCommonNotation(formula.replace(/\\{2,}(?=[A-Za-z;,:!{}_^])/g, '\\'))
  const group = (token) => token.startsWith('{') ? token : `{${token}}`
  const content = (token) => token.startsWith('{') ? token.slice(1, -1) : token

  // Chemical answers commonly add the aqueous state after the charge, e.g.
  // `\\text{NO}_{3}^{-}_{(aq)}`. TeX allows only one subscript per atom;
  // merge the state with the existing subscript and put it before the charge.
  return normalized
    .replace(/(\\text\{[^{}]*\})_(\{[^{}]*\}|[A-Za-z0-9])\^(\{[^{}]*\}|[A-Za-z0-9])_(\{[^{}]*\}|[A-Za-z0-9])/g,
      (_, atom, subscript, superscript, state) => `${atom}_{${content(subscript)}${content(state)}}^${group(superscript)}`)
    .replace(/(\\text\{[^{}]*\})\^(\{[^{}]*\}|[A-Za-z0-9])_(\{[^{}]*\}|[A-Za-z0-9])/g,
      (_, atom, superscript, subscript) => `${atom}_${group(subscript)}^${group(superscript)}`)
}

function normalizeCurrency(text) {
  // remark-math treats even LaTeX's escaped dollar as a math delimiter.
  // Protect literal dollars first; use a dollar-free KaTeX character command
  // inside math and restore Markdown escapes everywhere else.
  let marker = '\uE000'
  while (text.includes(marker)) marker += '\uE000'
  return text.replace(/\\\$/g, marker)
    .replace(/(?<!\$)R\$(?=\s*\d|})/g, () => `R${marker}`)
    .replace(/(?<![\\$])(\${1,2})(?!\$)([\s\S]*?)(?<![\\$])\1(?!\$)/g,
      (_, delimiter, formula) => `${delimiter}${normalizeFormula(formula).replaceAll(marker, '\\char"0024 ')}${delimiter}`)
    .replaceAll(marker, '\\$')
}

function normalizeText(text) {
  return normalizeCurrency(text
    .replace(/\\+\[([\s\S]*?)\\+\]/g, (_, formula) => `\n$$\n${normalizeFormula(formula.trim())}\n$$\n`)
    .replace(/\\+\(([\s\S]*?)\\+\)/g, (_, formula) => `$${normalizeFormula(formula.trim())}$`)
    .replace(/(^|\n)([ \t]*)\[[ \t]*([^\n]+?)\][ \t]*(?=\n|$)/g, (original, newline, indent, formula) => {
      if (!/\\(?:frac|sqrt|text|sum|int|begin|mathrm|cdot|times)\b|[_^]\s*\{/.test(formula)) return original
      return `${newline}${indent}$$\n${indent}${normalizeFormula(formula.trim())}\n${indent}$$`
    })
  )
}

function outsideInlineCode(text) {
  let result = '', start = 0, index = 0
  while (index < text.length) {
    if (text[index] !== '`') { index++; continue }
    let end = index
    while (text[end] === '`') end++
    const marker = text.slice(index, end)
    let close = text.indexOf(marker, end)
    while (close !== -1 && (text[close - 1] === '`' || text[close + marker.length] === '`')) close = text.indexOf(marker, close + marker.length)
    if (close === -1) { index = end; continue }
    result += normalizeText(text.slice(start, index)) + text.slice(index, close + marker.length)
    start = index = close + marker.length
  }
  return result + normalizeText(text.slice(start))
}

export default function normalizeLumiMath(content) {
  if (typeof content !== 'string') return ''
  let result = '', prose = '', fence = null, indented = false, previousBlank = true
  for (const line of content.match(/[^\n]*\n|[^\n]+$/g) || []) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})([^\n]*)/)
    if (fence) {
      result += line
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null
    } else if (marker) {
      result += outsideInlineCode(prose) + line
      prose = ''
      fence = marker[1]
    } else if ((/^(?: {4}|\t)/.test(line) && (previousBlank || indented)) || (indented && !line.trim())) {
      result += outsideInlineCode(prose) + line
      prose = ''
      indented = true
    } else { prose += line; indented = false }
    previousBlank = !line.trim()
  }
  return result + outsideInlineCode(prose)
}

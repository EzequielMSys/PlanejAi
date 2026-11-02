// Convert the delimiters used by older replies before Markdown consumes their
// backslashes. Code examples stay literal, and ordinary brackets stay text.
function normalizeCurrency(text) {
  // remark-math treats even LaTeX's escaped dollar as a math delimiter.
  // Protect literal dollars first; use a dollar-free KaTeX character command
  // inside math and restore Markdown escapes everywhere else.
  let marker = '\uE000'
  while (text.includes(marker)) marker += '\uE000'
  return text.replace(/\\\$/g, marker)
    .replace(/(?<!\$)R\$(?=\s*\d|})/g, () => `R${marker}`)
    .replace(/(?<![\\$])(\${1,2})(?!\$)([\s\S]*?)(?<![\\$])\1(?!\$)/g,
      (_, delimiter, formula) => `${delimiter}${formula.replaceAll(marker, '\\char"0024 ')}${delimiter}`)
    .replaceAll(marker, '\\$')
}

function normalizeText(text) {
  return normalizeCurrency(text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `\n$$\n${formula.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => `$${formula.trim()}$`)
    .replace(/(^|\n)([ \t]*)\[[ \t]*([^\n]+?)\][ \t]*(?=\n|$)/g, (original, newline, indent, formula) => {
      if (!/\\(?:frac|sqrt|text|sum|int|begin|mathrm|cdot|times)\b|[_^]\s*\{/.test(formula)) return original
      return `${newline}${indent}$$\n${indent}${formula.trim()}\n${indent}$$`
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

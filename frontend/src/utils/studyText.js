export function parseStudyText(value) {
  const lines = String(value || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraph = [], code = null, list = null
  const flush = () => { if (paragraph.length) { blocks.push({ type: 'paragraph', text: paragraph.join('\n') }); paragraph = [] } if (list) { blocks.push(list); list = null } }
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flush()
      if (code) { blocks.push(code); code = null } else code = { type: 'code', language: line.trim().slice(3).replace(/[^\w+-]/g, '').slice(0, 24), text: '' }
      continue
    }
    if (code) { code.text += (code.text ? '\n' : '') + line; continue }
    const heading = line.match(/^#{1,4}\s+(.+)$/)
    const bullet = line.match(/^\s*(?:[-*]\s+|\d+[.)]\s+)(.+)$/)
    if (!line.trim()) { flush(); continue }
    if (heading) { flush(); blocks.push({ type: 'heading', text: heading[1] }); continue }
    if (bullet) {
      if (paragraph.length) { blocks.push({ type: 'paragraph', text: paragraph.join('\n') }); paragraph = [] }
      const ordered = /^\s*\d/.test(line)
      if (list && list.ordered !== ordered) { blocks.push(list); list = null }
      if (!list) list = { type: 'list', ordered, items: [] }
      list.items.push(bullet[1]); continue
    }
    if (list) { blocks.push(list); list = null }
    paragraph.push(line)
  }
  flush()
  if (code) blocks.push(code)
  return blocks
}
export function inlineStudyText(value) {
  return String(value).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map(part =>
    part.startsWith('**') && part.endsWith('**') ? { type: 'strong', text: part.slice(2, -2) } :
      part.startsWith('`') && part.endsWith('`') ? { type: 'code', text: part.slice(1, -1) } : { type: 'text', text: part })
}

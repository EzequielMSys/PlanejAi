export function downloadTextCopy(text, filename = 'planejai-copia-do-texto.txt') {
  const url = window.URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = filename
  document.body.appendChild(link); link.click(); link.remove()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

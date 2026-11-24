(function () {
  try {
    var raw = localStorage.getItem('planejai:tema') || '{}'
    var ajustes = JSON.parse(raw)
    if (ajustes.fundoTorrido) document.documentElement.classList.add('pn-alto-contraste')
    var tema = localStorage.getItem('theme')
    if (tema !== 'light' && tema !== 'dark') {
      tema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    document.documentElement.classList.toggle('dark', tema === 'dark')
  } catch { /* Mantém o tema padrão quando o armazenamento estiver bloqueado. */ }
})()

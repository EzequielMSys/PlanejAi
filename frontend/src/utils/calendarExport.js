const escapeIcs = (value = '') => String(value).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

export function exportarCronograma(cronograma) {
  const eventos = (cronograma?.dias || []).flatMap((dia) => (dia.conteudos || []).map((conteudo) => {
    const data = String(dia.data_estudo || '').slice(0, 10).replaceAll('-', '')
    return ['BEGIN:VEVENT', `UID:planejai-${conteudo.id}@calendar`, `DTSTART;VALUE=DATE:${data}`, `SUMMARY:${escapeIcs(conteudo.titulo || 'Estudo PlanejAI')}`, `DESCRIPTION:${escapeIcs(`${conteudo.disciplina || 'Estudo'} · ${dia.tempo_previsto || 0} min`)}`, 'END:VEVENT'].join('\r\n')
  }))
  const arquivo = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PlanejAI//Cronograma//PT-BR', 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([arquivo], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = 'cronograma-planejai.ics'; link.click(); URL.revokeObjectURL(url)
}

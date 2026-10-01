function replanejarPendencias(itens, hoje = new Date()) {
  const inicio = new Date(hoje);
  inicio.setHours(12, 0, 0, 0);
  const pendentes = itens
    .filter((item) => !item.concluido && new Date(`${item.data_dia}T12:00:00`) < inicio)
    .sort((a, b) => String(a.data_dia).localeCompare(String(b.data_dia)));

  return pendentes.map((item, indice) => {
    const data = new Date(inicio);
    data.setDate(data.getDate() + 1 + Math.floor(indice / 3));
    return { ...item, novaData: data.toISOString().slice(0, 10) };
  });
}

function escaparIcs(valor = '') {
  return String(valor).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

function gerarCalendarioIcs(itens, nome = 'PlanejAI') {
  const eventos = itens.map((item) => {
    const data = String(item.data_dia || item.data || '').replaceAll('-', '');
    return ['BEGIN:VEVENT', `UID:planejai-${item.id || item.id_conteudo_cronograma}@local`, `DTSTART;VALUE=DATE:${data}`, `SUMMARY:${escaparIcs(item.titulo || 'Sessão de estudo')}`, `DESCRIPTION:${escaparIcs(item.disciplina || nome)}`, 'END:VEVENT'].join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${nome}//Cronograma//PT-BR`, 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR'].join('\r\n');
}

module.exports = { replanejarPendencias, gerarCalendarioIcs };


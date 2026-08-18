const RESULTADOS = Object.freeze({
  ESQUECI: { multiplicador: 0, dominio: -2 },
  DIFICIL: { multiplicador: 1.35, dominio: 0 },
  LEMBREI: { multiplicador: 2.2, dominio: 1 },
  DOMINEI: { multiplicador: 3.5, dominio: 2 }
});

function calcularProximaRevisao(estado = {}, resultado, hoje = new Date()) {
  const regra = RESULTADOS[resultado];
  if (!regra) throw new Error('Resultado de revisão inválido.');

  const repeticoesAnteriores = Number(estado.repeticoes || 0);
  const intervaloAnterior = Number(estado.intervalo_dias || 0);
  let repeticoes = resultado === 'ESQUECI' ? 0 : repeticoesAnteriores + 1;
  let intervaloDias;

  if (resultado === 'ESQUECI') intervaloDias = 1;
  else if (repeticoes === 1) intervaloDias = resultado === 'DOMINEI' ? 3 : 1;
  else if (repeticoes === 2) intervaloDias = resultado === 'DIFICIL' ? 3 : 6;
  else intervaloDias = Math.max(1, Math.round(Math.max(intervaloAnterior, 3) * regra.multiplicador));

  intervaloDias = Math.min(intervaloDias, 120);
  const proxima = new Date(hoje);
  proxima.setHours(12, 0, 0, 0);
  proxima.setDate(proxima.getDate() + intervaloDias);

  return {
    repeticoes,
    intervaloDias,
    nivelDominio: Math.max(0, Math.min(10, Number(estado.nivel_dominio || 0) + regra.dominio)),
    proximaRevisao: proxima.toISOString().slice(0, 10),
    resultado
  };
}

module.exports = { RESULTADOS, calcularProximaRevisao };


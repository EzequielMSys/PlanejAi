const CONFIDENCE = Object.freeze({ CHUTEI: 0.45, DUVIDA: 0.75, CERTEZA: 1 });
const DIFFICULTY = Object.freeze({ FACIL: 0.8, MEDIA: 1, DIFICIL: 1.2 });

function atualizarDominio(estado = {}, tentativa = {}) {
  const anterior = Math.max(0, Math.min(100, Number(estado.dominio) || 0));
  const evidencias = Math.max(0, Number(estado.evidencias) || 0) + 1;
  const confianca = CONFIDENCE[tentativa.confianca] ?? CONFIDENCE.DUVIDA;
  const dificuldade = DIFFICULTY[tentativa.dificuldade] ?? DIFFICULTY.MEDIA;
  const ajuda = Math.max(0.35, 1 - (Math.max(0, Number(tentativa.pistasUsadas) || 0) * 0.18));
  const alvo = tentativa.acertou ? 100 : 0;
  const peso = Math.min(0.32, (0.12 + (1 / Math.sqrt(evidencias)) * 0.12) * dificuldade * ajuda);
  let dominio = anterior + ((alvo - anterior) * peso * confianca);

  // Errar com certeza indica uma concepção equivocada; acertar chutando não é
  // evidência suficiente para declarar domínio.
  if (!tentativa.acertou && tentativa.confianca === 'CERTEZA') dominio -= 7;
  if (tentativa.acertou && tentativa.confianca === 'CHUTEI') dominio = Math.min(dominio, anterior + 4);
  dominio = Math.round(Math.max(0, Math.min(100, dominio)));

  const confiancaAnterior = Number(estado.confianca_media) || 0;
  const confiancaValor = Math.round(confianca * 100);
  return {
    dominio,
    evidencias,
    acertos: Math.max(0, Number(estado.acertos) || 0) + (tentativa.acertou ? 1 : 0),
    confiancaMedia: Math.round(((confiancaAnterior * (evidencias - 1)) + confiancaValor) / evidencias),
    intervaloDias: dominio >= 85 ? 21 : dominio >= 70 ? 10 : dominio >= 50 ? 4 : 1
  };
}

function recomendarDificuldade(dominio) {
  const valor = Number(dominio) || 0;
  if (valor < 40) return 'FACIL';
  if (valor < 75) return 'MEDIA';
  return 'DIFICIL';
}

function escolherProximaAcao({ revisoes = 0, erros = 0, competencia, minutos = 25, energia = 3 } = {}) {
  if (revisoes > 0) return { tipo: 'REVISAO', minutos: Math.min(minutos, 20), motivo: `${revisoes} revisão(ões) estão vencendo e a memória perde força com o atraso.` };
  if (erros > 0) return { tipo: 'ERROS', minutos: Math.min(minutos, 20), motivo: `${erros} erro(s) ainda precisam ser explicados e corrigidos.` };
  if (competencia) return { tipo: energia <= 2 ? 'PRATICA_LEVE' : 'COMPETENCIA', minutos, competencia, motivo: `${competencia.nome} é sua competência com menor domínio (${competencia.dominio}%).` };
  return { tipo: 'DIAGNOSTICO', minutos: Math.min(minutos, 15), motivo: 'Ainda faltam evidências para personalizar seu próximo estudo.' };
}

function calcularSequenciaSemanal(datas = [], hoje = new Date()) {
  const semanas = new Set(datas.map((data) => {
    const d = new Date(`${String(data).slice(0, 10)}T12:00:00`);
    const quinta = new Date(d);
    quinta.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    return `${quinta.getFullYear()}-${String(Math.floor((quinta - new Date(quinta.getFullYear(), 0, 1)) / 604800000) + 1).padStart(2, '0')}`;
  }));
  let sequencia = 0;
  const cursor = new Date(hoje);
  for (let i = 0; i < 260; i += 1) {
    const quinta = new Date(cursor);
    quinta.setDate(cursor.getDate() + 3 - ((cursor.getDay() + 6) % 7));
    const key = `${quinta.getFullYear()}-${String(Math.floor((quinta - new Date(quinta.getFullYear(), 0, 1)) / 604800000) + 1).padStart(2, '0')}`;
    if (!semanas.has(key)) break;
    sequencia += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return sequencia;
}

module.exports = { CONFIDENCE, atualizarDominio, recomendarDificuldade, escolherProximaAcao, calcularSequenciaSemanal };

const redacaoModel = require('../models/redacaoModel');

/**
 * Análise de pontuação e estrutura básica do texto.
 */
function analisarTexto(texto) {
  const paragrafos = texto
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const quantidadeParagrafos = paragrafos.length;

  const frases = texto
    .split(/[.!?]+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  const palavras = texto
    .split(/\s+/)
    .filter(Boolean);

  const totalPalavras = palavras.length;

  const paragrafosLongos = paragrafos.filter(
    (p) => p.split(/\s+/).filter(Boolean).length > 6
  ).length;

  const usoPontoFinal = frases.length >= 3;

  const extensaoAdequada = totalPalavras >= 200;

  return {
    paragrafos,
    quantidadeParagrafos,
    frases,
    palavras,
    totalPalavras,
    paragrafosLongos,
    usoPontoFinal,
    extensaoAdequada
  };
}

/**
 * Detecta conectivos de coesão no texto.
 */
function detectarConectivos(texto) {
  const conectivos = [
    'portanto',
    'assim',
    'além disso',
    'ademais',
    'contudo',
    'entretanto',
    'porém',
    'no entanto',
    'dessa forma',
    'desse modo',
    'em suma',
    'por fim',
    'primeiramente',
    'por outro lado',
    'logo',
    'todavia'
  ];

  const textoNormalizado = texto.toLowerCase();

  return conectivos.filter((c) => textoNormalizado.includes(c));
}

/**
 * Detecta elementos de proposta de intervenção.
 */
function detectarPropostaIntervencao(texto) {
  const expressoes = [
    'é necessário',
    'é preciso',
    'deve',
    'pode-se',
    'governo',
    'estado',
    'sociedade',
    'medidas',
    'ações',
    'implementar',
    'criar',
    'políticas',
    'cidadania',
    'educação',
    'conscientização'
  ];

  const textoNormalizado = texto.toLowerCase();

  const encontrados = expressoes.filter((e) =>
    textoNormalizado.includes(e)
  );

  return encontrados;
}

/**
 * Gera nota e feedback baseado em análise estrutural do texto.
 */
function gerarFeedbackAutomatico(texto) {
  const analise = analisarTexto(texto);

  const {
    totalPalavras,
    quantidadeParagrafos,
    usoPontoFinal,
    extensaoAdequada
  } = analise;

  const conectivos = detectarConectivos(texto);
  const intervencao = detectarPropostaIntervencao(texto);

  let nota = 0;
  const pontos = [];

  // Competência 1: Domínio da escrita formal
  if (extensaoAdequada) {
    nota += 20;
    pontos.push(
      'Domínio básico da escrita formal: boa extensão e desenvolvimento.'
    );
  } else {
    pontos.push(
      'A redação está curta. Desenvolva mais para demonstrar domínio da escrita formal.'
    );
  }

  // Competência 2: Compreensão do tema
  if (usoPontoFinal && totalPalavras >= 150) {
    nota += 20;
    pontos.push(
      'Boa estruturação de ideias com o uso de frases completas e coerentes.'
    );
  } else {
    pontos.push(
      'Revise a organização das frases e a progressão das ideias para melhorar a coesão.'
    );
  }

  // Competência 3: Seleção e organização de argumentos
  if (quantidadeParagrafos >= 3) {
    nota += 20;
    pontos.push(
      'Boa organização em parágrafos, o que ajuda na progressão argumentativa.'
    );
  } else {
    pontos.push(
      'Divida o texto em mais parágrafos (introdução, desenvolvimento e conclusão) para melhorar a estrutura.'
    );
  }

  // Competência 4: Coesão e conectivos
  if (conectivos.length >= 2) {
    nota += 20;
    pontos.push(
      `Bom uso de conectivos (${conectivos.slice(0, 3).join(', ')}) garantindo coesão textual.`
    );
  } else {
    pontos.push(
      'Utilize mais conectivos (portanto, além disso, contudo, etc.) para melhorar a coesão entre as ideias.'
    );
  }

  // Competência 5: Proposta de intervenção
  if (intervencao.length >= 2) {
    nota += 20;
    pontos.push(
      'Presença de elementos de proposta de intervenção respeitando os direitos humanos.'
    );
  } else {
    pontos.push(
      'Inclua uma proposta de intervenção clara, detalhada e com agente, ação e efeito.'
    );
  }

  // Garante nota mínima de 40 quando há texto mínimo
  if (totalPalavras > 0) {
    nota = Math.max(nota, 40);
  }

  const feedback = [
    `Sua redação tem ${totalPalavras} palavras e ${quantidadeParagrafos} parágrafo(s).`,
    ...pontos,
    `Nota estimada: ${nota.toFixed(1)}/100.`
  ].join(' ');

  return {
    nota,
    feedback
  };
}

async function enviarRedacao(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { tema, texto } = req.body;

    if (!tema || !texto) {
      return res.status(400).json({ message: 'Tema e texto são obrigatórios.' });
    }

    const avaliacao = gerarFeedbackAutomatico(texto);

    const redacao = await redacaoModel.criarRedacao(usuarioId, {
      tema,
      texto,
      notaEstimada: avaliacao.nota,
      feedbackIa: avaliacao.feedback
    });

    return res.status(201).json({
      message: 'Redação enviada com sucesso.',
      redacao
    });
  } catch (error) {
    console.error('Erro ao enviar redação:', error);
    return res.status(500).json({ message: 'Erro interno ao enviar redação.' });
  }
}

async function listarRedacoes(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const redacoes = await redacaoModel.listarPorUsuario(usuarioId);
    return res.json(redacoes);
  } catch (error) {
    console.error('Erro ao listar redações:', error);
    return res.status(500).json({ message: 'Erro interno ao listar redações.' });
  }
}

module.exports = {
  enviarRedacao,
  listarRedacoes
};

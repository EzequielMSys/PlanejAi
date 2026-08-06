const redacaoModel = require('../models/redacaoModel');
const { analisarRedacao } = require('../utils/analiseRedacao');
const { corrigirTexto } = require('../utils/languageToolService');
const { sugerirTemaPorPalavraChave, sugerirTemaAleatorio, gerarRepertorioParaTema } = require('../utils/repertorioRedacao');

/**
 * Análise de pontuação e estrutura básica do texto.
 */
function analisarEstrutura(texto) {
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

  const usoPontoFinal = frases.length >= 3;

  const extensaoAdequada = totalPalavras >= 200;

  return {
    quantidadeParagrafos,
    frases,
    totalPalavras,
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

  return expressoes.filter((e) => textoNormalizado.includes(e));
}

/**
 * Gera nota e feedback baseado em análise estrutural do texto.
 */
function gerarFeedbackAutomatico(texto) {
  const { quantidadeParagrafos, totalPalavras, usoPontoFinal, extensaoAdequada } = analisarEstrutura(texto);

  const conectivos = detectarConectivos(texto);
  const intervencao = detectarPropostaIntervencao(texto);

  let nota = 0;
  const pontos = [];

  // Competência 1: Domínio da escrita formal
  if (extensaoAdequada) {
    nota += 20;
    pontos.push('Domínio básico da escrita formal: boa extensão e desenvolvimento.');
  } else {
    pontos.push('A redação está curta. Desenvolva mais para demonstrar domínio da escrita formal.');
  }

  // Competência 2: Compreensão do tema
  if (usoPontoFinal && totalPalavras >= 150) {
    nota += 20;
    pontos.push('Boa estruturação de ideias com o uso de frases completas e coerentes.');
  } else {
    pontos.push('Revise a organização das frases e a progressão das ideias para melhorar a coesão.');
  }

  // Competência 3: Seleção e organização de argumentos
  if (quantidadeParagrafos >= 3) {
    nota += 20;
    pontos.push('Boa organização em parágrafos, o que ajuda na progressão argumentativa.');
  } else {
    pontos.push('Divida o texto em mais parágrafos (introdução, desenvolvimento e conclusão) para melhorar a estrutura.');
  }

  // Competência 4: Coesão e conectivos
  if (conectivos.length >= 2) {
    nota += 20;
    pontos.push(`Bom uso de conectivos (${conectivos.slice(0, 3).join(', ')}) garantindo coesão textual.`);
  } else {
    pontos.push('Utilize mais conectivos (portanto, além disso, contudo, etc.) para melhorar a coesão entre as ideias.');
  }

  // Competência 5: Proposta de intervenção
  if (intervencao.length >= 2) {
    nota += 20;
    pontos.push('Presença de elementos de proposta de intervenção respeitando os direitos humanos.');
  } else {
    pontos.push('Inclua uma proposta de intervenção clara, detalhada e com agente, ação e efeito.');
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

    // Correção ortográfica com LanguageTool (com fallback)
    const linguagem = await corrigirTexto(texto);

    // Análise avançada: erros, sugestões, detecção de IA e competências ENEM
    const analise = analisarRedacao(texto, linguagem.erros);

    // Se o LanguageTool falhou, usa análise básica de erros
    const errosFinais = linguagem.sucesso ? linguagem.erros : analise.erros;

    const repertorioSugerido = sugerirTemaPorPalavraChave(tema || '');
    const repertorio = gerarRepertorioParaTema(repertorioSugerido, 5);

    const feedbackEnem = [
      `Redação avaliada pelo modelo ENEM (0 a 1000 pontos).`,
      `Sua redação tem ${analise.estrutura.totalPalavras} palavras e ${analise.estrutura.quantidadeParagrafos} parágrafo(s).`,
      `Nota estimada: ${analise.enem.notaFinal}/1000.`,
      analise.enem.competencias
        .map((c) => `C${c.codigo} (${c.nome}): ${c.nota}/${c.maximo}. ${c.feedback}`)
        .join(' ')
    ].join(' ');

    const redacao = await redacaoModel.criarRedacao(usuarioId, {
      tema,
      texto,
      notaEstimada: analise.enem.notaFinal,
      feedbackIa: feedbackEnem,
      errosTexto: errosFinais,
      sugestoes: analise.sugestoes,
      flagIa: analise.ia.flag_ia,
      competenciasEnem: analise.enem.competencias,
      repertorioSugerido: repertorio,
      iaNivel: analise.ia.nivel,
      iaEvidencias: analise.ia.evidencias,
      textoCorrigido: linguagem.corrigido !== texto ? linguagem.corrigido : null
    });

    return res.status(201).json({
      message: 'Redação enviada com sucesso.',
      redacao: {
        ...redacao,
        enem: analise.enem,
        repertorioSugerido: repertorio,
        ia: analise.ia
      }
    });
  } catch (error) {
    console.error('Erro ao enviar redação:', error);
    return res.status(500).json({ message: 'Erro interno ao enviar redação.' });
  }
}

/**
 * Sugere um tema e repertórios de redação para o usuário.
 */
async function sugerirTema(req, res) {
  try {
    const { palavraChave } = req.body;

    let sugestao;
    if (palavraChave) {
      sugestao = sugerirTemaPorPalavraChave(palavraChave);
    } else {
      sugestao = sugerirTemaAleatorio();
    }

    const repertorio = gerarRepertorioParaTema(sugestao, 6);

    return res.json({
      tema: sugestao.tema,
      proposta: sugestao.proposta,
      repertorio
    });
  } catch (error) {
    console.error('Erro ao sugerir tema:', error);
    return res.status(500).json({ message: 'Erro interno ao sugerir tema.' });
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

/**
 * Lista todas as redações (apenas admin/dono) - para avaliação docente.
 */
async function listarTodasRedacoes(req, res) {
  try {
    const redacoes = await redacaoModel.listarTodas();
    return res.json(redacoes);
  } catch (error) {
    console.error('Erro ao listar todas as redações:', error);
    return res.status(500).json({ message: 'Erro interno ao listar redações.' });
  }
}

/**
 * Admin/dono avalia uma redação (nota manual + feedback).
 */
async function avaliarRedacao(req, res) {
  try {
    const administradorId = req.usuario.id;
    const { idRedacao } = req.params;
    const { notaManual, feedbackManual } = req.body;

    if (notaManual === undefined || notaManual === null || !feedbackManual) {
      return res.status(400).json({ message: 'Nota e feedback são obrigatórios.' });
    }

const nota = Number(notaManual);
    if (Number.isNaN(nota) || nota < 0 || nota > 1000) {
      return res.status(400).json({ message: 'Nota deve estar entre 0 e 1000 (padrão ENEM).' });
    }

    const redacao = await redacaoModel.obterRedacaoPorId(idRedacao);
    if (!redacao) {
      return res.status(404).json({ message: 'Redação não encontrada.' });
    }

    const resultado = await redacaoModel.avaliarRedacao(idRedacao, {
      notaManual: nota,
      feedbackManual,
      avaliadoPor: administradorId
    });

    return res.json({
      message: 'Redação avaliada com sucesso.',
      redacao: resultado
    });
  } catch (error) {
    console.error('Erro ao avaliar redação:', error);
    return res.status(500).json({ message: 'Erro interno ao avaliar redação.' });
  }
}

async function obterRedacao(req, res) {
  try {
    const { idRedacao } = req.params;
    const redacao = await redacaoModel.obterRedacaoPorId(idRedacao);

    if (!redacao) {
      return res.status(404).json({ message: 'Redação não encontrada.' });
    }

    return res.json(redacao);
  } catch (error) {
    console.error('Erro ao obter redação:', error);
    return res.status(500).json({ message: 'Erro interno ao obter redação.' });
  }
}

module.exports = {
  enviarRedacao,
  listarRedacoes,
  listarTodasRedacoes,
  avaliarRedacao,
  obterRedacao,
  sugerirTema
};

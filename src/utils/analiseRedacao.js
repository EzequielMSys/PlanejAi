/**
 * Utilitários de análise avançada de redação.
 * Inclui detecção de erros ortográficos, sugestão de palavras,
 * detecção heurística de uso de IA e avaliação por competências do ENEM.
 */

// Conectivos utilizados para recomendações de coesão
const CONECTIVOS = [
  { palavra: 'portanto', categoria: 'conclusão' },
  { palavra: 'assim', categoria: 'conclusão' },
  { palavra: 'logo', categoria: 'conclusão' },
  { palavra: 'dessa forma', categoria: 'conclusão' },
  { palavra: 'desse modo', categoria: 'conclusão' },
  { palavra: 'em suma', categoria: 'conclusão' },
  { palavra: 'por fim', categoria: 'conclusão' },
  { palavra: 'além disso', categoria: 'adição' },
  { palavra: 'ademais', categoria: 'adição' },
  { palavra: 'ainda', categoria: 'adição' },
  { palavra: 'também', categoria: 'adição' },
  { palavra: 'contudo', categoria: 'oposição' },
  { palavra: 'entretanto', categoria: 'oposição' },
  { palavra: 'porém', categoria: 'oposição' },
  { palavra: 'no entanto', categoria: 'oposição' },
  { palavra: 'todavia', categoria: 'oposição' },
  { palavra: 'por outro lado', categoria: 'oposição' },
  { palavra: 'primeiramente', categoria: 'ordenação' },
  { palavra: 'em segundo lugar', categoria: 'ordenação' },
  { palavra: 'finalmente', categoria: 'ordenação' }
];

// Padrões mais extensos de texto gerado por IA (frases genéricas)
const PADROES_IA = [
  'em um mundo cada vez mais',
  'vivemos em uma sociedade',
  'é de extrema importância',
  'é fundamental destacar',
  'não se pode negar que',
  'diante do exposto',
  'tendo em vista',
  'vale ressaltar',
  'cabe destacar',
  'é imperativo',
  'neste contexto',
  'nesse sentido',
  'de maneira geral',
  'em outras palavras',
  'além do mais',
  'posto que',
  'contudo, é importante',
  'portanto, é possível',
  'é importante ressaltar',
  'é importante destacar',
  'diante do cenário',
  'diante desse cenário',
  'em suma',
  'de acordo com estudos',
  'estudos mostram que',
  'pesquisas apontam que',
  'é notório que',
  'é sabido que',
  'faz-se necessário',
  'faz se necessário',
  'faz-se mister',
  'torna-se essencial',
  'torna se essencial',
  'é inegável que',
  'é indiscutível que',
  'no que diz respeito a',
  'quando se trata de',
  'trata-se de'
];

// Palavras conectivas de IA frequentemente repetidas
const PALAVRAS_CHAVE_IA = [
  'crucial', 'fundamental', 'complexo', 'intrínseco', 'inerente',
  'inevitável', 'indubitavelmente', 'notoriamente', 'atualmente',
  'significativamente', 'expressivamente', 'substancialmente',
  'intrínseca', 'inevitavelmente', 'precipuamente', 'hodiernamente',
  'concomitantemente', 'exponencialmente', 'paradigmático', 'paradigmática',
  'estigma', 'estigmatização', 'errôneamente', 'erroneamente', 'supracitado',
  'sobredito', 'supramencionado', 'sobredita', 'vigente', 'premente',
  'contundente', 'disseminação', 'corrobora', 'elucida', 'assertiva'
];

/**
 * Normaliza texto removendo acentos para comparação.
 */
function normalizarPalavra(palavra) {
  return palavra
    .toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z]/g, '');
}

/**
 * Tokeniza o texto em palavras, ignorando pontuação.
 */
function tokenizar(texto) {
  return texto
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[.,;:!?()"']/g, ''))
    .filter((t) => t.length > 0);
}

/**
 * Conta palavras de um texto.
 */
function contarPalavras(texto) {
  return texto.split(/\s+/).filter(Boolean).length;
}

/**
 * Divide o texto em parágrafos.
 */
function obterParagrafos(texto) {
  return texto
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Verifica se o texto possui uma proposta de intervenção (competência 5).
 */
function detectarPropostaIntervencao(texto) {
  const expressoes = [
    'é necessário', 'é preciso', 'deve', 'pode-se', 'é fundamental que',
    'governo', 'estado', 'sociedade', 'medidas', 'ações', 'implementar',
    'criar', 'políticas', 'cidadania', 'educação', 'conscientização',
    'por meio de', 'a fim de', 'visa', 'objetiva', 'proposta', 'intervenção',
    'intervencao', 'agente', 'mecanismo', 'instrumento', 'parceria',
    'ministério', 'secretaria', 'cabe ao', 'compete ao', 'mídia', 'escola'
  ];

  const textoNormalizado = texto.toLowerCase();

  return expressoes.filter((e) => textoNormalizado.includes(e));
}

/**
 * Mede a entropia lexical (variedade de vocabulário) do texto.
 * Textos gerados por IA tendem a ter vocabulário mais repetido.
 */
function calcularEntropiaLexical(texto) {
  const tokens = tokenizar(texto);
  if (tokens.length === 0) return 0;

  const contagem = {};
  for (const token of tokens) {
    contagem[token] = (contagem[token] || 0) + 1;
  }

  const total = tokens.length;
  let entropia = 0;

  for (const freq of Object.values(contagem)) {
    const p = freq / total;
    if (p > 0) {
      entropia -= p * Math.log2(p);
    }
  }

  return entropia;
}

/**
 * Calcula a razão de palavras únicas (type-token ratio).
 */
function calcularTypeTokenRatio(texto) {
  const tokens = tokenizar(texto);
  if (tokens.length === 0) return 0;

  const unicas = new Set(tokens);
  return unicas.size / tokens.length;
}

/**
 * Detecta heurística de uso de IA generativa.
 */
function detectarIA(texto) {
  const textoNormalizado = texto.toLowerCase();
  let pontuacao = 0;
  const evidencias = [];

  // Verifica padrões genéricos típicos de IA
  for (const padrao of PADROES_IA) {
    const ocorrencias = textoNormalizado.split(padrao).length - 1;
    if (ocorrencias > 0) {
      pontuacao += 2 * ocorrencias;
      evidencias.push(`Padrão genérico: "${padrao}"`);
    }
  }

  // Verifica palavras-chave de IA
  for (const palavra of PALAVRAS_CHAVE_IA) {
    const ocorrencias = textoNormalizado.split(palavra).length - 1;
    if (ocorrencias > 0) {
      pontuacao += ocorrencias;
      evidencias.push(`Vocabulário frequente em textos de IA: "${palavra}"`);
    }
  }

  const tokens = tokenizar(texto);
  const totalPalavras = tokens.length;

  // Entropia lexical baixa indica vocabulário repetido (comum em IA)
  const ttr = calcularTypeTokenRatio(texto);
  if (totalPalavras > 100 && ttr < 0.4) {
    pontuacao += 2;
    evidencias.push(`Baixa variedade de vocabulário (type-token ratio: ${ttr.toFixed(2)}).`);
  }

  // Repetição excessiva de conectivos típicos de IA
  const conectivosIA = ['além disso', 'portanto', 'contudo', 'entretanto', 'dessa forma'];
  let usoExcessivoConectivos = 0;
  for (const c of conectivosIA) {
    usoExcessivoConectivos += textoNormalizado.split(c).length - 1;
  }
  if (usoExcessivoConectivos >= 6) {
    pontuacao += 2;
    evidencias.push('Uso excessivo de conectivos típicos de textos gerados por IA.');
  }

  // Texto muito longo e sem erros ortográficos pode indicar IA
  // Nota: esta heurística é uma aproximação e deve ser combinada com outros sinais.
  const semErrosAparentes = contarPalavras(texto) > 300 ? 0 : 1;
  if (totalPalavras > 400 && semErrosAparentes === 0) {
    pontuacao += 1;
    evidencias.push('Texto muito extenso sem erros ortográficos aparentes.');
  }

  const nivel = pontuacao >= 6 ? 'provavel' : pontuacao >= 3 ? 'possivel' : 'improvável';

  return {
    flag_ia: pontuacao >= 6 ? 1 : 0,
    pontuacao,
    nivel,
    evidencias: evidencias.slice(0, 8)
  };
}

/**
 * Gera recomendações de conectivos e melhoria de coesão.
 */
function gerarSugestoes(texto) {
  const tokens = tokenizar(texto);
  const textoNormalizado = texto.toLowerCase();
  const sugestoes = [];

  // Detecta conectivos já usados
  const conectivosUsados = CONECTIVOS.filter((c) =>
    textoNormalizado.includes(c.palavra)
  ).map((c) => c.palavra);

  // Se usar poucos conectivos, sugere mais
  if (conectivosUsados.length < 2) {
    sugestoes.push({
      tipo: 'coesao',
      mensagem:
        'Utilize mais conectivos para melhorar a coesão textual, como "portanto", "além disso", "contudo".'
    });
  }

  // Detecta palavras repetidas
  const contagem = {};
  for (const token of tokens) {
    contagem[token] = (contagem[token] || 0) + 1;
  }

  const repetidas = Object.entries(contagem)
    .filter(([p, c]) => c >= 4 && p.length > 3)
    .map(([p]) => p);

  if (repetidas.length > 0) {
    sugestoes.push({
      tipo: 'vocabulario',
      mensagem: `A palavra "${repetidas[0]}" foi repetida várias vezes. Varie o vocabulário usando sinônimos.`
    });
  }

  // Sugere variação de vocabulário
  if (calcularTypeTokenRatio(texto) < 0.5) {
    sugestoes.push({
      tipo: 'vocabulario',
      mensagem:
        'Há pouca variedade de vocabulário. Utilize sinônimos e evite repetição excessiva de palavras.'
    });
  }

  return sugestoes;
}

/**
 * Avalia a redação por competências do ENEM.
 * Cada competência vale até 200 pontos, total 1000.
 */
function avaliarPorCompetenciasENEM(texto, erros) {
  const { quantidadeParagrafos, totalPalavras, frases, usoPontoFinal, extensaoAdequada } = gerarEstrutura(texto);
  const conectivos = detectarConectivos(texto);
  const intervencao = detectarPropostaIntervencao(texto);

  const competencias = [];

  // Competência 1: Domínio da norma culta (ortografia, gramática, pontuação)
  let c1 = 200;
  const errosOrtograficos = erros.length;
  const deducaoC1 = Math.min(errosOrtograficos * 20, 160);
  c1 = Math.max(40, c1 - deducaoC1);

  if (!usoPontoFinal) {
    c1 = Math.max(40, c1 - 20);
  }

  competencias.push({
    codigo: 1,
    nome: 'Domínio da norma culta',
    nota: Math.round(c1),
    maximo: 200,
    feedback:
      errosOrtograficos === 0
        ? 'Excelente domínio da norma culta. Uso correto de ortografia, gramática e pontuação.'
        : `Foram detectados ${errosOrtograficos} possíveis erros de ortografia/gramática. Revise-os para melhorar o domínio da norma culta.`
  });

  // Competência 2: Compreensão do tema + repertório sociocultural
  let c2 = 200;
  const repertorio = detectarRepertorio(texto);

  if (extensaoAdequada && totalPalavras >= 150) {
    c2 = 200;
  } else if (totalPalavras >= 100) {
    c2 = 160;
  } else {
    c2 = 120;
  }

  if (repertorio.length > 0) {
    c2 = Math.min(200, c2 + 20);
  } else {
    c2 = Math.max(100, c2 - 20);
    competencias.push({
      codigo: 2,
      nome: 'Compreensão do tema e repertório',
      nota: Math.round(c2),
      maximo: 200,
      feedback: 'Não foi identificado repertório sociocultural explícito. Cite autores, obras, fatos históricos ou dados para enriquecer a argumentação.'
    });
  }

  if (!competencias.some((c) => c.codigo === 2)) {
    competencias.push({
      codigo: 2,
      nome: 'Compreensão do tema e repertório',
      nota: Math.round(c2),
      maximo: 200,
      feedback: 'Boa compreensão do tema. Para melhorar, insira mais repertório sociocultural produtivo (obras, autores, fatos históricos).'
    });
  }

  // Competência 3: Seleção e organização de argumentos
  let c3 = 200;
  if (quantidadeParagrafos >= 4) {
    c3 = 200;
  } else if (quantidadeParagrafos === 3) {
    c3 = 170;
  } else if (quantidadeParagrafos === 2) {
    c3 = 140;
  } else {
    c3 = 100;
  }

  competencias.push({
    codigo: 3,
    nome: 'Seleção e organização de argumentos',
    nota: Math.round(c3),
    maximo: 200,
    feedback:
      quantidadeParagrafos >= 4
        ? 'Excelente organização do texto em introdução, desenvolvimento e conclusão.'
        : 'Divida o texto em mais parágrafos (introdução, desenvolvimento, conclusão) para melhorar a progressão argumentativa.'
  });

  // Competência 4: Coesão e conectivos
  let c4 = 200;
  if (conectivos.length >= 3) {
    c4 = 200;
  } else if (conectivos.length === 2) {
    c4 = 170;
  } else if (conectivos.length === 1) {
    c4 = 140;
  } else {
    c4 = 100;
  }

  competencias.push({
    codigo: 4,
    nome: 'Coesão e conectivos',
    nota: Math.round(c4),
    maximo: 200,
    feedback:
      conectivos.length >= 3
        ? `Bom uso de conectivos (${conectivos.slice(0, 3).join(', ')}) garantindo coesão textual.`
        : 'Utilize mais conectivos (portanto, além disso, contudo, etc.) para melhorar a coesão entre as ideias.'
  });

  // Competência 5: Proposta de intervenção
  let c5 = 200;
  const temAgenteAcaoEfeito = intervencao.length >= 3;
  if (temAgenteAcaoEfeito) {
    c5 = 200;
  } else if (intervencao.length === 2) {
    c5 = 170;
  } else if (intervencao.length === 1) {
    c5 = 140;
  } else {
    c5 = 100;
  }

  competencias.push({
    codigo: 5,
    nome: 'Proposta de intervenção',
    nota: Math.round(c5),
    maximo: 200,
    feedback:
      temAgenteAcaoEfeito
        ? 'Presença de elementos de proposta de intervenção respeitando os direitos humanos.'
        : 'Inclua uma proposta de intervenção clara, detalhada e com agente, ação, meio e efeito.'
  });

  const notaFinal = competencias.reduce((acc, c) => acc + c.nota, 0);

  return {
    notaFinal,
    competencias
  };
}

/**
 * Gera estrutura básica do texto para análise.
 */
function gerarEstrutura(texto) {
  const paragrafos = obterParagrafos(texto);
  const quantidadeParagrafos = paragrafos.length;

  const frases = texto
    .split(/[.!?]+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  const palavras = texto.split(/\s+/).filter(Boolean);
  const totalPalavras = palavras.length;

  const usoPontoFinal = frases.length >= 3;
  const extensaoAdequada = totalPalavras >= 200;

  return {
    paragrafos,
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
    'portanto', 'assim', 'além disso', 'ademais', 'contudo', 'entretanto',
    'porém', 'no entanto', 'dessa forma', 'desse modo', 'em suma', 'por fim',
    'primeiramente', 'por outro lado', 'logo', 'todavia', 'em segundo lugar',
    'finalmente', 'diante disso', 'nesse sentido', 'além do mais'
  ];

  const textoNormalizado = texto.toLowerCase();

  return conectivos.filter((c) => textoNormalizado.includes(c));
}

/**
 * Detecta repertório sociocultural (menção a autores, obras, fatos, dados).
 * Usa limites de palavra para evitar falsos positivos de substrings.
 */
function detectarRepertorio(texto) {
  const textoNormalizado = texto.toLowerCase();

  const elementos = [
    // Filósofos e pensadores
    'aristóteles', 'platão', 'sócrates', 'kant', 'marx', 'foucault', 'bauman',
    'hannah arendt', 'rousseau', 'byung-chul han', 'milton santos', 'mill',
    'weber', 'durkheim', 'paulo freire', 'anísio teixeira', 'giddens',
    'hobbes', 'locke', 'montesquieu', 'voltaire', 'maquiavel', 'freud',
    // Obras literárias
    'casa-grande & senzala', 'macunaíma', 'vidas secas', 'o cortiço',
    'dom casmurro', 'memórias póstumas', 'quincas borba', 'grande sertão',
    'primeira guerra', 'segunda guerra', 'revolução industrial', 'revolução francesa',
    'constituição cidadã', 'constituição de 1988', 'lei áurea',
    'semana de arte moderna', 'ditadura militar', 'redemocratização',
    'acordo de paris', 'estocolmo', 'conferência de',
    // Dados/institutos
    'ibge', 'inep', 'oms', 'onu', 'unesco', 'fórum econômico mundial',
    'reuters', 'datafolha', 'ipea', 'gini',
    // Filmes e séries (elementos com limites de palavra)
    'cidade de deus', 'central do brasil', 'tempos modernos', 'black mirror',
    'escritores da liberdade', 'divertida mente', 'o contador de histórias',
    'o abutre', 'lixo extraordinário', 'narcos', 'senna'
  ];

  return elementos.filter((e) => {
    // Busca exata ou com delimitadores de palavra
    const regex = new RegExp(`(^|[^a-zà-ú])${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zà-ú]|$)`, 'i');
    return regex.test(textoNormalizado);
  });
}

/**
 * Executa análise completa de uma redação.
 * Retorna erros, sugestões, detecção de IA e estrutura.
 */
function analisarRedacao(texto, erros = []) {
  const sugestoes = gerarSugestoes(texto);
  const ia = detectarIA(texto);
  const estrutura = gerarEstrutura(texto);
  const enem = avaliarPorCompetenciasENEM(texto, erros);
  const repertorio = detectarRepertorio(texto);

  return {
    erros,
    sugestoes,
    ia,
    estrutura,
    enem,
    repertorio
  };
}

module.exports = {
  analisarRedacao,
  detectarIA,
  gerarSugestoes,
  avaliarPorCompetenciasENEM,
  gerarEstrutura,
  detectarConectivos,
  detectarPropostaIntervencao,
  detectarRepertorio,
  calcularEntropiaLexical,
  calcularTypeTokenRatio,
  tokenizar
};

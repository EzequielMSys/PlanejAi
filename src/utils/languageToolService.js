/**
 * Serviço de correção ortográfica e gramatical usando a API pública do LanguageTool.
 * Documentação: https://languagetool.org/http-api/swagger-ui/#/default/post_check
 *
 * A API gratuita não requer chave, mas tem limite de ~20 requisições/min por IP.
 * Em produção com alto volume, recomenda-se rodar o LanguageTool localmente (Docker)
 * apontando para http://localhost:8010/v2/check ou usar uma chave de API comercial.
 */

const https = require('https');

const LANGUAGE_TOOL_URL = process.env.LANGUAGE_TOOL_URL || 'https://api.languagetool.org/v2/check';
const LANGUAGE = 'pt-BR';
const MOTHER_TONGUE = 'pt-BR';
const PREFERRED_VARIANTS = ['pt-BR'];

// Categorias de erro mais relevantes para uma redação (evita ruído de falsos positivos)
const CATEGORIAS_RELEVANTES = [
  'TYPOS',
  'GRAMMAR',
  'CASING',
  'PUNCTUATION',
  'REDUNDANCY',
  'CONFUSED_WORDS',
  'COMMA_PARENTHESIS_WHITESPACE',
  'DOUBLE_PREPOSITION',
  'MISSING_COMMA',
  'UNUSED_TERM',
  'MULTIPLE_WHITESPACE'
];

/**
 * Faz POST na API do LanguageTool usando o módulo https nativo do Node.
 */
function chamarLanguageTool(texto) {
  const body = new URLSearchParams({
    text: texto,
    language: LANGUAGE,
    motherTongue: MOTHER_TONGUE,
    preferredVariants: PREFERRED_VARIANTS.join(',')
  });

  return new Promise((resolve, reject) => {
    const url = new URL(LANGUAGE_TOOL_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body.toString()),
        'User-Agent': 'PlanejAI/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let dados = '';

      res.on('data', (chunk) => {
        dados += chunk;
      });

      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`LanguageTool respondeu com status ${res.statusCode}.`));
        }
        try {
          const json = JSON.parse(dados);
          if (!json || !Array.isArray(json.matches)) {
            return reject(new Error('Resposta inválida do LanguageTool.'));
          }
          resolve(json);
        } catch (error) {
          reject(new Error('Falha ao decodificar resposta do LanguageTool.'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy(new Error('Timeout ao chamar LanguageTool.'));
    });

    req.write(body.toString());
    req.end();
  });
}

/**
 * Filtra os matches do LanguageTool para manter apenas os relevantes
 * e evita falsos positivos de palavras próprias.
 */
function filtrarMatches(matches, texto) {
  const palavrasProprias = new Set(
    texto
      .split(/\s+/)
      .filter((palavra) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(palavra))
      .map((p) => p.replace(/[.,;:!?()"']/g, '').toLowerCase())
  );

  return matches
    .filter((match) => {
      const categoria = match.rule?.category?.id || '';
      const mensagem = match.message || '';
      const categoriaRelevante = CATEGORIAS_RELEVANTES.some((c) =>
        categoria.includes(c)
      );

      // Ignora palavras próprias (nomes, lugares) marcadas por falta de minúscula
      const palavraContexto = match.context?.text
        ?.split(/\s+/)
        [match.context?.offset || 0]?.replace(/[.,;:!?()"']/g, '')
        .toLowerCase();

      if (palavraContexto && palavrasProprias.has(palavraContexto)) {
        return false;
      }

      // Ignora sugestões triviais de estilo (ex.: contrações informais)
      if (categoria === 'STYLE' && !mensagem.includes('ortográfica')) {
        return false;
      }

      return categoriaRelevante;
    })
    .slice(0, 40);
}

/**
 * Converte os matches do LanguageTool em um formato padronizado
 * compatível com o frontend (palavra, posicao, sugestao).
 */
function converterMatchesParaErros(matches, texto) {
  const erros = [];

  for (const match of matches) {
    const offset = match.offset;
    const length = match.length;
    if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 1) {
      continue;
    }
    const palavra = texto.slice(offset, offset + length);
    if (!palavra) continue;

    const sugestao = match.replacements?.[0]?.value || null;

    erros.push({
      palavra,
      posicao: offset,
      sugestao,
      tipo: match.rule?.category?.id || 'GRAMMAR',
      mensagem: match.message || null
    });
  }

  return erros;
}

/**
 * Corrige o texto usando a API do LanguageTool.
 * Retorna: { corrigido, erros, sucesso }
 */
async function corrigirTexto(texto) {
  if (!texto || texto.trim().length < 10) {
    return {
      corrigido: texto,
      erros: [],
      sucesso: false,
      motivo: 'Texto muito curto para análise.'
    };
  }

  try {
    const resultado = await chamarLanguageTool(texto);

    const matches = filtrarMatches(resultado.matches || [], texto);
    const erros = converterMatchesParaErros(matches, texto);

    // Constrói texto corrigido aplicando as sugestões
    let corrigido = texto;
    const matchesOrdenados = [...erros].sort((a, b) => b.posicao - a.posicao);

    for (const erro of matchesOrdenados) {
      if (erro.sugestao) {
        corrigido =
          corrigido.slice(0, erro.posicao) +
          erro.sugestao +
          corrigido.slice(erro.posicao + erro.palavra.length);
      }
    }

    return {
      corrigido,
      erros,
      sucesso: true
    };
  } catch (error) {
    console.warn('[LANGUAGETOOL] Erro ao chamar API, usando fallback.', error.message);
    return {
      corrigido: texto,
      erros: [],
      sucesso: false,
      motivo: error.message
    };
  }
}

module.exports = {
  corrigirTexto,
  chamarLanguageTool
};

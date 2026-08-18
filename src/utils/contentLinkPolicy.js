const SEARCH_URL_PATTERN = /(?:google\.[^/]+\/search|bing\.com\/search|youtube\.com\/results|search_query=|[?&]q=)/i;

const DIRECT_RESOURCES = {
  'Estequiometria': {
    tipo: 'VIDEO',
    link: 'https://pt.khanacademy.org/science/9-ano/fisico-e-quimica-atomica-e-molecular/estequiometria/v/estequiometria'
  },
  'Genética': {
    tipo: 'VIDEO',
    link: 'https://pt.khanacademy.org/science/biologia-ensino-medio/x008af9690f00e6cd%3Agenetica-classica/x008af9690f00e6cd%3Aintroducao-a-hereditariedade/v/alleles-and-genes'
  },
  'Concordância verbal': {
    tipo: 'VIDEO',
    link: 'https://www.youtube.com/watch?v=s2T9Ap2J7u0'
  },
  'Competências do ENEM': {
    tipo: 'PDF',
    link: 'https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/a_redacao_no_enem_2025_cartilha_do_participante.pdf'
  },
  'Matrizes e determinantes': {
    tipo: 'PDF',
    link: 'https://www.ifmg.edu.br/conselheirolafaiete/ensino-1/arquivos-ensino/anexos-materiais-de-estudo/matrizes-determinantes-e-sistemas-lineares-2o-ano.pdf'
  },
  'Geometria plana': {
    tipo: 'PDF',
    link: 'https://periodicos.utfpr.edu.br/rbect/article/view/1518/1855'
  }
};

const WIKIPEDIA_TOPICS = {
  'Funções do 1º grau': 'Função_afim',
  'Equações do 2º grau': 'Equação_quadrática',
  'Trigonometria': 'Trigonometria',
  'Probabilidade': 'Teoria_das_probabilidades',
  'Estatística básica': 'Estatística',
  'Progressões aritméticas': 'Progressão_aritmética',
  'Mecânica: cinemática': 'Cinemática',
  'Leis de Newton': 'Leis_de_Newton',
  'Trabalho e energia': 'Trabalho_(física)',
  'Eletricidade básica': 'Eletricidade',
  'Termodinâmica': 'Termodinâmica',
  'Ondulatória': 'Onda',
  'Tabela periódica': 'Tabela_periódica',
  'Ligações químicas': 'Ligação_química',
  'Reações orgânicas': 'Reação_orgânica',
  'Equilíbrio químico': 'Equilíbrio_químico',
  'Citologia e células': 'Citologia',
  'Ecologia': 'Ecologia',
  'Fisiologia humana': 'Fisiologia_humana',
  'Evolução': 'Evolução',
  'Bioquímica': 'Bioquímica',
  'Interpretação de texto': 'Interpretação_de_texto',
  'Regência verbal e nominal': 'Regência_(gramática)',
  'Figuras de linguagem': 'Figura_de_linguagem',
  'Redação dissertativa': 'Dissertação',
  'Ortografia e acentuação': 'Ortografia_da_língua_portuguesa',
  'Coesão e coerência textual': 'Coesão_textual',
  'Gêneros textuais': 'Gênero_textual',
  'Modernismo brasileiro': 'Modernismo_no_Brasil',
  'Romantismo': 'Romantismo_no_Brasil',
  'Realismo': 'Realismo_no_Brasil',
  'Escolas literárias': 'Escola_literária',
  'Estrutura da redação dissertativa': 'Dissertação',
  'Repertório sociocultural': 'Repertório',
  'Interpretação de textos em inglês': 'Compreensão_de_leitura',
  'Tempos verbais': 'Tempo_gramatical',
  'Vocabulário essencial': 'Vocabulário',
  'Brasil Colônia': 'Brasil_Colônia',
  'Era Vargas': 'Era_Vargas',
  'Ditadura militar': 'Ditadura_militar_brasileira',
  'Revolução Industrial': 'Revolução_Industrial',
  'Guerra Fria': 'Guerra_Fria',
  'Geopolítica mundial': 'Geopolítica',
  'Climatologia': 'Climatologia',
  'Urbanização': 'Urbanização',
  'Meio ambiente': 'Meio_ambiente',
  'Agricultura e agronegócio': 'Agronegócio',
  'Filosofia antiga': 'Filosofia_antiga',
  'Ética e moral': 'Ética',
  'Filosofia contemporânea': 'Filosofia_contemporânea',
  'Cultura e sociedade': 'Cultura',
  'Desigualdade social': 'Desigualdade_social',
  'Movimentos sociais': 'Movimento_social'
};

function isSearchUrl(value) {
  return SEARCH_URL_PATTERN.test(String(value || ''));
}

function getDirectResource(titulo) {
  if (DIRECT_RESOURCES[titulo]) return DIRECT_RESOURCES[titulo];
  const topic = WIKIPEDIA_TOPICS[titulo];
  if (!topic) return null;
  return { tipo: 'ARTIGO', link: `https://pt.wikipedia.org/wiki/${encodeURIComponent(topic)}` };
}

function validateDirectResource(url, tipo = 'LINK') {
  if (!url) return null;
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Informe uma URL completa iniciada por https://'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || isSearchUrl(url)) {
    throw new Error('Use o endereço direto do material, não uma página de pesquisa.');
  }
  if (tipo === 'VIDEO') {
    const directVideo = /youtube\.com\/watch|youtu\.be\/|khanacademy\.org\/.+\/v\//i.test(url);
    if (!directVideo) throw new Error('O vídeo precisa apontar diretamente para a página de reprodução.');
  }
  if (tipo === 'PDF' && !/\.pdf(?:$|[?#])/i.test(parsed.pathname + parsed.search)) {
    throw new Error('O material marcado como PDF precisa apontar diretamente para um arquivo .pdf.');
  }
  return parsed.toString();
}

module.exports = { getDirectResource, isSearchUrl, validateDirectResource };

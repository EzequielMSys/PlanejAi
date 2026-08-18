/**
 * Banco de temas de redação (modelo ENEM) e repertórios socioculturais.
 *
 * Para cada tema, oferece sugestões de repertório que podem embasar a
 * argumentação: obras literárias, filmes, fatos históricos, filósofos,
 * obras de arte e dados/estudos.
 */

const TEMAS = [
  {
    id: 'educacao',
    area: 'Educação',
    tema: 'Os desafios da educação brasileira no século XXI',
    proposta:
      'A educação é um direito fundamental garantido pela Constituição. O tema convida a discutir a qualidade do ensino, a desigualdade de acesso, a valorização dos professores e o impacto da tecnologia na aprendizagem.',
    repertorio: [
      { tipo: 'Livro', titulo: 'Pedagogia do Oprimido', autor: 'Paulo Freire', como_usar: 'Para defender uma educação libertadora e crítica, que respeite o conhecimento do aluno.' },
      { tipo: 'Filme', titulo: 'Escritores da Liberdade', autor: 'Richard LaGravenese', como_usar: 'Como exemplo de superação e de educação transformadora em contextos de vulnerabilidade.' },
      { tipo: 'Filme', titulo: 'O Contador de Histórias', autor: 'Luiz Villaça', como_usar: 'Para ilustrar a importância da leitura e da valorização do educador.' },
      { tipo: 'Fato histórico', titulo: 'Reforma Capanema (1942)', autor: null, como_usar: 'Para contextualizar a trajetória das políticas educacionais brasileiras.' },
      { tipo: 'Dado', titulo: 'SAEB/IDEB', autor: 'Inep', como_usar: 'Para citar indicadores de qualidade da educação básica no Brasil.' },
      { tipo: 'Filósofo', titulo: 'Anísio Teixeira', autor: null, como_usar: 'Para defender a escola pública, gratuita e de qualidade para todos.' }
    ]
  },
  {
    id: 'tecnologia',
    area: 'Tecnologia e Sociedade',
    tema: 'O impacto da inteligência artificial nas relações sociais e de trabalho',
    proposta:
      'A IA vem transformando o trabalho, a comunicação e a privacidade. O tema convida a refletir sobre os limites éticos, a regulação e os novos empregos.',
    repertorio: [
      { tipo: 'Fato histórico', titulo: 'Primeira e Segunda Revolução Industrial', autor: null, como_usar: 'Para comparar as mudanças tecnológicas passadas com a atual revolução da IA.' },
      { tipo: 'Filósofo', titulo: 'Byung-Chul Han', autor: null, como_usar: 'Para discutir a sociedade do cansaço e o impacto da tecnologia na subjetividade.' },
      { tipo: 'Filósofo', titulo: 'Zygmunt Bauman', autor: null, como_usar: 'Para tratar da modernidade líquida e da fluidez das relações mediadas pela tecnologia.' },
      { tipo: 'Filme', titulo: 'Black Mirror', autor: 'Charlie Brooker', como_usar: 'Como exemplo distópico dos riscos éticos da tecnologia e da vigilância.' },
      { tipo: 'Filme', titulo: 'Her', autor: 'Spike Jonze', como_usar: 'Para discutir as relações emocionais e afetivas com a inteligência artificial.' },
      { tipo: 'Dado', titulo: 'Pesquisa sobre automação', autor: 'Fórum Econômico Mundial', como_usar: 'Para citar projeções de empregos ameaçados e criados pela automação.' }
    ]
  },
  {
    id: 'saude_mental',
    area: 'Saúde',
    tema: 'A saúde mental dos jovens brasileiros: desafios e caminhos',
    proposta:
      'O tema convida a discutir o aumento dos casos de ansiedade e depressão entre jovens, a pressão das redes sociais, o bullying e a importância do acolhimento.',
    repertorio: [
      { tipo: 'Livro', titulo: 'O Demônio do Meio-Dia', autor: 'Andrew Solomon', como_usar: 'Para fundamentar a discussão sobre depressão com base em relatos e pesquisas.' },
      { tipo: 'Filme', titulo: 'Divertida Mente', autor: 'Pete Docter', como_usar: 'Como metáfora lúdica da importância das emoções e da saúde emocional.' },
      { tipo: 'Fato histórico', titulo: 'Reforma Psiquiátrica Brasileira (Lei 10.216/2001)', autor: null, como_usar: 'Para contextualizar as políticas de saúde mental e a desinstitucionalização.' },
      { tipo: 'Filósofo', titulo: 'Epicteto', autor: null, como_usar: 'Para discutir o estoicismo e o controle das emoções diante das adversidades.' },
      { tipo: 'Dado', titulo: 'OMS - depressão', autor: 'Organização Mundial da Saúde', como_usar: 'Para citar estatísticas sobre a prevalência de transtornos mentais.' }
    ]
  },
  {
    id: 'meio_ambiente',
    area: 'Meio Ambiente',
    tema: 'A sustentabilidade e o consumo consciente no Brasil',
    proposta:
      'O tema convida a refletir sobre a crise climática, o esgotamento dos recursos naturais, a produção de lixo e o papel do consumo consciente.',
    repertorio: [
      { tipo: 'Livro', titulo: 'Primavera Silenciosa', autor: 'Rachel Carson', como_usar: 'Para fundamentar a crítica ao uso indiscriminado de agrotóxicos e a defesa ambiental.' },
      { tipo: 'Filme', titulo: 'A Era do Gelo - O Big Bang', autor: null, como_usar: 'Para ilustrar de forma lúdica os impactos das mudanças climáticas.' },
      { tipo: 'Filme', titulo: 'Lixo Extraordinário', autor: 'Lucy Walker', como_usar: 'Como exemplo de arte e conscientização a partir da reciclagem.' },
      { tipo: 'Fato histórico', titulo: 'Conferência de Estocolmo (1972)', autor: null, como_usar: 'Para marcar o início das discussões ambientais em escala global.' },
      { tipo: 'Fato histórico', titulo: 'Acordo de Paris (2015)', autor: null, como_usar: 'Para citar compromissos internacionais de redução de emissões.' },
      { tipo: 'Filósofo', titulo: 'Hans Jonas', autor: null, como_usar: 'Para discutir a ética da responsabilidade com as gerações futuras.' }
    ]
  },
  {
    id: 'desigualdade',
    area: 'Sociedade',
    tema: 'A desigualdade social e a mobilidade no Brasil',
    proposta:
      'O tema convida a discutir as múltiplas dimensões da desigualdade (renda, raça, gênero, região) e os mecanismos de mobilidade social.',
    repertorio: [
      { tipo: 'Livro', titulo: 'Casa-Grande & Senzala', autor: 'Gilberto Freyre', como_usar: 'Para discutir as raízes históricas da desigualdade e da formação social brasileira.' },
      { tipo: 'Livro', titulo: 'O Cortiço', autor: 'Aluísio Azevedo', como_usar: 'Para ilustrar as condições de moradia e a desigualdade urbana no Brasil.' },
      { tipo: 'Filme', titulo: 'Cidade de Deus', autor: 'Fernando Meirelles', como_usar: 'Para retratar a desigualdade e a violência nas periferias brasileiras.' },
      { tipo: 'Filósofo', titulo: 'Karl Marx', autor: null, como_usar: 'Para discutir as relações de classe e a concentração de renda.' },
      { tipo: 'Fato histórico', titulo: 'Abolição da Escravatura (1888)', autor: null, como_usar: 'Para contextualizar a ausência de políticas de reparação e a persistência da desigualdade.' },
      { tipo: 'Dado', titulo: 'Coeficiente de Gini', autor: 'IBGE', como_usar: 'Para citar o índice de desigualdade de renda do Brasil.' }
    ]
  },
  {
    id: 'cultura',
    area: 'Cultura e Identidade',
    tema: 'A valorização da cultura e da identidade brasileira',
    proposta:
      'O tema convida a refletir sobre a diversidade cultural, o patrimônio histórico, a cultura popular e a influência da indústria cultural.',
    repertorio: [
      { tipo: 'Livro', titulo: 'Macunaíma', autor: 'Mário de Andrade', como_usar: 'Como representação da identidade cultural e da figura do "herói sem nenhum caráter".' },
      { tipo: 'Livro', titulo: 'Vidas Secas', autor: 'Graciliano Ramos', como_usar: 'Para retratar a cultura e a resistência do povo nordestino diante da seca.' },
      { tipo: 'Filme', titulo: 'Central do Brasil', autor: 'Walter Salles', como_usar: 'Para discutir identidade, memória e a cultura brasileira.' },
      { tipo: 'Fato histórico', titulo: 'Semana de Arte Moderna (1922)', autor: null, como_usar: 'Para marcar a valorização da cultura nacional e o rompimento com o academicismo.' },
      { tipo: 'Filósofo', titulo: 'Milton Santos', autor: null, como_usar: 'Para discutir globalização, território e identidade cultural.' }
    ]
  },
  {
    id: 'democracia',
    area: 'Política e Cidadania',
    tema: 'Os desafios da democracia e da participação cidadã no Brasil',
    proposta:
      'O tema convida a refletir sobre a desinformação, a polarização, a participação política e o fortalecimento das instituições democráticas.',
    repertorio: [
      { tipo: 'Livro', titulo: 'O Contrato Social', autor: 'Jean-Jacques Rousseau', como_usar: 'Para fundamentar a discussão sobre a soberania popular e o pacto social.' },
      { tipo: 'Livro', titulo: '1984', autor: 'George Orwell', como_usar: 'Como alerta contra a manipulação da informação e o totalitarismo.' },
      { tipo: 'Filósofo', titulo: 'Platão', autor: null, como_usar: 'Para discutir a relação entre conhecimento, verdade e poder.' },
      { tipo: 'Fato histórico', titulo: 'Redemocratização (1985)', autor: null, como_usar: 'Para contextualizar a conquista da democracia no Brasil após a ditadura.' },
      { tipo: 'Fato histórico', titulo: 'Constituição Cidadã (1988)', autor: null, como_usar: 'Para citar os direitos fundamentais e a participação popular garantidos.' },
      { tipo: 'Dado', titulo: 'Pesquisa sobre mídias sociais', autor: 'Reuters Institute', como_usar: 'Para citar dados sobre consumo de notícias e desinformação digital.' }
    ]
  },
  {
    id: 'trabalho',
    area: 'Trabalho e Economia',
    tema: 'O futuro do trabalho e a (des)igualdade de oportunidades',
    proposta:
      'O tema convida a refletir sobre a precarização, a automação, o trabalho informal e as novas formas de emprego na era digital.',
    repertorio: [
      { tipo: 'Livro', titulo: 'O Manifesto Comunista', autor: 'Karl Marx e Friedrich Engels', como_usar: 'Para discutir as relações de trabalho e a luta de classes.' },
      { tipo: 'Livro', titulo: 'A Riqueza das Nações', autor: 'Adam Smith', como_usar: 'Para contextualizar a divisão do trabalho e o capitalismo.' },
      { tipo: 'Filme', titulo: 'Tempos Modernos', autor: 'Charles Chaplin', como_usar: 'Como crítica à mecanização do trabalho e à alienação do operário.' },
      { tipo: 'Fato histórico', titulo: 'Consolidação das Leis do Trabalho - CLT (1943)', autor: null, como_usar: 'Para contextualizar os direitos trabalhistas no Brasil.' },
      { tipo: 'Dado', titulo: 'Taxa de informalidade', autor: 'IBGE', como_usar: 'Para citar o percentual de trabalhadores informais no Brasil.' },
      { tipo: 'Filósofo', titulo: 'Hannah Arendt', autor: null, como_usar: 'Para refletir sobre a distinção entre trabalho, obra e ação.' }
    ]
  },
  {
    id: 'comunicacao',
    area: 'Comunicação e Mídia',
    tema: 'O papel da imprensa e a proliferação de fake news',
    proposta:
      'O tema convida a refletir sobre a desinformação, a responsabilidade das plataformas digitais, o jornalismo e o pensamento crítico.',
    repertorio: [
      { tipo: 'Livro', titulo: 'A Sociedade do Espetáculo', autor: 'Guy Debord', como_usar: 'Para discutir a mediação da realidade pelas imagens e pela mídia.' },
      { tipo: 'Filósofo', titulo: 'Michel Foucault', autor: null, como_usar: 'Para discutir as relações de poder e discurso na produção de verdades.' },
      { tipo: 'Filme', titulo: 'O Abutre', autor: 'Dan Gilroy', como_usar: 'Como crítica ao sensacionalismo e à ética jornalística.' },
      { tipo: 'Fato histórico', titulo: 'Criação da imprensa (Gutenberg)', autor: null, como_usar: 'Para contextualizar a democratização da informação ao longo da história.' },
      { tipo: 'Dado', titulo: 'Pesquisa sobre fake news', autor: 'DataSenado', como_usar: 'Para citar dados sobre a disseminação de desinformação no Brasil.' }
    ]
  }
];

/**
 * Normaliza texto para busca (remove acentos, minúsculas).
 */
function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '');
}

/**
 * Busca um tema por palavra-chave (ex.: a área de foco do usuário).
 * Se não encontrar, retorna um tema aleatório.
 */
function sugerirTemaPorPalavraChave(palavraChave) {
  const alvo = normalizar(palavraChave);

  if (!alvo) {
    return TEMAS[Math.floor(Math.random() * TEMAS.length)];
  }

  const encontrado = TEMAS.find((t) => {
    const texto = normalizar(`${t.area} ${t.tema} ${t.proposta}`);
    return texto.includes(alvo);
  });

  if (encontrado) {
    return encontrado;
  }

  // Busca parcial por área
  const porArea = TEMAS.find((t) => normalizar(t.area).includes(alvo));
  const termos = alvo.split(/\s+/).filter((termo) => termo.length > 2);
  const sinonimos = {
    escola: ['educacao'], ensino: ['educacao'], professor: ['educacao'],
    internet: ['tecnologia', 'comunicacao'], ia: ['tecnologia'], redes: ['tecnologia', 'comunicacao'],
    ansiedade: ['saude_mental'], jovem: ['saude_mental', 'educacao'],
    clima: ['meio_ambiente'], lixo: ['meio_ambiente'], consumo: ['meio_ambiente'],
    pobreza: ['desigualdade'], renda: ['desigualdade', 'trabalho'], emprego: ['trabalho'],
    noticia: ['comunicacao'], desinformacao: ['comunicacao', 'democracia'], politica: ['democracia']
  };
  const expandidos = [...termos, ...termos.flatMap((termo) => sinonimos[termo] || [])];
  const ranqueados = TEMAS.map((tema) => {
    const base = normalizar(`${tema.id} ${tema.area} ${tema.tema} ${tema.proposta}`);
    const pontos = expandidos.reduce((total, termo) => total + (base.includes(termo) ? (base.startsWith(termo) ? 3 : 1) : 0), 0);
    return { tema, pontos };
  }).sort((a, b) => b.pontos - a.pontos);
  if (ranqueados[0]?.pontos > 0) {
    return ranqueados[0].tema;
  }

  if (porArea) {
    return porArea;
  }

  return TEMAS[Math.floor(Math.random() * TEMAS.length)];
}

/**
 * Gera sugestões de repertório para um tema.
 */
function gerarRepertorioParaTema(tema, quantidade = 5) {
  if (!tema) return [];

  const repertorio = tema.repertorio || [];
  return repertorio.slice(0, quantidade);
}

/**
 * Retorna um tema aleatório e seus repertórios (sugestão para o usuário).
 */
function sugerirTemaAleatorio() {
  const tema = TEMAS[Math.floor(Math.random() * TEMAS.length)];
  return {
    tema: tema.tema,
    proposta: tema.proposta,
    repertorio: gerarRepertorioParaTema(tema)
  };
}

module.exports = {
  TEMAS,
  sugerirTemaPorPalavraChave,
  sugerirTemaAleatorio,
  gerarRepertorioParaTema
};

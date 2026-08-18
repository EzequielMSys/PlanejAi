const { gerarRepertorioParaTema } = require('./repertorioRedacao');

const RECOMENDACOES = {
  educacao: [
    { tipo: 'Podcast', titulo: 'Café da Manhã — educação', autor: 'Folha de S.Paulo', como_usar: 'Use o episódio para levantar causas; confirme números na fonte primária citada.' },
    { tipo: 'Documentário', titulo: 'Nunca Me Sonharam', autor: 'Cacau Rhoden', como_usar: 'Relacione os relatos de estudantes aos desafios do ensino médio.' }
  ],
  tecnologia: [
    { tipo: 'Podcast', titulo: 'Hipsters Ponto Tech', autor: 'Alura', como_usar: 'Use debates sobre tecnologia e trabalho como ponto de partida, sem tratar opiniões como dados.' },
    { tipo: 'Filme', titulo: 'O Dilema das Redes', autor: 'Jeff Orlowski', como_usar: 'Discuta economia da atenção, algoritmos e responsabilidade das plataformas.' }
  ],
  saude_mental: [
    { tipo: 'Livro', titulo: 'Sociedade do Cansaço', autor: 'Byung-Chul Han', como_usar: 'Associe cultura de desempenho à pressão sobre jovens, evitando generalizações clínicas.' },
    { tipo: 'Podcast', titulo: 'Autoconsciente', autor: 'Regina Giannetti', como_usar: 'Use reflexões sobre emoções para qualificar a discussão, não como diagnóstico.' }
  ],
  meio_ambiente: [
    { tipo: 'Documentário', titulo: 'A Lei da Água', autor: 'André D’Elia', como_usar: 'Relacione proteção florestal, água e políticas públicas brasileiras.' },
    { tipo: 'Podcast', titulo: 'O Clima entre Nós', autor: 'Climainfo', como_usar: 'Mapeie perspectivas antes de buscar dados em fontes primárias.' }
  ],
  desigualdade: [
    { tipo: 'Livro', titulo: 'Quarto de Despejo', autor: 'Carolina Maria de Jesus', como_usar: 'Use a experiência narrada para humanizar a discussão sobre pobreza e invisibilidade.' },
    { tipo: 'Podcast', titulo: 'Projeto Querino', autor: 'Rádio Novelo', como_usar: 'Conecte processos históricos às desigualdades atuais com recorte claro.' }
  ],
  default: [
    { tipo: 'Podcast', titulo: 'Café da Manhã', autor: 'Folha de S.Paulo', como_usar: 'Escolha um episódio do eixo e valide números em fontes oficiais.' },
    { tipo: 'Livro', titulo: 'Cidadania no Brasil', autor: 'José Murilo de Carvalho', como_usar: 'Contextualize a construção de direitos e os limites da cidadania.' }
  ]
};

function montarKitTema(tema) {
  if (!tema) return null;
  return {
    ...tema,
    repertorio: gerarRepertorioParaTema(tema, 6),
    questaoNorteadora: `Quais causas mantêm ${tema.tema.toLowerCase()} e quais atores podem enfrentá-las de forma viável?`,
    rotasDeTese: [
      'Analise uma causa estrutural e uma consequência social.',
      'Contraponha avanço legal e dificuldade de aplicação prática.',
      'Discuta responsabilidade do poder público e participação da sociedade.'
    ],
    checklist: ['Delimitar o problema', 'Apresentar tese com dois eixos', 'Comprovar cada argumento', 'Conectar repertório à tese', 'Propor intervenção com cinco elementos'],
    armadilhas: ['Copiar o texto motivador', 'Citar obra sem explicar a relação', 'Apresentar solução genérica', 'Inventar dado ou autoria'],
    recomendacoes: RECOMENDACOES[tema.id] || RECOMENDACOES.default,
    textosMotivadores: [
      { rotulo: 'Contexto', texto: tema.proposta },
      { rotulo: 'Tensão', texto: 'Direitos previstos em lei nem sempre se convertem em acesso, qualidade e participação efetiva.' },
      { rotulo: 'Recorte', texto: `Priorize causas, grupos afetados e caminhos aplicáveis ao contexto brasileiro no eixo ${tema.area}.` }
    ]
  };
}

module.exports = { montarKitTema };

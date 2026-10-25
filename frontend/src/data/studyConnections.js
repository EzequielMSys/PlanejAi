// Curadoria editorial: relações explícitas e direcionais, sem inferência sobre dados pessoais.
// Revisão das referências: 2026-10-25. Exemplos e perguntas autorais.
export const SOURCES = {
  energia: {name:'OpenStax · Trabalho e energia (em inglês)',url:'https://openstax.org/books/college-physics-2e/pages/7-2-kinetic-energy-and-the-work-energy-theorem'},
  movimento: {name:'OpenStax · Gráficos de posição e tempo (em inglês)',url:'https://openstax.org/books/physics/pages/2-3-position-vs-time-graphs'},
  coesao: {name:'Inep · Cartilha de redação 2025, competência IV (PDF)',url:'https://download.inep.gov.br/publicacoes/institucionais/avaliacoes_e_exames_da_educacao_basica/a_redacao_no_enem_2025_cartilha_do_participante_dislexia.pdf'},
  redacao: {name:'Inep · Cartilha de redação 2025 (página de acesso)',url:'https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/redacao-do-enem-2025-cartilha-do-a-participante/'},
}
export const TOPICS = {
  newton: {title:'Leis de Newton',subjects:['Física'],aliases:['Leis de Newton','Dinâmica: leis de Newton']},
  energia: {title:'Trabalho e energia',subjects:['Física'],aliases:['Trabalho e energia']},
  funcoes: {title:'Funções do 1º grau',subjects:['Matemática'],aliases:['Funções do 1º grau','Função do primeiro grau','Funções de primeiro grau','Função afim']},
  cinematica: {title:'Mecânica: cinemática',subjects:['Física'],aliases:['Mecânica: cinemática','Cinemática']},
  coesao: {title:'Coesão e coerência textual',subjects:['Português','Redação'],aliases:['Coesão e coerência textual','Coesão e coerência']},
  estrutura: {title:'Estrutura da redação dissertativa',subjects:['Redação','Português'],aliases:['Estrutura da redação dissertativa','Redação dissertativa']},
  repertorio: {title:'Repertório sociocultural',subjects:['Redação'],aliases:['Repertório sociocultural']},
}
export const CONNECTIONS = [
  {id:'newton-energia',from:'newton',to:'energia',relation:'Ajuda a entender',source:'energia',
    why:'A força resultante muda o movimento. O trabalho dessa força conecta o deslocamento à variação da energia cinética.',
    example:'Uma resultante constante de 4 N, no sentido do movimento, atua por 3 m: o trabalho resultante é 12 J e a energia cinética aumenta 12 J.',
    question:'No mesmo deslocamento, o que muda se a resultante constante apontar no sentido contrário ao movimento?',
    reasoning:'O trabalho resultante é −12 J: a energia cinética diminui 12 J, desde que o corpo complete os 3 m sem inverter o movimento.'},
  {id:'energia-newton',from:'energia',to:'newton',relation:'Retoma uma base',source:'energia',
    why:'Para calcular trabalho resultante, identifique primeiro as forças que atuam no corpo. As leis de Newton ajudam nessa escolha.',
    example:'Um carrinho avança com velocidade constante numa reta: tração e resistências se equilibram, e o trabalho resultante é zero.',
    question:'Trabalho resultante zero significa que nenhuma força atua no carrinho?',
    reasoning:'Não. Forças podem se equilibrar. O trabalho de uma pode compensar o de outra; a energia cinética permanece constante.'},
  {id:'funcoes-cinematica',from:'funcoes',to:'cinematica',relation:'Ganha uma aplicação',source:'movimento',
    why:'No movimento retilíneo uniforme, posição e tempo se relacionam por uma função afim: a taxa é a velocidade e o valor inicial é a posição.',
    example:'Em s(t) = 2t + 5, com s em metros e t em segundos, a posição inicial é 5 m e a velocidade é 2 m/s.',
    question:'Se a taxa passa de 2 para −2 m/s, o que muda no gráfico de posição por tempo?',
    reasoning:'A reta fica decrescente. A posição inicial continua 5 m; o sinal negativo indica movimento no sentido escolhido como negativo.'},
  {id:'cinematica-funcoes',from:'cinematica',to:'funcoes',relation:'Retoma uma ferramenta',source:'movimento',
    why:'Num gráfico de posição por tempo com velocidade constante, a inclinação da reta permite interpretar a taxa de uma função afim.',
    example:'Uma posição cresce de 4 m para 10 m entre 0 s e 3 s, em movimento uniforme. A taxa é (10 − 4) ÷ 3 = 2 m/s.',
    question:'Qual expressão representa essa posição em função do tempo?',
    reasoning:'s(t) = 2t + 4. O coeficiente 2 é a taxa de variação e 4 é a posição inicial. A velocidade precisa ser constante para usar essa reta.'},
  {id:'coesao-estrutura',from:'coesao',to:'estrutura',relation:'Fortalece a escrita',source:'coesao',
    why:'As ligações entre frases e parágrafos tornam visível o percurso do argumento. Escolha conectivos pela relação de sentido.',
    example:'“Faltam bibliotecas no bairro. Por isso, o acesso aos livros é limitado.” O conectivo marca uma consequência.',
    question:'“No entanto” manteria a mesma relação entre essas frases?',
    reasoning:'Não. Ele introduziria contraste. Confira se a segunda ideia contrasta ou decorre da primeira antes de escolher o conectivo.'},
  {id:'estrutura-coesao',from:'estrutura',to:'coesao',relation:'Ajuda a revisar',source:'coesao',
    why:'Depois de organizar tese e argumentos, confira como cada parte se liga à anterior. Coesão torna essas relações explícitas.',
    example:'Se o segundo parágrafo acrescenta outro motivo para a tese, uma expressão de adição pode orientar a leitura.',
    question:'Começar todos os parágrafos com “portanto” ajuda a construir o argumento?',
    reasoning:'Não necessariamente. “Portanto” indica conclusão; use recursos coesivos que correspondam à relação efetiva entre as ideias.'},
  {id:'repertorio-estrutura',from:'repertorio',to:'estrutura',relation:'Fortalece um argumento',source:'redacao',
    why:'Uma referência ganha função argumentativa quando você explica como ela sustenta sua tese sobre o tema.',
    example:'Ao discutir leitura, relacione uma obra conhecida ao obstáculo analisado, em vez de apenas mencionar seu título.',
    question:'Que relação você precisaria explicar entre essa obra e o seu argumento?',
    reasoning:'Mostre uma ideia ou situação específica da obra e explique como ela ajuda a analisar o problema defendido no parágrafo.'},
  {id:'estrutura-repertorio',from:'estrutura',to:'repertorio',relation:'Amplia a fundamentação',source:'redacao',
    why:'Um argumento pode ser desenvolvido com um conhecimento pertinente, desde que a ligação com o tema seja explicada.',
    example:'Num texto sobre leitura, uma obra pode ajudar a discutir acesso à cultura quando essa relação for analisada.',
    question:'Como verificar se a referência escolhida contribui para sua tese?',
    reasoning:'Tente explicar a ligação com suas palavras. Se ela não sustenta o argumento, escolha outra referência ou reformule a análise.'},
]
export function normalizeTopic(value) {
  return typeof value==='string' ? value.replace(/[º°ª]/g,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim() : ''
}
const topicIndex = new Map(Object.entries(TOPICS).flatMap(([id,topic])=>topic.subjects.flatMap(subject=>topic.aliases.map(alias=>[`${normalizeTopic(subject)}:${normalizeTopic(alias)}`,id]))))
export function connectionsFor(content) {
  const topic = topicIndex.get(`${normalizeTopic(content?.disciplina)}:${normalizeTopic(content?.titulo)}`)
  if(!topic)return []
  return CONNECTIONS.filter(connection=>connection.from===topic)
}

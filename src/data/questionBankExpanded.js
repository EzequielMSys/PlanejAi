function opcoesNumericas(correta, indice, passo = 1) {
  const candidatas = [correta, correta + passo, Math.max(0, correta - passo), correta + (passo * 2)]
  const unicas = [...new Set(candidatas)]
  while (unicas.length < 4) unicas.push(correta + unicas.length * passo + 1)
  const alternativas = Array(4)
  alternativas[indice] = String(correta)
  let cursor = 0
  for (let i = 0; i < 4; i += 1) {
    if (i === indice) continue
    while (unicas[cursor] === correta) cursor += 1
    alternativas[i] = String(unicas[cursor++])
  }
  return alternativas
}

function numerica({ disciplina, competencia, enunciado, correta, explicacao, dificuldade, indice, passo }) {
  return { disciplina, competencia, enunciado, alternativas: opcoesNumericas(correta, indice, passo), resposta: indice, explicacao, dificuldade }
}

const questoes = []

// Matemática: situações inéditas de porcentagem e função afim.
for (let i = 0; i < 15; i += 1) {
  const total = 120 + (i * 40)
  const percentual = [10, 15, 20, 25, 30][i % 5]
  const correta = total * percentual / 100
  questoes.push(numerica({
    disciplina: 'Matemática', competencia: 'Porcentagem', indice: i % 4,
    enunciado: `Em uma campanha escolar, ${percentual}% de ${total} participantes concluíram todas as etapas. Quantos participantes concluíram a campanha?`,
    correta, passo: Math.max(2, total / 20), dificuldade: i < 5 ? 'FACIL' : 'MEDIA',
    explicacao: `${percentual}% equivale a ${percentual / 100}. Multiplicando ${total} por ${percentual / 100}, obtemos ${correta}.`
  }))
}
for (let i = 0; i < 15; i += 1) {
  const fixa = 4 + i
  const taxa = 2 + (i % 5)
  const horas = 2 + (i % 6)
  const correta = fixa + taxa * horas
  questoes.push(numerica({
    disciplina: 'Matemática', competencia: 'Função afim', indice: (i + 1) % 4,
    enunciado: `Uma plataforma cobra R$ ${fixa} de taxa fixa e R$ ${taxa} por hora. Qual será o custo de ${horas} horas de uso?`,
    correta, passo: taxa, dificuldade: i < 6 ? 'FACIL' : 'MEDIA',
    explicacao: `O custo é dado por C = ${fixa} + ${taxa} × ${horas}, resultando em R$ ${correta}.`
  }))
}

// Física: velocidade média e energia cinética em números inteiros.
for (let i = 0; i < 10; i += 1) {
  const tempo = 20 + i * 10
  const velocidade = 3 + (i % 6)
  const distancia = tempo * velocidade
  questoes.push(numerica({
    disciplina: 'Física', competencia: 'Cinemática', indice: (i + 2) % 4,
    enunciado: `Um objeto percorre ${distancia} metros em ${tempo} segundos, mantendo ritmo constante. Qual é sua velocidade média em m/s?`,
    correta: velocidade, passo: 1, dificuldade: i < 4 ? 'FACIL' : 'MEDIA',
    explicacao: `Velocidade média é distância dividida pelo tempo: ${distancia} ÷ ${tempo} = ${velocidade} m/s.`
  }))
}
for (let i = 0; i < 5; i += 1) {
  const massa = 2 * (i + 1)
  const velocidade = 2 + i
  const correta = massa * velocidade * velocidade / 2
  questoes.push(numerica({
    disciplina: 'Física', competencia: 'Energia', indice: (i + 3) % 4,
    enunciado: `Um corpo de ${massa} kg move-se a ${velocidade} m/s. Considerando Ec = m·v²/2, qual é sua energia cinética em joules?`,
    correta, passo: Math.max(2, massa), dificuldade: 'MEDIA',
    explicacao: `Substituindo os valores: Ec = ${massa} × ${velocidade}² ÷ 2 = ${correta} J.`
  }))
}

// Química: leitura quantitativa de fórmulas e relações de massa.
const formulas = [
  ['H₂O', 2, 'hidrogênio'], ['CO₂', 2, 'oxigênio'], ['NH₃', 3, 'hidrogênio'], ['CH₄', 4, 'hidrogênio'],
  ['H₂SO₄', 4, 'oxigênio'], ['Ca(OH)₂', 2, 'oxigênio'], ['C₂H₆', 6, 'hidrogênio'], ['Al₂O₃', 3, 'oxigênio']
]
formulas.forEach(([formula, correta, elemento], i) => {
  questoes.push(numerica({
    disciplina: 'Química', competencia: 'Linguagem química', indice: i % 4,
    enunciado: `Na fórmula ${formula}, quantos átomos de ${elemento} aparecem em uma unidade da substância?`,
    correta, passo: 1, dificuldade: i < 4 ? 'FACIL' : 'MEDIA',
    explicacao: `O índice associado ao elemento na fórmula ${formula} indica ${correta} átomo(s) de ${elemento}.`
  }))
})
for (let i = 0; i < 7; i += 1) {
  const massaUnidade = 5 + i
  const quantidade = 2 + i
  const correta = massaUnidade * quantidade
  questoes.push(numerica({
    disciplina: 'Química', competencia: 'Proporções químicas', indice: (i + 1) % 4,
    enunciado: `Em um modelo experimental, cada porção de uma substância possui ${massaUnidade} g. Qual é a massa total de ${quantidade} porções idênticas?`,
    correta, passo: massaUnidade, dificuldade: i < 3 ? 'FACIL' : 'MEDIA',
    explicacao: `A massa total é proporcional ao número de porções: ${massaUnidade} × ${quantidade} = ${correta} g.`
  }))
}

// Linguagens: conectivos e funções textuais, com alternativas conceituais.
const linguagem = [
  ['“A equipe revisou o projeto; portanto, reduziu os erros.” O conectivo “portanto” expressa:', 'Conclusão', ['Oposição', 'Condição', 'Adição']],
  ['“Embora estivesse cansada, Ana concluiu a leitura.” “Embora” introduz:', 'Concessão', ['Causa', 'Finalidade', 'Conclusão']],
  ['“Estudou porque desejava compreender o tema.” “porque” apresenta:', 'Causa', ['Alternância', 'Comparação', 'Concessão']],
  ['“Organizou o material para que pudesse revisar.” A expressão destacada indica:', 'Finalidade', ['Oposição', 'Tempo', 'Proporção']],
  ['“Além disso, o grupo apresentou novos dados.” “Além disso” marca:', 'Adição', ['Conclusão', 'Condição', 'Explicação']],
  ['“Se houver tempo, faremos outro exercício.” A oração inicial estabelece:', 'Condição', ['Causa', 'Consequência', 'Conformidade']],
  ['“Enquanto a chuva caía, a turma lia.” “Enquanto” indica:', 'Simultaneidade temporal', ['Finalidade', 'Oposição', 'Conclusão']],
  ['“O resultado foi melhor do que esperávamos.” A construção estabelece:', 'Comparação', ['Explicação', 'Condição', 'Adição']],
  ['“Não apenas pesquisou, mas também apresentou fontes.” A correlação indica:', 'Adição enfática', ['Alternância', 'Concessão', 'Causa']],
  ['“Conforme o regulamento orienta, a fonte foi citada.” “Conforme” expressa:', 'Conformidade', ['Consequência', 'Tempo', 'Oposição']],
  ['“Primeiro levantou dados; depois, analisou-os.” Os termos organizam:', 'Sequência temporal', ['Contradição', 'Hipótese', 'Comparação']],
  ['“Ou revisamos agora, ou retomamos amanhã.” A estrutura indica:', 'Alternância', ['Explicação', 'Finalidade', 'Conclusão']],
  ['“A proposta é viável, isto é, pode ser executada.” “isto é” introduz:', 'Reformulação explicativa', ['Oposição', 'Condição', 'Tempo']],
  ['“Quanto mais praticava, mais confiante ficava.” A relação é de:', 'Proporção', ['Causa isolada', 'Concessão', 'Alternância']],
  ['“Apesar do pouco tempo, entregou um texto consistente.” A expressão inicial marca:', 'Concessão', ['Finalidade', 'Adição', 'Conclusão']]
]
linguagem.forEach(([enunciado, correta, erradas], i) => {
  const indice = (i + 2) % 4
  const alternativas = [...erradas]
  alternativas.splice(indice, 0, correta)
  questoes.push({ disciplina: 'Português', competencia: 'Coesão e coerência', enunciado, alternativas, resposta: indice, explicacao: `Nesse contexto, o elemento destacado estabelece relação de ${correta.toLowerCase()}.`, dificuldade: i < 6 ? 'FACIL' : 'MEDIA' })
})

// Ciências humanas: conceitos aplicados, todos com enunciados e explicações próprios.
const humanas = [
  ['História', 'Cidadania', 'A ampliação do direito ao voto em uma sociedade democrática representa principalmente:', 'Inclusão política', ['Centralização econômica', 'Isolamento cultural', 'Censura privada']],
  ['História', 'Industrialização', 'A concentração de fábricas nas cidades durante a industrialização favoreceu:', 'Crescimento urbano acelerado', ['Retorno geral ao campo', 'Fim do trabalho assalariado', 'Desaparecimento do comércio']],
  ['História', 'Fontes históricas', 'Ao comparar cartas, fotografias e jornais de uma época, o pesquisador busca:', 'Confrontar perspectivas diferentes', ['Encontrar uma versão neutra única', 'Eliminar o contexto', 'Substituir toda interpretação']],
  ['Geografia', 'Urbanização', 'A ocupação de encostas sem infraestrutura adequada aumenta o risco de:', 'Deslizamentos e vulnerabilidade social', ['Formação de geleiras', 'Redução da gravidade', 'Expansão de desertos polares']],
  ['Geografia', 'Globalização', 'Redes digitais e transportes rápidos intensificam a globalização porque:', 'Aceleram fluxos de informação e mercadorias', ['Eliminam todas as fronteiras', 'Tornam culturas idênticas', 'Impedem migrações']],
  ['Geografia', 'Clima', 'A retirada da vegetação urbana tende a elevar a temperatura local por reduzir:', 'Sombra e evapotranspiração', ['Rotação terrestre', 'Pressão oceânica global', 'Duração do ano']],
  ['Sociologia', 'Cultura', 'Normas, símbolos e práticas aprendidas socialmente compõem:', 'A cultura de um grupo', ['Somente a herança genética', 'Apenas leis escritas', 'Um fenômeno sem história']],
  ['Sociologia', 'Desigualdade', 'Desigualdade social difere de diversidade porque envolve:', 'Acesso desigual a recursos e oportunidades', ['A existência de gostos distintos', 'A variedade de paisagens', 'Diferenças sem relações de poder']],
  ['Sociologia', 'Trabalho', 'A divisão social do trabalho significa que:', 'Atividades são distribuídas entre pessoas e grupos', ['Todos executam a mesma tarefa', 'O trabalho deixa de produzir valor', 'Não existem especializações']],
  ['Filosofia', 'Ética', 'Considerar como uma decisão afeta outras pessoas é um exercício de:', 'Responsabilidade ética', ['Cálculo geométrico', 'Memorização mecânica', 'Neutralidade absoluta']],
  ['Filosofia', 'Argumentação', 'Um argumento é mais consistente quando apresenta:', 'Razões relevantes e evidências verificáveis', ['Apenas repetição da conclusão', 'Ataques ao interlocutor', 'Palavras difíceis sem relação']],
  ['Filosofia', 'Conhecimento', 'Questionar a origem e os limites de uma afirmação pertence ao campo da:', 'Epistemologia', ['Cartografia', 'Fonética', 'Botânica']],
  ['Biologia', 'Ecologia', 'A variedade de espécies ajuda a estabilidade de um ecossistema porque:', 'Amplia relações e respostas a mudanças', ['Impede qualquer competição', 'Elimina decompositores', 'Interrompe o fluxo de energia']],
  ['Biologia', 'Genética', 'Genes são segmentos de DNA que:', 'Contêm informações para características e funções', ['Produzem energia sem células', 'Existem apenas em bactérias', 'Substituem todos os nutrientes']],
  ['Biologia', 'Saúde', 'Vacinas contribuem para a proteção coletiva ao:', 'Estimular memória do sistema imune', ['Eliminar a necessidade de higiene', 'Curar instantaneamente qualquer doença', 'Impedir a produção de anticorpos']]
]
humanas.forEach(([disciplina, competencia, enunciado, correta, erradas], i) => {
  const indice = (i + 3) % 4
  const alternativas = [...erradas]
  alternativas.splice(indice, 0, correta)
  questoes.push({ disciplina, competencia, enunciado, alternativas, resposta: indice, explicacao: `${correta} é a alternativa que aplica corretamente o conceito de ${competencia.toLowerCase()} ao contexto apresentado.`, dificuldade: i % 3 === 0 ? 'FACIL' : 'MEDIA' })
})

module.exports = questoes

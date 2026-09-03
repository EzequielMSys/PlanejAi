// Banco autoral complementar para simulados longos. As questões não reproduzem
// enunciados, alternativas ou gabaritos de vestibulares oficiais.

const questoes = []

function opcoesNumericas(correta, indice, passo = 1, unidade = '') {
  const valores = [correta, correta + passo, Math.max(0, correta - passo), correta + passo * 2]
  const unicos = [...new Set(valores)]
  while (unicos.length < 4) unicos.push(correta + (unicos.length + 1) * passo)
  const alternativas = Array(4)
  alternativas[indice] = `${correta}${unidade}`
  let cursor = 0
  for (let posicao = 0; posicao < 4; posicao += 1) {
    if (posicao === indice) continue
    while (unicos[cursor] === correta) cursor += 1
    alternativas[posicao] = `${unicos[cursor]}${unidade}`
    cursor += 1
  }
  return alternativas
}

function numerica({ disciplina, competencia, enunciado, correta, explicacao, dificuldade, indice, passo, unidade }) {
  return { disciplina, competencia, enunciado, alternativas: opcoesNumericas(correta, indice, passo, unidade), resposta: indice, explicacao, dificuldade }
}

// Matemática: progressões e modelagem, com números distintos em cada item.
for (let i = 0; i < 18; i += 1) {
  const primeiro = 4 + i
  const razao = 2 + (i % 5)
  const termo = 5 + (i % 6)
  const correta = primeiro + (termo - 1) * razao
  questoes.push(numerica({
    disciplina: 'Matemática', competencia: 'Progressão aritmética', indice: i % 4,
    enunciado: `Em uma sequência aritmética, o primeiro termo é ${primeiro} e a razão é ${razao}. Qual é o ${termo}º termo?`,
    correta, passo: razao, dificuldade: i < 6 ? 'FACIL' : i < 14 ? 'MEDIA' : 'DIFICIL',
    explicacao: `Em uma PA, aₙ = a₁ + (n − 1)r. Logo, ${primeiro} + (${termo} − 1) × ${razao} = ${correta}.`
  }))
}

// Física: densidade e conservação de energia em situações inéditas.
for (let i = 0; i < 18; i += 1) {
  const volume = 2 + i
  const densidade = 3 + (i % 6)
  const massa = volume * densidade
  questoes.push(numerica({
    disciplina: 'Física', competencia: 'Densidade', indice: (i + 1) % 4,
    enunciado: `Uma amostra homogênea tem volume de ${volume} cm³ e massa de ${massa} g. Qual é sua densidade em g/cm³?`,
    correta: densidade, passo: 1, unidade: ' g/cm³', dificuldade: i < 6 ? 'FACIL' : i < 14 ? 'MEDIA' : 'DIFICIL',
    explicacao: `Densidade é massa dividida pelo volume: ${massa} ÷ ${volume} = ${densidade} g/cm³.`
  }))
}

// Química: concentração comum, sem depender de memorização de prova anterior.
for (let i = 0; i < 18; i += 1) {
  const volumeMl = 200 + i * 50
  const concentracao = 4 + (i % 7)
  const massa = concentracao * (volumeMl / 1000)
  questoes.push(numerica({
    disciplina: 'Química', competencia: 'Soluções', indice: (i + 2) % 4,
    enunciado: `Uma solução possui ${massa} g de soluto em ${volumeMl} mL de solução. Qual é a concentração comum, em g/L?`,
    correta: concentracao, passo: 1, unidade: ' g/L', dificuldade: i < 6 ? 'FACIL' : i < 14 ? 'MEDIA' : 'DIFICIL',
    explicacao: `${volumeMl} mL correspondem a ${volumeMl / 1000} L. Assim, C = ${massa} ÷ ${volumeMl / 1000} = ${concentracao} g/L.`
  }))
}

const conceituais = [
  ['Biologia', 'Genética', 'Quando dois alelos diferentes estão presentes em um mesmo indivíduo, essa condição é chamada de:', 'Heterozigose', ['Homozigose', 'Mutação obrigatória', 'Clonagem'], 'Heterozigose ocorre quando os alelos de um gene são diferentes.'],
  ['Biologia', 'Ecologia', 'A relação em que ambos os organismos se beneficiam é um exemplo de:', 'Mutualismo', ['Predação', 'Parasitismo', 'Competição'], 'No mutualismo, as duas espécies obtêm benefício na interação.'],
  ['Biologia', 'Evolução', 'A seleção natural favorece, em determinado ambiente, características que tendem a:', 'Aumentar sucesso de sobrevivência e reprodução', ['Ser idênticas em todos os indivíduos', 'Impedir variações hereditárias', 'Eliminar toda competição'], 'Características hereditárias que favorecem sobrevivência e reprodução tendem a tornar-se mais frequentes.'],
  ['Geografia', 'Demografia', 'A transição demográfica costuma envolver, ao longo do tempo, a redução de:', 'Taxas de natalidade e mortalidade', ['A extensão territorial', 'A rotação terrestre', 'A diversidade cultural'], 'O processo descreve a passagem de taxas altas para taxas menores de mortalidade e natalidade.'],
  ['Geografia', 'Economia', 'A balança comercial de um país compara principalmente:', 'Exportações e importações de bens', ['Apenas impostos municipais', 'Número de rios e montanhas', 'Somente salários do setor público'], 'A balança comercial registra a diferença entre bens exportados e importados.'],
  ['Geografia', 'Meio ambiente', 'O uso racional da água em cidades contribui diretamente para:', 'Reduzir pressão sobre mananciais e sistemas de abastecimento', ['Aumentar desperdício doméstico', 'Eliminar a necessidade de tratamento', 'Impedir o ciclo da água'], 'Economia e reuso reduzem a demanda sobre fontes de água e infraestrutura.'],
  ['História', 'Brasil contemporâneo', 'A redemocratização brasileira é marcada pela retomada de:', 'Instituições democráticas e eleições diretas', ['Censura prévia obrigatória', 'Poder hereditário', 'Fechamento do Congresso'], 'A redemocratização restaurou direitos políticos e mecanismos de participação eleitoral.'],
  ['História', 'Economia e sociedade', 'O trabalho assalariado se caracteriza pela:', 'Remuneração em troca da força de trabalho', ['Ausência de qualquer contrato', 'Propriedade automática da empresa', 'Proibição de divisão de tarefas'], 'No trabalho assalariado, a pessoa vende sua força de trabalho e recebe remuneração.'],
  ['História', 'Patrimônio', 'Preservar fontes e patrimônios históricos ajuda uma sociedade a:', 'Compreender diferentes memórias e processos do passado', ['Eliminar interpretações', 'Substituir pesquisa por opinião', 'Impedir novas produções culturais'], 'Fontes e patrimônios sustentam investigação, memória e debate crítico sobre o passado.'],
  ['Português', 'Leitura e argumentação', 'Em um texto argumentativo, um dado confiável é usado principalmente para:', 'Sustentar uma afirmação com evidência', ['Substituir a tese por completo', 'Evitar qualquer conclusão', 'Criar ambiguidade proposital'], 'Dados confiáveis funcionam como evidência para justificar um ponto de vista.'],
  ['Português', 'Variação linguística', 'Reconhecer diferentes variedades da língua portuguesa significa compreender que:', 'Usos linguísticos variam conforme contexto e comunidade', ['Só existe uma forma legítima de comunicação', 'A norma padrão não possui contexto de uso', 'Toda fala deve ser idêntica à escrita formal'], 'A língua varia social, histórica e regionalmente; adequação depende da situação comunicativa.'],
  ['Português', 'Coesão textual', 'O emprego de pronomes e expressões que retomam ideias anteriores favorece:', 'Coesão referencial', ['Mudança de assunto sem ligação', 'Contradição automática', 'Ausência de sentido'], 'Retomadas referenciais conectam partes do texto e evitam repetição desnecessária.'],
  ['Filosofia', 'Política', 'O debate filosófico sobre justiça pública busca avaliar:', 'Critérios para distribuir direitos, deveres e recursos', ['Apenas preferências individuais sem efeito coletivo', 'A substituição de leis por boatos', 'A impossibilidade de convivência'], 'Refletir sobre justiça envolve critérios de distribuição e reconhecimento em uma comunidade.'],
  ['Sociologia', 'Participação social', 'A organização coletiva de moradores para discutir melhorias locais é exemplo de:', 'Participação social', ['Isolamento político', 'Determinismo biológico', 'Consumo individual obrigatório'], 'Ação coletiva organizada é uma forma de participação na vida pública.'],
  ['Inglês', 'Leitura', 'Na frase “The data were checked before the report was published”, a ideia principal é que:', 'Os dados foram verificados antes da publicação', ['O relatório foi publicado antes de existir dados', 'Os dados deixaram de ser usados', 'A publicação impediu a verificação'], 'A construção indica uma ação de verificação anterior à publicação do relatório.'],
  ['Literatura', 'Leitura literária', 'A construção de imagens e escolhas de linguagem em um poema contribui para:', 'Produzir sentidos e efeitos estéticos', ['Eliminar qualquer interpretação', 'Transformar toda obra em documento técnico', 'Impedir relação com o leitor'], 'Recursos de linguagem participam da produção de sentidos e efeitos estéticos na obra.'],
  ['Matemática', 'Estatística', 'A mediana de uma lista ordenada representa:', 'O valor central, ou a média dos dois centrais', ['Sempre o maior valor', 'A soma de todos os valores', 'Necessariamente o valor mais frequente'], 'A mediana depende da posição central dos dados após ordenação.'],
  ['Física', 'Ondulatória', 'A frequência de uma onda indica:', 'Quantas oscilações ocorrem por unidade de tempo', ['A distância total percorrida pela onda', 'A massa do meio', 'A cor obrigatória da fonte'], 'Frequência mede o número de ciclos ou oscilações em determinado intervalo de tempo.']
]

conceituais.forEach(([disciplina, competencia, enunciado, correta, erradas, explicacao], indice) => {
  const resposta = indice % 4
  const alternativas = [...erradas]
  alternativas.splice(resposta, 0, correta)
  questoes.push({ disciplina, competencia, enunciado, alternativas, resposta, explicacao, dificuldade: indice % 5 === 0 ? 'DIFICIL' : indice % 2 === 0 ? 'MEDIA' : 'FACIL' })
})

module.exports = questoes

import { useMemo, useState } from 'react'
import './StudyGuide.css'

function normalizarTitulo(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function embaralharAlternativas(questoes) {
  return questoes.map(([pergunta, opcoes, correta, explicacao]) => {
    const alternativas = opcoes.map((texto, indice) => ({ texto, correta: indice === correta }))
    for (let indice = alternativas.length - 1; indice > 0; indice -= 1) {
      const sorteado = Math.floor(Math.random() * (indice + 1))
      ;[alternativas[indice], alternativas[sorteado]] = [alternativas[sorteado], alternativas[indice]]
    }
    return [pergunta, alternativas.map((item) => item.texto), alternativas.findIndex((item) => item.correta), explicacao]
  })
}

const AULAS_ESPECIFICAS = [
  { chave: 'interpretacao de texto', conceito: 'Interpretar não é localizar uma palavra repetida no enunciado. É reconstruir o sentido produzido pelo texto, observando quem fala, para quem fala, a situação, os conectivos e o efeito das escolhas de linguagem.', passos: ['Leia o comando e transforme-o em uma pergunta objetiva.', 'Localize no texto a ideia que responde ao comando, não apenas um termo parecido.', 'Observe conectivos: “porém” contrasta, “portanto” conclui, “porque” explica.', 'Elimine alternativas que exageram, contradizem ou trazem informação externa.'], armadilha: 'Não confunda inferência com opinião: uma inferência precisa ter pistas concretas no texto.', pratica: 'Depois de escolher uma alternativa, complete a frase: “Escolhi esta resposta porque o trecho ___ indica ___.”', questoes: [['Em “Marina fechou a janela porque começou a chover”, a segunda oração apresenta:', ['uma causa para a ação de fechar a janela', 'uma consequência da janela fechada', 'uma opinião sem relação com a ação'], 0, '“Porque” introduz o motivo que explica por que Marina fechou a janela.'], ['Uma alternativa afirma algo que não aparece nem pode ser concluído pelas pistas do texto. Ela deve ser:', ['aceita por ser criativa', 'descartada por extrapolar o texto', 'preferida se tiver palavras mais difíceis'], 1, 'Interpretação exige evidência textual; informação sem apoio é extrapolação.'], ['Qual é a melhor justificativa para uma resposta interpretativa?', ['“Foi a primeira alternativa que li.”', '“Uma palavra é parecida com o enunciado.”', '“O conectivo e o trecho mostram essa relação de sentido.”'], 2, 'A justificativa deve apontar uma evidência e explicar a relação de sentido.']] },
  { chave: 'funcoes do 1', conceito: 'Uma função do primeiro grau relaciona duas grandezas por uma regra do tipo f(x) = ax + b. O coeficiente a mostra como o valor varia a cada unidade de x; b indica o valor inicial, quando x vale zero.', passos: ['Identifique qual grandeza depende da outra.', 'Separe a taxa de variação (a) do valor inicial (b).', 'Substitua um valor de x com cuidado e calcule f(x).', 'Verifique se o resultado cresce ou diminui conforme o sinal de a.'], armadilha: 'Não troque a taxa por hora/unidade com o valor fixo: em 3x + 8, 3 varia e 8 é o ponto de partida.', pratica: 'Crie uma situação com taxa fixa e taxa variável e escreva sua expressão.', questoes: [['Na função f(x) = 4x + 7, qual é o valor inicial?', ['4', '7', '11'], 1, 'O valor inicial é f(0), portanto b = 7.'], ['Se a = -2 em f(x) = ax + b, a função:', ['cresce quando x aumenta', 'permanece sempre igual', 'diminui quando x aumenta'], 2, 'Coeficiente angular negativo indica comportamento decrescente.'], ['Uma corrida cobra R$ 6 de bandeirada e R$ 2 por quilômetro. Qual expressão representa o custo C?', ['C = 6x + 2', 'C = 2x + 6', 'C = 8x'], 1, 'R$ 2 é a taxa por quilômetro e R$ 6 é o valor fixo inicial.']] },
  { chave: 'ecologia', conceito: 'Ecologia estuda as relações entre seres vivos e ambiente. Em cadeias alimentares, matéria circula; energia entra principalmente pelos produtores e diminui a cada transferência entre níveis tróficos.', passos: ['Identifique produtores, consumidores e decompositores.', 'Siga a seta da cadeia como fluxo de energia/alimento.', 'Analise qual população é afetada primeiro por uma alteração.', 'Diferencie relação ecológica, nicho e habitat antes de responder.'], armadilha: 'A seta não aponta para quem come; aponta para onde a energia vai.', pratica: 'Monte uma cadeia com capim, gafanhoto, sapo e cobra e explique o efeito da redução do capim.', questoes: [['Em uma cadeia capim → gafanhoto → sapo, o gafanhoto é:', ['produtor', 'consumidor primário', 'decompositor'], 1, 'Ele se alimenta diretamente do produtor, por isso é consumidor primário.'], ['Se os produtores diminuem muito, qual grupo tende a sofrer primeiro?', ['consumidores primários', 'decompositores apenas', 'nenhum outro nível'], 0, 'Consumidores primários dependem diretamente da energia armazenada pelos produtores.'], ['Qual afirmação sobre energia na cadeia alimentar é correta?', ['aumenta em cada nível', 'é reciclada integralmente', 'diminui a cada transferência'], 2, 'Parte da energia é dissipada em cada transferência, restando menos para o nível seguinte.']] },
  { chave: 'estequiometria', conceito: 'Estequiometria usa a equação química balanceada para comparar quantidades de reagentes e produtos. Os coeficientes indicam proporções em mol, não massas arbitrárias.', passos: ['Balanceie a equação antes de qualquer cálculo.', 'Converta a quantidade dada para mol quando necessário.', 'Use a razão entre os coeficientes para chegar à quantidade pedida.', 'Converta a unidade final e confira se o reagente limitante foi considerado.'], armadilha: 'Índices da fórmula não podem ser alterados para balancear; ajuste apenas coeficientes na frente das substâncias.', pratica: 'Em 2H₂ + O₂ → 2H₂O, explique a proporção entre mol de O₂ e mol de H₂O.', questoes: [['Na equação 2H₂ + O₂ → 2H₂O, 1 mol de O₂ produz quantos mol de H₂O?', ['1', '2', '4'], 1, 'A razão dos coeficientes é 1 mol de O₂ para 2 mol de H₂O.'], ['Para balancear uma equação, deve-se alterar:', ['coeficientes', 'índices químicos', 'símbolos dos elementos'], 0, 'Coeficientes preservam a identidade das substâncias e ajustam a quantidade de moléculas.'], ['Por que converter massa em mol pode ser necessário?', ['Porque a equação relaciona proporções de partículas/mol', 'Porque mol sempre é menor que grama', 'Para eliminar o balanceamento'], 0, 'Os coeficientes da equação representam relações estequiométricas em mol.']] },
  { chave: 'cinematica', conceito: 'Cinemática descreve o movimento sem investigar suas causas. Posição, deslocamento, intervalo de tempo, velocidade média e aceleração precisam ser distinguidos para modelar uma situação.', passos: ['Defina referencial e unidades.', 'Anote posição inicial, final e intervalo de tempo.', 'Calcule deslocamento antes de velocidade média.', 'Verifique se a unidade final é coerente, como m/s ou km/h.'], armadilha: 'Distância percorrida e deslocamento não são sempre iguais: voltar ao ponto inicial produz deslocamento zero.', pratica: 'Um estudante caminha 100 m e volta 100 m. Compare distância e deslocamento.', questoes: [['Um móvel percorre 120 m em 20 s. Sua velocidade média é:', ['4 m/s', '6 m/s', '140 m/s'], 1, 'Velocidade média = deslocamento/tempo = 120/20 = 6 m/s.'], ['Quando um objeto volta ao ponto de partida, seu deslocamento é:', ['zero', 'igual à distância total', 'sempre negativo'], 0, 'Deslocamento considera apenas a diferença entre posição final e inicial.'], ['Qual grandeza a cinemática não explica diretamente?', ['posição', 'velocidade', 'a causa do movimento'], 2, 'As causas, como forças, são estudadas pela dinâmica.']] },
  { chave: 'repertorio sociocultural', conceito: 'Repertório sociocultural produtivo não é uma citação decorativa. Ele deve ser confiável, pertinente ao tema e explicado de modo que sustente a tese ou um argumento da redação.', passos: ['Escolha um repertório que você consegue explicar com precisão.', 'Apresente o dado, obra, autor ou fato sem inventar informação.', 'Conecte explicitamente o repertório ao problema discutido.', 'Mostre como ele fortalece a tese ou a consequência apresentada.'], armadilha: 'Nomear um autor sem explicar a relação com o argumento não desenvolve repertório produtivo.', pratica: 'Escolha uma obra conhecida e escreva duas frases: apresentação e ligação com uma tese social.', questoes: [['Quando um repertório é produtivo?', ['Quando aparece sem relação com o parágrafo', 'Quando é explicado e usado para sustentar o argumento', 'Quando possui nome difícil'], 1, 'O valor está na função argumentativa, não no prestígio isolado da referência.'], ['Qual risco deve ser evitado?', ['Explicar a relação entre repertório e tese', 'Inventar dados ou atribuições para parecer convincente', 'Usar uma referência verificável'], 1, 'Informações inventadas prejudicam a credibilidade e a argumentação.'], ['Após apresentar um repertório, o passo mais importante é:', ['mudar imediatamente de assunto', 'mostrar como ele comprova ou problematiza a tese', 'repetir o nome do autor'], 1, 'A conexão explícita transforma referência em argumento.']] },
  { chave: 'modernismo brasileiro', conceito: 'O Modernismo brasileiro buscou renovar a linguagem e discutir criticamente a identidade nacional. Na primeira fase, a ruptura com padrões acadêmicos, a oralidade e a experimentação são marcas recorrentes.', passos: ['Localize o período e a proposta estética do movimento.', 'Compare a ruptura modernista com normas anteriores.', 'Observe linguagem, humor, cotidiano e crítica cultural nos textos.', 'Relacione recurso formal à visão de Brasil apresentada.'], armadilha: 'Modernismo não significa ausência de técnica; a experimentação é uma escolha estética consciente.', pratica: 'Ao ler um poema modernista, marque um traço de oralidade e explique o efeito dele.', questoes: [['Uma marca da primeira fase modernista é:', ['imitação rígida de modelos clássicos', 'experimentação linguística e crítica cultural', 'proibição da oralidade'], 1, 'A primeira fase valorizou ruptura, oralidade e revisão crítica da cultura brasileira.'], ['Por que a linguagem cotidiana pode ser usada no Modernismo?', ['Para aproximar arte e experiência brasileira', 'Porque não existe preocupação estética', 'Para copiar modelos europeus sem adaptação'], 0, 'A oralidade ajuda a questionar padrões e construir uma voz cultural própria.'], ['A ruptura modernista se dirige principalmente a:', ['convenções artísticas rígidas', 'qualquer forma de leitura', 'somente temas estrangeiros'], 0, 'O movimento questiona padrões formais e culturais considerados fixos.']] }
]

function planoPorDisciplina(disciplina = '', titulo = '') {
  const tema = normalizarTitulo(titulo)
  const aula = AULAS_ESPECIFICAS.find((item) => tema.includes(item.chave))
  if (aula) return aula
  const area = disciplina.toLowerCase()
  if (/(matemática|matematica|física|fisica|química|quimica)/.test(area)) return {
    conceito: 'O aprendizado acontece quando você transforma o enunciado em dados, relações e uma conclusão verificável — não quando tenta decorar fórmulas isoladas.',
    passos: ['Marque os dados e a pergunta do enunciado.', 'Escolha a relação, regra ou fórmula que conecta os dados.', 'Resolva por etapas e confira unidade, sinal e ordem de grandeza.'],
    questoes: [
      ['Qual deve ser o primeiro passo diante de uma questão?', ['Aplicar a primeira fórmula lembrada.', 'Separar dados e identificar o que é pedido.', 'Chutar pela unidade de medida.'], 1, 'Antes de calcular, é preciso entender exatamente quais são os dados e a pergunta.'],
      ['Qual verificação ajuda a encontrar um erro no final?', ['Conferir unidade e ordem de grandeza.', 'Trocar todos os números.', 'Ignorar o resultado se ele for grande.'], 0, 'Unidade e ordem de grandeza ajudam a perceber resultados incompatíveis.'],
      ['Por que resolver por etapas é útil?', ['Porque elimina a necessidade de entender.', 'Porque mostra onde uma relação foi aplicada de forma incorreta.', 'Porque sempre deixa a resposta menor.'], 1, 'As etapas tornam o raciocínio verificável e facilitam a correção.']
    ]
  }
  if (/(português|portugues|literatura|inglês|ingles|redação|redacao)/.test(area)) return {
    conceito: 'Interpretar é construir sentido pelo contexto: comando, palavras-chave, relação entre ideias e evidências do texto trabalham juntos.',
    passos: ['Leia o comando antes de procurar a resposta.', 'Localize palavras-chave e conectivos que relacionam as ideias.', 'Justifique a escolha com o contexto, não com uma palavra solta.'],
    questoes: [
      ['Ao interpretar um texto, qual estratégia é mais segura?', ['Escolher a alternativa com uma palavra igual ao texto.', 'Ler o comando e buscar evidências no contexto.', 'Responder apenas pelo título.'], 1, 'A resposta precisa ser sustentada pelo comando e pelo contexto do texto.'],
      ['O que conectivos como “porém” e “portanto” ajudam a identificar?', ['A relação entre as ideias.', 'A quantidade de parágrafos.', 'Somente a opinião do leitor.'], 0, 'Conectivos indicam contraste, causa, consequência e outras relações importantes.'],
      ['Uma boa resposta de interpretação deve:', ['Ignorar o restante do texto.', 'Ser justificada por um trecho ou regra do contexto.', 'Repetir a primeira frase lida.'], 1, 'Justificar evita escolhas baseadas em uma palavra isolada.']
    ]
  }
  if (/(história|historia|geografia|filosofia|sociologia)/.test(area)) return {
    conceito: 'Em Humanas, compreender é conectar contexto, conceitos, causas, consequências e perspectivas — não decorar uma lista de datas ou nomes.',
    passos: ['Situe o tema no tempo, espaço ou problema social.', 'Defina os conceitos centrais com suas próprias palavras.', 'Relacione causas, consequências e diferentes pontos de vista.'],
    questoes: [
      ['Qual abordagem favorece a compreensão em Humanas?', ['Decorar uma informação isolada.', 'Relacionar contexto, causas e consequências.', 'Desconsiderar o período histórico.'], 1, 'O sentido dos acontecimentos depende das relações entre contexto, causas e efeitos.'],
      ['Antes de responder, é importante identificar:', ['O conceito central e o contexto do tema.', 'A alternativa mais longa.', 'A data atual do computador.'], 0, 'Conceito e contexto orientam a leitura da questão.'],
      ['Por que comparar perspectivas pode ajudar?', ['Porque todo tema possui uma única explicação simples.', 'Porque permite perceber interesses e interpretações diferentes.', 'Porque substitui a leitura da fonte.'], 1, 'Comparar perspectivas melhora a análise, sem substituir a consulta à fonte.']
    ]
  }
  return {
    conceito: 'Aprender bem é sair do reconhecimento superficial: explique a ideia, conecte-a a um exemplo e teste se consegue usá-la sem consultar o material.',
    passos: ['Defina a ideia principal com suas palavras.', 'Associe o conceito a um exemplo ou situação.', 'Faça uma questão curta e revise o ponto que gerou dúvida.'],
    questoes: [
      ['Qual ação mostra que você começou a compreender um tema?', ['Explicá-lo com suas próprias palavras.', 'Apenas reler o título.', 'Pular diretamente para outro assunto.'], 0, 'Explicar com suas palavras revela se a ideia foi realmente compreendida.'],
      ['Para que serve um exemplo?', ['Para conectar o conceito a uma situação concreta.', 'Para evitar estudar a teoria.', 'Para substituir toda a fonte.'], 0, 'Exemplos ajudam a transformar uma definição em entendimento aplicável.'],
      ['O que fazer quando uma questão revelar dúvida?', ['Ignorar e seguir sem revisar.', 'Identificar o ponto específico e voltar ao passo correspondente.', 'Trocar a pergunta por outra mais fácil.'], 1, 'A dúvida é uma indicação objetiva do que revisar.']
    ]
  }
}

export function isExternalStudySource(url) {
  try {
    const parsed = new window.URL(url)
    return /^https?:$/.test(parsed.protocol) && !parsed.pathname.startsWith('/uploads/') && parsed.origin !== window.location.origin
  } catch { return false }
}

export default function StudyGuide({ material, sourceUrl, className = '' }) {
  const titulo = material?.titulo || material?.title || 'Este conteúdo'
  const disciplina = material?.disciplina || material?.area || 'sua disciplina'
  const plano = useMemo(() => planoPorDisciplina(disciplina, titulo), [disciplina, titulo])
  const questoes = useMemo(() => embaralharAlternativas(plano.questoes), [plano])
  const [respostas, setRespostas] = useState({})
  const [resultado, setResultado] = useState(null)
  const origem = (() => {
    try { return new window.URL(sourceUrl).hostname.replace(/^www\./, '') } catch { return 'fonte indicada' }
  })()
  const completas = questoes.every((_, indice) => respostas[indice] !== undefined)

  function corrigir() {
    if (!completas) return
    setResultado(questoes.reduce((total, [, , correta], indice) => total + Number(respostas[indice] === correta), 0))
  }

  return <article className={`study-guide ${className}`}>
    <header><span>LEITURA GUIADA</span><h2>{titulo}</h2><p>{disciplina} · primeiro entenda o método, depois confirme os detalhes na fonte original.</p></header>
    <section><h3>O que você precisa aprender</h3><p>{plano.conceito}</p></section>
    <section><h3>Roteiro de estudo</h3><ol>{plano.passos.map((passo) => <li key={passo}>{passo}</li>)}</ol></section>
    {plano.armadilha && <section><h3>Armadilha comum</h3><p>{plano.armadilha}</p>{plano.pratica && <p><b>Prática ativa:</b> {plano.pratica}</p>}</section>}
    <section className="study-guide-quiz" aria-labelledby="quiz-title">
      <div><span>VALIDAÇÃO DE LEITURA</span><h3 id="quiz-title">Teste rápido: responda sem consultar</h3><p>São três perguntas curtas sobre o método apresentado acima.</p></div>
      {questoes.map(([pergunta, opcoes, correta, explicacao], indice) => <fieldset key={pergunta} disabled={resultado !== null}>
        <legend>{indice + 1}. {pergunta}</legend>
        <div className="study-guide-options">{opcoes.map((opcao, opcaoIndice) => <button type="button" key={opcao} className={respostas[indice] === opcaoIndice ? 'is-selected' : ''} onClick={() => setRespostas((atuais) => ({ ...atuais, [indice]: opcaoIndice }))}><b>{String.fromCharCode(65 + opcaoIndice)}</b>{opcao}</button>)}</div>
        {resultado !== null && <p className={respostas[indice] === correta ? 'is-correct' : 'is-wrong'}>{respostas[indice] === correta ? '✓ Correto. ' : `Resposta correta: ${String.fromCharCode(65 + correta)}. `}{explicacao}</p>}
      </fieldset>)}
      {resultado === null ? <button type="button" className="study-guide-check" disabled={!completas} onClick={corrigir}>{completas ? 'Corrigir respostas' : 'Responda as 3 questões para corrigir'}</button> : <div className="study-guide-result" role="status"><b>{resultado}/3 respostas corretas</b><span>{resultado === 3 ? 'Ótimo: você entendeu o roteiro de estudo.' : 'Revise os comentários e tente aplicar o método na fonte.'}</span><button type="button" onClick={() => { setRespostas({}); setResultado(null) }}>Refazer teste</button></div>}
    </section>
    <footer><span>Para aprofundar, consulte a fonte original.</span><a href={sourceUrl} target="_blank" rel="noopener noreferrer">Abrir {origem} ↗</a></footer>
  </article>
}

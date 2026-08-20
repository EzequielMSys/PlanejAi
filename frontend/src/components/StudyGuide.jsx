import { useMemo, useState } from 'react'
import './StudyGuide.css'

function planoPorDisciplina(disciplina = '') {
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
  const plano = useMemo(() => planoPorDisciplina(disciplina), [disciplina])
  const [respostas, setRespostas] = useState({})
  const [resultado, setResultado] = useState(null)
  const origem = (() => {
    try { return new window.URL(sourceUrl).hostname.replace(/^www\./, '') } catch { return 'fonte indicada' }
  })()
  const completas = plano.questoes.every((_, indice) => respostas[indice] !== undefined)

  function corrigir() {
    if (!completas) return
    setResultado(plano.questoes.reduce((total, [, , correta], indice) => total + Number(respostas[indice] === correta), 0))
  }

  return <article className={`study-guide ${className}`}>
    <header><span>LEITURA GUIADA</span><h2>{titulo}</h2><p>{disciplina} · primeiro entenda o método, depois confirme os detalhes na fonte original.</p></header>
    <section><h3>O que você precisa aprender</h3><p>{plano.conceito}</p></section>
    <section><h3>Roteiro de estudo</h3><ol>{plano.passos.map((passo) => <li key={passo}>{passo}</li>)}</ol></section>
    <section className="study-guide-quiz" aria-labelledby="quiz-title">
      <div><span>VALIDAÇÃO DE LEITURA</span><h3 id="quiz-title">Teste rápido: responda sem consultar</h3><p>São três perguntas curtas sobre o método apresentado acima.</p></div>
      {plano.questoes.map(([pergunta, opcoes, correta, explicacao], indice) => <fieldset key={pergunta} disabled={resultado !== null}>
        <legend>{indice + 1}. {pergunta}</legend>
        <div className="study-guide-options">{opcoes.map((opcao, opcaoIndice) => <button type="button" key={opcao} className={respostas[indice] === opcaoIndice ? 'is-selected' : ''} onClick={() => setRespostas((atuais) => ({ ...atuais, [indice]: opcaoIndice }))}><b>{String.fromCharCode(65 + opcaoIndice)}</b>{opcao}</button>)}</div>
        {resultado !== null && <p className={respostas[indice] === correta ? 'is-correct' : 'is-wrong'}>{respostas[indice] === correta ? '✓ Correto. ' : `Resposta correta: ${String.fromCharCode(65 + correta)}. `}{explicacao}</p>}
      </fieldset>)}
      {resultado === null ? <button type="button" className="study-guide-check" disabled={!completas} onClick={corrigir}>{completas ? 'Corrigir respostas' : 'Responda as 3 questões para corrigir'}</button> : <div className="study-guide-result" role="status"><b>{resultado}/3 respostas corretas</b><span>{resultado === 3 ? 'Ótimo: você entendeu o roteiro de estudo.' : 'Revise os comentários e tente aplicar o método na fonte.'}</span><button type="button" onClick={() => { setRespostas({}); setResultado(null) }}>Refazer teste</button></div>}
    </section>
    <footer><span>Para aprofundar, consulte a fonte original.</span><a href={sourceUrl} target="_blank" rel="noopener noreferrer">Abrir {origem} ↗</a></footer>
  </article>
}

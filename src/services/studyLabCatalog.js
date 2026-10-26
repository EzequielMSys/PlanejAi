// Cases are versioned: keep published versions immutable so an old investigation
// and its reference solution continue to describe the same problem.
const sources = {
  energy: { title: 'Inmetro · unidades de potência e energia', url: 'https://www.gov.br/inmetro/pt-br/assuntos/metrologia-cientifica/laboratorios/eletricidade-e-magnetismo/energia-eletrica' },
  argument: { title: 'MEC · BNCC do Ensino Médio', url: 'https://www.gov.br/mec/pt-br/cne/bncc_ensino_medio.pdf' },
};
const money = n => n.toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2});
const catalog = [
  {
    id:'energia-cotidiano', version:1, title:'O aparelho mais potente é o que mais consome?',
    subjects:['Física','Matemática','Energia','Potência','Unidades'], minutes:20,
    objective:'Relacionar potência, tempo, consumo e custo sem confundir as unidades.',
    prerequisites:'Multiplicação, conversão de minutos em horas e leitura de unidades.',
    sources:[sources.energy], parameter:{label:'Minutos de banho por dia',min:5,max:30,step:1,initial:8,unit:'min'},
    phases(value=8) { const shower=5.5*value/60*30; return {
      base:{prompt:'Uma casa quer entender o consumo de três aparelhos em 30 dias. Calcule a energia de cada um, o custo conjunto e explique por que olhar somente a potência pode enganar.',
        data:['TV: 120 W, 5 horas por dia.','Chuveiro: 5.500 W, 10 minutos por dia.','Lâmpada: 9 W, 6 horas por dia.','Valor didático: R$ 0,80 por kWh, sem impostos, bandeiras nem outras cobranças. Considere potência constante.'],
        guiding:'Qual unidade de tempo precisa ser usada para obter kWh a partir de kW?',
        hint:'Converta W para kW dividindo por 1.000. Use E = P × tempo total; 10 minutos = 1/6 de hora.',
        solution:'TV: 0,120 × 5 × 30 = 18 kWh. Chuveiro: 5,5 × (10/60) × 30 = 27,5 kWh. Lâmpada: 0,009 × 6 × 30 = 1,62 kWh. Total: 47,12 kWh; custo didático: R$ 37,70. Potência indica a taxa; energia também depende do tempo. O modelo não representa uma conta real completa.',
        strategies:[{title:'Calcular por aparelho',text:'Encontre a energia mensal de cada equipamento e some ao final.',assumption:'A potência e o tempo de uso são constantes nos 30 dias.'},{title:'Começar por um dia',text:'Some 0,6 + 0,9167 + 0,054 kWh/dia, mantendo precisão, e multiplique por 30.',assumption:'O padrão diário se repete; arredonde apenas no resultado final.'}]},
      variation:{prompt:`Agora o banho dura ${value} minutos por dia, com o mesmo chuveiro e os mesmos 30 dias. Qual é o novo consumo do chuveiro e a diferença de custo em relação aos 10 minutos? A potência mudou?`,
        data:[`Banho: ${value} min/dia; potência: 5.500 W; período: 30 dias.`, 'Valor didático mantido: R$ 0,80/kWh. Os outros aparelhos não mudaram.'],
        guiding:'Qual fator da expressão E = P × t foi alterado?',hint:'Compare 5,5 × (minutos/60) × 30 com os 27,5 kWh do caso inicial.',
        solution:`O chuveiro passa a consumir ${money(shower)} kWh. A diferença é de ${money(shower-27.5)} kWh, equivalente a R$ ${money((shower-27.5)*.8)} (novo menos anterior). Valor negativo significa redução. A potência continua 5.500 W; mudou o tempo.`,
        strategies:[{title:'Recalcular o consumo',text:'Substitua o tempo e subtraia o resultado anterior.',assumption:'A potência continua constante.'},{title:'Usar proporcionalidade',text:`Multiplique 27,5 kWh pela razão ${value}/10.`,assumption:'Somente a duração varia; aparelho e período são os mesmos.'}]},
      transfer:{prompt:'Uma sala usa um projetor de 200 W por 3 horas em cada um de 20 encontros. Quanto consome e quanto custaria pelo mesmo valor didático? Explique a relação com o caso da casa sem copiar seus números.',
        data:['Potência constante: 200 W.','20 encontros de 3 horas cada.','R$ 0,80/kWh, sem outras cobranças.'],guiding:'O que corresponde ao tempo mensal neste novo contexto?',hint:'Converta a potência para kW e calcule o total de horas dos encontros.',solution:'0,2 kW × 60 h = 12 kWh. Custo didático: R$ 9,60. A relação P × tempo continua a mesma, mas as grandezas e o contexto mudaram.',strategies:[{title:'Por encontro',text:'0,2 × 3 = 0,6 kWh; depois multiplique por 20.',assumption:'Todos os encontros têm a mesma duração.'},{title:'Pelo tempo total',text:'Some 60 horas e multiplique por 0,2 kW.',assumption:'O projetor opera com potência constante.'}]},
    }; },
  },
  {
    id:'noticia-percentuais',version:1,title:'Uma manchete conta a história inteira?',
    subjects:['Matemática','Porcentagem','Estatística','Interpretação','Argumentação'],minutes:20,
    objective:'Distinguir contagem, proporção e pontos percentuais; escrever uma conclusão compatível com os dados.',
    prerequisites:'Divisão, porcentagem e identificação do total de uma amostra.',sources:[sources.argument],
    parameter:{label:'Usuários de ônibus na segunda pesquisa',min:0,max:150,step:1,initial:90,unit:'pessoas'},
    phases(value=90) {const percentage=value/150*100;return {
      base:{prompt:'Uma manchete afirma: “Uso de ônibus cresce quase 46% entre estudantes”. Confira o cálculo, explique o que a frase pode sugerir indevidamente e escreva uma versão mais precisa.',data:['Primeira pesquisa: 120 respondentes; 72 usam ônibus.','Segunda pesquisa: 150 respondentes; 105 usam ônibus.','São amostras independentes por conveniência, sem acompanhamento das mesmas pessoas. Não há margem de erro informada.'],
        guiding:'Quase 46% se refere à contagem de respostas ou à proporção dentro de cada amostra?',hint:'Compare (105−72)/72 com 72/120 e 105/150. Uma diferença entre porcentagens pode ser expressa em pontos percentuais.',
        solution:'A contagem cresceu 33/72 ≈ 45,83%, mas o número de respondentes também mudou. As proporções foram 60% e 70%: diferença de 10 pontos percentuais, ou aumento relativo de cerca de 16,67% na proporção observada. Uma manchete possível: “Em duas amostras, proporção que relata usar ônibus passa de 60% para 70%”. Não se pode generalizar uma mudança da população nem inferir causa com esses dados.',
        strategies:[{title:'Normalizar os grupos',text:'Transforme as duas contagens em proporções de seus respectivos totais.',assumption:'A descrição vale para as amostras observadas.'},{title:'Auditar a manchete',text:'Descubra qual denominador produz 45,83% e confronte-o com a ideia comunicada.',assumption:'Um cálculo correto pode sustentar uma interpretação inadequada.'}]},
      variation:{prompt:`Na segunda pesquisa, ${value} dos 150 respondentes usam ônibus. A primeira continua com 72 de 120. Compare as proporções e reescreva a conclusão.`,data:[`Primeira: 72/120. Segunda: ${value}/150.`,'Mesmas limitações amostrais do caso inicial.'],guiding:'Uma contagem maior sempre implica proporção maior?',hint:'Use 60% como referência e calcule a porcentagem da segunda amostra.',solution:`A segunda proporção é ${money(percentage)}%. A diferença é ${money(percentage-60)} pontos percentuais; a variação relativa da proporção é ${money((percentage-60)/60*100)}%. A conclusão deve descrever as amostras, sem atribuir causa nem generalizar.`,strategies:[{title:'Porcentagens',text:'Calcule cada proporção em 100 e subtraia.',assumption:'Use os denominadores de cada pesquisa.'},{title:'Razões',text:`Compare ${value}/150 com 72/120 antes de converter para porcentagem.`,assumption:'Frações equivalentes preservam a comparação.'}]},
      transfer:{prompt:'Uma biblioteca registrou 40 leitores de ficção entre 80 visitantes num dia e 60 entre 150 em outro. Houve aumento na quantidade? E na proporção? Escreva uma frase que informe as duas coisas.',data:['Dia A: 40 de 80.','Dia B: 60 de 150.','Dias diferentes, sem controle sobre quem visitou a biblioteca.'],guiding:'Qual conclusão muda quando você considera o tamanho de cada grupo?',hint:'Calcule 40/80 e 60/150.',solution:'A quantidade aumentou de 40 para 60 (50% a mais), enquanto a proporção caiu de 50% para 40% (−10 pontos percentuais; −20% relativos). São descrições desses dias, sem concluir uma tendência geral.',strategies:[{title:'Duas medidas',text:'Apresente contagem e proporção lado a lado.',assumption:'As duas medidas respondem a perguntas diferentes.'},{title:'Um grupo de referência',text:'Expresse ambos em cada 100 visitantes para comparar a composição.',assumption:'Normalizar não torna a amostra representativa.'}]},
    };},
  },
  {
    id:'agua-argumento',version:1,title:'Uma proposta sustentável precisa de que evidência?',
    subjects:['Matemática','Porcentagem','Redação','Argumentação','Interpretação'],minutes:25,
    objective:'Calcular uma contribuição possível e construir um argumento que reconheça limites.',
    prerequisites:'Porcentagem, distinção entre hipótese e evidência e construção de um parágrafo argumentativo.',sources:[sources.argument],
    parameter:{label:'Volume disponível para reuso no mês',min:0,max:4000,step:100,initial:600,unit:'litros'},
    phases(value=600){return {
      base:{prompt:'Uma proposta afirma: “O tanque de reuso resolverá o consumo de água da escola”. Avalie a frase e escreva um parágrafo favorável ou contrário à implantação, usando os números e explicitando pelo menos um limite.',data:['Cenário fictício: o jardim usa 4.000 litros por mês.','Um tanque pode fornecer 900 litros por mês, já descontadas as perdas.','Toda a água do tanque substitui igual volume usado na irrigação. Não há dados sobre outros usos da escola, custos ou segurança sanitária.'],guiding:'Os dados descrevem o consumo de toda a escola ou apenas do jardim?',hint:'Calcule 900/4.000. Separe a redução possível na irrigação da conclusão sobre o consumo total da escola.',solution:'900/4.000 = 22,5% do volume de irrigação. O tanque pode reduzir parte desse uso sob as hipóteses do cenário; não há base para afirmar que resolve o consumo total. Um argumento possível defende um projeto piloto, cita os 22,5%, reconhece os dados ausentes e propõe medir o resultado. Custos e adequação sanitária exigem avaliação própria; o exercício não recomenda instalar um sistema real.',strategies:[{title:'Partir do dado',text:'Apresente 22,5%, explique seu alcance e então formule uma posição.',assumption:'O volume do tanque substitui integralmente água da irrigação.'},{title:'Partir da tese',text:'Defenda uma implantação condicionada e use o cálculo como justificativa limitada.',assumption:'A tese deve reconhecer o que os dados ainda não demonstram.'}]},
      variation:{prompt:`O volume disponível mudou para ${value} litros por mês. Reavalie a contribuição para os 4.000 litros de irrigação e ajuste seu argumento.`,data:[`Reuso disponível: ${value} L/mês. Irrigação: 4.000 L/mês.`,'As demais hipóteses e ausências de dados continuam iguais.'],guiding:'A mudança do número altera sua posição ou apenas a força do argumento?',hint:'Divida o novo volume por 4.000 e multiplique por 100.',solution:`A contribuição possível é ${money(value/4000*100)}% da irrigação. Esse resultado não informa o percentual do consumo total da escola. Ajuste a tese proporcionalmente à evidência e mantenha explícitos os limites.`,strategies:[{title:'Atualizar a evidência',text:'Recalcule o percentual e revise as frases que dependiam do valor anterior.',assumption:'A hipótese de substituição continua válida.'},{title:'Confrontar cenários',text:'Compare o novo resultado com 22,5% e explique o efeito sobre a decisão.',assumption:'Uma diferença numérica não resolve a falta de dados sobre custos e segurança.'}]},
      transfer:{prompt:'Uma campanha quer reduzir o papel de uma biblioteca: de 2.400 folhas mensais, 600 poderiam ser substituídas por avisos digitais. Escreva uma recomendação com o percentual possível e uma limitação da proposta.',data:['Consumo atual: 2.400 folhas/mês.','Substituição possível: 600 folhas/mês.','Não há informação sobre acesso digital de todos os leitores nem sobre outros gastos.'],guiding:'Qual parte do problema o dado realmente permite estimar?',hint:'600/2.400 indica a fração do consumo considerada substituível.',solution:'A redução possível é 25% das folhas sob a hipótese apresentada. A recomendação deve reconhecer os 75% restantes e considerar acesso aos avisos, sem declarar resolvido todo o impacto ambiental.',strategies:[{title:'Dado e limite',text:'Calcule 25% e explicite o alcance da redução.',assumption:'Os avisos digitais substituem essas 600 folhas.'},{title:'Plano de verificação',text:'Proponha testar a mudança e medir uso de papel e acesso à informação.',assumption:'O resultado real precisa ser observado após a implementação.'}]},
    };},
  },
];
function find(id,version=1) { return catalog.find(c=>c.id===id&&c.version===version); }
function cards() { return catalog.map(({phases,...card})=>({...card,fictional:true})); }
function present(data) {
  const item=find(data.caseId,data.caseVersion); if(!item)return null;
  const phases=item.phases(data.parameter);
  return {...cards().find(c=>c.id===item.id),phases:Object.fromEntries(Object.entries(phases).map(([key,p])=>{
    const level=data.help?.[key] || 0;
    return [key,{prompt:p.prompt,data:p.data,helpLevel:level,...(level>=1?{guiding:p.guiding}:{}),...(level>=2?{hint:p.hint}:{}),...(level>=3?{solution:p.solution,strategies:p.strategies}:{})}];
  }))};
}
function recommend(title,causes=[]) {
  const t=String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(/energia|potencia|eletric|fisica|unidade/.test(t))return {id:'energia-cotidiano',reason:'Conecta potência, tempo e energia, assuntos próximos da dificuldade registrada.'};
  if(/redacao|argument|repertorio|agua|sustent/.test(t))return {id:'agua-argumento',reason:'Trabalha o uso de dados e os limites de um argumento.'};
  if(/porcent|estat|grafico|propor|matemat/.test(t)||causes.includes('interpretacao'))return {id:'noticia-percentuais',reason:'Ajuda a distinguir o que um dado permite concluir e como o enunciado é interpretado.'};
  return null;
}
module.exports={find,cards,present,recommend};

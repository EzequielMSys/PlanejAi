// Banco autoral de nível avançado. Os enunciados foram criados para a
// plataforma e treinam modelagem, escolha de estratégia e mais de uma etapa.

const questions = []

function alternatives(correct, index, distractors) {
  const values = [...distractors]
  values.splice(index, 0, correct)
  return values
}

for (let i = 0; i < 16; i += 1) {
  const base = 2 + (i % 4)
  const exponent = 3 + (i % 3)
  const target = exponent + 2
  const correct = target - exponent
  const answer = i % 4
  questions.push({
    disciplina: 'Matemática', competencia: 'Funções exponenciais e logaritmos', dificuldade: 'DIFICIL', resposta: answer,
    enunciado: `No cenário de modelagem A${i + 1}, considere a igualdade ${base}^(x − ${exponent}) = ${base}^${target}. Sem usar aproximações decimais, qual é o valor de x e qual propriedade permite encontrá-lo?`,
    alternativas: alternatives(`x = ${correct + exponent}; igualdade de potências de mesma base`, answer, [`x = ${correct}; soma dos expoentes`, `x = ${target + exponent}; produto dos expoentes`, `x = ${target - exponent}; mudança de base`]),
    explicacao: `Como as potências possuem a mesma base positiva e diferente de 1, seus expoentes devem ser iguais: x − ${exponent} = ${target}. Portanto x = ${target + exponent}.`
  })
}

for (let i = 0; i < 16; i += 1) {
  const total = 10 + (i % 5) * 2
  const chosen = 3 + (i % 4)
  const correct = (total * (total - 1)) / (chosen * (chosen - 1))
  const answer = (i + 1) % 4
  questions.push({
    disciplina: 'Matemática', competencia: 'Análise combinatória e probabilidade condicional', dificuldade: 'DIFICIL', resposta: answer,
    enunciado: `Em um grupo de ${total} estudantes, ${chosen} participam de uma olimpíada. Duas pessoas são escolhidas sem reposição. Sabendo que a primeira participa da olimpíada, qual é a probabilidade de a segunda também participar?`,
    alternativas: alternatives(`${chosen - 1}/${total - 1}`, answer, [`${chosen}/${total}`, `${chosen - 1}/${total}`, `${chosen}/${total - 1}`]),
    explicacao: `A condição informa que uma participante já foi retirada. Restam ${chosen - 1} participantes entre ${total - 1} estudantes; por isso a probabilidade condicional é ${chosen - 1}/${total - 1}.`
  })
}

for (let i = 0; i < 16; i += 1) {
  const mass = 2 + (i % 4)
  const height = 5 + i
  const speed = Math.sqrt(2 * 10 * height)
  const answer = (i + 2) % 4
  questions.push({
    disciplina: 'Física', competencia: 'Conservação de energia mecânica', dificuldade: 'DIFICIL', resposta: answer,
    enunciado: `Um carrinho de ${mass} kg parte do repouso de uma altura de ${height} m em uma pista sem atrito. Adote g = 10 m/s². Qual conclusão relaciona corretamente a massa, a energia e a velocidade imediatamente antes da base?`,
    alternativas: alternatives(`A massa cancela no cálculo e a velocidade é ${speed.toFixed(1)} m/s`, answer, [`A velocidade é ${height * 10} m/s porque toda energia vira força`, `A massa maior faz a velocidade dobrar`, `A velocidade depende apenas de ${mass} kg`]),
    explicacao: `Pela conservação de energia, mgh = mv²/2. A massa aparece nos dois lados e se cancela; v = √(2gh) = √${2 * 10 * height} ≈ ${speed.toFixed(1)} m/s.`
  })
}

for (let i = 0; i < 16; i += 1) {
  const speedA = 12 + i
  const speedB = 5 + (i % 5)
  const correct = speedA - speedB
  const answer = (i + 3) % 4
  questions.push({
    disciplina: 'Física', competencia: 'Movimento relativo e referenciais', dificuldade: 'DIFICIL', resposta: answer,
    enunciado: `Dois veículos seguem na mesma direção em uma via retilínea. O veículo A mantém ${speedA} m/s e o veículo B, à frente, mantém ${speedB} m/s. Para um passageiro de A, qual é a velocidade de B e como interpretar o sinal?`,
    alternativas: alternatives(`${speedB - speedA} m/s; B parece aproximar-se no sentido contrário`, answer, [`${correct} m/s; B parece afastar-se no mesmo sentido`, `${speedA + speedB} m/s; velocidades sempre se somam`, `0 m/s; referenciais não alteram velocidades`]),
    explicacao: `A velocidade relativa de B em relação a A é vB − vA = ${speedB} − ${speedA} = ${speedB - speedA} m/s. O sinal negativo indica que, no referencial de A, B se aproxima.`
  })
}

for (let i = 0; i < 16; i += 1) {
  const mol = 2 + (i % 4)
  const volume = mol * 22.4
  const answer = i % 4
  questions.push({
    disciplina: 'Química', competencia: 'Estequiometria e gases ideais', dificuldade: 'DIFICIL', resposta: answer,
    enunciado: `No lote químico C${i + 1}, a decomposição completa de ${mol} mol de um composto gasoso forma a mesma quantidade de mol de CO₂. Em CNTP, qual volume de CO₂ é previsto e qual relação é indispensável para o cálculo?`,
    alternativas: alternatives(`${volume.toFixed(1)} L; 1 mol de gás ocupa 22,4 L em CNTP`, answer, [`${mol} L; mol e volume são equivalentes`, `${(volume / 2).toFixed(1)} L; gases ocupam metade do volume`, `${(volume * 2).toFixed(1)} L; todo produto dobra o volume`]),
    explicacao: `A proporção estequiométrica informa ${mol} mol de CO₂. Em CNTP, V = n × 22,4 L/mol = ${mol} × 22,4 = ${volume.toFixed(1)} L.`
  })
}

for (let i = 0; i < 16; i += 1) {
  const ph = 2 + (i % 5)
  const concentration = `10⁻${ph}`
  const answer = (i + 1) % 4
  questions.push({
    disciplina: 'Química', competencia: 'Equilíbrio ácido-base e escala de pH', dificuldade: 'DIFICIL', resposta: answer,
    enunciado: `Na amostra ácido-base Q${i + 1}, uma solução aquosa tem pH = ${ph}. Ao compará-la com outra de pH = ${ph + 2}, qual afirmação está correta sobre a concentração de íons H⁺?`,
    alternativas: alternatives(`A primeira possui 100 vezes mais H⁺ (${concentration} mol/L)`, answer, ['A primeira possui 2 vezes mais H⁺', 'As duas possuem a mesma concentração de H⁺', 'A segunda possui 100 vezes mais H⁺']),
    explicacao: `pH = −log[H⁺]. Uma diferença de duas unidades na escala representa fator 10² = 100. A solução de pH ${ph} tem [H⁺] = ${concentration} mol/L e é 100 vezes mais ácida.`
  })
}

module.exports = questions

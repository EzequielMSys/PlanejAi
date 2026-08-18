const assert = require('node:assert/strict');
const { analisarRedacao } = require('../utils/analiseRedacao');
const { sugerirTemaPorPalavraChave } = require('../utils/repertorioRedacao');
const { montarKitTema } = require('../utils/estudioRedacao');

const textoCompleto = `A desigualdade educacional limita a cidadania brasileira. Defende-se que a omissão estatal e a exclusão digital agravam o problema.
Segundo Paulo Freire, a educação deve formar sujeitos críticos. Isso ocorre porque escolas sem infraestrutura reduzem oportunidades e ampliam diferenças sociais.
Além disso, o acesso desigual à internet prejudica estudantes vulneráveis, uma vez que impede pesquisa e participação em atividades.
Portanto, o Ministério da Educação deve ampliar a infraestrutura por meio de investimento federal, a fim de garantir acesso, especialmente em escolas periféricas.`;

const analise = analisarRedacao(textoCompleto, [], {
  tema: 'Os desafios da educação brasileira no século XXI'
});

assert.equal(analise.enem.competencias.length, 5, 'deve avaliar cinco competências');
assert.ok(analise.enem.notaFinal >= 200 && analise.enem.notaFinal <= 1000, 'nota deve respeitar a escala ENEM');
assert.ok(analise.enem.competencias.every((c) => c.nota % 40 === 0), 'notas devem usar faixas de 40 pontos');
assert.equal(analise.enem.intervencao.total, 5, 'deve reconhecer os cinco elementos da intervenção');
assert.ok(analise.enem.aderencia.encontradas.includes('educação'), 'deve reconhecer aderência temática');
assert.equal(analise.ia.flag_ia, 0, 'sinais de estilo não podem virar acusação automática');
assert.equal(analise.ia.confiancaLimitada, true, 'deve explicitar a incerteza');
assert.ok(analise.planoRevisao.length <= 3, 'plano deve ser priorizado e curto');

const curta = analisarRedacao('Este é apenas um começo de texto.', [], { tema: 'Educação' });
assert.equal(curta.ia.nivel, 'insuficiente', 'texto curto não permite análise de estilo');

const temaTecnologia = sugerirTemaPorPalavraChave('impacto da internet e da inteligência artificial');
assert.equal(temaTecnologia.id, 'tecnologia', 'busca semântica deve associar internet e IA a tecnologia');

const kit = montarKitTema(temaTecnologia);
assert.ok(kit.textosMotivadores.length >= 3, 'kit deve incluir coletânea motivadora');
assert.ok(kit.rotasDeTese.length >= 3, 'kit deve incluir rotas de tese');
assert.ok(kit.recomendacoes.some((r) => r.tipo === 'Podcast'), 'kit deve recomendar podcasts');
assert.ok(kit.checklist.length >= 5, 'kit deve incluir checklist de escrita');
assert.ok(kit.armadilhas.length >= 4, 'kit deve alertar sobre erros comuns');

console.log('Testes do Estúdio de Redação: OK');

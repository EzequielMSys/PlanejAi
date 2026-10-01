import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { oklchToHex, oklchToRgb, rgbToOklch, hexToRgb, contraste } from '../frontend/src/theme/color.js'
import { PALETTES, PALETA_PADRAO, tokensDaPaleta } from '../frontend/src/theme/palettes.js'

const MODOS = ['claro', 'escuro']

// Pares que realmente importam para leitura de texto na interface.
//  - 4.5:1 é o mínimo AA para texto normal.
//  - 3:1 é o mínimo AA para texto grande (>= 24px) e para elementos de UI
//    que precisam ser identificáveis (bordas de campo, botões).
//  - 1.3:1 é aceitável apenas para separadores decorativos, que não são
//    informação: exigir mais deles só tornaria o visual pesado sem ganho.
const PARES_CRITICOS = [
  ['texto', 'fundo', 4.5],
  ['texto', 'superficie', 4.5],
  ['texto', 'superficieAlt', 4.5],
  ['textoSuave', 'fundo', 4.5],
  ['textoSuave', 'superficie', 4.5],
  ['onPrimaria', 'primaria', 4.5],
  ['primaria', 'fundo', 3],
  ['primaria', 'superficie', 3],
  // Bordas de campo precisam ser distinguíveis do fundo (WCAG 1.4.11).
  ['bordaForte', 'fundo', 3],
  ['primariaBorda', 'fundo', 1.3],
  ['borda', 'superficie', 1.3],
]

describe('conversão de cor', () => {
  test('oklchToHex e hexToRgb fazem ida e volta preservando o tom', () => {
    const hex = oklchToHex(0.55, 0.15, 288)
    const { l, c, h } = rgbToOklch(hexToRgb(hex))
    // Tolerância de ~0.02 em L pela ida e volta sRGB -> OKLCH -> sRGB.
    assert.ok(Math.abs(l - 0.55) < 0.02, `L esperado 0.55, obtido ${l}`)
    assert.ok(Math.abs(c - 0.15) < 0.02, `C esperado 0.15, obtido ${c}`)
    assert.ok(Math.abs(h - 288) < 2, `H esperado 288, obtido ${h}`)
  })

  test('mesmo L produz brilho percebido igual em matizes diferentes', () => {
    // É a razão de usar OKLCH: 0.6 deve ter a mesma luminância percebida
    // regardless da matiz, ao contrário do que acontece em HSL.
    const roxo = oklchToRgb(0.6, 0.15, 288)
    const verde = oklchToRgb(0.6, 0.15, 145)
    const diferenca = Math.abs(
      0.2126 * roxo[0] + 0.7152 * roxo[1] + 0.0722 * roxo[2]
      - (0.2126 * verde[0] + 0.7152 * verde[1] + 0.0722 * verde[2]),
    )
    assert.ok(diferenca < 25, `diferença de brilho ${diferenca} alta demais`)
  })

  test('contraste calculado bate com os pares conhecidos do WCAG', () => {
    assert.equal(contraste([255, 255, 255], [0, 0, 0]).toFixed(2), '21.00')
    assert.equal(contraste([255, 255, 255], [255, 255, 255]).toFixed(2), '1.00')
  })
})

describe('paletas do PlanejAI', () => {
  test('existe a paleta padrão roxa', () => {
    assert.equal(PALETA_PADRAO, 'amethyst')
    assert.ok(PALETTES[PALETA_PADRAO], 'paleta padrão não existe')
  })

  for (const id of Object.keys(PALETTES)) {
    for (const modo of MODOS) {
      test(`${id} no modo ${modo} mantém contraste acessível`, () => {
        const tokens = tokensDaPaleta(id)[modo]
        for (const [fg, bg, minimo] of PARES_CRITICOS) {
          const razao = contraste(hexToRgb(tokens[fg]), hexToRgb(tokens[bg]))
          assert.ok(
            razao >= minimo,
            `${id}/${modo}: ${fg} sobre ${bg} = ${razao.toFixed(2)}:1, mínimo ${minimo}:1`,
          )
        }
      })
    }
  }

  test('toda paleta devolve exatamente os mesmos papéis de cor', () => {
    const referencia = Object.keys(tokensDaPaleta(PALETA_PADRAO).claro).sort()
    for (const id of Object.keys(PALETTES)) {
      for (const modo of MODOS) {
        assert.deepEqual(Object.keys(tokensDaPaleta(id)[modo]).sort(), referencia)
      }
    }
  })

  test('paleta desconhecida cai no padrão roxo em vez de quebrar', () => {
    assert.deepEqual(tokensDaPaleta('nao-existe'), tokensDaPaleta(PALETA_PADRAO))
  })

  test('cores são hex válidos de 6 dígitos', () => {
    for (const id of Object.keys(PALETTES)) {
      const tokens = tokensDaPaleta(id);
      for (const modo of MODOS) {
        for (const [nome, hex] of Object.entries(tokens[modo])) {
          assert.match(hex, /^#[0-9a-f]{6}$/, `${id}/${modo}/${nome} = ${hex}`)
        }
      }
    }
  })
})

describe('cor personalizada escolhida pelo usuário', () => {
  const escolhida = { id: 'custom', nome: 'Sua cor', hue: 25, chroma: 0.14 }

  test('uma paleta em objeto realmente altera os tokens', () => {
    // Regressão: `tokensDaPaleta` recebia um objeto e o tratava como chave de
    // PALETTES, retornando o roxo padrão e ignorando a cor escolhida.
    const custom = tokensDaPaleta(escolhida)
    const padrao = tokensDaPaleta(PALETA_PADRAO)
    assert.notEqual(custom.claro.primaria, padrao.claro.primaria)
    assert.notEqual(custom.escuro.primaria, padrao.escuro.primaria)
  })

  test('a cor personalizada também respeita o contraste', () => {
    for (const modo of MODOS) {
      const t = tokensDaPaleta(escolhida)[modo]
      for (const [fg, bg, minimo] of PARES_CRITICOS) {
        const razao = contraste(hexToRgb(t[fg]), hexToRgb(t[bg]))
        assert.ok(razao >= minimo, `custom/${modo}: ${fg} sobre ${bg} = ${razao.toFixed(2)}:1`)
      }
    }
  })

  test('matizes extremos continuam legíveis', () => {
    // O seletor de cor deixa o usuário escolher qualquer tom; a garantia de
    // contraste não pode depender de a escolha "ser razoável".
    for (const hue of [0, 60, 120, 180, 240, 300, 360]) {
      for (const modo of MODOS) {
        const t = tokensDaPaleta({ ...escolhida, hue })[modo]
        const razao = contraste(hexToRgb(t.onPrimaria), hexToRgb(t.primaria))
        assert.ok(razao >= 4.5, `hue ${hue}/${modo}: ${razao.toFixed(2)}:1`)
      }
    }
  })
})

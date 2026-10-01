const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const RAIZ = path.join(__dirname, '..')
const css = fs.readFileSync(path.join(RAIZ, 'frontend', 'src', 'index.css'), 'utf8')

// Comentários saem antes da contagem: uma chave dentro de um comentário
// desalinha a contagem e esconde o erro real.
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '')

const AT_CONTAINER = /^@(layer|media|supports|container|keyframes)\b/

const { hexToRgb, contraste } = require('../frontend/src/theme/color.js')

// Isola o bloco `.dark` que declara tokens de cor. Existem vários `.dark`
// menores no arquivo (como o do color-scheme), então procuramos o que realmente
// traz os papéis da paleta.
const extractDark = (() => {
  const pedacos = [...semComentarios(css).matchAll(/\.dark\s*\{([^}]*)\}/g)]
    .map((m) => m[1])
  return pedacos.find((b) => b.includes('--pn-fundo')) || ''
})()

function extract(token, bloco = extractDark) {
  const achado = bloco.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,6})`))
  return achado ? achado[1] : null
}

/**
 * Analisa o CSS linha a linha rastreando dois níveis:
 *  - `profundidade`: quantas chaves estão abertas no total.
 *  - `contexto`: quantos at-rules (@layer, @media...) estão abertos.
 *
 * Só é aninhamento indevido uma regra de classe aberta enquanto `contexto`
 * vale zero e `profundidade` é maior que 1. Dentro de @layer/@media isso é
 * normal, então não deve ser apontado.
 */
function analisar(texto) {
  let profundidade = 0
  let contexto = 0
  let minima = 0
  const orfaEm = []
  const aninhadas = []

  semComentarios(texto).split('\n').forEach((linha, indice) => {
    const trim = linha.trim()
    const eAtRule = AT_CONTAINER.test(trim)

    for (const caractere of linha) {
      if (caractere === '{') profundidade += 1
      if (caractere === '}') {
        profundidade -= 1
        if (profundidade < minima) minima = profundidade
      }
    }
    if (eAtRule) {
      contexto += (linha.match(/\{/g) || []).length - (linha.match(/\}/g) || []).length
    }

    if (profundidade < 0 && orfaEm.length === 0) orfaEm.push(indice + 1)

    const abreSeletor =
      /\{/.test(linha) && !/^@/.test(trim) && !/^\s/.test(linha) && !trim.startsWith('--')
    if (abreSeletor && contexto <= 0 && profundidade > 1 && aninhadas.length < 8) {
      aninhadas.push({ linha: indice + 1, texto: trim })
    }
  })

  return { fecha: profundidade === 0, profundidade, minima, orfaEm, aninhadas }
}

test('todo bloco CSS é fechado', () => {
  // Regressão real: .pn-previa-semana span ficou sem "}", então o navegador
  // tratou as regras seguintes como declarações e descartou todas. O build
  // continuava passando, por isso só a contagem de chaves pega esse erro.
  const { fecha, profundidade } = analisar(css)
  assert.equal(fecha, true, `saldo de chaves = ${profundidade}`)
})

test('nenhuma chave de fechamento órfã', () => {
  const { minima, orfaEm } = analisar(css)
  assert.equal(minima, 0, `"}" sobrando, primeira na linha ${orfaEm[0]}`)
})

test('nenhuma regra aninhada fora de @layer/@media', () => {
  const { aninhadas } = analisar(css)
  assert.equal(
    aninhadas.length,
    0,
    `aninhamento indevido nas linhas: ${aninhadas.map((a) => a.linha).join(', ')}`,
  )
})

test('nenhuma regra é declarada em duplicado', () => {
  // Regressão: um bloco inserido duas vezes deixou um fragmento órfã no fim
  // do arquivo, com "}" a mais. @layer/@media podem se repetir de propósito.
  const seletores = [...semComentarios(css).matchAll(/^([.#a-zA-Z][^{@\n]*?)\{/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean)
  const contagem = new Map()
  for (const seletor of seletores) contagem.set(seletor, (contagem.get(seletor) || 0) + 1)
  const repetidos = [...contagem].filter(([, n]) => n > 1).map(([s]) => s)
  assert.equal(repetidos.length, 0, `repetidos: ${repetidos.join(', ')}`)
})

test('toda classe pn- usada na Landing existe no CSS', () => {
  // Se uma classe falta no CSS, a seção renderiza como texto puro empilhado.
  const landing = fs.readFileSync(path.join(RAIZ, 'frontend', 'src', 'pages', 'Landing.jsx'), 'utf8')
  const usadas = [...landing.matchAll(/className="([^"]+)"/g)]
    .flatMap((m) => m[1].split(/\s+/))
    .filter((c) => c.startsWith('pn-'))

  assert.ok(usadas.length > 15, `só encontrei ${usadas.length} classes`)
  for (const classe of usadas) {
    assert.ok(css.includes(`.${classe}`), `.${classe} é usada na Landing mas não existe no CSS`)
  }
})

test('o design system tem os componentes essenciais', () => {
  for (const classe of [
    'pn-papel', 'pn-folha', 'pn-folha-interativa', 'pn-btn-primario',
    'pn-btn-fantasma', 'pn-campo', 'pn-pagina', 'pn-hero', 'pn-hero-texto',
    'pn-hero-previa', 'pn-mapa', 'pn-mapa-trilha', 'pn-mapa-rodape',
    'pn-territorios', 'pn-territorio', 'pn-jornada', 'pn-jornada-passo',
    'pn-rodape', 'pn-saltar', 'pn-secao-bloco', 'pn-fecho', 'pn-progresso',
  ]) {
    assert.ok(css.includes(`.${classe}`), `falta .${classe}`)
  }
})

test('o modo escuro define as próprias folhas', () => {
  // Sem estas regras o cartão fica claro sobre fundo escuro e o título some.
  assert.ok(css.includes('.dark .pn-folha'), 'falta .dark .pn-folha')
  assert.ok(css.includes('color-scheme: dark'), 'falta color-scheme: dark')
})

test('o modo escuro define as mesmas cores que o claro', () => {
  // Regressão: o .dark aplicava a classe mas não trazia os tokens de cor, que
  // vinham só do JS. Resultado: cartão branco e título invisível no escuro.
  // Cada papel de cor precisa existir nos dois modos, definido no CSS.
  const bloco = extractDark
  for (const papel of [
    'pn-fundo', 'pn-fundo-alt', 'pn-superficie', 'pn-superficie-alt',
    'pn-borda', 'pn-borda-forte', 'pn-texto', 'pn-texto-suave',
    'pn-primaria', 'pn-primaria-hover', 'pn-primaria-suave',
    'pn-primaria-borda', 'pn-on-primaria',
  ]) {
    assert.ok(bloco.includes(`--${papel}:`), `falta --${papel} no .dark do CSS`)
  }
})

test('o modo escuro não deixa texto claro sobre fundo escuro', () => {
  // Sanidade: o texto do escuro tem de ser mais claro que o fundo, e a
  // primária sobre a superfície também precisa de contraste.
  const paper = hexToRgb(extract('--pn-superficie', extractDark))
  const texto = hexToRgb(extract('--pn-texto', extractDark))
  assert.ok(
    contraste(texto, paper) >= 4.5,
    `texto sobre superfície = ${contraste(texto, paper).toFixed(2)}:1`,
  )
})

test('a folha é arredondada o bastante para não parecer uma caixa', () => {
  const folha = css.slice(css.indexOf('.pn-folha {'))
  const raio = folha.match(/border-radius:\s*([\d.]+)rem/)?.[1]
  assert.ok(raio, 'não achei border-radius em .pn-folha')
  assert.ok(Number(raio) >= 1.2, `raio ${raio}rem é pequeno demais, vira "quadrado"`)
})

const ARQ_CSS = [
  ['index', path.join(RAIZ, 'frontend', 'src', 'index.css')],
  ['unified', path.join(RAIZ, 'frontend', 'src', 'UnifiedDesign.css')],
  ['solid', path.join(RAIZ, 'frontend', 'src', 'SolidIdentity.css')],
]

// Papéis que são medidas, não cor: ficam de fora da checagem.
const NAO_E_COR = /--(?:ui|pl)-(?:sidebar|topbar|radius):/

test('as camadas legadas de CSS espelham os tokens --pn-*', () => {
  // Regressão: existiam três sistemas de cor independentes (--pn-*, --ui-*, --pl-*).
  // O --ui-* e o --pl-* tinham cores fixas, então o modo escuro divergia entre a
  // Landing e as telas internas. Cada papel de cor legado precisa derivar de um
  // token --pn-*, nunca de um hex fixo.
  const CORES = new Set(['success', 'warning', 'danger'])
  for (const [nome, arquivo] of ARQ_CSS) {
    const texto = semComentarios(fs.readFileSync(arquivo, 'utf8'))
    for (const achado of texto.matchAll(/(--(?:ui|pl)-[a-z0-9-]+):\s*([^;]+);/g)) {
      const [, token, valor] = achado
      if (NAO_E_COR.test(token + ':')) continue
      // Estados semânticos (sucesso, aviso, erro) ficam fora: eles não têm um
      // papel equivalente no design system e existem para comunicar estado.
      if (CORES.has(token.replace(/^--(?:ui|pl)-/, ''))) continue
      assert.ok(
        valor.trim().startsWith('var(--pn-'),
        `${nome}: ${token} usa "${valor.trim()}" em vez de um token --pn-*`,
      )
    }
  }
})

test('todo arquivo com tokens de cor também define o modo escuro', () => {
  for (const [nome, arquivo] of ARQ_CSS) {
    const texto = semComentarios(fs.readFileSync(arquivo, 'utf8'))
    if (!/--(?:ui|pl|pn)-[a-z0-9-]+:/.test(texto)) continue
    assert.match(texto, /\.dark\s*\{/, `${nome} define tokens mas não tem bloco .dark`)
  }
})

test('o movimento pode ser desligado pelo sistema e pelo usuário', () => {
  assert.ok(css.includes('prefers-reduced-motion'), 'falta respeitar o sistema')
  assert.ok(css.includes('a11y-reduced-motion'), 'falta o controle interno')
})

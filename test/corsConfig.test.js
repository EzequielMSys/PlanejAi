const test = require('node:test')
const assert = require('node:assert/strict')
const { isOriginAllowed, isHostPrivado, parsearOrigensPermitidas } = require('../src/config/corsConfig')

const ambiente = (CORS_ORIGIN) => parsearOrigensPermitidas(CORS_ORIGIN).permitidas

test('libera origem vazia, usada por curl e apps nativos', () => {
  assert.equal(isOriginAllowed(undefined, {}), true)
  assert.equal(isOriginAllowed('', {}), true)
})

test('libera a origem exata configurada', () => {
  const permitidas = ambiente('http://localhost:5173,https://ezequielmsys.github.io')
  assert.equal(isOriginAllowed('http://localhost:5173', { permitidas }), true)
  assert.equal(isOriginAllowed('https://ezequielmsys.github.io', { permitidas }), true)
})

test('bloqueia origem não configurada', () => {
  const permitidas = ambiente('http://localhost:5173')
  assert.equal(isOriginAllowed('https://malicioso.example.com', { permitidas }), false)
})

test('ignora differences de caixa, barra final e porta padrão', () => {
  const permitidas = ambiente('http://localhost:5173,https://plataforma.app')
  assert.equal(isOriginAllowed('http://LOCALHOST:5173', { permitidas }), true)
  assert.equal(isOriginAllowed('http://localhost:5173/', { permitidas }), true)
  assert.equal(isOriginAllowed('https://plataforma.app:443', { permitidas }), true)
})

test('rede privada liberada aceita o IP da LAN em qualquer porta', () => {
  const opcoes = { permitidas: [], permitirRedePrivada: true }
  assert.equal(isOriginAllowed('http://192.168.2.107:5173', opcoes), true)
  assert.equal(isOriginAllowed('http://10.0.0.5:3000', opcoes), true)
  assert.equal(isOriginAllowed('http://172.16.4.9:5173', opcoes), true)
  assert.equal(isOriginAllowed('http://127.0.0.1:3000', opcoes), true)
})

test('rede privada não confunde domínio com faixa de IP', () => {
  // O bug que motivou CORS_ALLOW_PRIVATE_NETWORK: um curinga em 192.168.*.*
  // também casaria estes domínios, permitindo que qualquer site usasse a API.
  const opcoes = { permitidas: [], permitirRedePrivada: true }
  assert.equal(isOriginAllowed('http://192.168.evil.com:5173', opcoes), false)
  assert.equal(isOriginAllowed('http://10.evil.example:5173', opcoes), false)
  assert.equal(isOriginAllowed('http://192.168.2.107.evil.com:5173', opcoes), false)
  assert.equal(isOriginAllowed('http://192.168.999.1:5173', opcoes), false)
})

test('rede privada não vale para IP público nem para https', () => {
  const opcoes = { permitidas: [], permitirRedePrivada: true }
  assert.equal(isOriginAllowed('http://8.8.8.8:5173', opcoes), false)
  assert.equal(isOriginAllowed('https://192.168.2.107:5173', opcoes), false)
  assert.equal(isOriginAllowed('https://malicioso.example.com', opcoes), false)
})

test('rede privada desligada por padrão', () => {
  assert.equal(isOriginAllowed('http://192.168.2.107:5173', { permitidas: [] }), false)
})

test('reconhece faixas privadas e ignora as públicas', () => {
  assert.equal(isHostPrivado('192.168.2.107'), true)
  assert.equal(isHostPrivado('10.111.9.31'), true)
  assert.equal(isHostPrivado('172.31.255.254'), true)
  assert.equal(isHostPrivado('169.254.79.226'), true)
  assert.equal(isHostPrivado('::1'), true)
  assert.equal(isHostPrivado('172.32.0.1'), false)
  assert.equal(isHostPrivado('26.101.104.214'), false)
  assert.equal(isHostPrivado('192.169.2.107'), false)
  assert.equal(isHostPrivado('192.168.evil.com'), false)
})

test('coringa em CORS_ORIGIN respeita esquema e porta', () => {
  const permitidas = ambiente('http://192.168.*.*:5173')
  assert.equal(isOriginAllowed('https://192.168.2.107:5173', { permitidas }), false)
  assert.equal(isOriginAllowed('http://192.168.2.107:3000', { permitidas }), false)
})

test('regra sem porta aceita qualquer porta', () => {
  const permitidas = ambiente('http://192.168.*.*')
  assert.equal(isOriginAllowed('http://192.168.2.107:3000', { permitidas }), true)
  assert.equal(isOriginAllowed('http://192.168.2.107:5173', { permitidas }), true)
})

test('libera a própria API para o Swagger', () => {
  const permitidas = ambiente('http://localhost:5173')
  assert.equal(
    isOriginAllowed('http://192.168.2.107:3000', { permitidas, hostDaRequisicao: '192.168.2.107:3000' }),
    true,
  )
  assert.equal(
    isOriginAllowed('http://192.168.2.107:3000', { permitidas, hostDaRequisicao: 'outra.maquina:3000' }),
    false,
  )
})

test('bloqueia origem "null" de iframe e file://', () => {
  const permitidas = ambiente('*')
  assert.equal(isOriginAllowed('null', { permitidas }), false)
  assert.equal(isOriginAllowed('file://', { permitidas }), false)
})

test('rejeita entrada malformada em vez de liberar', () => {
  const permitidas = ambiente('http://localhost:5173')
  assert.equal(isOriginAllowed('javascript:alert(1)', { permitidas }), false)
  assert.equal(isOriginAllowed('http://user:senha@localhost:5173', { permitidas }), false)
  assert.equal(isOriginAllowed('http://localhost:5173/caminho', { permitidas }), false)
})

test('reporta origens inválidas para o servidor avisar na inicialização', () => {
  const { invalidas } = parsearOrigensPermitidas('http://localhost:5173, nao-e-uma-url , http://a b:5173')
  assert.deepEqual(invalidas, ['nao-e-uma-url', 'http://a b:5173'])
})

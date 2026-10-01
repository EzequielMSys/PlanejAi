const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { validarSenhaForte, REQUISITOS_SENHA, SENHA_MINIMA } = require('../src/utils/authUtils')
const { SENHA_MINIMA: FRONT, validarSenha, REQUISITOS_SENHA: REQ_FRONT } = require('../frontend/src/config/senha.js')

test('frontend e backend usam o mesmo mínimo de senha', () => {
  // Regressão: o Register exigia 12 caracteres e o backend 8 (em mensagens
  // conflitantes). O usuário preenchia uma senha válida pela tela e recebia
  // "senha inválida" do servidor, sem entender o motivo.
  assert.equal(FRONT, SENHA_MINIMA, `frontend pede ${FRONT} e backend ${SENHA_MINIMA}`)
  assert.equal(SENHA_MINIMA, 8, 'o mínimo esperado é 8')
})

test('as mensagens de requisito são idênticas', () => {
  assert.equal(REQ_FRONT, REQUISITOS_SENHA)
})

test('a validação do frontend espelha a do backend', () => {
  const casos = [
    'Ab1cdef',        // exatamente 8, aceita
    'Abcdefg',        // 7, recusada
    'abcdefgh',       // sem maiúscula
    'ABCDEFGH',       // sem minúscula
    'Abcdefgh',       // sem número
    'Ab1cdefg',       // 9
    '',
    'Ab1',
  ]
  for (const senha of casos) {
    const back = validarSenhaForte(senha)
    const front = validarSenha(senha) === null
    assert.equal(front, back, `divergência em "${senha}": front=${front} back=${back}`)
  }
})

test('senha de 8 caracteres com os três tipos é aceita', () => {
  assert.equal(validarSenhaForte('Abcdefg1'), true)
  assert.equal(validarSenha('Abcdefg1'), null)
  // 7 caracteres continua inválida, mesmo com maiúscula e número.
  assert.equal(validarSenhaForte('Abcdef1'), false)
})

test('o Register não embute mais um número próprio', () => {
  // Se alguém reintroduzir um literal no Register, a regra volta a divergir.
  const fonte = fs.readFileSync(
    path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Register.jsx'),
    'utf8',
  )
  assert.ok(!/length < 12/.test(fonte), 'Register ainda valida 12 caracteres')
  assert.ok(!/Mín\. 12/.test(fonte), 'Register ainda mostra "Mín. 12"')
  assert.match(fonte, /REQUISITOS_SENHA/, 'Register deve usar a constante compartilhada')
})

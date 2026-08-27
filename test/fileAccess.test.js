const test = require('node:test')
const assert = require('node:assert/strict')
const { createFileToken, verifyFileToken, resolveUploadPath } = require('../src/services/fileAccessService')

test('assina e valida arquivo protegido com expiração', () => {
  const token = createFileToken('/uploads/materiais/aula.pdf', 60)
  assert.match(verifyFileToken(token).absolute, /materiais[\\/]aula\.pdf$/)
})

test('bloqueia travessia de diretório e foto pública', () => {
  assert.throws(() => resolveUploadPath('/uploads/../.env'), /Caminho/)
  assert.throws(() => createFileToken('/uploads/perfis/foto.png'), /inválido/)
})

test('rejeita token adulterado', () => {
  const token = createFileToken('/uploads/atividades/lista.pdf', 60)
  assert.throws(() => verifyFileToken(`${token}x`), /inválido/)
})

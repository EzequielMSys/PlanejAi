const test = require('node:test');
const assert = require('node:assert/strict');
const { seal, open, assertRestoreTarget } = require('../src/scripts/portableBackup');
const { validateRequest } = require('../src/services/supportService');
const secret = 'a1'.repeat(32);
test('backup criptografado exige chave correta e detecta adulteração', () => {
  const data = { tables: [{ name: 'usuarios', rows: [{ email: 'privado@example.test' }] }] };
  const encrypted = seal(data, secret);
  assert.equal(encrypted.includes(Buffer.from('privado@example.test')), false);
  assert.deepEqual(open(encrypted, secret), data);
  assert.throws(() => open(encrypted, 'b2'.repeat(32)));
  encrypted[encrypted.length - 1] ^= 1;
  assert.throws(() => open(encrypted, secret));
  assert.throws(() => seal(data, 'curta'));
});
test('restauração recusa nomes de bancos normais', () => {
  for (const database of ['tcc', 'planejai_tcc_online', '', 'planejai_restore_']) assert.throws(() => assertRestoreTarget({ database }));
  assert.doesNotThrow(() => assertRestoreTarget({ database: 'planejai_restore_teste_2026' }));
});
test('pedido de exclusão exige confirmação explícita e mensagem válida', () => {
  assert.throws(() => validateRequest({ categoria: 'EXCLUSAO', mensagem: 'Quero excluir minha conta.' }));
  assert.equal(validateRequest({ categoria: 'EXCLUSAO', mensagem: 'Quero excluir minha conta.', confirmacao: 'SOLICITAR EXCLUSAO' }).category, 'EXCLUSAO');
  for (const body of [{}, { categoria: 'ADMIN', mensagem: 'uma mensagem válida' }, { categoria: 'DUVIDA', mensagem: 'a'.repeat(2001) }]) assert.throws(() => validateRequest(body));
});

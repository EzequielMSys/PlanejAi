const test = require('node:test');
const assert = require('node:assert/strict');
const { identity, temporaryTableName, previousTableName } = require('../src/scripts/backupDatabase');

test('identifica origem e destino equivalentes sem expor credenciais', () => {
  const options = { host: 'LOCALHOST', port: 3306, database: 'tcc', user: 'root', password: 'segredo' };
  assert.equal(identity(options), 'localhost:3306/tcc');
  assert.equal(identity(options).includes('segredo'), false);
});

test('gera nomes separados para cópia e recuperação do backup', () => {
  assert.equal(temporaryTableName('usuarios'), '__planejai_next_usuarios');
  assert.equal(previousTableName('usuarios'), '__planejai_previous_usuarios');
});

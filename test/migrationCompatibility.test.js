const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { tipoCompatibilidade } = require('../src/scripts/migrationCompatibility')

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex')

test('aceita o mesmo SQL com quebras de linha Windows sem alterar o histórico', () => {
  const texto = 'SELECT 1;\nSELECT 2;\n'
  assert.equal(tipoCompatibilidade('teste.sql', texto, sha(texto.replace(/\n/g, '\r\n'))), 'quebra-de-linha')
  assert.equal(tipoCompatibilidade('teste.sql', 'SELECT 3;', sha(texto)), null)
})

test('exceção de avisos é restrita ao arquivo e aos hashes conhecidos', () => {
  const conteudo = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'add_avisos.sql'), 'utf8')
  const antigo = '08a609e011aca4de89367065ca6a9f8d51a83d48074338255cda90a7d263d62a'
  assert.equal(tipoCompatibilidade('add_avisos.sql', conteudo, antigo), 'avisos-legado')
  assert.equal(tipoCompatibilidade('outro.sql', conteudo, antigo), null)
  assert.equal(tipoCompatibilidade('add_avisos.sql', conteudo + '\n', antigo), null)
})

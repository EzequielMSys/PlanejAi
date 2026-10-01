const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  garantirPastas,
  uploadsRoot,
  nomeSeguro,
  caminhoRelativo,
} = require('../src/services/uploadStorageService')

test('garantirPastas cria uploads e todas as categorias', () => {
  // Regressão: uploads/ está no .gitignore e não existe numa instalação nova.
  // O Multer falhava ao gravar e toda foto respondia 404 sem explicação.
  const criadas = garantirPastas()
  const raiz = uploadsRoot()
  assert.ok(fs.existsSync(raiz), 'a pasta uploads/ não foi criada')
  for (const categoria of ['perfis', 'atividades', 'materiais', 'respostas']) {
    assert.ok(fs.existsSync(path.join(raiz, categoria)), `faltou uploads/${categoria}`)
  }
  // Rodar de novo não deve falhar nem duplicar nada.
  assert.deepEqual(garantirPastas(), [], 'a segunda chamada deveria criar nada')
})

test('a pasta de perfis é exatamente a que a rota pública lê', () => {
  // A rota serve /uploads/perfis/* e o Multer grava em uploads/perfis. Se os
  // nomes divergirem, toda foto retorna 404 mesmo com o arquivo no disco.
  const middleware = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'middlewares', 'uploadMiddleware.js'),
    'utf8',
  )
  const server = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8')
  assert.match(middleware, /uploads["',]\s*,\s*"perfis"/, 'o Multer não grava em uploads/perfis')
  assert.match(server, /uploads\/perfis\/\*file/, 'a rota não serve /uploads/perfis/*')
  assert.ok(fs.existsSync(path.join(uploadsRoot(), 'perfis')))
})

test('o nome do arquivo de perfil começa com perfil-', () => {
  const nome = nomeSeguro({ originalname: 'minha foto.jpg' }, 'perfis', 24)
  assert.match(nome, /^perfil-/)
  assert.match(nome, /\.jpg$/)
  assert.ok(!nome.includes(' '), 'o nome não pode ter espaço')
})

test('o caminho relativo usa barra e a categoria correta', () => {
  assert.equal(caminhoRelativo('perfis', 'perfil-1.jpg'), 'perfis/perfil-1.jpg')
})

const test = require('node:test')
const assert = require('node:assert/strict')

test('login continua disponível antes da migração do banner e o upload prepara a coluna', async () => {
  const dbPath = require.resolve('../src/config/db')
  const modelPath = require.resolve('../src/models/usuarioModel')
  const originalDb = require.cache[dbPath]
  let hasBannerColumn = false
  let savedBanner = null
  const queries = []
  const pool = {
    async execute(sql) {
      queries.push(sql)
      if (!hasBannerColumn && sql.includes('banner_url')) {
        const error = new Error("Unknown column 'banner_url' in 'field list'")
        error.code = 'ER_BAD_FIELD_ERROR'
        throw error
      }
      if (sql.startsWith('UPDATE usuarios')) {
        savedBanner = '/uploads/perfis/banner.jpg'
        return [{ affectedRows: 1 }]
      }
      return [[{ id: 7, id_usuario: 7, email: 'aluno@example.invalid', banner_url: hasBannerColumn ? savedBanner : undefined }]]
    },
    async query(sql) {
      queries.push(sql)
      if (sql.startsWith('ALTER TABLE')) hasBannerColumn = true
      return [[]]
    }
  }

  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: pool }
  delete require.cache[modelPath]
  try {
    const model = require(modelPath)
    const user = await model.buscarPorEmail('aluno@example.invalid')
    assert.equal(user.id_usuario, 7)
    assert.equal(queries.filter(sql => sql.includes('FROM usuarios')).length, 2)
    assert.ok(!queries.at(-1).includes('banner_url'))
    assert.doesNotMatch(queries.at(-1), /,\s*,/)

    const updated = await model.atualizarUsuario(7, { banner_url: '/uploads/perfis/banner.jpg' })
    assert.equal(updated.banner_url, '/uploads/perfis/banner.jpg')
    assert.ok(queries.some(sql => sql.startsWith('ALTER TABLE usuarios ADD COLUMN banner_url')))
  } finally {
    delete require.cache[modelPath]
    if (originalDb) require.cache[dbPath] = originalDb
    else delete require.cache[dbPath]
  }
})

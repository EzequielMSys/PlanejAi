const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { Readable } = require('stream')

// Categorias que o servidor precisa ter em disco. A pasta `uploads/` está no
// .gitignore, então numa instalação nova ela simplesmente não existe: o Multer
// falha ao gravar e o leitor devolve 404 para toda foto, sem dizer o motivo.
// Garantir as pastas na inicialização evita a falha silenciosa e faz o erro
// aparecer cedo, no log, em vez de virar 404 semanas depois.
const CATEGORIAS = ['perfis', 'atividades', 'materiais', 'respostas']

function uploadsRoot() {
  return path.resolve(__dirname, '..', '..', 'uploads')
}

function garantirPastas() {
  if (usarBlobPrivado()) return []
  const raiz = uploadsRoot()
  const criadas = []
  for (const categoria of ['', ...CATEGORIAS]) {
    const destino = categoria ? path.join(raiz, categoria) : raiz
    if (fs.existsSync(destino)) continue
    fs.mkdirSync(destino, { recursive: true })
    criadas.push(categoria || 'uploads')
  }
  return criadas
}

function usarBlobPrivado() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function nomeSeguro(file, categoria, userId) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  const base = path.basename(file.originalname || 'arquivo', ext)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 80) || 'arquivo'
  const prefixo = categoria === 'perfis' ? 'perfil' : categoria.slice(0, -1)
  return `${prefixo}-${base}-${userId || 'user'}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`
}

function caminhoRelativo(categoria, filename) {
  return `${categoria}/${filename}`.replaceAll('\\', '/')
}

async function armazenarArquivo(file, categoria, userId) {
  const filename = file.filename || nomeSeguro(file, categoria, userId)
  const relative = caminhoRelativo(categoria, filename)

  if (!usarBlobPrivado()) {
    return { filename, relative, url: `/uploads/${relative}` }
  }

  if (!file.buffer?.length) {
    const error = new Error('O armazenamento da Vercel exige o conteúdo do arquivo em memória.')
    error.status = 500
    throw error
  }

  const { put } = require('@vercel/blob')
  await put(`planejai/${relative}`, file.buffer, {
    access: 'private',
    addRandomSuffix: false,
    contentType: file.mimetype || 'application/octet-stream',
    cacheControlMaxAge: 0,
  })
  return { filename, relative, url: `/uploads/${relative}` }
}

async function enviarArquivoArmazenado(req, res, relative, { protegido = true } = {}) {
  if (!usarBlobPrivado()) {
    const raiz = uploadsRoot()
    const absolute = path.resolve(raiz, relative)
    // Travessia de diretório é rejeitada com 400: é uma tentativa, não um
    // arquivo ausente.
    if (!absolute.startsWith(`${raiz}${path.sep}`)) {
      return res.status(400).json({ error: 'Caminho de arquivo inválido.' })
    }
    if (!fs.existsSync(absolute)) {
      // Um 404 sem explicação é o mais difícil de diagnosticar. A pasta uploads/
      // é ignorada pelo Git, então some em instalações novas e é a causa comum
      // de todas as fotos desaparecerem de uma vez.
      const existeRaiz = fs.existsSync(raiz)
      console.warn(
        `[UPLOADS] Arquivo ausente: ${relative}` +
          (existeRaiz ? '' : ' — a pasta uploads/ não existe; ela é criada ao iniciar o servidor'),
      )
      return res.status(404).json({ error: 'Arquivo não encontrado.' })
    }
    res.setHeader('Cache-Control', protegido ? 'private, max-age=240' : 'public, max-age=86400')
    return res.sendFile(absolute)
  }

  const { get } = require('@vercel/blob')
  const result = await get(`planejai/${relative}`, {
    access: 'private',
    ifNoneMatch: req.headers['if-none-match'],
  })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' })
  }

  res.status(200)
  res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', protegido ? 'private, no-cache' : 'public, max-age=86400')
  if (result.blob.contentDisposition) res.setHeader('Content-Disposition', result.blob.contentDisposition)
  Readable.fromWeb(result.stream).on('error', () => res.destroy()).pipe(res)
  return undefined
}

module.exports = {
  usarBlobPrivado,
  nomeSeguro,
  caminhoRelativo,
  armazenarArquivo,
  enviarArquivoArmazenado,
  garantirPastas,
  uploadsRoot,
}

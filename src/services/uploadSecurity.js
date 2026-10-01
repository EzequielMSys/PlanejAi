const fs = require('fs/promises')
const path = require('path')

function startsWith(buffer, signature) {
  return buffer.subarray(0, signature.length).equals(Buffer.from(signature))
}

function isAcceptedSignature(extension, bytes) {
  switch (extension) {
    case '.jpg':
    case '.jpeg': return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case '.png': return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case '.gif': return startsWith(bytes, 'GIF87a') || startsWith(bytes, 'GIF89a')
    case '.webp': return startsWith(bytes, 'RIFF') && bytes.subarray(8, 12).equals(Buffer.from('WEBP'))
    case '.pdf': return startsWith(bytes, '%PDF-')
    case '.doc':
    case '.ppt': return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    case '.docx':
    case '.pptx': return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])
    case '.mp4': return bytes.subarray(4, 8).equals(Buffer.from('ftyp'))
    case '.webm': return startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])
    case '.txt': return true
    default: return false
  }
}

async function removerArquivo(file) {
  // Arquivos recebidos para Blob ainda não foram persistidos; basta descartá-los.
  if (file?.buffer) return
  if (!file?.path) return
  await fs.unlink(file.path).catch(() => undefined)
}

async function validarArquivoEnviado(file) {
  if (!file?.path && !file?.buffer) {
    const error = new Error('Arquivo enviado não encontrado.')
    error.status = 400
    throw error
  }

  const extension = path.extname(file.filename || file.originalname || '').toLowerCase()
  let bytes
  if (file.buffer) {
    bytes = file.buffer.subarray(0, 32)
  } else {
    const handle = await fs.open(file.path, 'r')
    try {
    bytes = Buffer.alloc(32)
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0)
    bytes = bytes.subarray(0, bytesRead)
    } finally {
      await handle.close()
    }
  }

  if (isAcceptedSignature(extension, bytes)) return true

  await removerArquivo(file)
  const error = new Error('O conteúdo do arquivo não corresponde ao formato informado.')
  error.status = 415
  throw error
}

module.exports = { validarArquivoEnviado, removerArquivo }

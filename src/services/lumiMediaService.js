const { toFile } = require('openai')
const { getOpenAIClient } = require('../utils/openaiClient')
const limits = require('./rateLimitStore')

const MAX_BYTES = 4 * 1024 * 1024
const fail = (message, status) => Object.assign(new Error(message), { status })

function mediaExtension(bytes) {
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE') return 'wav'
  if (bytes.toString('ascii', 4, 8) === 'ftyp') return 'mp4'
  if (bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))) return 'webm'
  if (bytes.toString('ascii', 0, 4) === 'OggS') return 'ogg'
  if (bytes.toString('ascii', 0, 4) === 'fLaC') return 'flac'
  if (bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224 && (bytes[1] & 6))) return 'mp3'
}

async function transcribe(owner, file) {
  const bytes = file?.buffer
  const extension = bytes?.length >= 12 && mediaExtension(bytes)
  if (!extension) throw fail('Envie áudio ou vídeo compatível e confira se o arquivo abre normalmente.', 415)
  if (bytes.length > MAX_BYTES) throw fail('O arquivo deve ter até 4 MB.', 413)
  const { client } = getOpenAIClient()
  const host = new URL(process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com').hostname
  const model = process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || {
    'api.groq.com': 'whisper-large-v3-turbo',
    'api.openai.com': 'whisper-1'
  }[host]
  if (!client || !model) throw fail('A transcrição está indisponível neste momento.', 503)
  if (await limits.consume('lumi-midia-minuto', String(owner), 60000) > 3 ||
      await limits.consume('lumi-midia-dia', String(owner), 86400000) > 20) {
    throw fail('Limite de transcrições atingido. Tente novamente mais tarde.', 429)
  }
  let result
  try {
    result = await client.audio.transcriptions.create({
      model, file: await toFile(bytes, `midia.${extension}`), response_format: 'json'
    }, { timeout: 45000, maxRetries: 0 })
  } catch (error) {
    if (error.status === 429) throw fail('O serviço de transcrição está ocupado. Tente novamente em instantes.', 429)
    if (error.status !== 400 && error.status !== 422) throw fail('O serviço de transcrição está indisponível neste momento.', 503)
    throw fail('Não foi possível transcrever a mídia. Confira se há uma faixa de áudio audível e tente novamente.', 422)
  }
  const texto = result?.text?.trim()
  if (!texto) throw fail('Nenhuma fala foi reconhecida.', 422)
  return { texto: texto.slice(0, 12000), truncated: texto.length > 12000 }
}

module.exports = { transcribe, mediaExtension, MAX_BYTES }

const test = require('node:test')
const assert = require('node:assert/strict')
const { transcribe, mediaExtension, MAX_BYTES } = require('../src/services/lumiMediaService')

test('recognizes media by container bytes and rejects renamed or oversized files before transcription', async () => {
  assert.equal(mediaExtension(Buffer.from('RIFF0000WAVE')), 'wav')
  assert.equal(mediaExtension(Buffer.from('0000ftypisom')), 'mp4')
  assert.equal(mediaExtension(Buffer.from([26, 69, 223, 163])), 'webm')
  await assert.rejects(transcribe(1, { buffer: Buffer.from('%PDF-1.7 file'), mimetype: 'audio/mpeg' }), { status: 415 })
  const oversized = Buffer.alloc(MAX_BYTES + 1)
  oversized.write('RIFF0000WAVE')
  await assert.rejects(transcribe(1, { buffer: oversized }), { status: 413 })
})

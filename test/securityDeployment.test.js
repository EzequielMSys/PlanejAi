const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')

test('Vercel serves the public app with a restrictive script policy and external theme preload', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
  const rootHeaders = vercel.headers.find(entry => entry.source === '/').headers
  const policy = rootHeaders.find(entry => entry.key.toLowerCase() === 'content-security-policy')?.value
  assert.match(policy, /script-src 'self'/)
  assert.match(policy, /object-src 'none'/)
  assert.match(policy, /frame-ancestors 'none'/)
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/)
  const html = fs.readFileSync(path.join(root, 'frontend/index.html'), 'utf8')
  assert.match(html, /<script src="\.\/theme-preload\.js"><\/script>/)
  assert.doesNotMatch(html, /<script(?:\s[^>]*)?>\s*[^<\s]/)
  assert.ok(fs.existsSync(path.join(root, 'frontend/public/theme-preload.js')))
})

test('external backup workflow schedules an encrypted copy and verifies restoration', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/database-backup.yml'), 'utf8')
  const script = fs.readFileSync(path.join(root, 'src/scripts/scheduledBackup.js'), 'utf8')
  assert.match(workflow, /schedule:/)
  assert.match(workflow, /BACKUP_ENCRYPTION_KEY/)
  assert.match(workflow, /retention-days: 14/)
  assert.match(script, /restoreBackup\(/)
  assert.match(script, /restored\.tables !== exported\.tables \|\| restored\.rows !== exported\.rows/)
})

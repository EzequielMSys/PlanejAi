const DEFAULT_ORIGIN = 'https://planej-ai-dusky.vercel.app'

async function checkOnce(origin, fetchImpl, expectedRevision = '') {
  const request = (path, options = {}) => fetchImpl(`${origin}${path}`, {
    ...options,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  const home = await request('/')
  const html = await home.text()
  if (!home.ok || !/id="root"/.test(html) || !/<script[^>]+src=/.test(html)) throw new Error('Frontend indisponível ou HTML incompleto.')
  const deployedRevision = html.match(/<meta name="planejai-revision" content="([a-f0-9]{40})">/)?.[1] || ''
  if (expectedRevision && deployedRevision !== expectedRevision) throw new Error('A nova revisão ainda não está publicada na Vercel.')
  const policy = home.headers.get('content-security-policy') || ''
  if (!policy.includes("script-src 'self'") || !policy.includes("object-src 'none'")) throw new Error('Política de segurança do frontend ausente.')
  const scriptPath = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match => match[1]).find(src => src.startsWith('/assets/'))
  if (!scriptPath) throw new Error('Script principal ausente no HTML.')
  const script = await request(scriptPath)
  if (!script.ok || !/javascript/.test(script.headers.get('content-type') || '')) throw new Error('Script principal indisponível.')

  const health = await request('/api/health')
  const healthBody = await health.json()
  if (!health.ok || healthBody.status !== 'OK' || healthBody.database !== 'connected') throw new Error('API ou banco indisponível.')

  const login = await request('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  })
  if (login.status !== 400) throw new Error('Validação pública do login inesperada.')

  const privateRoute = await request('/api/usuarios/me')
  if (privateRoute.status !== 401) throw new Error('Rota privada acessível sem autenticação.')

  return { revision: deployedRevision || 'unknown', frontend: home.status, script: script.status, api: health.status, loginValidation: login.status, privateRoute: privateRoute.status }
}

async function smokeProduction({ origin = process.env.PLANEJAI_PRODUCTION_ORIGIN || DEFAULT_ORIGIN, expectedRevision = process.env.PLANEJAI_EXPECTED_SHA || '', fetchImpl = fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = expectedRevision ? 15 : 3 } = {}) {
  const target = new URL(origin)
  if (target.protocol !== 'https:') throw new Error('O teste de produção exige HTTPS.')
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return { ...await checkOnce(target.origin, fetchImpl, expectedRevision), checkedAt: new Date().toISOString() } }
    catch (error) {
      if (attempt === attempts) throw error
      await wait(10000)
    }
  }
}

if (require.main === module) smokeProduction().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { smokeProduction, checkOnce }

const HEALTH_URL = 'https://planej-ai-dusky.vercel.app/api/health';
async function checkAvailability({ fetchImpl = fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = 3 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchImpl(HEALTH_URL, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
      const body = await response.json();
      if (response.ok && body.database === 'connected') return { available: true, checkedAt: new Date().toISOString() };
    } catch { /* Uma nova tentativa cobre partida a frio e falhas transitórias. */ }
    if (attempt < attempts) await wait(10000);
  }
  throw new Error('Aplicação ou banco indisponível após três verificações. Confira Aiven e Vercel.');
}
if (require.main === module) checkAvailability().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { checkAvailability };

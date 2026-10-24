const crypto = require('node:crypto');
const roots = new Set(['auth','files','usuarios','perfil','cronograma','atividade','redacao','conteudos','dashboard','avisos','aprendizagem','inteligencia','adaptativo','colaborativo','turmas','operacoes']);
function safeRoute(req) {
  const pathname = String(req.originalUrl || req.path || '').split('?')[0];
  if (pathname === '/api/health') return '/api/health';
  const root = pathname.split('/')[2];
  if (!pathname.startsWith('/api/') || !roots.has(root)) return '/other';
  // O padrão do Express vem do código, não de IDs, tokens ou texto da URL.
  const pattern = typeof req.route?.path === 'string' ? req.route.path : '/:unmatched';
  return (`/api/${root}` + (pattern === '/' ? '' : pattern)).slice(0, 255);
}
function requestId(value) {
  return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value) ? value : crypto.randomUUID();
}
module.exports = { safeRoute, requestId };

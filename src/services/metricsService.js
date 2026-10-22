const startedAt = Date.now();
const counters = new Map();
let inFlight = 0;
let totalRequests = 0;
let totalDurationMs = 0;
const webVitals = new Map();
const pool = require('../config/db');
const VITAL_NAMES = new Set(['LCP', 'INP', 'CLS', 'ROUTE_READY']);
const WEB_ROUTES = new Set(['/', '/login', '/register', '/esqueci-senha', '/redefinir-senha', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/lumi', '/chat', '/estudar', '/planejamento-inteligente', '/minha-jornada', '/perfil', '/preferencias', '/status', '/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono', '/dono/usuarios', '/onboarding', '/primeiro-acesso', '/alterar-senha', '/minhas-atividades', '/minhas-turmas', '/minhas-turmas/:id', '/avisos']);

function recordWebVital({ name, route, value }) {
  if (!VITAL_NAMES.has(name) || !WEB_ROUTES.has(route) || typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 60000) return false;
  const key = `${route}|${name}`;
  const bucket = webVitals.get(key) || { samples: [], total: 0 };
  bucket.total += 1;
  bucket.samples.push(value);
  if (bucket.samples.length > 300) bucket.samples.shift();
  webVitals.set(key, bucket);
  return true;
}

function webVitalSnapshot() {
  return [...webVitals.entries()].map(([key, bucket]) => {
    const [route, name] = key.split('|');
    const ordered = [...bucket.samples].sort((a, b) => a - b);
    return { route, name, count: bucket.total, p75: Number(ordered[Math.ceil(ordered.length * .75) - 1].toFixed(name === 'CLS' ? 3 : 0)) };
  }).sort((a, b) => a.route.localeCompare(b.route) || a.name.localeCompare(b.name));
}

async function persistWebVital(measurement) {
  if (!recordWebVital(measurement)) return false;
  await pool.execute('INSERT INTO web_vital_samples (route, metric, value) VALUES (?, ?, ?)', [measurement.route, measurement.name, measurement.value]);
  return true;
}

async function persistedWebVitalSnapshot() {
  await pool.execute('DELETE FROM web_vital_samples WHERE recorded_at < NOW() - INTERVAL 7 DAY');
  const [rows] = await pool.execute('SELECT route, metric AS name, value FROM web_vital_samples WHERE recorded_at >= NOW() - INTERVAL 7 DAY ORDER BY id DESC LIMIT 20000');
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.route}|${row.name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(Number(row.value));
  }
  return [...groups].map(([key, values]) => {
    const [route, name] = key.split('|');
    values.sort((a, b) => a - b);
    return { route, name, count: values.length, p75: Number(values[Math.ceil(values.length * .75) - 1].toFixed(name === 'CLS' ? 3 : 0)) };
  }).sort((a, b) => a.route.localeCompare(b.route) || a.name.localeCompare(b.name));
}

function beginRequest() {
  inFlight += 1;
}

function finishRequest({ method, route, status, durationMs }) {
  inFlight = Math.max(0, inFlight - 1);
  totalRequests += 1;
  totalDurationMs += durationMs;
  const key = `${method} ${route} ${status}`;
  counters.set(key, (counters.get(key) || 0) + 1);
}

function snapshot() {
  const memory = process.memoryUsage();
  const errors = [...counters.entries()]
    .filter(([key]) => /\s[45]\d\d$/.test(key))
    .reduce((sum, [, value]) => sum + value, 0);
  return {
    started_at: new Date(startedAt).toISOString(),
    uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
    requests: {
      total: totalRequests,
      in_flight: inFlight,
      errors,
      average_duration_ms: totalRequests
        ? Number((totalDurationMs / totalRequests).toFixed(2))
        : 0,
      by_route_status: Object.fromEntries(counters),
    },
    web_vitals: webVitalSnapshot(),
    memory: {
      rss_mb: Number((memory.rss / 1024 / 1024).toFixed(2)),
      heap_used_mb: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
      heap_total_mb: Number((memory.heapTotal / 1024 / 1024).toFixed(2)),
    },
  };
}

module.exports = { beginRequest, finishRequest, recordWebVital, webVitalSnapshot, persistWebVital, persistedWebVitalSnapshot, snapshot };

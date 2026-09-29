const crypto = require('crypto');
const rateLimitStore = require('../services/rateLimitStore');

const attempts = new Map();
const registrationAttempts = new Map();
let activeRegistrations = 0;

const REGISTRATION_WINDOW_MS = Number(process.env.REGISTRATION_WINDOW_MS || 30 * 60 * 1000);
const REGISTRATION_LIMIT = Number(process.env.REGISTRATION_LIMIT || 5);
const REGISTRATION_CONCURRENCY_LIMIT = Number(process.env.REGISTRATION_CONCURRENCY_LIMIT || 2);
const persistentLimitsEnabled = process.env.NODE_ENV !== 'test';

async function consumirLimitePersistente(...args) {
  if (!persistentLimitsEnabled) return null;
  return rateLimitStore.consume(...args);
}

function platformHeaders(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
}

function requestLogger(req, res, next) {
  // Health checks são frequentes e não agregam auditoria; registrá-los gera
  // ruído e pode encobrir alertas reais em produção.
  if (req.path === '/api/health') return next()
  const started = process.hrtime.bigint()
  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6
    console.log(JSON.stringify({ event: 'http_request', request_id: req.requestId, method: req.method, path: req.path, status: res.statusCode, duration_ms: Number(durationMs.toFixed(1)) }))
  })
  next()
}

async function authRateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const limit = req.path.includes('login') ? Number(process.env.LOGIN_RATE_LIMIT || 8) : Number(process.env.AUTH_RATE_LIMIT || 5);
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    try {
      const persistentCount = await consumirLimitePersistente(`AUTH:${req.path}`, req.ip, windowMs);
      if (persistentCount > limit) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
    } catch { /* fallback local para manter o login disponível durante falha transitória do banco */ }
    return next();
  }

  record.count += 1;
  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - record.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

  if (record.count > limit) {
    res.setHeader('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
  }
  try {
    const persistentCount = await consumirLimitePersistente(`AUTH:${req.path}`, req.ip, windowMs);
    if (persistentCount > limit) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
  } catch { /* fallback local */ }
  next();
}

async function registrationRateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  let record = registrationAttempts.get(key);

  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: now + REGISTRATION_WINDOW_MS };
    registrationAttempts.set(key, record);
  }

  record.count += 1;
  const remaining = Math.max(0, REGISTRATION_LIMIT - record.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  res.setHeader('RateLimit-Limit', String(REGISTRATION_LIMIT));
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

  if (record.count > REGISTRATION_LIMIT) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      error: 'Limite de cadastros excedido. Aguarde antes de tentar novamente.',
      retry_after_seconds: retryAfterSeconds,
    });
  }

  try {
    const persistentCount = await consumirLimitePersistente('REGISTRATION', req.ip, REGISTRATION_WINDOW_MS);
    if (persistentCount > REGISTRATION_LIMIT) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ error: 'Limite de cadastros excedido. Aguarde antes de tentar novamente.', retry_after_seconds: retryAfterSeconds });
    }
  } catch { /* fallback local */ }

  if (activeRegistrations >= REGISTRATION_CONCURRENCY_LIMIT) {
    res.setHeader('Retry-After', '2');
    return res.status(429).json({
      error: 'Muitos cadastros sendo processados ao mesmo tempo. Tente novamente em instantes.',
      retry_after_seconds: 2,
    });
  }

  activeRegistrations += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    activeRegistrations = Math.max(0, activeRegistrations - 1);
  };
  res.once('finish', release);
  res.once('close', release);
  next();
}

function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (now > value.resetAt) attempts.delete(key);
  }
  for (const [key, value] of registrationAttempts) {
    if (now > value.resetAt) registrationAttempts.delete(key);
  }
}

// Funções serverless podem congelar entre requisições. Timers globais não são
// um mecanismo confiável de manutenção nelas e também mantêm recursos vivos
// desnecessariamente. A limpeza persistente continua sendo feita pelo banco.
if (!process.env.VERCEL) {
  const cleanupTimer = setInterval(cleanupRateLimits, 10 * 60 * 1000);
  cleanupTimer.unref();
  const persistentCleanupTimer = setInterval(() => rateLimitStore.cleanup().catch(() => {}), 6 * 60 * 60 * 1000);
  persistentCleanupTimer.unref();
}

module.exports = {
  authRateLimit,
  registrationRateLimit,
  platformHeaders,
  requestLogger,
};

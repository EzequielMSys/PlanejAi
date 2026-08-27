const crypto = require('crypto');

const attempts = new Map();

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
  const started = process.hrtime.bigint()
  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6
    console.log(JSON.stringify({ event: 'http_request', request_id: req.requestId, method: req.method, path: req.path, status: res.statusCode, duration_ms: Number(durationMs.toFixed(1)) }))
  })
  next()
}

function authRateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const limit = req.path.includes('login') ? 12 : 8;
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
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
  next();
}

function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (now > value.resetAt) attempts.delete(key);
  }
}

const cleanupTimer = setInterval(cleanupRateLimits, 10 * 60 * 1000);
cleanupTimer.unref();

module.exports = { authRateLimit, platformHeaders, requestLogger };

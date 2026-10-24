const crypto = require("crypto");
const pool = require("../config/db");
const metrics = require("../services/metricsService");
const { safeRoute } = require('../utils/operationContext');

function operationsMonitor(req, res, next) {
  const started = process.hrtime.bigint();
  metrics.beginRequest();
  // Registra a promessa ainda durante a requisição, antes de enviar a resposta.
  // Sem isso, o runtime serverless pode interromper o INSERT após res.finish.
  let complete;
  const completion = new Promise(resolve => { complete = resolve; });
  if (process.env.VERCEL && safeRoute(req) !== '/api/health') require('@vercel/functions').waitUntil(completion);
  res.once('close', () => { if (!res.writableFinished) complete(); });

  res.once("finish", async () => {
    try {
      const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
      metrics.finishRequest({
        method: req.method,
        route: safeRoute(req),
        status: res.statusCode,
        durationMs,
      });

      if (safeRoute(req) === '/api/health') return;
      if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && res.statusCode < 500) return;
      const userId = req.usuario?.id_usuario || req.usuario?.id || null;
      const ipHash = crypto
        .createHash("sha256")
        .update(`${process.env.AUDIT_HASH_SALT || "planejai-local"}:${req.ip}`)
        .digest("hex");
      await pool.execute(
        `INSERT INTO auditoria_api
         (id_usuario, metodo, rota, status_http, request_id, ip_hash, duracao_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          req.method,
          // Nunca persiste query strings (podem conter tokens de recuperação).
          safeRoute(req),
          res.statusCode,
          req.requestId || null,
          ipHash,
          Math.max(0, Math.round(durationMs)),
        ],
      );
    } catch {
      console.warn(JSON.stringify({ event: 'audit_unavailable', request_id: req.requestId, status: res.statusCode }));
    } finally { complete(); }
  });

  next();
}

module.exports = { operationsMonitor };

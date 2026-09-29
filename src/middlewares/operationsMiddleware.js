const crypto = require("crypto");
const pool = require("../config/db");
const metrics = require("../services/metricsService");

function operationsMonitor(req, res, next) {
  const started = process.hrtime.bigint();
  metrics.beginRequest();

  res.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    metrics.finishRequest({
      method: req.method,
      route: req.baseUrl || req.path,
      status: res.statusCode,
      durationMs,
    });

    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
    const userId = req.usuario?.id_usuario || req.usuario?.id || null;
    const ipHash = crypto
      .createHash("sha256")
      .update(`${process.env.AUDIT_HASH_SALT || "planejai-local"}:${req.ip}`)
      .digest("hex");
    pool.execute(
      `INSERT INTO auditoria_api
       (id_usuario, metodo, rota, status_http, request_id, ip_hash, duracao_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        req.method,
        req.originalUrl.slice(0, 255),
        res.statusCode,
        req.requestId || null,
        ipHash,
        Math.max(0, Math.round(durationMs)),
      ],
    ).catch((error) =>
      console.warn("[AUDIT WARNING]", error.message),
    );
  });

  next();
}

module.exports = { operationsMonitor };

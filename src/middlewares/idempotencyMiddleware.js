const pool = require("../config/db");

function idempotency(operation, ttlHours = 24) {
  return async (req, res, next) => {
    const key = String(req.get("Idempotency-Key") || "").trim();
    if (!key) return next();
    if (!/^[A-Za-z0-9._:-]{8,100}$/.test(key)) {
      return res.status(400).json({
        error: "Idempotency-Key deve ter entre 8 e 100 caracteres seguros.",
      });
    }

    const userId = req.usuario?.id_usuario || req.usuario?.id;
    try {
      const [insert] = await pool.execute(
        `INSERT IGNORE INTO idempotencia_api
         (chave, id_usuario, operacao, status, expira_em)
         VALUES (?, ?, ?, 'PROCESSANDO', DATE_ADD(NOW(), INTERVAL ? HOUR))`,
        [key, userId, operation, ttlHours],
      );

      if (!insert.affectedRows) {
        const [[existing]] = await pool.execute(
          `SELECT status, codigo_http, resposta FROM idempotencia_api
           WHERE chave = ? AND id_usuario = ? AND operacao = ? AND expira_em > NOW()`,
          [key, userId, operation],
        );
        if (existing?.status === "CONCLUIDA") {
          res.setHeader("Idempotency-Replayed", "true");
          return res.status(existing.codigo_http || 200).json(existing.resposta);
        }
        if (existing?.status === "PROCESSANDO") {
          return res.status(409).json({ error: "Esta operação já está em processamento." });
        }
        await pool.execute(
          "DELETE FROM idempotencia_api WHERE chave = ? AND id_usuario = ? AND operacao = ?",
          [key, userId, operation],
        );
        return idempotency(operation, ttlHours)(req, res, next);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const successful = res.statusCode >= 200 && res.statusCode < 300;
        pool.execute(
          `UPDATE idempotencia_api SET status = ?, codigo_http = ?, resposta = ?
           WHERE chave = ? AND id_usuario = ? AND operacao = ?`,
          [
            successful ? "CONCLUIDA" : "FALHOU",
            res.statusCode,
            JSON.stringify(body),
            key,
            userId,
            operation,
          ],
        ).catch((error) => console.warn("[IDEMPOTENCY WARNING]", error.message));
        return originalJson(body);
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { idempotency };

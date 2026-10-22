const router = require("express").Router();
const { authMiddleware, isDono } = require("../middlewares/authMiddleware");
const metrics = require("../services/metricsService");
const { getBackupStatus } = require("../services/backupScheduler");
const jobQueue = require("../services/jobQueue");
const rateLimitStore = require('../services/rateLimitStore');

// Apenas valores numéricos e nomes de rotas conhecidos; nenhum dado pessoal é coletado.
router.post('/vitals', async (req, res, next) => {
  try {
    const attempts = await rateLimitStore.consume('WEB_VITALS', req.ip, 5 * 60 * 1000);
    if (attempts > 120) return res.sendStatus(429);
    if (!await metrics.persistWebVital(req.body || {})) return res.sendStatus(400);
    return res.sendStatus(204);
  } catch (error) { return next(error); }
});

router.get("/metrics", authMiddleware, isDono, async (req, res, next) => {
  try {
    res.json({
      ...metrics.snapshot(),
      web_vitals: await metrics.persistedWebVitalSnapshot(),
      jobs: jobQueue.snapshot(),
      backup: getBackupStatus(),
    });
  } catch (error) { next(error); }
});

module.exports = router;

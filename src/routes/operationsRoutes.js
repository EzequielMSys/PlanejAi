const router = require("express").Router();
const { authMiddleware, isDono } = require("../middlewares/authMiddleware");
const metrics = require("../services/metricsService");
const { getBackupStatus } = require("../services/backupScheduler");
const jobQueue = require("../services/jobQueue");
const rateLimitStore = require('../services/rateLimitStore');
const support = require('../services/supportService');
const { operationalSummary } = require('../services/operationalSummary');

router.get('/suporte', authMiddleware, async (req, res, next) => {
  try { res.json(await support.list(req.usuario.id)); } catch (error) { next(error); }
});
router.post('/suporte', authMiddleware, async (req, res, next) => {
  try { res.status(201).json(await support.create(req.usuario.id, req.body)); } catch (error) { next(error); }
});
router.get('/suporte/:id/captura',authMiddleware,async(req,res,next)=>{
  try{const file=await support.screenshot(req.params.id,req.usuario);if(!file?.captura)return res.sendStatus(404);res.set({'Content-Type':file.captura_mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"});res.send(file.captura)}catch(error){next(error)}
});
router.get('/atendimento', authMiddleware, isDono, async (req, res, next) => {
  try { res.json(await support.list(null, true)); } catch (error) { next(error); }
});
router.patch('/atendimento/:id', authMiddleware, isDono, async (req, res, next) => {
  try { await support.reply(req.params.id, req.body); res.sendStatus(204); } catch (error) { next(error); }
});

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
      operation: await operationalSummary(),
    });
  } catch (error) { next(error); }
});

module.exports = router;

const router = require("express").Router();
const { authMiddleware, isDono } = require("../middlewares/authMiddleware");
const metrics = require("../services/metricsService");
const { getBackupStatus } = require("../services/backupScheduler");
const jobQueue = require("../services/jobQueue");

router.get("/metrics", authMiddleware, isDono, (req, res) => {
  res.json({
    ...metrics.snapshot(),
    jobs: jobQueue.snapshot(),
    backup: getBackupStatus(),
  });
});

module.exports = router;

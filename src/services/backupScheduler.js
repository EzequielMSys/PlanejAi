const { backupDatabase } = require('../scripts/backupDatabase');

const state = { status: 'disabled', lastStartedAt: null, lastCompletedAt: null, lastError: null };
let running = false;

async function runBackup() {
  if (running) return;
  running = true;
  state.status = 'running';
  state.lastStartedAt = new Date().toISOString();
  state.lastError = null;
  try {
    const result = await backupDatabase();
    state.status = 'ok';
    state.lastCompletedAt = new Date().toISOString();
    state.tables = result.tables;
    state.rows = result.rows;
  } catch (error) {
    state.status = 'failed';
    state.lastError = error.message;
    console.error('[BACKUP SCHEDULER]', error.message);
  } finally {
    running = false;
  }
}

function startBackupScheduler() {
  const hours = Number(process.env.BACKUP_INTERVAL_HOURS || 0);
  if (!process.env.BACKUP_DATABASE_URL || !Number.isFinite(hours) || hours <= 0) return null;
  state.status = 'scheduled';
  const timer = setInterval(runBackup, hours * 60 * 60 * 1000);
  timer.unref();
  if (process.env.BACKUP_RUN_ON_START === 'true') setImmediate(runBackup);
  return timer;
}

function getBackupStatus() {
  return { ...state };
}

module.exports = { startBackupScheduler, getBackupStatus, runBackup };

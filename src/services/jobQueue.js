const crypto = require("crypto");

const MAX_CONCURRENT = Number(process.env.JOB_QUEUE_CONCURRENCY || 2);
const MAX_PENDING = Number(process.env.JOB_QUEUE_MAX_PENDING || 100);
const pending = [];
const jobs = new Map();
let running = 0;

function cleanup() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.finishedAt && job.finishedAt < cutoff) jobs.delete(id);
  }
}

function drain() {
  while (running < MAX_CONCURRENT && pending.length) {
    const item = pending.shift();
    const job = jobs.get(item.id);
    running += 1;
    job.status = "RUNNING";
    job.startedAt = Date.now();
    Promise.resolve()
      .then(item.task)
      .then(() => { job.status = "COMPLETED"; })
      .catch((error) => {
        job.status = "FAILED";
        job.error = error.message;
        console.error(`[JOB ${job.type}]`, error.message);
      })
      .finally(() => {
        job.finishedAt = Date.now();
        running = Math.max(0, running - 1);
        cleanup();
        drain();
      });
  }
}

function enqueue(type, task) {
  if (pending.length >= MAX_PENDING) {
    const error = new Error("Fila de processamento temporariamente cheia.");
    error.status = 503;
    throw error;
  }
  const id = crypto.randomUUID();
  jobs.set(id, { id, type, status: "PENDING", createdAt: Date.now() });
  pending.push({ id, task });
  setImmediate(drain);
  return id;
}

function snapshot() {
  const failed = [...jobs.values()].filter((job) => job.status === "FAILED").length;
  return {
    pending: pending.length,
    running,
    failed,
    max_pending: MAX_PENDING,
    concurrency: MAX_CONCURRENT,
  };
}

module.exports = { enqueue, snapshot };

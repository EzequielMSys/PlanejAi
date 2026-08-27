require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/db");
const { platformHeaders, requestLogger } = require("./middlewares/platformMiddleware");
const fileRoutes = require("./routes/fileRoutes");

const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const perfilRoutes = require("./routes/perfilRoutes");
const cronogramaRoutes = require("./routes/cronogramaRoutes");
const atividadeRoutes = require("./routes/atividadeRoutes");
const redacaoRoutes = require("./routes/redacaoRoutes");
const conteudoRoutes = require("./routes/conteudoRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const avisoRoutes = require("./routes/avisoRoutes");
const aprendizagemRoutes = require("./routes/aprendizagemRoutes");
const inteligenciaRoutes = require("./routes/inteligenciaRoutes");
const adaptiveLearningRoutes = require("./routes/adaptiveLearningRoutes");
const collaborativeLearningRoutes = require("./routes/collaborativeLearningRoutes");
const turmaRoutes = require("./routes/turmaRoutes");

const app = express();
app.disable("x-powered-by");

const garantirTabelas = require("./scripts/garantirTabelas");
const repairContentLinks = require("./scripts/repairContentLinks");
const seedDatabase = require("./scripts/seedDatabase");
const { startBackupScheduler, getBackupStatus } = require("./services/backupScheduler");

const uploadErrorHandler = require("./middlewares/uploadErrorHandler");

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0) {
      return callback(
        new Error(
          "CORS_ORIGIN não configurado. Defina as origens permitidas no .env.",
        ),
      );
    }
    if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error("Origem não permitida pelo CORS."));
  },
};

app.use(platformHeaders);
app.use(requestLogger);
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));

app.use(
  "/uploads/perfis",
  express.static(path.join(__dirname, "..", "uploads", "perfis"), {
    maxAge: "1d",
    immutable: false,
    fallthrough: false,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/cronograma", cronogramaRoutes);
app.use("/api/atividade", atividadeRoutes);
app.use("/api/redacao", redacaoRoutes);
app.use("/api/conteudos", conteudoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/avisos", avisoRoutes);
app.use("/api/aprendizagem", aprendizagemRoutes);
app.use("/api/inteligencia", inteligenciaRoutes);
app.use("/api/adaptativo", adaptiveLearningRoutes);
app.use("/api/colaborativo", collaborativeLearningRoutes);
app.use("/api/turmas", turmaRoutes);

app.use(uploadErrorHandler);

app.get("/", (req, res) => {
  res.json({
    message: "Plataforma Estudos Inteligente API",
    version: "1.0.0",
    status: "OK",
  });
});

app.get("/api/health", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "OK",
      database: "connected",
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      backup: (() => { const value = getBackupStatus(); delete value.lastError; return value })(),
    });
  } catch (error) {
    error.status = 503;
    next(error);
  }
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint não encontrado.",
    method: req.method,
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  const status = err.status || (err.type === "entity.too.large" ? 413 : 500);
  console.error(`[${req.requestId || "sem-id"}]`, err.stack || err.message);
  res.status(status).json({
    error:
      status === 413
        ? "Payload muito grande."
        : status === 503
          ? "Banco de dados indisponível."
          : "Internal server error",
    request_id: req.requestId,
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  let server;

  const shutdown = (signal) => {
    console.log(`[SERVER] ${signal} recebido. Encerrando com segurança...`);
    if (!server) {
      pool.end().finally(() => process.exit(1));
      return;
    }
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (error) =>
    console.error("[UNHANDLED REJECTION]", error),
  );
  process.on("uncaughtException", (error) => {
    console.error("[UNCAUGHT EXCEPTION]", error);
    shutdown("UNCAUGHT_EXCEPTION");
  });

  async function start() {
    try {
      // A API só fica disponível depois que o schema e os dados derivados
      // estiverem prontos. Assim nenhuma requisição disputa com as migrations.
      await garantirTabelas();
      if (process.env.AUTO_SEED_DATABASE !== "false") {
        await seedDatabase();
      }
      await repairContentLinks();
      server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor rodando na porta ${PORT}`);
      });
      startBackupScheduler();
    } catch (error) {
      console.error("[STARTUP] Banco de dados não pôde ser preparado:", error.message);
      await pool.end();
      process.exitCode = 1;
    }
  }

  start();
}

module.exports = app;

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const os = require("os");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const pool = require("./config/db");
const { platformHeaders, requestLogger } = require("./middlewares/platformMiddleware");
const routeRegistry = require("./config/routeRegistry");
const helmet = require("helmet");
const { operationsMonitor } = require("./middlewares/operationsMiddleware");

const app = express();
app.disable("x-powered-by");
// Evita o parser "extended" (qs) para a query string; a API não depende de
// objetos aninhados na URL e passa a aceitar apenas parâmetros simples.
app.set("query parser", "simple");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const garantirTabelas = require("./scripts/garantirTabelas");
const repairContentLinks = require("./scripts/repairContentLinks");
const seedDatabase = require("./scripts/seedDatabase");
const { startBackupScheduler, getBackupStatus } = require("./services/backupScheduler");

const uploadErrorHandler = require("./middlewares/uploadErrorHandler");

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

function corsOptionsForRequest(req, callback) {
  callback(null, {
    origin(origin, originCallback) {
      if (!origin) {
        return originCallback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");
      let isApiSameOrigin = false;
      try {
        // Permite que o Swagger servido pela própria API use o IP/porta pelos
        // quais o cliente a acessou, inclusive em outros computadores da LAN.
        const originUrl = new URL(normalizedOrigin);
        isApiSameOrigin = originUrl.host === req.get("host");
      } catch {
        isApiSameOrigin = false;
      }

      if (isApiSameOrigin || allowedOrigins.includes(normalizedOrigin)) {
        return originCallback(null, true);
      }

      return originCallback(new Error("Origem não permitida pelo CORS."));
    },
  });
}

app.use(platformHeaders);
app.use(requestLogger);
app.use(operationsMonitor);
app.use(cors(corsOptionsForRequest));
app.use(express.json({ limit: "2mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));

app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "PlanejAI API - Swagger",
    swaggerOptions: {
      tryItOutEnabled: true,
      displayRequestDuration: true,
      docExpansion: "full",
      persistAuthorization: process.env.NODE_ENV !== "production",
    },
  }),
);

app.use(
  "/uploads/perfis",
  express.static(path.join(__dirname, "..", "uploads", "perfis"), {
    maxAge: "1d",
    immutable: false,
    fallthrough: false,
  }),
);

for (const { basePath, router } of routeRegistry) {
  app.use(basePath, router);
}

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

  function listen(port) {
    return new Promise((resolve, reject) => {
      const candidate = app.listen(port, "0.0.0.0");
      const onError = (error) => {
        candidate.removeListener("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        candidate.removeListener("error", onError);
        resolve(candidate);
      };
      candidate.once("error", onError);
      candidate.once("listening", onListening);
    });
  }

  async function existingPlanejAiIsHealthy(port) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(1500),
      });
      if (!response.ok) return false;
      const payload = await response.json();
      return payload?.status === "OK";
    } catch {
      return false;
    }
  }

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
      try {
        server = await listen(PORT);
      } catch (error) {
        if (error.code !== "EADDRINUSE") throw error;

        const reusable = await existingPlanejAiIsHealthy(PORT);
        if (reusable) {
          console.log(
            `[SERVER] A porta ${PORT} já possui uma instância saudável do PlanejAI. O servidor existente será reutilizado.`,
          );
          await pool.end();
          return;
        }

        console.error(
          `[SERVER] A porta ${PORT} está ocupada por outro programa. Encerre o processo que usa a porta ou configure PORT com outro valor.`,
        );
        await pool.end();
        process.exitCode = 1;
        return;
      }
      const networkAddresses = Object.values(os.networkInterfaces())
        .flat()
        .filter((address) => address && address.family === "IPv4" && !address.internal)
        .map((address) => `http://${address.address}:${PORT}/api-docs`);
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/api-docs`);
      networkAddresses.forEach((url) => console.log(`Swagger na rede: ${url}`));
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

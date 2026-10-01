require("dotenv").config();
const express = require("express");
const cors = require("cors");
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
const { enviarArquivoArmazenado, garantirPastas, usarBlobPrivado } = require("./services/uploadStorageService");

// Cria uploads/ e suas subpastas antes de qualquer requisição. Sem isso, uma
// instalação nova não tem onde gravar fotos e toda imagem responde 404 sem
// explicar o motivo. A pasta é ignorada pelo Git, então isso acontece sempre.
if (!usarBlobPrivado()) {
  try {
    const criadas = garantirPastas();
    if (criadas.length) console.log(`[UPLOADS] Pastas criadas: ${criadas.join(", ")}`);
  } catch (error) {
    console.error("[UPLOADS] Não foi possível preparar a pasta de uploads:", error.message);
  }
}

const uploadErrorHandler = require("./middlewares/uploadErrorHandler");

const { isOriginAllowed, parsearOrigensPermitidas } = require("./config/corsConfig");

const { permitidas: origensPermitidas, invalidas: origensInvalidas } = parsearOrigensPermitidas();
// Libera qualquer IP privado em http, o que resolve o IP da LAN mudar a cada
// boot sem precisar editar o .env. Desligado por padrão: em produção as
// origens devem continuar explícitas.
const permitirRedePrivada = process.env.CORS_ALLOW_PRIVATE_NETWORK === "true";

if (permitirRedePrivada) {
  console.log("[CORS] CORS_ALLOW_PRIVATE_NETWORK=true: origens http em IP privado serão aceitas.");
}
if (origensInvalidas.length) {
  console.warn(
    `[CORS] Ignorando origens inválidas em CORS_ORIGIN: ${origensInvalidas.join(", ")}`,
  );
}
if (!origensPermitidas.length && !permitirRedePrivada) {
  console.warn(
    "[CORS] CORS_ORIGIN está vazio. Só requisições sem cabeçalho Origin (curl, apps nativos) e a própria API serão atendidas.",
  );
}

// Rejeitar a origem aqui, antes do `cors`, permite responder 403 com uma
// mensagem que diz o que ajustar. Lançar um Error faria o `cors` chamar
// next(err) e o resultado seria um 500 genérico, que sugere falha do servidor
// e ainda polui auditoria e métricas de erro.
function corsGate(req, res, next) {
  const origin = req.get("origin");
  if (isOriginAllowed(origin, { permitidas: origensPermitidas, hostDaRequisicao: req.get("host"), permitirRedePrivada })) {
    return next();
  }

  console.warn(
    JSON.stringify({
      event: "cors_origin_bloqueada",
      request_id: req.requestId,
      origin,
      path: req.path,
      dica: "Adicione a origem em CORS_ORIGIN no .env e reinicie a API, ou defina CORS_ALLOW_PRIVATE_NETWORK=true para aceitar qualquer IP privado.",
    }),
  );
  return res.status(403).json({
    error: "Origem não permitida pelo CORS.",
    origin,
    allowed_origins: origensPermitidas.map((regra) => `${regra.protocolo}//${regra.host}${regra.porta ? `:${regra.porta}` : ""}`),
    request_id: req.requestId,
  });
}

app.use(platformHeaders);
app.use(requestLogger);
app.use(operationsMonitor);
app.use(corsGate);
// `origin` reflexivo é seguro aqui: a lista já foi validada pelo corsGate acima.
app.use(cors({ origin: true, maxAge: 600 }));
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

// Perfis seguem a visibilidade já existente no produto, mas passam pelo mesmo
// adaptador para funcionar tanto no disco local quanto no Blob privado.
app.get("/uploads/perfis/*file", async (req, res, next) => {
  try {
    const file = Array.isArray(req.params.file) ? req.params.file.join("/") : req.params.file;
    if (!file || file.includes("..") || file.includes("\\")) return res.status(400).json({ error: "Arquivo inválido." });
    return await enviarArquivoArmazenado(req, res, `perfis/${file}`, { protegido: false });
  } catch (error) {
    return next(error);
  }
});

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

// No Express 5, o curinga precisa ter nome. Sem caminho, este middleware
// continua abrangendo qualquer rota que não tenha sido atendida antes.
app.use((req, res) => {
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

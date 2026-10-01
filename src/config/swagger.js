const swaggerJsdoc = require("swagger-jsdoc");
const routeRegistry = require("./routeRegistry");

function openApiPath(expressPath) {
  return expressPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function operationFor(method, fullPath, tag, handlers) {
  const parameters = [...fullPath.matchAll(/\{([^}]+)\}/g)].map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
  const protectedRoute = handlers.includes("authMiddleware");
  const writesBody = ["post", "put", "patch"].includes(method);
  const acceptsFile = handlers.includes("multerMiddleware");
  const acceptsIdempotency = fullPath === "/api/cronograma/gerar";

  return {
    tags: [tag],
    summary: `${method.toUpperCase()} ${fullPath}`,
    operationId: `${method}_${fullPath}`.replace(/[^A-Za-z0-9]+/g, "_"),
    ...(protectedRoute ? { security: [{ bearerAuth: [] }] } : {}),
    ...((parameters.length || acceptsIdempotency)
      ? {
          parameters: [
            ...parameters,
            ...(acceptsIdempotency
              ? [{
                  name: "Idempotency-Key",
                  in: "header",
                  required: false,
                  description: "Chave única para repetir a chamada sem gerar outro cronograma.",
                  schema: { type: "string", minLength: 8, maxLength: 100 },
                }]
              : []),
          ],
        }
      : {}),
    ...(writesBody
      ? {
          requestBody: {
            required: true,
            content: {
              [acceptsFile ? "multipart/form-data" : "application/json"]: {
                schema: acceptsFile
                  ? {
                      type: "object",
                      required: ["file"],
                      properties: {
                        file: { type: "string", format: "binary" },
                      },
                      additionalProperties: true,
                    }
                  : {
                      type: "object",
                      additionalProperties: true,
                      description: "Consulte a resposta de validação da API para os campos exigidos.",
                    },
              },
            },
          },
        }
      : {}),
    responses: {
      200: { description: "Operação realizada com sucesso." },
      ...(writesBody ? { 201: { description: "Recurso criado com sucesso, quando aplicável." } } : {}),
      400: { description: "Dados inválidos." },
      ...(protectedRoute ? { 401: { description: "Token ausente, inválido ou expirado." } } : {}),
      500: { description: "Erro interno do servidor." },
    },
  };
}

function discoverExpressPaths() {
  const paths = {};
  for (const { basePath, tag, router } of routeRegistry) {
    const inheritedHandlers = [];
    for (const layer of router.stack || []) {
      if (!layer.route) {
        if (layer.name && layer.name !== "query" && layer.name !== "expressInit") {
          inheritedHandlers.push(layer.name);
        }
        continue;
      }
      if (!layer.route || typeof layer.route.path !== "string") continue;
      const fullPath = openApiPath(`${basePath}${layer.route.path === "/" ? "" : layer.route.path}`);
      paths[fullPath] ||= {};
      const handlers = [
        ...inheritedHandlers,
        ...layer.route.stack.map((routeLayer) => routeLayer.name),
      ];
      for (const method of Object.keys(layer.route.methods)) {
        paths[fullPath][method] = operationFor(method, fullPath, tag, handlers);
      }
    }
  }
  return paths;
}

const documentedSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "PlanejAI API",
      version: "1.0.0",
      description:
        "Documentação interativa da API PlanejAI. Cadastre um aluno, faça login e copie o `token` retornado. Para testar operações protegidas, clique em **Authorize** e informe somente o token (o prefixo Bearer é aplicado automaticamente).",
    },
    servers: [
      {
        url: "/",
        description: "Mesmo IP e porta usados para abrir esta documentação",
      },
    ],
    tags: [
      {
        name: "Cadastro",
        description: "Criação da conta do aluno e início da jornada no PlanejAI",
      },
      {
        name: "Autenticação",
        description: "Login, recuperação e alteração de senha",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Cole aqui o token retornado por POST /api/auth/login.",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["nome", "email"],
          properties: {
            nome: {
              type: "string",
              description: "Nome contendo somente letras e espaços.",
              example: "Maria Silva",
            },
            email: {
              type: "string",
              format: "email",
              description: "Deve ser único. Troque este valor a cada teste no Swagger.",
              example: "altere.para.um.email.unico@example.com",
            },
            senha: {
              type: "string",
              format: "password",
              minLength: 8,
              description:
                "Opcional. Deve ter ao menos 8 caracteres, uma letra maiúscula e um número. Quando omitida, uma senha temporária é gerada.",
              example: "PlanejAI2026",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 42 },
            id_usuario: { type: "integer", example: 42 },
            nome: { type: "string", example: "Maria Silva" },
            email: { type: "string", format: "email", example: "maria.silva@example.com" },
            tipo: { type: "string", example: "aluno" },
            senha_temporaria: { type: "integer", enum: [0, 1], example: 0 },
            ativo: { type: "integer", enum: [0, 1], example: 1 },
          },
        },
        RegisterResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Usuário criado com sucesso." },
            persistido_no_banco: {
              type: "boolean",
              example: true,
              description: "Só é verdadeiro após o registro ser relido da tabela usuarios.",
            },
            usuario: { $ref: "#/components/schemas/User" },
            senha_temporaria: {
              type: "string",
              nullable: true,
              description: "Retornada somente quando a senha não foi enviada no cadastro.",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "senha"],
          properties: {
            email: { type: "string", format: "email", example: "aluno@example.com" },
            senha: { type: "string", format: "password", example: "PlanejAI2026" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string", description: "JWT usado nas rotas protegidas." },
            usuario: { $ref: "#/components/schemas/User" },
            primeiro_acesso: { type: "boolean", example: false },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["senhaAtual", "novaSenha", "confirmarSenha"],
          properties: {
            senhaAtual: { type: "string", format: "password", example: "PlanejAI2026" },
            novaSenha: { type: "string", format: "password", minLength: 8, example: "NovaSenha2026" },
            confirmarSenha: { type: "string", format: "password", example: "NovaSenha2026" },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["token", "novaSenha", "confirmarSenha"],
          properties: {
            token: { type: "string", description: "Token de 64 caracteres recebido no link de recuperação." },
            novaSenha: { type: "string", format: "password", minLength: 8, example: "NovaSenha2026" },
            confirmarSenha: { type: "string", format: "password", example: "NovaSenha2026" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Email já cadastrado." },
          },
        },
      },
    },
  },
  apis: [require("path").join(__dirname, "../routes/*.js").replace(/\\/g, "/")],
});

const discoveredPaths = discoverExpressPaths();
const swaggerSpec = {
  ...documentedSpec,
  paths: Object.fromEntries(
    Object.entries(discoveredPaths).map(([path, operations]) => [
      path,
      { ...operations, ...(documentedSpec.paths?.[path] || {}) },
    ]),
  ),
};

module.exports = swaggerSpec;

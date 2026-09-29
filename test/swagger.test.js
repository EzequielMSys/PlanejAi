const test = require("node:test");
const assert = require("node:assert/strict");
const swaggerSpec = require("../src/config/swagger");
const routeRegistry = require("../src/config/routeRegistry");

function openApiPath(path) {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

test("documenta todos os métodos registrados no Express", () => {
  for (const { basePath, router } of routeRegistry) {
    for (const layer of router.stack || []) {
      if (!layer.route || typeof layer.route.path !== "string") continue;
      const path = openApiPath(`${basePath}${layer.route.path === "/" ? "" : layer.route.path}`);
      for (const method of Object.keys(layer.route.methods)) {
        assert.ok(swaggerSpec.paths[path]?.[method], `${method.toUpperCase()} ${path} ausente`);
      }
    }
  }
});

test("marca rotas protegidas e uploads corretamente", () => {
  assert.deepEqual(swaggerSpec.paths["/api/aprendizagem/resumo"].get.security, [
    { bearerAuth: [] },
  ]);
  assert.ok(
    swaggerSpec.paths["/api/atividade/upload"].post.requestBody.content[
      "multipart/form-data"
    ],
  );
});

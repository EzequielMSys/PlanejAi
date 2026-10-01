process.env.NODE_ENV = 'test';
const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const {
  registrationRateLimit,
} = require("../src/middlewares/platformMiddleware");

async function attempt(ip) {
  const req = { ip };
  const res = new EventEmitter();
  res.headers = {};
  res.setHeader = (name, value) => {
    res.headers[name] = value;
  };
  res.status = (status) => {
    res.statusCode = status;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  let accepted = false;
  await registrationRateLimit(req, res, () => {
    accepted = true;
    res.emit("finish");
  });
  return { accepted, res };
}

test("cadastro permite 5 tentativas e bloqueia a sexta por IP", async () => {
  const ip = `teste-${Date.now()}`;
  for (let index = 1; index <= 5; index += 1) {
    const result = await attempt(ip);
    assert.equal(result.accepted, true, `tentativa ${index} deveria passar`);
    assert.equal(result.res.headers["RateLimit-Limit"], "5");
  }

  const blocked = await attempt(ip);
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.ok(Number(blocked.res.headers["Retry-After"]) > 0);
  assert.match(blocked.res.body.error, /Limite de cadastros excedido/);
});

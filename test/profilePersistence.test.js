const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(file, dependencies) {
  const context = { module: { exports: {} }, console, require: key => {
    if (!(key in dependencies)) throw new Error(`Unexpected dependency: ${key}`);
    return dependencies[key];
  } };
  vm.runInNewContext(fs.readFileSync(require.resolve(file), 'utf8'), context);
  return context.module.exports;
}

test('availability queries remain valid with MySQL ANSI_QUOTES enabled', async () => {
  const queries = [];
  const pool = { execute: async (sql, values) => {
    // ANSI_QUOTES interprets double-quoted tokens as column names, not weekdays.
    assert.doesNotMatch(sql, /"(?:DOM|SEG|TER|QUA|QUI|SEX|SAB)"/);
    assert.match(sql, /FIELD\([^)]*'DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'/);
    queries.push({ sql, values });
    return [[]];
  } };
  const model = load('../src/models/disponibilidadeSemanaModel', {
    '../config/db': pool, './perfilEstudoModel': {},
  });
  await model.obterDisponibilidade(101);
  await model.obterDisponibilidadePorUsuario(101);
  assert.equal(queries.length, 3);
});

test('profile endpoints use the authenticated user ID even when profile IDs differ', async () => {
  const calls = [];
  const days = [{ id_perfil: 9, dia_semana: 'SEG' }];
  const controller = load('../src/controllers/perfilController', {
    '../models/perfilEstudoModel': { obterPerfilPorUsuario: async id => {
      assert.equal(id, 101);
      return { id_perfil: 9, id_usuario: id, areas_foco: 'Matemática' };
    } },
    '../models/disponibilidadeSemanaModel': {
      obterDisponibilidadePorUsuario: async id => { calls.push(id); return days; },
      obterDisponibilidade: async () => { throw new Error('Ambiguous ID lookup'); },
    },
  });
  const responses = [];
  const res = { json: data => responses.push(data) };
  await controller.obterPerfilCompleto({ usuario: { id: 101 } }, res);
  await controller.obterDisponibilidade({ usuario: { id: 101 } }, res);
  assert.deepEqual(calls, [101, 101]);
  assert.equal(responses[0].disponibilidade, days);
  assert.equal(responses[1], days);
});

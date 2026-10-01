const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sortMigrations } = require('../src/scripts/migrationUtils');

test('ordena todas as migrations e mantém dependências do motor de estudo', () => {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'));
  const ordered = sortMigrations(files);

  assert.deepEqual(new Set(ordered), new Set(files));
  assert.equal(ordered[0], '000_base_schema.sql');
  assert.ok(ordered.indexOf('add_learning_engine.sql') < ordered.indexOf('add_learning_progress.sql'));
  assert.ok(ordered.indexOf('add_learning_engine.sql') < ordered.indexOf('add_cronograma_progression.sql'));
  assert.ok(ordered.includes('add_study_intelligence.sql'));
  assert.ok(ordered.indexOf('add_exam_catalog_v7.sql') < ordered.indexOf('activities_2_0_v8.sql'));
  assert.ok(ordered.indexOf('activities_2_0_v8.sql') < ordered.indexOf('activities_2_0_drafts_v9.sql'));
});

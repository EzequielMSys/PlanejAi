const fs = require('fs');

const migrationOrder = [
  'add_auth_fields.sql',
  'add_perfil_and_owner_fields.sql',
  'add_pedagogical_activities.sql',
  'add_activity_assignment.sql',
  'add_content_materials.sql',
  'add_avisos.sql',
  'add_redacao_review.sql',
  'add_redacao_enem_analysis.sql',
  'expand_areas_foco_schema.sql',
  'fix_cronograma_schema.sql',
  'add_learning_engine.sql'
];

function sortMigrations(files) {
  return [...files].sort((left, right) => {
    const leftIndex = migrationOrder.indexOf(left);
    const rightIndex = migrationOrder.indexOf(right);
    const leftRank = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const rightRank = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    return leftRank - rightRank || left.localeCompare(right);
  });
}

function readStatements(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function isAlreadyAppliedError(error) {
  return error.errno === 121 || [
    'ER_TABLE_EXISTS_ERROR',
    'ER_DUP_FIELDNAME',
    'ER_DUP_KEYNAME',
    'ER_FK_DUP_NAME'
  ].includes(error.code) || /already exists|duplicate column name|duplicate key name|errno:\s*121/i.test(error.message || '');
}

module.exports = { isAlreadyAppliedError, readStatements, sortMigrations };

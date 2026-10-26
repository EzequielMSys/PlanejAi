const fs = require('fs');

const migrationOrder = [
  '000_base_schema.sql',
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
  'add_learning_engine.sql',
  'add_cronograma_progression.sql',
  'add_learning_progress.sql',
  'add_study_intelligence.sql',
  'add_adaptive_learning_v1_v2.sql',
  'add_adaptive_v2_goals.sql',
  'add_collaborative_learning_v3.sql',
  'add_learning_paths_v3.sql',
  'add_classes_v4.sql',
  'enhance_peer_review_v5.sql',
  'enhance_essay_portfolio_v6.sql',
  'add_exam_catalog_v7.sql',
  'activities_2_0_v8.sql',
  'activities_2_0_drafts_v9.sql',
  'operational_resilience_v10.sql',
  'add_exam_session_features_v11.sql',
  'security_session_version_v12.sql',
  'persistent_rate_limits_v13.sql',
    'persist_cronograma_assessment_answers_v14.sql',
  'persist_study_notes_v15.sql',
  'add_ia_chatbot_v17.sql',
  'field_web_vitals_v18.sql',
  'user_pronouns_v19.sql',
  'expand_user_pronouns_v20.sql',
  'study_continuity_v21.sql',
  'remove_unused_birth_date_v22.sql',
  'operation_support_v23.sql',
  'learning_journal_v24.sql',
  'session_closure_v25.sql',
  'personal_desk_v26.sql',
  'feedback_context_v51.sql',
  'reading_and_conversations_v53.sql',
  'highlight_reviews_v55.sql',
  'flashcard_library_v57.sql',
  'flashcard_history_v59.sql',
  'flashcard_objectives_v61.sql',
  'flashcard_collection_edit_v63.sql'
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

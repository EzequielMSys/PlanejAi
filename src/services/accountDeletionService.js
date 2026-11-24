const bcrypt = require('bcrypt');
const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../config/db');
const { uploadsRoot, usarBlobPrivado } = require('./uploadStorageService');

// These tables contain an account ID without a foreign key. New migrations
// must be reviewed before deletion is offered for another account type.
const directTables = [
  'anotacoes_estudo', 'auditoria_api', 'caderno_erros', 'checkins_estudo',
  'cronograma_avaliacoes', 'diagnosticos_estudo', 'diario_passos', 'dominio_competencias',
  'flashcard_colecao_itens', 'flashcards_estudo', 'grupos_dinamicos_membros', 'idempotencia_api',
  'limites_ia', 'mensagens_chat_ia', 'metas_por_materia', 'metas_semanais_estudo',
  'missoes_estudo', 'privacidade_aprendizagem', 'projetos_redacao',
  'provas_planejadas', 'redacao_versoes', 'revisoes_estudo', 'rotinas_estudo',
  'sessoes_estudo', 'sessoes_guiadas', 'simulados_catalogo',
  'tentativas_questoes', 'trilhas_aprendizagem',
];
const manualTables = new Set(['perfil_estudo', 'redacoes', 'respostas_usuario']);

async function assertSchemaCoverage(connection) {
  const [rows] = await connection.query(`SELECT c.TABLE_NAME AS table_name,
    COALESCE(r.DELETE_RULE, 'NONE') AS delete_rule
    FROM information_schema.COLUMNS c
    LEFT JOIN information_schema.KEY_COLUMN_USAGE k ON k.TABLE_SCHEMA = c.TABLE_SCHEMA
      AND k.TABLE_NAME = c.TABLE_NAME AND k.COLUMN_NAME = c.COLUMN_NAME
      AND k.REFERENCED_TABLE_NAME = 'usuarios'
    LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
    WHERE c.TABLE_SCHEMA = DATABASE() AND c.COLUMN_NAME = 'id_usuario'
      AND c.TABLE_NAME <> 'usuarios'`);
  const missing = rows.filter(row => !directTables.includes(row.table_name)
    && !manualTables.has(row.table_name) && row.delete_rule !== 'CASCADE');
  if (missing.length) throw new Error(`Exclusão exige revisão do esquema: ${missing.map(row => row.table_name).join(', ')}`);
}

function profilePath(url) {
  if (!url) return null;
  const match = /^\/uploads\/perfis\/([a-zA-Z0-9_.-]+)$/.exec(url);
  if (!match || match[1].startsWith('.')) throw new Error('Arquivo de perfil inválido.');
  return `perfis/${match[1]}`;
}

async function removeProfileFile(relative) {
  if (!relative) return;
  if (usarBlobPrivado()) {
    await require('@vercel/blob').del(`planejai/${relative}`);
    return;
  }
  const root = uploadsRoot();
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error('Caminho inválido.');
  await fs.unlink(absolute).catch(error => { if (error.code !== 'ENOENT') throw error; });
}

async function deleteStudentAccount(id, password, dependencies = {}) {
  const db = dependencies.db || pool;
  const removeFile = dependencies.removeFile || removeProfileFile;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[account]] = await connection.execute(
      'SELECT id_usuario, tipo, senha, foto_url, banner_url FROM usuarios WHERE id_usuario = ? FOR UPDATE', [id]);
    if (!account) { await connection.rollback(); return { status: 'missing' }; }
    if (account.tipo !== 'aluno') { await connection.rollback(); return { status: 'unsupported' }; }
    if (!password || !await bcrypt.compare(password, account.senha)) { await connection.rollback(); return { status: 'invalid_password' }; }

    // A student cannot own a class. Fail closed if a legacy account does.
    const [[ownedClass]] = await connection.execute('SELECT id_turma FROM turmas WHERE criado_por = ? LIMIT 1', [id]);
    if (ownedClass) { await connection.rollback(); return { status: 'owned_class' }; }
    await assertSchemaCoverage(connection);

    await connection.execute(`DELETE cc FROM cronograma_conteudos cc
      JOIN cronograma_dias cd ON cd.id_dia = cc.id_dia
      JOIN cronogramas c ON c.id_cronograma = cd.id_cronograma
      JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?`, [id]);
    await connection.execute(`DELETE cd FROM cronograma_dias cd
      JOIN cronogramas c ON c.id_cronograma = cd.id_cronograma
      JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?`, [id]);
    await connection.execute('DELETE c FROM cronogramas c JOIN perfil_estudo p ON p.id_perfil = c.id_perfil WHERE p.id_usuario = ?', [id]);
    await connection.execute('DELETE d FROM disponibilidade_semana d JOIN perfil_estudo p ON p.id_perfil = d.id_perfil WHERE p.id_usuario = ?', [id]);
    await connection.execute('DELETE FROM perfil_estudo WHERE id_usuario = ?', [id]);

    await connection.execute('DELETE FROM redacao_anotacoes WHERE criado_por = ?', [id]);
    await connection.execute('DELETE FROM redacoes WHERE id_usuario = ?', [id]);
    await connection.execute('DELETE FROM respostas_usuario WHERE id_usuario = ?', [id]);
    await connection.execute('DELETE FROM revisoes_pares WHERE id_autor = ? OR id_revisor = ?', [id, id]);
    await connection.execute('DELETE FROM denuncias_revisao WHERE denunciado_por = ?', [id]);
    await connection.execute('DELETE FROM intervencoes_pedagogicas WHERE id_aluno = ?', [id]);

    for (const table of directTables) {
      await connection.execute(`DELETE FROM \`${table}\` WHERE id_usuario = ?`, [id]);
    }
    const [deleted] = await connection.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    if (deleted.affectedRows !== 1) throw new Error('A conta mudou durante a exclusão.');

    // File deletion is attempted before commit. A failure rolls back the DB.
    // A very rare commit failure after unlink needs operator remediation.
    for (const relative of new Set([profilePath(account.foto_url), profilePath(account.banner_url)].filter(Boolean))) {
      await removeFile(relative);
    }
    await connection.commit();
    return { status: 'deleted' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { deleteStudentAccount, profilePath, directTables };

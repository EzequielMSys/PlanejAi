// Run explicitly with `node test/accountDeletionIntegration.js`.
// Creates and removes only a randomly named local test schema.
require('dotenv').config();
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const getDatabaseOptions = require('../src/config/databaseOptions');

async function main() {
  const original = getDatabaseOptions();
  if (!['localhost', '127.0.0.1', '::1'].includes(original.host)) {
    throw new Error('O teste de exclusão exige MariaDB local.');
  }
  const schema = `planejai_delete_test_${crypto.randomBytes(5).toString('hex')}`;
  process.env.DB_NAME = schema;
  const { database: ignored, ...serverOptions } = original;
  const admin = await mysql.createConnection(serverOptions);
  let pool;
  let imagePath;
  try {
    await require('../src/scripts/garantirTabelas')();
    pool = require('../src/config/db');
    const password = 'SenhaDescartavel2026!';
    const hash = await bcrypt.hash(password, 10);
    const file = `perfil-delete-test-${crypto.randomBytes(6).toString('hex')}.png`;
    imagePath = path.join(__dirname, '..', 'uploads', 'perfis', file);
    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.writeFile(imagePath, Buffer.from('temporary test file'));
    const [insert] = await pool.execute(
      'INSERT INTO usuarios (nome,email,senha,tipo,ativo,foto_url) VALUES (?,?,?,?,1,?)',
      ['Conta Descartavel', `${schema}@example.invalid`, hash, 'aluno', `/uploads/perfis/${file}`]);
    const id = insert.insertId;
    const [profile] = await pool.execute('INSERT INTO perfil_estudo (id_usuario,areas_foco) VALUES (?,?)', [id, 'Matemática']);
    await pool.execute('INSERT INTO disponibilidade_semana (id_perfil,dia_semana) VALUES (?,?)', [profile.insertId, 'SEG']);
    const [plan] = await pool.execute('INSERT INTO cronogramas (id_perfil,data_inicio) VALUES (?,CURRENT_DATE)', [profile.insertId]);
    await pool.execute('INSERT INTO cronograma_dias (id_cronograma,data_estudo) VALUES (?,CURRENT_DATE)', [plan.insertId]);
    await pool.execute('INSERT INTO mensagens_chat_ia (id_usuario,role,conteudo) VALUES (?,\'user\',?)', [id, 'Teste privado']);
    await pool.execute('INSERT INTO redacoes (id_usuario,tema,texto) VALUES (?,?,?)', [id, 'Teste', 'Texto privado']);
    await pool.execute('INSERT INTO suporte_solicitacoes (id_usuario,categoria,mensagem) VALUES (?,\'EXCLUSAO\',?)', [id, 'Pedido de teste']);

    const deletion = require('../src/services/accountDeletionService');
    assert.equal((await deletion.deleteStudentAccount(id, 'errada')).status, 'invalid_password');
    await assert.rejects(deletion.deleteStudentAccount(id, password, {
      removeFile: async () => { throw new Error('Armazenamento indisponível'); },
    }), /Armazenamento indisponível/);
    const [[kept]] = await pool.execute('SELECT COUNT(*) AS total FROM usuarios WHERE id_usuario = ?', [id]);
    assert.equal(kept.total, 1, 'falha no arquivo precisa reverter o banco');
    assert.equal((await deletion.deleteStudentAccount(id, password)).status, 'deleted');
    for (const table of ['usuarios', 'perfil_estudo', 'disponibilidade_semana', 'cronogramas', 'cronograma_dias', 'mensagens_chat_ia', 'redacoes', 'suporte_solicitacoes']) {
      const [[row]] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      assert.equal(row.total, 0, `${table} ainda contém dados`);
    }
    const [ownedTables] = await pool.query(`SELECT TABLE_NAME AS name FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'id_usuario' AND TABLE_NAME <> 'usuarios'`);
    for (const { name } of ownedTables) {
      const [[row]] = await pool.execute(`SELECT COUNT(*) AS total FROM \`${name}\` WHERE id_usuario = ?`, [id]);
      assert.equal(row.total, 0, `${name} manteve o identificador da conta`);
    }
    await assert.rejects(fs.stat(imagePath), { code: 'ENOENT' });
    console.log('Conta, dados relacionados e arquivo removidos no banco isolado.');
  } finally {
    if (pool) await pool.end();
    if (imagePath) await fs.rm(imagePath, { force: true });
    if (!/^planejai_delete_test_[a-f0-9]{10}$/.test(schema)) throw new Error('Nome de teste inválido.');
    await admin.query(`DROP DATABASE IF EXISTS \`${schema}\``);
    await admin.end();
  }
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });

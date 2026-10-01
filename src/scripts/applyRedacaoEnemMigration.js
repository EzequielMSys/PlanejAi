/**
 * Script para aplicar a migration de análise ENEM de redação.
 *
 * Executa: node src/scripts/applyRedacaoEnemMigration.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function aplicarMigration() {
  const filePath = path.join(__dirname, '..', '..', 'migrations', 'add_redacao_enem_analysis.sql');
  const sql = fs.readFileSync(filePath, 'utf8');

  // Divide o SQL em comandos individuais (por ponto e vírgula, ignorando comentários)
  const comandos = sql
    .split(';')
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && !c.startsWith('--'));

  for (const comando of comandos) {
    if (comando.startsWith('--')) continue;

    try {
      await pool.query(comando);
      console.log('Comando executado com sucesso.');
    } catch (err) {
      // Se a coluna já existir, ignora o erro (IF NOT EXISTS nem sempre é suportado por todas versões)
      if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column')) {
        console.log('Coluna já existe, ignorando:', err.message);
      } else if (err.code === 'ER_DUP_KEYNAME') {
        console.log('Chave já existe, ignorando.');
      } else {
        console.error('Erro ao executar comando:', err.message);
      }
    }
  }

  await pool.end();
  console.log('Migration de análise ENEM aplicada com sucesso.');
}

aplicarMigration().catch((err) => {
  console.error('Falha ao aplicar migration:', err);
  process.exit(1);
});

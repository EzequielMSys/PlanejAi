// Executado somente pelo workflow privado em credenciais, com artefatos criptografados.
const fs = require('node:fs/promises');
const path = require('node:path');
const { exportBackup, restoreBackup } = require('./portableBackup');
const databaseOptions = require('../config/databaseOptions');

async function run() {
  if (!process.env.DATABASE_URL || !process.env.DB_SSL_CA_BASE64 || process.env.DB_SSL_MODE !== 'verify-full') {
    throw new Error('Configure os secrets de origem e a CA; TLS verificado é obrigatório.');
  }
  const destination = databaseOptions.fromDatabaseUrl(process.env.RESTORE_DATABASE_URL || '');
  // A verificação usa apenas o serviço descartável do próprio runner.
  if (!['127.0.0.1', 'localhost'].includes(destination.host)) throw new Error('A verificação deve usar o MySQL isolado do runner.');
  delete destination.ssl;
  const file = path.resolve('backups/external/database.pnai');
  const exported = await exportBackup(databaseOptions({ connectTimeout: 20000 }), file, process.env.BACKUP_ENCRYPTION_KEY);
  const restored = await restoreBackup(destination, file, process.env.BACKUP_ENCRYPTION_KEY);
  if (restored.tables !== exported.tables || restored.rows !== exported.rows) throw new Error('Restauração divergente.');
  const manifest = { ...exported, restoreVerified: true, restoredAt: restored.restoredAt, verification: restored.verified };
  await fs.writeFile(path.join(path.dirname(file), 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  console.log(JSON.stringify(manifest));
}
if (require.main === module) run().catch(error => {
  // Não registrar SQL, registros pessoais, URI ou senha em logs públicos.
  console.error('[BACKUP] Falhou a cópia ou sua restauração:', error.code || 'CONFIGURATION_OR_VERIFICATION_FAILED');
  process.exitCode = 1;
});
module.exports = { run };

require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('Aplicando migration: expand_areas_foco_schema...');

    // Verifica o tipo atual da coluna
    const [columns] = await conn.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'perfil_estudo' AND COLUMN_NAME = 'areas_foco'`,
      [process.env.DB_NAME]
    );

    if (columns.length === 0) {
      console.log('Coluna areas_foco não encontrada. Nada a fazer.');
    } else {
      const typeAtual = (columns[0].COLUMN_TYPE || '').toUpperCase();
      console.log(`Tipo atual de areas_foco: ${typeAtual}`);

      if (typeAtual.includes('VARCHAR(100)')) {
        await conn.query(
          'ALTER TABLE perfil_estudo MODIFY COLUMN areas_foco VARCHAR(500) NULL'
        );
        console.log('  + areas_foco expandido para VARCHAR(500)');
      } else {
        console.log('  = areas_foco já está com tamanho suficiente ou diferente.');
      }
    }

    console.log('Migration concluída!');
  } catch (error) {
    console.error('Erro ao aplicar migration:', error.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();


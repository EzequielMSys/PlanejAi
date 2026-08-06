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
    console.log('Aplicando migration: add_redacao_review...');

    // Verifica se as colunas já existem
    const [columns] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'redacoes'`,
      [process.env.DB_NAME]
    );

    const colunasExistentes = new Set(columns.map((c) => c.COLUMN_NAME));

    const alteracoes = [
      ['nota_manual', "`nota_manual` decimal(4,2) DEFAULT NULL AFTER `feedback_ia`"],
      ['feedback_manual', "`feedback_manual` text DEFAULT NULL AFTER `nota_manual`"],
      ['avaliado_por', "`avaliado_por` int(11) DEFAULT NULL AFTER `feedback_manual`"],
      ['erros_texto', "`erros_texto` text DEFAULT NULL AFTER `avaliado_por`"],
      ['sugestoes', "`sugestoes` text DEFAULT NULL AFTER `erros_texto`"],
      ['flag_ia', "`flag_ia` tinyint(1) DEFAULT 0 AFTER `sugestoes`"]
    ];

    let aplicou = false;

    for (const [nome, definicao] of alteracoes) {
      if (!colunasExistentes.has(nome)) {
        await conn.query(`ALTER TABLE redacoes ADD COLUMN ${definicao}`);
        console.log(`  + Coluna ${nome} adicionada`);
        aplicou = true;
      } else {
        console.log(`  = Coluna ${nome} já existe`);
      }
    }

    if (aplicou) {
      console.log('Migration aplicada com sucesso!');
    } else {
      console.log('Nenhuma alteração necessária (tudo já aplicado).');
    }
  } catch (error) {
    console.error('Erro ao aplicar migration:', error.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();

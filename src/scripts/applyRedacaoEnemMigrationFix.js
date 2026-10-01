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
    console.log('Aplicando colunas de análise ENEM em redacoes...');

    // Verifica colunas existentes
    const [columns] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'redacoes'",
      [process.env.DB_NAME]
    );
    const existentes = new Set(columns.map((c) => c.COLUMN_NAME));

    const alteracoes = [
      // Expande nota_estimada e nota_manual para suportar 0-1000
      ['nota_estimada', 'MODIFY COLUMN nota_estimada decimal(6,2) DEFAULT NULL'],
      ['nota_manual', 'MODIFY COLUMN nota_manual decimal(6,2) DEFAULT NULL'],
      // Adiciona colunas de análise ENEM
      ['competencias_enem', "ADD COLUMN competencias_enem text DEFAULT NULL AFTER flag_ia"],
      ['repertorio_sugerido', "ADD COLUMN repertorio_sugerido text DEFAULT NULL AFTER competencias_enem"],
      ['ia_nivel', "ADD COLUMN ia_nivel varchar(20) DEFAULT NULL AFTER repertorio_sugerido"],
      ['ia_evidencias', "ADD COLUMN ia_evidencias text DEFAULT NULL AFTER ia_nivel"],
      ['texto_corrigido', "ADD COLUMN texto_corrigido text DEFAULT NULL AFTER ia_evidencias"]
    ];

    let aplicou = false;

    for (const [nome, definicao] of alteracoes) {
      try {
        if (nome === 'nota_estimada' || nome === 'nota_manual') {
          // Para MODIFY, sempre executa (coluna já existe)
          await conn.query(`ALTER TABLE redacoes ${definicao}`);
          console.log(`  ~ Coluna ${nome} modificada`);
          aplicou = true;
        } else if (!existentes.has(nome)) {
          await conn.query(`ALTER TABLE redacoes ${definicao}`);
          console.log(`  + Coluna ${nome} adicionada`);
          aplicou = true;
        } else {
          console.log(`  = Coluna ${nome} já existe`);
        }
      } catch (err) {
        console.log(`  ! Erro em ${nome}: ${err.message}`);
      }
    }

    if (aplicou) {
      console.log('Migration de análise ENEM aplicada com sucesso!');
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

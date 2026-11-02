const pool = require('../config/db');
const questionBank = require('../data/questionBank');
const { seedConteudos } = require('./seedConteudos');
const syncExamCatalog = require('./syncExamCatalog');

const seedQuestoes = require('../services/questionBankSync').createQuestionBankSync(pool, questionBank);

async function seedDatabase() {
  const conteudos = await seedConteudos();
  const questoes = await seedQuestoes();
  const catalogo = await syncExamCatalog();
  return { conteudos, questoes, catalogo };
}

module.exports = seedDatabase;

if (require.main === module) {
  seedDatabase()
    .then(() => pool.end())
    .catch((error) => {
      console.error('[SEED] Falha:', error.message);
      process.exitCode = 1;
    });
}

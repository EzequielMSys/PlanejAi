const pool = require('../config/db');
const questionBank = require('../data/questionBank');
const { seedConteudos } = require('./seedConteudos');

async function seedQuestoes() {
  const [rows] = await pool.query('SELECT enunciado FROM questoes_estudo');
  const existentes = new Set(rows.map((row) => row.enunciado));
  let inseridas = 0;

  for (const questao of questionBank) {
    if (existentes.has(questao.enunciado)) continue;
    await pool.execute(
      `INSERT INTO questoes_estudo
       (disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade, origem, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        questao.disciplina,
        questao.competencia || null,
        questao.enunciado,
        JSON.stringify(questao.alternativas),
        questao.resposta,
        questao.explicacao,
        questao.dificuldade || 'MEDIA',
        questao.origem || 'PlanejAI'
      ]
    );
    existentes.add(questao.enunciado);
    inseridas += 1;
  }

  console.log(`[SEED] ${inseridas} questões essenciais inseridas.`);
  return inseridas;
}

async function seedDatabase() {
  const conteudos = await seedConteudos();
  const questoes = await seedQuestoes();
  return { conteudos, questoes };
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

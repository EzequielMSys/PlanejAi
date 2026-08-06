require('dotenv').config();
const pool = require('../config/db');

// Conteúdos de exemplo para as principais áreas de foco
const conteudos = [
  // Matemática (área: Exatas)
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Funções do 1º grau', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=funcoes+primeiro+grau', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Equações do 2º grau', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=equacao+segundo+grau', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Geometria plana', tipo: 'PDF', link: 'https://www.google.com/search?q=geometria+plana+pdf+exercicios', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Trigonometria', tipo: 'LIVRO', link: 'https://www.google.com/search?q=trigonometria+livro', nivel: 'INTERMEDIARIO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Probabilidade', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=probabilidade+enem+artigo', nivel: 'INTERMEDIARIO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Estatística básica', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=estatistica+basica', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Matrizes e determinantes', tipo: 'PDF', link: 'https://www.google.com/search?q=matrizes+determinantes+pdf', nivel: 'AVANCADO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Progressões aritméticas', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=progressao+aritmetica', nivel: 'BASICO' },

  // Português (área: Linguística / Letras)
  { area: 'Linguística', disciplina: 'Português', titulo: 'Interpretação de texto', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=interpretacao+de+texto+pdf', nivel: 'BASICO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Concordância verbal', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=concordancia+verbal', nivel: 'BASICO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Regência verbal e nominal', tipo: 'PDF', link: 'https://www.google.com/search?q=regencia+verbal+nominal+pdf', nivel: 'INTERMEDIARIO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Figuras de linguagem', tipo: 'LIVRO', link: 'https://www.google.com/search?q=figuras+de+linguagem+livro', nivel: 'BASICO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Redação dissertativa', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=redacao+dissertativa+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Ortografia e acentuação', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=ortografia+acentuacao', nivel: 'BASICO' },
  { area: 'Letras', disciplina: 'Português', titulo: 'Coesão e coerência textual', tipo: 'PDF', link: 'https://www.google.com/search?q=coesao+coerencia+textual+pdf', nivel: 'AVANCADO' },
  { area: 'Letras', disciplina: 'Português', titulo: 'Gêneros textuais', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=generos+textuais+artigo', nivel: 'BASICO' }
];

async function run() {
  const [existeTabela] = await pool.query('SELECT COUNT(*) AS total FROM conteudos');
  if (existeTabela[0].total > 0) {
    console.log(`Já existem ${existeTabela[0].total} conteúdos. Nada a fazer.`);
    process.exit(0);
  }

  let inseridos = 0;
  for (const c of conteudos) {
    try {
      await pool.execute(
        `INSERT INTO conteudos (area, disciplina, titulo, tipo, link, nivel)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.area, c.disciplina, c.titulo, c.tipo, c.link, c.nivel]
      );
      inseridos++;
    } catch (error) {
      console.log('Erro ao inserir:', c.titulo, '-', error.message);
    }
  }

  console.log(`Seed concluído. ${inseridos} conteúdos inseridos.`);
  process.exit(0);
}

run().catch((error) => {
  console.error('Erro:', error.message);
  process.exit(1);
});

require('dotenv').config();
const pool = require('../config/db');

// Conteúdos de exemplo para as principais áreas de foco
// Agora cobrindo todas as matérias comuns de vestibular
const conteudos = [
  // ===== Matemática (área: Exatas) =====
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Funções do 1º grau', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=funcoes+primeiro+grau', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Equações do 2º grau', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=equacao+segundo+grau', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Geometria plana', tipo: 'PDF', link: 'https://www.google.com/search?q=geometria+plana+pdf+exercicios', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Trigonometria', tipo: 'LIVRO', link: 'https://www.google.com/search?q=trigonometria+livro', nivel: 'INTERMEDIARIO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Probabilidade', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=probabilidade+enem+artigo', nivel: 'INTERMEDIARIO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Estatística básica', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=estatistica+basica', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Matrizes e determinantes', tipo: 'PDF', link: 'https://www.google.com/search?q=matrizes+determinantes+pdf', nivel: 'AVANCADO' },
  { area: 'Exatas', disciplina: 'Matemática', titulo: 'Progressões aritméticas', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=progressao+aritmetica', nivel: 'BASICO' },

  // ===== Física (área: Exatas) =====
  { area: 'Exatas', disciplina: 'Física', titulo: 'Mecânica: cinemática', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=cinematica+enem', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Física', titulo: 'Leis de Newton', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=leis+de+newton', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Física', titulo: 'Trabalho e energia', tipo: 'PDF', link: 'https://www.google.com/search?q=trabalho+energia+enem+pdf', nivel: 'INTERMEDIARIO' },
  { area: 'Exatas', disciplina: 'Física', titulo: 'Eletricidade básica', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=eletricidade+enem+artigo', nivel: 'INTERMEDIARIO' },
  { area: 'Exatas', disciplina: 'Física', titulo: 'Termodinâmica', tipo: 'LIVRO', link: 'https://www.google.com/search?q=termodinamica+enem+livro', nivel: 'AVANCADO' },
  { area: 'Exatas', disciplina: 'Física', titulo: 'Ondulatória', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=ondulatoria+enem', nivel: 'INTERMEDIARIO' },

  // ===== Química (área: Exatas) =====
  { area: 'Exatas', disciplina: 'Química', titulo: 'Estequiometria', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=estequiometria+enem', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Química', titulo: 'Tabela periódica', tipo: 'PDF', link: 'https://www.google.com/search?q=tabela+periodica+enem+pdf', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Química', titulo: 'Ligações químicas', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=ligacoes+quimicas+enem', nivel: 'BASICO' },
  { area: 'Exatas', disciplina: 'Química', titulo: 'Reações orgânicas', tipo: 'LIVRO', link: 'https://www.google.com/search?q=reacoes+organicas+enem+livro', nivel: 'INTERMEDIARIO' },
  { area: 'Exatas', disciplina: 'Química', titulo: 'Equilíbrio químico', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=equilibrio+quimico', nivel: 'AVANCADO' },

  // ===== Biologia (área: Biológicas) =====
  { area: 'Biológicas', disciplina: 'Biologia', titulo: 'Citologia e células', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=citologia+celsulas+enem', nivel: 'BASICO' },
  { area: 'Biológicas', disciplina: 'Biologia', titulo: 'Genética', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=genetica+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Biológicas', disciplina: 'Biologia', titulo: 'Ecologia', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=ecologia+enem+artigo', nivel: 'BASICO' },
  { area: 'Biológicas', disciplina: 'Biologia', titulo: 'Fisiologia humana', tipo: 'LIVRO', link: 'https://www.google.com/search?q=fisiologia+humana+enem+livro', nivel: 'INTERMEDIARIO' },
  { area: 'Biológicas', disciplina: 'Biologia', titulo: 'Evolução', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=evolucao+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Biológicas', disciplina: 'Biologia', titulo: 'Bioquímica', tipo: 'PDF', link: 'https://www.google.com/search?q=bioquimica+enem+pdf', nivel: 'AVANCADO' },

  // ===== Português (área: Linguística / Letras) =====
  { area: 'Linguística', disciplina: 'Português', titulo: 'Interpretação de texto', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=interpretacao+de+texto+pdf', nivel: 'BASICO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Concordância verbal', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=concordancia+verbal', nivel: 'BASICO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Regência verbal e nominal', tipo: 'PDF', link: 'https://www.google.com/search?q=regencia+verbal+nominal+pdf', nivel: 'INTERMEDIARIO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Figuras de linguagem', tipo: 'LIVRO', link: 'https://www.google.com/search?q=figuras+de+linguagem+livro', nivel: 'BASICO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Redação dissertativa', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=redacao+dissertativa+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Linguística', disciplina: 'Português', titulo: 'Ortografia e acentuação', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=ortografia+acentuacao', nivel: 'BASICO' },
  { area: 'Letras', disciplina: 'Português', titulo: 'Coesão e coerência textual', tipo: 'PDF', link: 'https://www.google.com/search?q=coesao+coerencia+textual+pdf', nivel: 'AVANCADO' },
  { area: 'Letras', disciplina: 'Português', titulo: 'Gêneros textuais', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=generos+textuais+artigo', nivel: 'BASICO' },

  // ===== Literatura (área: Letras) =====
  { area: 'Letras', disciplina: 'Literatura', titulo: 'Modernismo brasileiro', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=modernismo+brasileiro+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Letras', disciplina: 'Literatura', titulo: 'Romantismo', tipo: 'LIVRO', link: 'https://www.google.com/search?q=romantismo+brasileiro+livro', nivel: 'BASICO' },
  { area: 'Letras', disciplina: 'Literatura', titulo: 'Realismo', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=realismo+literatura+enem', nivel: 'BASICO' },
  { area: 'Letras', disciplina: 'Literatura', titulo: 'Escolas literárias', tipo: 'PDF', link: 'https://www.google.com/search?q=escolas+literarias+enem+pdf', nivel: 'BASICO' },

  // ===== Redação (área: Letras) =====
  { area: 'Letras', disciplina: 'Redação', titulo: 'Estrutura da redação dissertativa', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=estrutura+redacao+dissertativa+enem', nivel: 'BASICO' },
  { area: 'Letras', disciplina: 'Redação', titulo: 'Repertório sociocultural', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=repertorio+sociocultural+redacao', nivel: 'INTERMEDIARIO' },
  { area: 'Letras', disciplina: 'Redação', titulo: 'Competências do ENEM', tipo: 'PDF', link: 'https://www.google.com/search?q=competencias+redacao+enem+pdf', nivel: 'BASICO' },

  // ===== Inglês (área: Linguística) =====
  { area: 'Linguística', disciplina: 'Inglês', titulo: 'Interpretação de textos em inglês', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=interpretacao+textos+ingles+enem', nivel: 'BASICO' },
  { area: 'Linguística', disciplina: 'Inglês', titulo: 'Tempos verbais', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=tempos+verbais+ingles', nivel: 'INTERMEDIARIO' },
  { area: 'Linguística', disciplina: 'Inglês', titulo: 'Vocabulário essencial', tipo: 'PDF', link: 'https://www.google.com/search?q=vocabulario+ingles+enem+pdf', nivel: 'BASICO' },

  // ===== História (área: Humanas) =====
  { area: 'Humanas', disciplina: 'História', titulo: 'Brasil Colônia', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=brasil+colonia+enem', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'História', titulo: 'Era Vargas', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=era+vargas+enem+artigo', nivel: 'INTERMEDIARIO' },
  { area: 'Humanas', disciplina: 'História', titulo: 'Ditadura militar', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=ditadura+militar+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Humanas', disciplina: 'História', titulo: 'Revolução Industrial', tipo: 'LIVRO', link: 'https://www.google.com/search?q=revolucao+industrial+enem+livro', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'História', titulo: 'Guerra Fria', tipo: 'PDF', link: 'https://www.google.com/search?q=guerra+fria+enem+pdf', nivel: 'INTERMEDIARIO' },

  // ===== Geografia (área: Humanas) =====
  { area: 'Humanas', disciplina: 'Geografia', titulo: 'Geopolítica mundial', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=geopolitica+mundial+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Humanas', disciplina: 'Geografia', titulo: 'Climatologia', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=climatologia+enem', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'Geografia', titulo: 'Urbanização', tipo: 'LIVRO', link: 'https://www.google.com/search?q=urbanizacao+enem+livro', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'Geografia', titulo: 'Meio ambiente', tipo: 'PDF', link: 'https://www.google.com/search?q=meio+ambiente+enem+pdf', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'Geografia', titulo: 'Agricultura e agronegócio', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=agricultura+enem+artigo', nivel: 'INTERMEDIARIO' },

  // ===== Filosofia (área: Humanas) =====
  { area: 'Humanas', disciplina: 'Filosofia', titulo: 'Filosofia antiga', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=filosofia+antiga+enem', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'Filosofia', titulo: 'Ética e moral', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=etica+moral+filosofia+enem', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'Filosofia', titulo: 'Filosofia contemporânea', tipo: 'PDF', link: 'https://www.google.com/search?q=filosofia+contemporanea+enem+pdf', nivel: 'INTERMEDIARIO' },

  // ===== Sociologia (área: Humanas) =====
  { area: 'Humanas', disciplina: 'Sociologia', titulo: 'Cultura e sociedade', tipo: 'ARTIGO', link: 'https://www.google.com/search?q=cultura+sociedade+sociologia+enem', nivel: 'BASICO' },
  { area: 'Humanas', disciplina: 'Sociologia', titulo: 'Desigualdade social', tipo: 'VIDEO', link: 'https://www.youtube.com/results?search_query=desigualdade+social+enem', nivel: 'INTERMEDIARIO' },
  { area: 'Humanas', disciplina: 'Sociologia', titulo: 'Movimentos sociais', tipo: 'PDF', link: 'https://www.google.com/search?q=movimentos+sociais+enem+pdf', nivel: 'INTERMEDIARIO' }
];

async function run() {
  // Busca títulos já existentes para evitar duplicatas ao re-seedar
  const [existentes] = await pool.query(
    'SELECT titulo FROM conteudos'
  );
  const titulosExistentes = new Set(existentes.map((r) => r.titulo));

  let inseridos = 0;
  let ignorados = 0;

  for (const c of conteudos) {
    if (titulosExistentes.has(c.titulo)) {
      ignorados++;
      continue;
    }

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

  console.log(`Seed concluído. ${inseridos} inseridos, ${ignorados} já existiam.`);
  process.exit(0);
}

run().catch((error) => {
  console.error('Erro:', error.message);
  process.exit(1);
});

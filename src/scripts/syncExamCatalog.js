const pool = require('../config/db')

// Catálogos de treino autorais. Instituições servem como referência de perfil e
// objetivo; a plataforma não apresenta essas coleções como provas oficiais.
const catalogos = [
  ['ENEM', 'ENEM Essencial', 2025, 'Simulado autoral interdisciplinar PlanejAI para treinar ritmo, repertório e tomada de decisão. Não reproduz prova oficial.', 330],
  ['FUVEST', 'FUVEST Estratégica 2025', 2025, 'Simulado autoral de interpretação, ciências e resolução de problemas no perfil da primeira fase. Não reproduz prova oficial.', 300],
  ['UNICAMP', 'UNICAMP Contextos 2025', 2025, 'Treino autoral interdisciplinar com situações contextualizadas e leitura cuidadosa. Não reproduz prova oficial.', 300],
  ['UNESP', 'UNESP Panorama 2025', 2025, 'Coleção autoral equilibrada entre linguagens, humanas, natureza e matemática. Não reproduz prova oficial.', 300],
  ['UFRGS', 'UFRGS Conexões 2025', 2025, 'Simulado autoral de múltiplas áreas para prática de conceitos e conexões. Não reproduz prova oficial.', 300],
  ['PUC-SP', 'PUC-SP Humanidades & Exatas 2025', 2025, 'Treino autoral de raciocínio, leitura e repertório interdisciplinar. Não reproduz prova oficial.', 240],
  ['MACKENZIE', 'Mackenzie Multidisciplinar 2025', 2025, 'Coleção autoral para consolidar conteúdos de vestibular em uma sessão extensa. Não reproduz prova oficial.', 240],
  ['IME', 'IME Sprint 2025', 2025, 'Treino autoral avançado de Matemática, Física e Química. Não reproduz prova oficial.', 300]
]

async function syncExamCatalog() {
  for (const [instituicao, titulo, ano, descricao, duracao] of catalogos) {
    await pool.execute(
      `INSERT IGNORE INTO catalogo_provas (instituicao, titulo, referencia_ano, descricao, tipo, duracao_minutos)
       VALUES (?, ?, ?, ?, 'SIMULADO_AUTORAL', ?)`,
      [instituicao, titulo, ano, descricao, duracao]
    )
  }

  const [catalogoRows] = await pool.query('SELECT id_catalogo, instituicao FROM catalogo_provas WHERE ativo=1')
  const porInstituicao = new Map(catalogoRows.map((item) => [Number(item.id_catalogo), item.instituicao]))
  let vinculadas = 0

  for (const [idCatalogo, instituicao] of porInstituicao) {
    const filtroArea = ['ITA', 'IME'].includes(instituicao)
      ? " AND disciplina IN ('Matemática', 'Física', 'Química')"
      : ''
    const [result] = await pool.execute(
      `INSERT IGNORE INTO catalogo_prova_questoes (id_catalogo, id_questao)
       SELECT ?, id_questao FROM questoes_estudo WHERE ativo=1${filtroArea}`,
      [idCatalogo]
    )
    vinculadas += Number(result.affectedRows || 0)
  }

  console.log(`[CATÁLOGO] ${catalogos.length} coleções verificadas; ${vinculadas} novos vínculos de questões.`)
  return { colecoes: catalogos.length, vinculadas }
}

module.exports = syncExamCatalog

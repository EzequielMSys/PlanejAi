// Curadoria editorial: nenhuma requisição a terceiros é feita ao abrir a página.
export const checkedOn = '2026-10-23'
export const sourceCategories = ['Todas', 'Aulas e leituras', 'Provas e questões', 'Redação', 'Acervos', 'Internacionais']
export const studySources = [
  { name: 'Inep · provas do Enem', url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos', category: 'Provas e questões', access: 'Acesso aberto', description: 'Cadernos e gabaritos oficiais, organizados por edição.', official: true },
  { name: 'FGV · provas e gabaritos', url: 'https://vestibular.fgv.br/provas-gabaritos', category: 'Provas e questões', access: 'Acesso aberto', description: 'Provas anteriores publicadas pela própria instituição.', official: true },
  { name: 'Brasil Escola', url: 'https://brasilescola.uol.com.br/', category: 'Aulas e leituras', access: 'Leitura aberta', description: 'Explicações por disciplina para consultar e comparar conceitos.' },
  { name: 'Curso Enem Gratuito', url: 'https://cursoenemgratuito.com.br/', category: 'Aulas e leituras', access: 'Gratuito · pode pedir cadastro', description: 'Aulas e planos de preparação para o Enem.' },
  { name: 'Estuda.com', url: 'https://estuda.com/', category: 'Provas e questões', access: 'Acesso básico e planos pagos', description: 'Prática de questões e preparação para vestibulares.' },
  { name: 'RevisãoOnline', url: 'https://revisaoonline.com.br/', category: 'Redação', access: 'Gratuito · pode pedir cadastro', description: 'Revisão de textos com IA e colaboração entre participantes. A avaliação é formativa.' },
  { name: 'Corrige Aqui · Brasil Escola', url: 'https://vestibular.brasilescola.uol.com.br/corrige-aqui', category: 'Redação', access: 'Consulte cadastro e limites', description: 'Ferramenta de correção de redação. Confira as condições antes de enviar seu texto.' },
  { name: 'coRedação', url: 'https://coredacao.com/', category: 'Redação', access: 'Cadastro · consulte limites e planos', description: 'Feedback automatizado por competências; a nota estimada não é uma nota oficial.' },
  { name: 'Aprova Total', url: 'https://aprovatotal.com.br/', category: 'Aulas e leituras', access: 'Planos pagos', description: 'Curso preparatório para Enem e vestibulares.' },
  { name: 'Descomplica', url: 'https://descomplica.com.br/', category: 'Aulas e leituras', access: 'Planos pagos', description: 'Cursos e exercícios de preparação para o Enem.' },
  { name: 'Stoodi', url: 'https://stoodi.com.br/', category: 'Aulas e leituras', access: 'Planos pagos · aula de demonstração', description: 'Videoaulas e banco de exercícios para vestibulares.' },
  { name: 'ProEnem', url: 'https://proenem.com.br/', category: 'Aulas e leituras', access: 'Planos pagos', description: 'Preparação com aulas, simulados e redação.' },
  { name: 'Guia do Estudante', url: 'https://guiadoestudante.abril.com.br/', category: 'Aulas e leituras', access: 'Conteúdos abertos e assinatura', description: 'Atualidades e orientações de estudo. Consulte a disponibilidade de cada material.' },
  { name: 'Wikilivros', url: 'https://pt.wikibooks.org/', category: 'Acervos', access: 'Acesso aberto', description: 'Livros colaborativos. Confira referências e compare com outras fontes.' },
  { name: 'Acervo Digital da Unesp', url: 'https://acervodigital.unesp.br/', category: 'Acervos', access: 'Consulte a licença de cada item', description: 'Objetos educacionais e documentos do acervo universitário.' },
  { name: 'College Board · SAT', url: 'https://satsuite.collegeboard.org/help-center/can-students-still-practice-using-khan-academy', category: 'Internacionais', access: 'Orientação oficial · em inglês', description: 'Explica a preparação oficial para o SAT com a Khan Academy.', official: true },
  { name: 'Khan Academy · SAT', url: 'https://www.khanacademy.org/sat', category: 'Internacionais', access: 'Gratuito · em inglês', description: 'Preparação por habilidades para o SAT. Não é um curso para o Enem.' },
  { name: 'ACT', url: 'https://www.act.org/', category: 'Internacionais', access: 'Em inglês · consulte recursos e planos', description: 'Portal oficial do exame ACT e de sua preparação.', official: true },
  { name: 'Princeton Review', url: 'https://www.princetonreview.com/', category: 'Internacionais', access: 'Recursos gratuitos e serviços pagos · em inglês', description: 'Preparação para exames internacionais, incluindo SAT e ACT.' },
  { name: 'Kaplan Test Prep', url: 'https://www.kaptest.com/', category: 'Internacionais', access: 'Recursos e cursos pagos · em inglês', description: 'Preparação para diferentes exames internacionais.' },
  { name: 'SimpleStudy', url: 'https://simplestudy.cloud/', category: 'Internacionais', access: 'Cadastro e planos · em inglês', description: 'Revisão, quizzes e provas de currículos internacionais. Cobertura do Enem não confirmada.' },
]

export const topicSources = [
  { keywords: ['ecologia', 'cadeia alimentar', 'niveis troficos'], name: 'Cadeia alimentar · Brasil Escola', url: 'https://brasilescola.uol.com.br/biologia/cadeia-alimentar.htm' },
  { keywords: ['leis de newton', 'dinamica'], name: 'Leis de Newton · Brasil Escola', url: 'https://brasilescola.uol.com.br/fisica/leis-newton.htm' },
]
export const normalizeStudyText = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export function sourcesForTopic(title = '') {
  const text = normalizeStudyText(title)
  return topicSources.filter(source => source.keywords.some(word => text.includes(word)))
}

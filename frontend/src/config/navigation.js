const ALL = ['aluno', 'docente', 'admin', 'adm', 'dono']
const STAFF = ['docente', 'admin', 'adm', 'dono']
export const PAGES = [
  { path: '/fontes-estudo', title: 'Fontes para estudar', description: 'Leituras, provas oficiais, redação e acervos.', keywords: 'biblioteca fontes materiais enem gratuitas', group: 'Aprender', icon: 'book', roles: ALL, hidden: true, searchable: true, navParent: '/aprendizagem' },
  { path: '/inicio', title: 'Hoje', description: 'Continue seu estudo ou monte uma sessão guiada.', keywords: 'meu dia inicio jornada sessão guiada', group: 'Sua rotina', icon: 'home', roles: ALL },
  { path: '/sessao-guiada', title: 'Sessão guiada', description: 'Um roteiro para o tempo que você tem agora, sem alterar a semana.', keywords: 'minha jornada tempo', group: 'Sua rotina', icon: 'route', roles: ['aluno'], hidden: true, searchable: true, navParent: '/inicio' },
  { path: '/cronograma', title: 'Cronograma', description: 'Organize a semana, ajuste datas e retome pendências.', keywords: 'planejamento semana horários', group: 'Sua rotina', icon: 'calendar', roles: ALL },
  { path: '/aprendizagem', title: 'Praticar e revisar', description: 'Revisões, questões e progresso com base nas suas respostas.', keywords: 'meu progresso aprendizagem evolução domínio', group: 'Aprender', icon: 'book', roles: ALL },
  { path: '/provas', title: 'Provas e simulados', description: 'Treine com intenção. Aprenda com o resultado.', group: 'Aprender', icon: 'exam', roles: ALL },
  { path: '/redacoes', title: 'Redações', description: 'Da primeira ideia à próxima versão.', group: 'Aprender', icon: 'pen', roles: ALL },
  { path: '/ferramentas-estudo', title: 'Ferramentas de estudo', description: 'Metas por matéria, diagnóstico, cartões e trilhas.', keywords: 'flashcards metas diagnóstico trilhas ferramentas planejamento inteligente', group: 'Aprender', icon: 'chart', roles: ALL, hidden: true, searchable: true, navParent: '/aprendizagem' },
  { path: '/minhas-atividades', title: 'Minhas atividades', description: 'Enunciados, entregas e devolutivas.', group: 'Sua turma', icon: 'check', roles: ['aluno'] },
  { path: '/minhas-turmas', title: 'Minhas turmas', description: 'Tudo que sua turma compartilha com você.', group: 'Sua turma', icon: 'people', roles: ['aluno'] },
  { path: '/avisos', title: 'Avisos', description: 'Os comunicados que você precisa acompanhar.', group: 'Sua turma', icon: 'bell', roles: ['aluno'] },
  { path: '/dashboard-gestor', title: 'Visão pedagógica', description: 'Acompanhe estudantes e intervenções.', group: 'Gestão', icon: 'chart', roles: STAFF },
  { path: '/turmas', title: 'Gerenciar turmas', description: 'Pessoas e disciplinas em um só lugar.', group: 'Gestão', icon: 'people', roles: STAFF },
  { path: '/atividades', title: 'Gerenciar atividades', description: 'Prepare, publique e acompanhe atividades.', group: 'Gestão', icon: 'check', roles: STAFF },
  { path: '/materiais', title: 'Biblioteca de materiais', description: 'Organize os recursos dos seus estudantes.', group: 'Gestão', icon: 'book', roles: STAFF },
  { path: '/usuarios', title: 'Pessoas e acessos', description: 'Administração de contas e permissões.', group: 'Gestão', icon: 'people', roles: ['admin', 'adm', 'dono'] },
  { path: '/dono', title: 'Operação da plataforma', description: 'Serviços, métricas e administração.', group: 'Gestão', icon: 'settings', roles: ['dono'] },
  { path: '/lumi', title: 'Lumi', description: 'Sua companhia para entender, praticar e avançar.', group: 'Lumi · inteligência artificial', icon: 'spark', roles: ALL },
  { path: '/preferencias', title: 'Meu espaço', description: 'Suas cores. Seu jeito de ler e estudar.', group: 'Preferências', icon: 'palette', roles: ALL },
  { path: '/perfil', title: 'Minha conta', description: 'Seus dados, objetivos e disponibilidade.', group: 'Preferências', icon: 'user', roles: ALL },
  { path: '/alterar-senha', title: 'Segurança', description: 'Cuide do acesso à sua conta.', group: 'Preferências', icon: 'lock', roles: ALL, hidden: true },
  { path: '/primeiro-acesso', title: 'Primeiro acesso', description: 'Prepare sua conta para estudar.', group: 'Sua conta', roles: ALL, hidden: true },
  { path: '/onboarding', title: 'Meu ponto de partida', description: 'Um plano que respeita a sua rotina.', group: 'Sua conta', roles: ALL, hidden: true },
  { path: '/estudar', title: 'Sala de estudo', description: 'Seu material, suas anotações e tempo para se concentrar.', group: 'Aprender', roles: ALL, hidden: true },
  { path: '/status', title: 'Conexão e serviços', description: 'Confira como estão os serviços da plataforma.', group: 'Ajuda', roles: ALL, hidden: true },
]
export function navigationFor(role) { return PAGES.filter(page => !page.hidden && page.roles.includes(role)) }
export function pageFor(pathname) {
  const aliases = { '/dashboard': '/inicio', '/chat': '/lumi', '/dono/usuarios': '/usuarios', '/minha-jornada': '/sessao-guiada', '/planejamento-inteligente': '/ferramentas-estudo' }
  const path = aliases[pathname] || pathname
  return [...PAGES].sort((a, b) => b.path.length - a.path.length).find(page => path === page.path || path.startsWith(page.path + '/')) || { title: 'PlanejAI', group: 'Seu espaço', description: 'Aprenda no seu ritmo.' }
}

export function searchPages(role, query) {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
  const needle = normalize(query)
  return PAGES.filter(page => page.roles.includes(role) && (!page.hidden || (page.searchable && needle)))
    .filter(page => normalize(`${page.title} ${page.group} ${page.keywords || ''}`).includes(needle)).slice(0, 6)
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'

import ProtectedRoute from './routes/ProtectedRoute'
import RouteLoading from './components/RouteLoading'
const Layout = lazy(() => import('./layouts/Layout'))

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PrimeiroAcesso = lazy(() => import('./pages/PrimeiroAcesso'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/TodayDashboard'))
const DashboardGestor = lazy(() => import('./pages/DashboardGestor'))
const Cronograma = lazy(() => import('./pages/Cronograma'))
const Redacoes = lazy(() => import('./pages/Redacoes'))
const Perfil = lazy(() => import('./pages/Perfil'))
const AlterarSenha = lazy(() => import('./pages/AlterarSenha'))
const EsqueciSenha = lazy(() => import('./pages/EsqueciSenha'))
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'))
const UsuariosAdmin = lazy(() => import('./pages/UsuariosAdmin'))
const PainelDono = lazy(() => import('./pages/PainelDono'))
const Atividades = lazy(() => import('./pages/Atividades'))
const Materiais = lazy(() => import('./pages/Materiais'))
const MinhasAtividades = lazy(() => import('./pages/MinhasAtividades'))
const AvisosAluno = lazy(() => import('./pages/AvisosAluno'))
const NotFound = lazy(() => import('./pages/NotFound'))
const StudySession = lazy(() => import('./pages/StudySession'))
const Aprendizagem = lazy(() => import('./pages/Aprendizagem'))
const SystemStatus = lazy(() => import('./pages/SystemStatus'))
const PlanejamentoInteligente = lazy(() => import('./pages/PlanejamentoInteligente'))
const MinhaJornada = lazy(() => import('./pages/MinhaJornada'))
const Turmas = lazy(() => import('./pages/Turmas'))
const MinhasTurmas = lazy(() => import('./pages/MinhasTurmas'))
const MinhasTurmasDetalhe = lazy(() => import('./pages/MinhasTurmasDetalhe'))
const LearningStrategies = lazy(() => import('./pages/LearningStrategies'))
const ResearchPortfolio = lazy(() => import('./pages/ResearchPortfolio'))
const InvestigationProjects = lazy(() => import('./pages/InvestigationProjects'))
const StudyLaboratory = lazy(() => import('./pages/StudyLaboratory'))
const ExamPreparation = lazy(() => import('./pages/ExamPreparation'))
const Provas = lazy(() => import('./pages/Provas'))
const Chat = lazy(() => import('./pages/Chat'))
const Preferencias = lazy(() => import('./pages/Preferencias'))
const FontesEstudo = lazy(() => import('./pages/FontesEstudo'))
const PersonalDesk = lazy(() => import('./pages/PersonalDesk'))
const MyUnderstanding = lazy(() => import('./pages/MyUnderstanding'))
const Search = lazy(() => import('./pages/Search'))

function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={<RouteLoading />}
      >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/inicio" element={<Dashboard />} />
            <Route path="/mesa" element={<PersonalDesk />} />
            <Route path="/meu-entendimento" element={<MyUnderstanding />} />
            <Route path="/busca" element={<Search />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cronograma" element={<Cronograma />} />
            <Route path="/estudar" element={<StudySession />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/aprendizagem" element={<Aprendizagem />} />
            <Route path="/fontes-estudo" element={<FontesEstudo />} />
            <Route path="/ferramentas-estudo" element={<PlanejamentoInteligente />} />
            <Route path="/planejamento-inteligente" element={<Navigate to="/ferramentas-estudo" replace />} />
                        <Route path="/provas" element={<Provas />} />
<Route path="/preparacao-provas" element={<ExamPreparation />} />
<Route path="/laboratorio" element={<StudyLaboratory />} />
<Route path="/portfolio-investigacao" element={<ResearchPortfolio />} />
<Route path="/como-aprendo" element={<LearningStrategies />} />
<Route path="/projetos-investigacao" element={<InvestigationProjects />} />
            <Route path="/lumi" element={<Chat />} />
            <Route path="/chat" element={<Navigate to="/lumi" replace />} />
            <Route path="/preferencias" element={<Preferencias />} />
            <Route path="/sessao-guiada" element={<MinhaJornada />} />
            <Route path="/minha-jornada" element={<Navigate to="/sessao-guiada" replace />} />
            <Route path="/redacoes" element={<Redacoes />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/minhas-atividades" element={<MinhasAtividades />} />
            <Route path="/avisos" element={<AvisosAluno />} />
            {/* Visão do aluno no formato Classroom. Fica no grupo autenticado
                comum, e não em gestorOnly: /turmas é a tela de gestão, esta é a
                de participação. */}
            <Route path="/minhas-turmas" element={<MinhasTurmas />} />
            <Route path="/minhas-turmas/:id" element={<MinhasTurmasDetalhe />} />
            <Route path="/alterar-senha" element={<AlterarSenha />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute gestorOnly />}>
          <Route element={<Layout />}>
            <Route path="/dashboard-gestor" element={<DashboardGestor />} />
            <Route path="/turmas" element={<Turmas />} />
            <Route path="/atividades" element={<Atividades />} />
            <Route path="/materiais" element={<Materiais />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<Layout />}>
            <Route path="/usuarios" element={<UsuariosAdmin />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute donoOnly />}>
          <Route element={<Layout />}>
            <Route path="/dono" element={<PainelDono />} />
            <Route path="/dono/usuarios" element={<UsuariosAdmin />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App

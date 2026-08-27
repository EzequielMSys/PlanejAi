import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'

import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './layouts/Layout'

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

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="grid min-h-screen place-items-center font-bold">Carregando PlanejAI…</div>}>
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard-gestor" element={<DashboardGestor />} />
<Route path="/cronograma" element={<Cronograma />} />
            <Route path="/estudar" element={<StudySession />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/aprendizagem" element={<Aprendizagem />} />
            <Route path="/planejamento-inteligente" element={<PlanejamentoInteligente />} />
            <Route path="/minha-jornada" element={<MinhaJornada />} />
            <Route path="/turmas" element={<Turmas />} />
            <Route path="/redacoes" element={<Redacoes />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/atividades" element={<Atividades />} />
            <Route path="/materiais" element={<Materiais />} />
            <Route path="/minhas-atividades" element={<MinhasAtividades />} />
            <Route path="/avisos" element={<AvisosAluno />} />
            <Route path="/alterar-senha" element={<AlterarSenha />} />
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

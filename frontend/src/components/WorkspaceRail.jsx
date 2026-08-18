import { useLocation } from 'react-router-dom'
import CommandPalette from './CommandPalette'
import './WorkspaceRail.css'

const MAPA = {
  '/inicio': ['01', 'Visão geral', 'Hoje é um bom dia para avançar um pouco.'],
  '/dashboard': ['01', 'Visão geral', 'Hoje é um bom dia para avançar um pouco.'],
  '/cronograma': ['02', 'Cronograma', 'Um plano vivo, feito para caber na rotina.'],
  '/redacoes': ['03', 'Redação', 'Ideias ganham força quando passam pela revisão.'],
  '/atividades': ['04', 'Atividades', 'Praticar transforma conteúdo em repertório.'],
  '/minhas-atividades': ['05', 'Minhas entregas', 'Organize o próximo passo, não todos de uma vez.'],
  '/avisos': ['06', 'Avisos', 'O que você precisa saber, sem ruído.'],
  '/perfil': ['07', 'Perfil', 'Seu espaço, suas escolhas, seu ritmo.'],
  '/materiais': ['08', 'Materiais', 'Referências reunidas para continuar aprendendo.'],
  '/dashboard-gestor': ['G1', 'Painel pedagógico', 'Dados para orientar pessoas, não apenas medir.'],
  '/usuarios': ['G2', 'Comunidade', 'Gestão clara para uma experiência mais humana.'],
  '/dono': ['G3', 'Operação', 'Visão ampla, decisões cuidadosas.'],
  '/dono/usuarios': ['G3', 'Operação', 'Visão ampla, decisões cuidadosas.']
}

export default function WorkspaceRail() {
  const { pathname } = useLocation()
  const [numero, titulo, frase] = MAPA[pathname] || ['P/', 'PlanejAI', 'Estude com direção.']
  const hoje = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date()).replace('.', '')
  return <div className="workspace-rail"><div className="workspace-rail-index"><b>{numero}</b><span>{titulo}</span></div><p>{frase}</p><div className="workspace-rail-actions"><time>{hoje}</time><CommandPalette /></div></div>
}

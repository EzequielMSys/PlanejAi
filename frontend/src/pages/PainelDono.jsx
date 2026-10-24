import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import usuarioService from '../services/usuarioService'
import { loadOperationsMetrics } from '../services/operationsService'
import './PainelDono.css'
import SupportPanel from '../components/SupportPanel'
import ExternalOperations from '../components/ExternalOperations'

const numero = valor => Number(valor || 0)

export default function PainelDono() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [totais, setTotais] = useState(null)
  const [loading, setLoading] = useState(true)
  const [webVitals, setWebVitals] = useState([])
  const [operations, setOperations] = useState(null)
  const [operationsError, setOperationsError] = useState('')

  const refreshVitals = () => loadOperationsMetrics().then((data) => { setWebVitals(data.web_vitals || []); setOperations(data); setOperationsError('') }).catch(() => setOperationsError('Não foi possível atualizar os indicadores. Tente novamente.'))

  useEffect(() => {
    usuarioService.listar().then(data => {
      setUsuarios(Array.isArray(data) ? data : data.usuarios || [])
      setTotais(data.stats || null)
    }).catch(() => toast.error('Erro ao carregar métricas do dono.')).finally(() => setLoading(false))
    refreshVitals()
  }, [])

  const stats = useMemo(() => totais || ({
    total: usuarios.length,
    ativos: usuarios.filter(item => Number(item.ativo) === 1).length,
    inativos: usuarios.filter(item => Number(item.ativo) === 0).length,
    donos: usuarios.filter(item => item.tipo === 'dono').length,
    admins: usuarios.filter(item => item.tipo === 'admin').length,
    docentes: usuarios.filter(item => item.tipo === 'docente').length,
    alunos: usuarios.filter(item => item.tipo === 'aluno').length
  }), [usuarios, totais])
  const proporcaoAtivos = numero(stats.total) ? Math.round(numero(stats.ativos) / numero(stats.total) * 100) : 0
  const vitalRoutes = [...new Set(webVitals.map((item) => item.route))].sort()
  const metricFor = (route, name) => webVitals.find((item) => item.route === route && item.name === name)

  if (loading) return <main className="owner-page"><div className="owner-wrap"><h1>Operação da plataforma</h1><p className="owner-loading">Carregando indicadores de acesso…</p></div></main>

  return <main className="owner-page"><div className="owner-wrap">
    <header className="owner-hero"><div><span className="owner-kicker">PLANEJAI · VISÃO DO DONO</span><h1>Operação da plataforma</h1><p>Um ponto de partida para acompanhar contas e chegar às áreas de gestão que mantêm a experiência de estudos funcionando.</p><button type="button" onClick={() => navigate('/dono/usuarios')}>Abrir pessoas e acessos <span aria-hidden="true">↗</span></button></div><aside><span>ACESSO À PLATAFORMA</span><strong>{proporcaoAtivos}%</strong><p>das contas cadastradas estão ativas</p><div role="img" aria-label={`${proporcaoAtivos}% das contas ativas`}><span style={{ width: `${proporcaoAtivos}%` }} /></div><small>{numero(stats.ativos)} ativas · {numero(stats.inativos)} inativas</small></aside></header>

    <section className="owner-overview" aria-label="Indicadores de contas"><div className="owner-section-heading"><span className="owner-kicker">VISÃO GERAL</span><h2>A comunidade em números</h2><p>Indicadores de contas cadastradas, independentes da página atual do diretório.</p></div><div className="owner-stat-grid"><Stat label="Contas cadastradas" value={stats.total} hint="Pessoas na plataforma" /><Stat label="Contas ativas" value={stats.ativos} hint="Com acesso habilitado" /><Stat label="Contas inativas" value={stats.inativos} hint="Sem acesso no momento" /><Stat label="Administradores" value={stats.admins} hint="Gestão da plataforma" /></div></section>

    <div className="owner-panels"><section className="owner-panel"><span className="owner-kicker">QUEM PARTICIPA</span><h2>Composição da comunidade</h2><p>Distribuição dos perfis de acesso cadastrados.</p><div className="owner-role-list"><Role label="Estudantes" value={stats.alunos} total={stats.total} /><Role label="Docentes" value={stats.docentes} total={stats.total} /><Role label="Administradores" value={stats.admins} total={stats.total} /><Role label="Donos" value={stats.donos} total={stats.total} /></div></section><section className="owner-panel"><span className="owner-kicker">ÁREAS DE GESTÃO</span><h2>Seu próximo destino</h2><p>Entre diretamente na área que precisa da sua atenção.</p><nav className="owner-link-list" aria-label="Áreas de gestão"><button type="button" onClick={() => navigate('/dono/usuarios')}><span><strong>Pessoas e acessos</strong><small>Perfis, permissões e estado das contas</small></span><b aria-hidden="true">↗</b></button><button type="button" onClick={() => navigate('/dashboard-gestor')}><span><strong>Visão pedagógica</strong><small>Entregas, desempenho e intervenções</small></span><b aria-hidden="true">↗</b></button><button type="button" onClick={() => navigate('/turmas')}><span><strong>Turmas</strong><small>Participantes e espaços de aprendizagem</small></span><b aria-hidden="true">↗</b></button><button type="button" onClick={() => navigate('/atividades')}><span><strong>Atividades</strong><small>Publicações, rascunhos e correções</small></span><b aria-hidden="true">↗</b></button><button type="button" onClick={() => navigate('/materiais')}><span><strong>Biblioteca de materiais</strong><small>Recursos vinculados ao cronograma</small></span><b aria-hidden="true">↗</b></button></nav></section></div>
    <section className="owner-panel owner-vitals" aria-labelledby="owner-vitals-title"><div className="owner-vitals-heading"><div><span className="owner-kicker">EXPERIÊNCIA REAL</span><h2 id="owner-vitals-title">Desempenho por página</h2><p>Percentil 75 das visitas dos últimos 7 dias. Sem identificação dos estudantes. LCP: carregamento; INP: resposta; CLS: estabilidade. A troca de página mede a navegação interna.</p></div><button type="button" onClick={refreshVitals}>Atualizar dados</button></div>{vitalRoutes.length ? <div className="owner-vitals-scroll"><table><caption>Métricas de carregamento e interação por rota</caption><thead><tr><th scope="col">Página</th><th scope="col">LCP</th><th scope="col">INP</th><th scope="col">CLS</th><th scope="col">Troca de página</th></tr></thead><tbody>{vitalRoutes.map((route) => <tr key={route}><th scope="row">{route}</th>{['LCP', 'INP', 'CLS', 'ROUTE_READY'].map((name) => { const item = metricFor(route, name); return <td key={name}>{item ? `${item.p75}${name === 'CLS' ? '' : ' ms'}` : '—'}{item && <small>{item.count} amostras{item.count < 20 ? ' · preliminar' : ''}</small>}</td> })}</tr>)}</tbody></table></div> : <p className="owner-vitals-empty">Ainda não há amostras. Abra as páginas no navegador e volte para acompanhar as medições.</p>}</section>
    <section className="owner-panel"><h2>Saúde da operação</h2>{operationsError && <p role="alert">{operationsError}</p>}<button type="button" onClick={refreshVitals}>Atualizar operação</button>{operations && <><h3>Lumi</h3><p>{operations.operation?.ia?.configured ? 'Chave configurada no servidor' : 'Chave ausente no servidor'} · Modelo: {operations.operation?.ia?.model}</p><p>{operations.operation?.ia?.mensagens ?? '—'} mensagens enviadas hoje por {operations.operation?.ia?.estudantes ?? '—'} pessoas. Limite por pessoa: {Number(operations.operation?.ia?.daily_limit) > 0 ? `${operations.operation.ia.daily_limit}/dia` : 'desativado'}.</p><p>Contagem pelo relógio do banco. Não representa créditos nem disponibilidade do provedor.</p><h3>Backups</h3><p>A rotina externa não depende desta instância do Vercel. Consulte as cópias verificadas e sua retenção no quadro “Cópias e disponibilidade” abaixo.</p><h3>Falhas nas últimas 24 horas</h3><p>Operações de escrita registradas no banco; continua disponível entre reinicializações do Vercel. Falhas de leitura e indisponibilidade do próprio banco devem ser acompanhadas nos logs do Vercel.</p>{operations.operation?.failures?.length ? <ul>{operations.operation.failures.map((item, index) => <li key={index}>{item.metodo} {item.rota} · HTTP {item.status_http} · {item.total} ocorrências</li>)}</ul> : <p>Nenhuma falha de escrita registrada nesse período.</p>}<p>{operations.operation?.support?.abertos ?? '—'} pedidos aguardando conclusão.</p></>}</section>
    <ExternalOperations />
    <SupportPanel owner />
  </div></main>
}

function Stat({ label, value, hint }) { return <article className="owner-stat"><span>{label}</span><strong>{numero(value)}</strong><small>{hint}</small></article> }
function Role({ label, value, total }) { const percent = numero(total) ? Math.round(numero(value) / numero(total) * 100) : 0; return <div className="owner-role"><div><strong>{label}</strong><span>{numero(value)} · {percent}%</span></div><div className="owner-role-track"><span style={{ width: `${percent}%` }} /></div></div> }

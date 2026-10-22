import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export default function NotFound() {
  return <AuthLayout title="Essa página saiu do plano." subtitle="O endereço pode ter mudado ou não existe. Vamos encontrar o caminho de volta."
    destaque={<><p className="pn-sobrancelha">Erro 404</p><h2 className="pn-secao">Um desvio, não o fim do caminho.</h2><p className="pn-corpo">Seu espaço de estudos continua aqui. Volte ao início para escolher o próximo passo.</p></>}>
    <div className="pn-form"><Link className="pn-btn pn-btn-primario" to="/">Voltar ao PlanejAI <span aria-hidden="true">→</span></Link><Link className="pn-btn pn-btn-fantasma" to="/dashboard">Abrir meus estudos</Link></div>
  </AuthLayout>
}

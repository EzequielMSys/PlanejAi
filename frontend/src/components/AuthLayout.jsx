import { Link } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import './AuthLayout.css'

/**
 * Moldura comum das telas de autenticação (Login e Register), reescrita no
 * mesmo estilo editorial da Landing: tipografia Georgia, cantos discretos e
 * tokens da paleta do usuário — nada de hex fixo ou animação pesada.
 *
 * A coluna do formulário aparece primeiro no HTML, então a ordem de leitura em
 * celular e para leitor de tela é a que importa: conteúdo, e só depois a
 * apresentação. O painel lateral (`destaque`) é decorativo e fica fora do
 * fluxo de leitura (`aria-hidden`).
 */
export default function AuthLayout({ title, subtitle, children, rodape, destaque, variant }) {
  return (
    <div className={`study-auth${variant ? ` study-auth--${variant}` : ''}`}>
      <header className="study-auth-topo">
        <Link to="/" className="study-auth-marca" aria-label="PlanejAI, página inicial">
          {/* O aria-label do link cobre o conjunto inteiro; o do Logo ficaria
              duplicado ao ser lido junto com o texto visível ao lado. */}
          <Logo className="h-8 w-8" />
          <span>Planej<span className="study-auth-accent">AI</span></span>
        </Link>
        <ThemeToggle />
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="study-auth-corpo">
        <section className="study-auth-formulario">
          <h1>{title}</h1>
          {subtitle && <p className="study-auth-sub">{subtitle}</p>}
          {children}
          {rodape && <div className="study-auth-rodape">{rodape}</div>}
        </section>

        {destaque && (
          <aside className="study-auth-lateral" aria-hidden="true">
            <div className="study-auth-caderno">{destaque}</div>
          </aside>
        )}
      </main>
    </div>
  )
}

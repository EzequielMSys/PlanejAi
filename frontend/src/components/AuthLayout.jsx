import { Link } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import './AuthLayout.css'
import './AuthJourneyPreview.css'

/**
 * Moldura comum das telas de autenticação (Login, Register, recuperação).
 *
 * Antes cada tela repetia a própria estrutura com gradientes e hex fixos, o que
 * gerava três variantes visuais e nenhuma delas seguia a paleta escolhida pelo
 * usuário. Aqui a tela é dividida em duas colunas: o formulário e um painel que
 * explica o produto, com a mesma linguagem visual da Landing (Atlas).
 *
 * A coluna do formulário aparece primeiro no HTML, então a ordem de leitura em
 * celular e para leitor de tela é a que importa: conteúdo, e só depois a
 * apresentação.
 */
export default function AuthLayout({ title, subtitle, children, rodape, destaque, variant }) {
  if (variant === 'login' || variant === 'register') {
    return <div className={`study-auth study-auth--${variant}`}>
      <header className="study-auth-topo"><LinkMarca /><ThemeToggle /></header>
      <main id="conteudo-principal" tabIndex={-1} className="study-auth-corpo">
        <section className="study-auth-formulario" aria-labelledby="auth-title">
          <h1 id="auth-title">{title}</h1>
          {subtitle && <p className="study-auth-sub">{subtitle}</p>}
          {children}
          {rodape && <div className="study-auth-rodape">{rodape}</div>}
        </section>
        {destaque && <aside className="study-auth-lateral" aria-label="Conheça o espaço de estudos"><div className="study-auth-showcase">{destaque}</div></aside>}
      </main>
    </div>
  }
  return (
    <div className="pn-auth">
      <div className="pn-auth-grade" aria-hidden="true" />

      <div className="pn-auth-topo">
        <LinkMarca />
        <ThemeToggle />
      </div>

      <main id="conteudo-principal" tabIndex={-1} className="pn-auth-corpo">
        <section
          className="pn-auth-painel"
        >
          <h1 className="pn-secao">{title}</h1>
          {subtitle && <p className="pn-corpo pn-auth-sub">{subtitle}</p>}
          {children}
          {rodape && <div className="pn-auth-rodape">{rodape}</div>}
        </section>

        {destaque && (
          <aside
            className="pn-auth-destaque"
            aria-hidden="true"
          >
            {destaque}
          </aside>
        )}
      </main>
    </div>
  )
}

function LinkMarca() {
  return (
    <Link to="/" className="pn-marca" aria-label="PlanejAI, página inicial">
      {/* O aria-label do link cobre o conjunto inteiro; o do Logo ficaria
          duplicado ao ser lido junto com o texto visível ao lado. */}
      <Logo className="h-8 w-8" animado={false} />
      <span className="pn-marca-texto">Planej<strong>AI</strong></span>
    </Link>
  )
}

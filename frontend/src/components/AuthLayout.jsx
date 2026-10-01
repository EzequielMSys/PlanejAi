import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

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
export default function AuthLayout({ title, subtitle, children, rodape, destaque }) {
  return (
    <div className="pn-auth">
      <a href="#conteudo-principal" className="pn-saltar">Pular para o conteúdo</a>
      <div className="pn-auth-grade" aria-hidden="true" />

      <div className="pn-auth-topo">
        <LinkMarca />
        <ThemeToggle />
      </div>

      <main id="conteudo-principal" tabIndex={-1} className="pn-auth-corpo">
        <motion.section
          className="pn-auth-painel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h1 className="pn-secao">{title}</h1>
          {subtitle && <p className="pn-corpo pn-auth-sub">{subtitle}</p>}
          {children}
          {rodape && <div className="pn-auth-rodape">{rodape}</div>}
        </motion.section>

        {destaque && (
          <motion.aside
            className="pn-auth-destaque"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            aria-hidden="true"
          >
            {destaque}
          </motion.aside>
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

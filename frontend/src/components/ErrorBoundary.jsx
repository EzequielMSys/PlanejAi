import React from 'react'
import Logo from './Logo'
import './RecoveryState.css'

export default class ErrorBoundary extends React.Component {
  state = { error: null }

  componentDidUpdate(previousProps) {
    if (this.state.error && this.props.resetKey !== previousProps.resetKey) {
      this.setState({ error: null })
    }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[PlanejAI UI]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.silent) return null
    const unavailable = /dynamically imported|ChunkLoadError|Loading chunk|importing a module/i.test(String(this.state.error?.message || this.state.error))
    return (
      <div className="recovery-state" role="alert">
        <section>
          <Logo className="h-11 w-11" />
          <p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-[rgb(var(--pn-primaria-rgb)/1)]">Recuperação segura</p>
          <h1 className="mt-2 text-3xl font-black">Algo não carregou como deveria.</h1>
          <p>A interface encontrou um problema. Tentar novamente não recarrega o site. Ao voltar ao editor, confira o rascunho e o aviso de salvamento.</p>
          {unavailable ? <><p>Para buscar a página atualizada, será necessário recarregar. Antes disso, preserve textos ainda não enviados em outras áreas abertas.</p><button type="button" onClick={() => window.location.reload()}>Recarregar a página</button></> : <button type="button" onClick={() => this.setState({ error: null })}>Tentar novamente</button>}
        </section>
      </div>
    )
  }
}

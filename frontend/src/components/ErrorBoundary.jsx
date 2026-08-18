import React from 'react'
import Logo from './Logo'

export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[PlanejAI UI]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="grid min-h-screen place-items-center bg-[#160F20] p-6 text-white">
        <section className="max-w-lg rounded-3xl border border-white/10 bg-white/[.06] p-8">
          <Logo className="h-11 w-11" />
          <p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-[#C4B5FD]">Recuperação segura</p>
          <h1 className="mt-2 text-3xl font-black">Algo não carregou como deveria.</h1>
          <p className="mt-3 text-white/65">Seus dados não foram alterados. Recarregue a interface para continuar.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-[#7C3AED] px-5 py-3 font-black">Recarregar PlanejAI</button>
        </section>
      </main>
    )
  }
}

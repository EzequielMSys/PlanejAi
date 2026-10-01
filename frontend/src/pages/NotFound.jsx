import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#160F20] p-6 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.06] p-8 sm:p-12">
        <Logo className="h-12 w-12" />
        <p className="mt-10 text-xs font-black uppercase tracking-[.25em] text-[#C4B5FD]">Erro 404</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">Essa página saiu do plano.</h1>
        <p className="mt-5 max-w-md leading-relaxed text-white/65">O endereço pode ter mudado ou não existe. Seus dados continuam seguros.</p>
        <Link to="/" className="mt-8 inline-flex rounded-xl bg-[#7C3AED] px-5 py-3 font-black transition hover:bg-[#8B5CF6]">Voltar ao PlanejAI</Link>
      </section>
    </main>
  )
}

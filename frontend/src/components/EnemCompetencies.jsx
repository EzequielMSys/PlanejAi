const NOMES = ['Norma-padrão', 'Tema e repertório', 'Argumentação', 'Coesão', 'Intervenção']

export default function EnemCompetencies({ competencias = [] }) {
  const possuiDados = competencias.some((item) => Number(item.avaliacoes) > 0)
  return <section className="mt-8 rounded-2xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.15)] bg-[rgb(var(--pn-superficie-alt-rgb)/1)] p-5 dark:bg-[rgb(var(--pn-superficie-rgb)/1)]">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[rgb(var(--pn-primaria-rgb)/1)] dark:text-[rgb(var(--pn-primaria-rgb)/1)]">Redação ENEM</p><h3 className="text-xl font-black">Domínio por competência</h3></div><span className="text-xs text-[rgb(var(--pn-texto-rgb)/0.45)] dark:text-white/45">média das redações avaliadas · máximo 200</span></div>
    {!possuiDados ? <p className="mt-5 rounded-xl border border-dashed border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] p-5 text-sm text-[rgb(var(--pn-texto-rgb)/0.55)] dark:text-white/55">Envie sua primeira redação para formar este mapa.</p> : <div className="mt-6 grid gap-4">{competencias.map((item)=><div key={item.codigo}><div className="mb-1.5 flex justify-between gap-3 text-xs"><b>C{item.codigo} · {NOMES[item.codigo - 1]}</b><span>{item.media}/200 · {item.avaliacoes} avaliação(ões)</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/0.1)]"><div className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--pn-primaria-rgb)/1)] to-[rgb(var(--pn-primaria-suave-rgb)/1)]" style={{width:`${Math.min(100,Number(item.media)/2)}%`}} /></div></div>)}</div>}
  </section>
}

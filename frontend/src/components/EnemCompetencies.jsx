const NOMES = ['Norma-padrão', 'Tema e repertório', 'Argumentação', 'Coesão', 'Intervenção']

export default function EnemCompetencies({ competencias = [] }) {
  const possuiDados = competencias.some((item) => Number(item.avaliacoes) > 0)
  return <section className="mt-8 rounded-2xl border border-[#7C4DFF]/15 bg-[#FAF8FC] p-5 dark:bg-[#241C31]">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#6D3EC5] dark:text-[#CBB3FF]">Redação ENEM</p><h3 className="text-xl font-black">Domínio por competência</h3></div><span className="text-xs text-black/45 dark:text-white/45">média das redações avaliadas · máximo 200</span></div>
    {!possuiDados ? <p className="mt-5 rounded-xl border border-dashed border-[#7C4DFF]/20 p-5 text-sm text-black/55 dark:text-white/55">Envie sua primeira redação para formar este mapa.</p> : <div className="mt-6 grid gap-4">{competencias.map((item)=><div key={item.codigo}><div className="mb-1.5 flex justify-between gap-3 text-xs"><b>C{item.codigo} · {NOMES[item.codigo - 1]}</b><span>{item.media}/200 · {item.avaliacoes} avaliação(ões)</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#E9E1F0] dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#6334B6] to-[#B07BFF]" style={{width:`${Math.min(100,Number(item.media)/2)}%`}} /></div></div>)}</div>}
  </section>
}

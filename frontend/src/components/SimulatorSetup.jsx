import { useState } from 'react'

const DISCIPLINAS = ['Matemática', 'Física', 'Química', 'Biologia', 'Português', 'Literatura', 'História', 'Geografia', 'Sociologia', 'Filosofia', 'Inglês']

export default function SimulatorSetup({ onStart, errosPendentes = 0 }) {
  const [opcoes, setOpcoes] = useState({ quantidade: 10, disciplina: '', dificuldade: '', minutos: 15, origem: '' })
  const alterar = (campo, valor) => setOpcoes((atual) => ({ ...atual, [campo]: valor }))

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#6D3EC5] dark:text-[#CBB3FF]">Monte sua prova</p><h2 className="mt-1 text-2xl font-black">Simulado sob medida</h2><p className="mt-2 max-w-2xl text-sm text-black/55 dark:text-white/55">Escolha o recorte da sessão. As alternativas mudam de posição em cada tentativa e o resultado alimenta seu mapa.</p></div><button type="button" disabled={!errosPendentes} onClick={() => onStart({ ...opcoes, origem: 'erros', quantidade: Math.min(20, errosPendentes) })} className="rounded-full border border-amber-500/30 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-amber-950/30 dark:text-amber-200">Treinar meus erros ({errosPendentes})</button></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-2 text-xs font-black">Disciplina<select value={opcoes.disciplina} onChange={(e)=>alterar('disciplina',e.target.value)} className="rounded-xl border border-[#7C4DFF]/20 bg-transparent p-3 text-sm"><option value="">Todas as áreas</option>{DISCIPLINAS.map((item)=><option key={item}>{item}</option>)}</select></label>
      <label className="grid gap-2 text-xs font-black">Dificuldade<select value={opcoes.dificuldade} onChange={(e)=>alterar('dificuldade',e.target.value)} className="rounded-xl border border-[#7C4DFF]/20 bg-transparent p-3 text-sm"><option value="">Mista</option><option value="FACIL">Fácil</option><option value="MEDIA">Média</option><option value="DIFICIL">Difícil</option></select></label>
      <label className="grid gap-2 text-xs font-black">Quantidade<select value={opcoes.quantidade} onChange={(e)=>alterar('quantidade',Number(e.target.value))} className="rounded-xl border border-[#7C4DFF]/20 bg-transparent p-3 text-sm">{[5,10,15,20,30].map((item)=><option key={item} value={item}>{item} questões</option>)}</select></label>
      <label className="grid gap-2 text-xs font-black">Tempo<select value={opcoes.minutos} onChange={(e)=>alterar('minutos',Number(e.target.value))} className="rounded-xl border border-[#7C4DFF]/20 bg-transparent p-3 text-sm"><option value="0">Sem cronômetro</option><option value="10">10 minutos</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="60">60 minutos</option></select></label>
    </div>
    <button type="button" onClick={() => onStart(opcoes)} className="mt-7 rounded-full bg-[#6D3EC5] px-7 py-3 text-sm font-black text-white shadow-lg shadow-[#6D3EC5]/20">Iniciar sessão personalizada</button>
  </div>
}


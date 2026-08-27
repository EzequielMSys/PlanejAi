import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import adaptive from '../services/adaptiveService'

export default function AdaptiveLearningHub() {
  const [acao, setAcao] = useState(null)
  const [competencias, setCompetencias] = useState([])
  const [missoes, setMissoes] = useState([])
  const [sequencia, setSequencia] = useState(0)
  const [checkin, setCheckin] = useState({ energia: 3, minutosDisponiveis: 25, formatoPreferido: 'EXERCICIOS' })
  const [sessao, setSessao] = useState(null)
  const [objetivo, setObjetivo] = useState('')
  const [recordacao, setRecordacao] = useState('')
  const [resumo, setResumo] = useState('')

  async function carregar() {
    const [next, skills, quests, streak] = await Promise.all([adaptive.proximaAcao(), adaptive.competencias(), adaptive.missoes(), adaptive.sequencia()])
    setAcao(next); setCompetencias(skills); setMissoes(quests); setSequencia(streak.semanas)
  }
  useEffect(() => { carregar().catch(() => toast.error('Não foi possível carregar o plano adaptativo.')) }, [])
  async function salvarCheckin(event) { event.preventDefault(); setAcao(await adaptive.checkin(checkin)); toast.success('Plano de hoje recalculado.') }
  async function ativarRotina(nome, minutos) { await adaptive.salvarRotina({ nome, configuracao: { minutos, formato: checkin.formatoPreferido }, ativa: true }); setCheckin({ ...checkin, minutosDisponiveis: minutos }); toast.success(`Rotina “${nome}” ativada.`) }
  async function iniciar() { setSessao(await adaptive.iniciarSessao({ objetivo: objetivo || acao?.motivo || 'Consolidar minha próxima competência' })); toast.success('Sessão guiada iniciada.') }
  async function concluir() { await adaptive.concluirSessao(sessao.idSessao, { conhecimentoPrevio: recordacao, resumoFinal: resumo, dificuldadePercebida: 'MEDIA' }); setSessao(null); setObjetivo(''); setRecordacao(''); setResumo(''); await carregar(); toast.success('Sessão concluída e registrada.') }

  return <section className="mt-5 grid gap-5">
    <article className="rounded-[2rem] bg-gradient-to-br from-[#4B2A80] to-[#241A34] p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#D7C5FF]">Próxima melhor ação</p><h2 className="mt-2 text-2xl font-black">{acao?.tipo?.replaceAll('_', ' ') || 'Calculando seu próximo passo'}</h2><p className="mt-2 max-w-2xl text-sm text-white/75">{acao?.motivo}</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><b className="text-2xl">{sequencia}</b><small className="block">semanas consistentes</small></div></div>
      {!sessao ? <div className="mt-5 flex flex-wrap gap-2"><input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Objetivo desta sessão" className="min-w-64 flex-1 rounded-full p-3 text-black"/><button type="button" onClick={iniciar} className="rounded-full bg-white px-5 py-3 font-black text-[#4B2A80]">Começar sessão guiada</button></div> : <div className="mt-5 grid gap-3 rounded-2xl bg-white/10 p-4"><b>1. Antes de consultar: o que você já lembra?</b><textarea value={recordacao} onChange={(e) => setRecordacao(e.target.value)} className="rounded-xl p-3 text-black"/><b>2. Após estudar e praticar: explique com suas palavras</b><textarea value={resumo} onChange={(e) => setResumo(e.target.value)} className="rounded-xl p-3 text-black"/><button type="button" disabled={resumo.trim().length < 20} onClick={concluir} className="rounded-full bg-white px-5 py-3 font-black text-[#4B2A80] disabled:opacity-40">Concluir sessão</button></div>}
    </article>
    <div className="grid gap-5 lg:grid-cols-3">
      <form onSubmit={salvarCheckin} className="rounded-[2rem] bg-white p-5 dark:bg-[#211A2D]"><h3 className="font-black">Check-in de hoje</h3><label className="mt-3 block text-sm">Energia: {checkin.energia}/5<input className="w-full" type="range" min="1" max="5" value={checkin.energia} onChange={(e) => setCheckin({ ...checkin, energia: Number(e.target.value) })}/></label><input aria-label="Minutos disponíveis" className="mt-3 w-full rounded-xl border p-2" type="number" min="5" value={checkin.minutosDisponiveis} onChange={(e) => setCheckin({ ...checkin, minutosDisponiveis: Number(e.target.value) })}/><select className="mt-3 w-full rounded-xl border p-2" value={checkin.formatoPreferido} onChange={(e) => setCheckin({ ...checkin, formatoPreferido: e.target.value })}><option value="EXERCICIOS">Exercícios</option><option value="REVISAO">Revisão</option><option value="LEITURA">Leitura</option><option value="VIDEO">Vídeo</option></select><div className="mt-3 flex flex-wrap gap-1">{[['Dia corrido',15],['Rotina normal',30],['Semana de provas',60]].map(([nome,minutos]) => <button type="button" key={nome} onClick={() => ativarRotina(nome,minutos)} className="rounded-full border px-2 py-1 text-xs">{nome}</button>)}</div><button className="mt-3 rounded-full bg-[#6D3EC5] px-4 py-2 font-bold text-white">Recalcular hoje</button></form>
      <article className="rounded-[2rem] bg-white p-5 dark:bg-[#211A2D]"><h3 className="font-black">Competências prioritárias</h3>{competencias.slice(0, 5).map((item) => <div key={item.id_competencia} className="mt-3"><div className="flex justify-between text-sm"><b>{item.nome}</b><span>{item.dominio}%</span></div><div className="mt-1 h-2 rounded-full bg-black/10"><div className="h-full rounded-full bg-[#6D3EC5]" style={{ width: `${item.dominio}%` }}/></div><small className="opacity-60">{item.disciplina} · {item.dificuldadeRecomendada}</small></div>)}</article>
      <article className="rounded-[2rem] bg-white p-5 dark:bg-[#211A2D]"><h3 className="font-black">Missões da semana</h3>{missoes.map((missao) => <div key={missao.id_missao} className="mt-3 rounded-xl border p-3"><b>{missao.titulo}</b><p className="text-sm opacity-60">{missao.progresso}/{missao.alvo}</p></div>)}</article>
    </div>
  </section>
}

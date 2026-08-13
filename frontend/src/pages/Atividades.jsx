import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import atividadeService from '../services/atividadeService'

const novaQuestao = () => ({ id: `q-${Date.now()}`, enunciado: '', tipo: 'MULTIPLA_ESCOLHA', opcoes: ['', ''], resposta_correta: '' })

export default function Atividades() {
  const { isAdmin, isDono, isDocente } = useAuth()
  const gestor = isAdmin || isDono || isDocente
  const [itens, setItens] = useState([])
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', prazo: '', questoes: [novaQuestao()] })

  const carregar = async () => { try { setItens(await atividadeService.listar()) } catch { toast.error('Não foi possível carregar as atividades.') } }
  useEffect(() => { carregar() }, [])
  const salvar = async (status) => {
    try {
      const atividade = await atividadeService.criar({ ...form, status })
      setItens((atual) => [atividade, ...atual]); setAberto(false)
      setForm({ titulo: '', descricao: '', prazo: '', questoes: [novaQuestao()] })
      toast.success(status === 'PUBLICADA' ? 'Atividade publicada.' : 'Rascunho salvo.')
    } catch (error) { toast.error(error.response?.data?.message || 'Revise os dados da atividade.') }
  }
  const atualizarQuestao = (indice, dados) => setForm((atual) => ({ ...atual, questoes: atual.questoes.map((q, i) => i === indice ? { ...q, ...dados } : q) }))

  return <div className="min-h-screen bg-[#F7F7FB] px-4 py-10 dark:bg-[#0F0E20] sm:px-8"><div className="mx-auto max-w-6xl">
    <header className="mb-8 rounded-[2.5rem] bg-gradient-to-br from-[#4B4C9D] to-[#9394CF] p-8 text-white shadow-2xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[.3em] text-white/70">Espaço de aprendizagem</p><h1 className="mt-2 text-4xl font-black">Atividades</h1><p className="mt-2 text-white/85">Desafios, entregas e feedbacks em um só lugar.</p></div>{gestor && <button onClick={() => setAberto(!aberto)} className="rounded-full bg-white px-6 py-3 font-black text-[#4B4C9D]">{aberto ? 'Fechar editor' : 'Criar atividade'}</button>}</div></header>
    {aberto && <section className="mb-7 space-y-4 rounded-[2rem] bg-white p-6 shadow-xl dark:bg-[#1E1D3A]"><h2 className="text-2xl font-black">Nova atividade</h2><input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título" className="w-full rounded-xl border p-3 text-black" /><textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Instruções ou situação-problema" className="w-full rounded-xl border p-3 text-black" /><input type="datetime-local" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} className="rounded-xl border p-3 text-black" />
      {form.questoes.map((q, i) => <div key={q.id} className="space-y-2 rounded-xl border border-[#9394CF]/30 p-4"><b>Questão {i + 1}</b><select value={q.tipo} onChange={(e) => atualizarQuestao(i, { tipo: e.target.value })} className="ml-3 rounded border p-2 text-black"><option value="MULTIPLA_ESCOLHA">Múltipla escolha</option><option value="CHECKBOX">Checklist</option><option value="DISSERTATIVA">Discursiva</option></select><textarea value={q.enunciado} onChange={(e) => atualizarQuestao(i, { enunciado: e.target.value })} placeholder="Enunciado" className="block w-full rounded border p-2 text-black" />{q.tipo !== 'DISSERTATIVA' && <><input value={q.opcoes[0]} onChange={(e) => atualizarQuestao(i, { opcoes: [e.target.value, q.opcoes[1]] })} placeholder="Opção 1" className="mr-2 rounded border p-2 text-black" /><input value={q.opcoes[1]} onChange={(e) => atualizarQuestao(i, { opcoes: [q.opcoes[0], e.target.value] })} placeholder="Opção 2" className="rounded border p-2 text-black" /><input value={q.resposta_correta} onChange={(e) => atualizarQuestao(i, { resposta_correta: e.target.value })} placeholder="Gabarito" className="block mt-2 w-full rounded border p-2 text-black" /></>}</div>)}
      <button onClick={() => setForm({ ...form, questoes: [...form.questoes, novaQuestao()] })} className="font-bold text-[#4B4C9D]">+ Adicionar questão</button><div className="flex gap-3"><button onClick={() => salvar('RASCUNHO')} className="rounded-full border border-[#4B4C9D] px-5 py-2 font-bold text-[#4B4C9D]">Salvar rascunho</button><button onClick={() => salvar('PUBLICADA')} className="rounded-full bg-[#4B4C9D] px-5 py-2 font-bold text-white">Publicar</button></div></section>}
    <div className="grid gap-4 md:grid-cols-2">{itens.map((item) => <article key={item.id_atividade} className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-[#1E1D3A]"><span className="rounded-full bg-[#9394CF]/20 px-3 py-1 text-xs font-black">{item.status}</span><h2 className="mt-4 text-xl font-black">{item.titulo || item.pergunta}</h2><p className="mt-2 text-sm opacity-70">{item.descricao}</p><p className="mt-5 text-sm font-bold text-[#4B4C9D]">{item.questoes?.length || 0} questões {gestor && `• ${item.entregas || 0} entregas`}</p></article>)}</div>
  </div></div>
}

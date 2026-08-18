import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import aprendizagem from '../services/aprendizagemService'

const palavras = (texto = '') => texto.trim().split(/\s+/).filter(Boolean).length

export default function EssayVersions({ redacao }) {
  const [aberto, setAberto] = useState(false)
  const [versoes, setVersoes] = useState([])
  const [texto, setTexto] = useState(redacao.texto || '')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { setTexto(redacao.texto || ''); setVersoes([]); setAberto(false) }, [redacao.id_redacao, redacao.texto])
  async function abrir() {
    const novo = !aberto; setAberto(novo)
    if (novo) try { setVersoes(await aprendizagem.versoesRedacao(redacao.id_redacao)) } catch { toast.error('Não foi possível carregar as versões.') }
  }
  async function salvar() {
    if (palavras(texto) < 20) return toast.error('A versão precisa ter ao menos 20 palavras.')
    setSalvando(true)
    try { setVersoes(await aprendizagem.criarVersaoRedacao(redacao.id_redacao, { texto, observacao: 'Reescrita pelo estudante' })); toast.success('Nova versão registrada.') }
    catch { toast.error('Não foi possível salvar a versão.') } finally { setSalvando(false) }
  }
  const anterior = versoes[0]
  const evolucao = useMemo(() => palavras(texto) - palavras(anterior?.texto || redacao.texto), [texto, anterior, redacao.texto])

  return <section className="rounded-2xl border border-[#7C4DFF]/20 bg-[#F8F4FC] p-4 dark:bg-[#281D36]">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#6D3EC5] dark:text-[#CBB3FF]">Oficina de reescrita</p><h4 className="font-black">Versões e evolução</h4></div><button type="button" onClick={abrir} className="rounded-full border border-[#7C4DFF]/25 px-4 py-2 text-xs font-black">{aberto ? 'Fechar oficina' : 'Criar nova versão'}</button></div>
    {aberto && <div className="mt-4"><textarea value={texto} onChange={(e)=>setTexto(e.target.value)} rows={10} className="w-full rounded-xl border border-[#7C4DFF]/20 bg-white p-4 text-sm leading-7 text-black outline-none focus:border-[#7C4DFF] dark:bg-[#17111F] dark:text-white" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs"><span><b>{palavras(texto)} palavras</b> · {evolucao >= 0 ? '+' : ''}{evolucao} desde a versão anterior</span><button type="button" disabled={salvando} onClick={salvar} className="rounded-full bg-[#6D3EC5] px-5 py-2.5 font-black text-white disabled:opacity-50">{salvando ? 'Salvando…' : 'Registrar versão'}</button></div>{versoes.length > 0 && <div className="mt-5 grid gap-2"><p className="text-xs font-black uppercase tracking-wider">Histórico</p>{versoes.map((v)=><button type="button" onClick={()=>setTexto(v.texto)} key={v.id_versao} className="flex items-center justify-between rounded-xl border border-[#7C4DFF]/15 bg-white p-3 text-left text-xs dark:bg-white/5"><b>Versão {v.numero_versao}</b><span>{palavras(v.texto)} palavras · {new Date(v.criado_em).toLocaleDateString('pt-BR')}</span></button>)}</div>}</div>}
  </section>
}


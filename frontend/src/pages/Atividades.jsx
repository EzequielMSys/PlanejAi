import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import atividadeService from '../services/atividadeService'
import { motion, AnimatePresence } from 'framer-motion'
import MaterialViewer from '../components/MaterialViewer'

const novaQuestao = () => ({ id: `q-${Date.now()}`, enunciado: '', tipo: 'MULTIPLA_ESCOLHA', opcoes: ['', ''], resposta_correta: '' })

export default function Atividades() {
  const { isGestor } = useAuth()
  const [itens, setItens] = useState([])
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [alunos, setAlunos] = useState([])
  const [carregandoAlunos, setCarregandoAlunos] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [entregas, setEntregas] = useState(null)
  const [correcoes, setCorrecoes] = useState({})
  const [material, setMaterial] = useState(null)
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    prazo: '',
    anexos: [],
    questoes: [novaQuestao()],
    atribuicao: 'TODOS',
    destinatarios: []
  })

  const carregarAlunos = async () => {
    if (!isGestor) return
    setCarregandoAlunos(true)
    try {
      const data = await atividadeService.listarAlunos()
      setAlunos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Não foi possível carregar alunos.')
    } finally {
      setCarregandoAlunos(false)
    }
  }

  const carregar = async () => {
    try {
      const data = await atividadeService.listar()
      setItens(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Não foi possível carregar as atividades.')
    }
  }

  useEffect(() => { carregar() }, [])
  useEffect(() => { if (aberto) carregarAlunos() }, [aberto])

  const handleUploadImagem = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviandoImagem(true)
    try {
      const data = await atividadeService.uploadImagem(file)
      setForm((f) => ({
        ...f,
        anexos: [...f.anexos, { tipo: file.type, url: data.url, nome: file.name }]
      }))
      setUploadPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
      toast.success('Imagem enviada.')
    } catch {
      toast.error('Erro ao enviar imagem.')
    } finally {
      setEnviandoImagem(false)
      e.target.value = ''
    }
  }

  const removerAnexo = (index) => {
    setForm((f) => ({ ...f, anexos: f.anexos.filter((_, i) => i !== index) }))
    if (index === 0) setUploadPreview(null)
  }

  const salvar = async (status) => {
    if (!form.titulo.trim()) {
      toast.error('Informe o título da atividade.')
      return
    }
    setSalvando(true)
    try {
      const payload = {
        ...form,
        status,
        atribuicao: form.atribuicao,
        destinatarios: form.atribuicao === 'SELECIONADOS' ? form.destinatarios : []
      }
      const atividade = editandoId
        ? await atividadeService.atualizar(editandoId, payload)
        : await atividadeService.criar(payload)
      setItens((atual) => editandoId ? atual.map((item) => item.id_atividade === editandoId ? atividade : item) : [atividade, ...atual])
      setAberto(false)
      setEditandoId(null)
      setForm({ titulo: '', descricao: '', prazo: '', anexos: [], questoes: [novaQuestao()], atribuicao: 'TODOS', destinatarios: [] })
      setUploadPreview(null)
      toast.success(editandoId ? 'Atividade atualizada.' : status === 'PUBLICADA' ? 'Atividade publicada.' : 'Rascunho salvo.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Revise os dados da atividade.')
    } finally {
      setSalvando(false)
    }
  }

  const toggleDestinatario = (idUsuario) => {
    setForm((f) => {
      const lista = Array.isArray(f.destinatarios) ? f.destinatarios : []
      const existe = lista.includes(idUsuario)
      return {
        ...f,
        destinatarios: existe ? lista.filter((id) => id !== idUsuario) : [...lista, idUsuario]
      }
    })
  }

  const atualizarQuestao = (indice, dados) => {
    setForm((atual) => ({
      ...atual,
      questoes: atual.questoes.map((q, i) => (i === indice ? { ...q, ...dados } : q))
    }))
  }

  const adicionarQuestao = () => {
    setForm((f) => ({ ...f, questoes: [...f.questoes, novaQuestao()] }))
  }

  const removerQuestao = (index) => {
    setForm((f) => ({ ...f, questoes: f.questoes.filter((_, i) => i !== index) }))
  }

  const editar = (item) => {
    setForm({
      titulo: item.titulo || '', descricao: item.descricao || '', prazo: item.prazo ? String(item.prazo).slice(0, 16) : '',
      anexos: item.anexos || [], questoes: item.questoes?.length ? item.questoes : [novaQuestao()],
      atribuicao: item.atribuicao || 'TODOS', destinatarios: (item.destinatarios || []).map(String)
    })
    setEditandoId(item.id_atividade); setAberto(true); setUploadPreview(null); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const abrirEntregas = async (item) => {
    try { setEntregas({ atividade: item, itens: await atividadeService.entregas(item.id_atividade) }) }
    catch { toast.error('Não foi possível carregar as entregas.') }
  }

  const corrigir = async (resposta) => {
    const dados = correcoes[resposta.id_resposta] || { nota: resposta.nota ?? '', feedback: resposta.feedback || '' }
    try {
      const atualizada = await atividadeService.corrigir(resposta.id_resposta, dados)
      setEntregas((atual) => ({ ...atual, itens: atual.itens.map((item) => item.id_resposta === atualizada.id_resposta ? atualizada : item) }))
      toast.success('Correção salva e liberada ao aluno.')
    } catch (error) { toast.error(error.response?.data?.message || 'Revise a nota informada.') }
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] px-4 py-10 dark:bg-[#0F0E20] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="workspace-hero mb-8 rounded-[2.5rem] bg-gradient-to-br from-[#4B4C9D] to-[#9394CF] p-8 text-white shadow-2xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[.3em] text-white/70">Espaço de aprendizagem</p>
              <h1 className="mt-2 text-4xl font-black">Atividades</h1>
              <p className="mt-2 text-white/85">Crie desafios, anexe materiais e acompanhe entregas.</p>
            </div>
            {isGestor && (
              <button
                onClick={() => setAberto(!aberto)}
                className="rounded-full bg-white px-6 py-3 font-black text-[#4B4C9D] shadow-xl hover:scale-105 transition"
              >
                {aberto ? 'Fechar editor' : 'Criar atividade'}
              </button>
            )}
          </div>
        </header>

        <AnimatePresence>
          {aberto && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-10 space-y-6 rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl dark:bg-[#1E1D3A]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">{editandoId ? 'Editar atividade' : 'Nova atividade'}</h2>
                <span className="text-xs font-bold text-black/50 dark:text-white/50 bg-[#F7F7FB] dark:bg-white/10 px-3 py-1 rounded-full">
                  {isGestor ? 'Modo gestor' : 'Modo aluno'}
                </span>
              </div>

              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Título da atividade"
                className="w-full rounded-2xl border border-[#9394CF]/40 bg-[#F7F7FB] px-5 py-3 text-black dark:text-white"
              />

              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Instruções ou situação-problema"
                className="h-32 w-full rounded-2xl border border-[#9394CF]/40 bg-[#F7F7FB] px-5 py-3 text-black dark:text-white"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="datetime-local"
                  value={form.prazo}
                  onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                  className="rounded-2xl border border-[#9394CF]/40 bg-[#F7F7FB] px-5 py-3 text-black dark:text-white"
                />
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.webm"
                    className="hidden"
                    onChange={handleUploadImagem}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={enviandoImagem}
                    className="w-full rounded-2xl border border-dashed border-[#9394CF] bg-[#F7F7FB] px-5 py-3 font-bold text-[#4B4C9D] hover:bg-[#9394CF]/10 transition disabled:opacity-50"
                  >
                    {enviandoImagem ? 'Enviando...' : 'Anexar arquivo'}
                  </button>
                </div>
              </div>

              {isGestor && (
                <div className="rounded-2xl border border-[#9394CF]/30 bg-[#F7F7FB] p-5 dark:bg-white/5 space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[#4B4C9D]">Atribuição</p>
                  <select
                    value={form.atribuicao}
                    onChange={(e) => setForm((f) => ({ ...f, atribuicao: e.target.value, destinatarios: e.target.value === 'TODOS' ? [] : f.destinatarios }))}
                    className="w-full rounded-xl border border-[#9394CF]/40 bg-white px-4 py-2 text-sm font-bold text-black dark:bg-[#1E1D3A] dark:text-white"
                  >
                    <option value="TODOS">Todos os alunos</option>
                    <option value="SELECIONADOS">Alunos selecionados</option>
                  </select>

                  {form.atribuicao === 'SELECIONADOS' && (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-[#9394CF]/30 bg-white p-3 dark:bg-[#1E1D3A]">
                      {carregandoAlunos ? (
                        <p className="text-sm text-black/60 dark:text-white/60">Carregando alunos...</p>
                      ) : alunos.length === 0 ? (
                        <p className="text-sm text-black/60 dark:text-white/60">Nenhum aluno disponível.</p>
                      ) : (
                        <div className="space-y-2">
                          {alunos.map((aluno) => {
                            const id = String(aluno.id_usuario || aluno.id)
                            const marcado = (form.destinatarios || []).includes(id)
                            return (
                              <label key={id} className="flex items-center gap-3 text-sm font-semibold text-black dark:text-white">
                                <input
                                  type="checkbox"
                                  checked={marcado}
                                  onChange={() => toggleDestinatario(id)}
                                  className="w-4 h-4 accent-[#4B4C9D]"
                                />
                                {aluno.nome} <span className="text-black/50 dark:text-white/50">• {aluno.email}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {uploadPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative inline-block"
                  >
                    <img src={uploadPreview} alt="Prévia do anexo" className="h-40 w-auto rounded-2xl border border-[#9394CF]/30 object-cover" />
                    <button
                      type="button"
                      onClick={() => removerAnexo(0)}
                      className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {form.anexos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.anexos.map((anexo, i) => (
                    <span key={i} className="flex items-center gap-2 rounded-full bg-[#9394CF]/10 px-3 py-1 text-xs font-bold text-[#4B4C9D]">
                      {anexo.nome || anexo.url}
                      <button type="button" onClick={() => removerAnexo(i)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {form.questoes.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 rounded-2xl border border-[#9394CF]/30 bg-[#F7F7FB] p-5 dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-[#4B4C9D]">Questão {i + 1}</span>
                      {form.questoes.length > 1 && (
                        <button type="button" onClick={() => removerQuestao(i)} className="text-xs font-bold text-red-500 hover:text-red-700">
                          Remover
                        </button>
                      )}
                    </div>

                    <select
                      value={q.tipo}
                      onChange={(e) => atualizarQuestao(i, { tipo: e.target.value, resposta_correta: e.target.value === 'CHECKBOX' ? [] : '' })}
                      className="w-full rounded-xl border border-[#9394CF]/40 bg-white px-4 py-2 text-sm font-bold text-black dark:bg-[#1E1D3A] dark:text-white"
                    >
                      <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
                      <option value="CHECKBOX">Checklist (múltipla)</option>
                      <option value="DISSERTATIVA">Discursiva</option>
                    </select>

                    <textarea
                      value={q.enunciado}
                      onChange={(e) => atualizarQuestao(i, { enunciado: e.target.value })}
                      placeholder="Enunciado da questão"
                      className="h-24 w-full rounded-xl border border-[#9394CF]/40 bg-white px-4 py-3 text-sm text-black dark:bg-[#1E1D3A] dark:text-white"
                    />

                    {q.tipo !== 'DISSERTATIVA' && (
                      <div className="grid gap-3">
                        {(q.opcoes || []).map((opcao, opcaoIndex) => <div key={opcaoIndex} className="flex gap-2"><input value={opcao} onChange={(e) => { const opcoes = [...q.opcoes]; const anterior = opcoes[opcaoIndex]; opcoes[opcaoIndex] = e.target.value; const resposta_correta = Array.isArray(q.resposta_correta) ? q.resposta_correta.map((v) => v === anterior ? e.target.value : v) : q.resposta_correta === anterior ? e.target.value : q.resposta_correta; atualizarQuestao(i, { opcoes, resposta_correta }) }} placeholder={`Opção ${opcaoIndex + 1}`} className="flex-1 rounded-xl border border-[#9394CF]/40 bg-white px-4 py-2 text-sm text-black dark:bg-[#1E1D3A] dark:text-white" />{q.opcoes.length > 2 && <button type="button" onClick={() => atualizarQuestao(i, { opcoes: q.opcoes.filter((_, n) => n !== opcaoIndex) })}>×</button>}</div>)}
                        <button type="button" onClick={() => atualizarQuestao(i, { opcoes: [...q.opcoes, ''] })} className="text-left text-xs font-bold text-[#4B4C9D]">+ Nova opção</button>
                        {q.tipo === 'MULTIPLA_ESCOLHA' ? <select value={q.resposta_correta || ''} onChange={(e) => atualizarQuestao(i, { resposta_correta: e.target.value })} className="rounded-xl border p-2 text-black"><option value="">Selecione o gabarito</option>{q.opcoes.filter(Boolean).map((opcao) => <option key={opcao}>{opcao}</option>)}</select> : <div className="flex flex-wrap gap-2">{q.opcoes.filter(Boolean).map((opcao) => <label key={opcao} className="flex items-center gap-2 rounded-lg border p-2 text-xs"><input type="checkbox" checked={(q.resposta_correta || []).includes(opcao)} onChange={() => { const atual = q.resposta_correta || []; atualizarQuestao(i, { resposta_correta: atual.includes(opcao) ? atual.filter((v) => v !== opcao) : [...atual, opcao] }) }} />{opcao}</label>)}</div>}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-black/60 dark:text-white/60">Pontos</label>
                      <input
                        type="number"
                        min={1}
                        value={q.pontos}
                        onChange={(e) => atualizarQuestao(i, { pontos: Number(e.target.value) })}
                        className="w-20 rounded-xl border border-[#9394CF]/40 bg-white px-3 py-2 text-sm text-black dark:bg-[#1E1D3A] dark:text-white"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={adicionarQuestao} className="rounded-full border border-[#9394CF] px-5 py-2 text-sm font-black text-[#4B4C9D] hover:bg-[#9394CF]/10 transition">
                  + Adicionar questão
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => salvar('RASCUNHO')}
                  disabled={salvando}
                  className="rounded-full border border-[#4B4C9D] px-6 py-3 font-bold text-[#4B4C9D] hover:bg-[#4B4C9D]/10 transition disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar rascunho'}
                </button>
                <button
                  onClick={() => salvar('PUBLICADA')}
                  disabled={salvando}
                  className="rounded-full bg-[#4B4C9D] px-6 py-3 font-bold text-white shadow-xl hover:bg-black transition disabled:opacity-50"
                >
                  {salvando ? 'Publicando...' : 'Publicar atividade'}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="grid gap-5 md:grid-cols-2">
          {itens.map((item) => (
            <motion.article
              key={item.id_atividade}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2.5rem] bg-white p-6 shadow-xl dark:bg-[#1E1D3A] border border-[#9394CF]/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-[#9394CF]/20 px-3 py-1 text-xs font-black">{item.status}</span>
                <span className="text-xs font-bold text-black/50 dark:text-white/50">{item.questoes?.length || 0} questões</span>
              </div>

              <h2 className="text-xl font-black mb-2">{item.titulo || item.pergunta}</h2>
              <p className="text-sm text-black/60 dark:text-white/60 line-clamp-2">{item.descricao}</p>

              {item.anexos?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.anexos.map((anexo, idx) => <button type="button" key={`${anexo.url}-${idx}`} onClick={() => setMaterial({ ...anexo, titulo: anexo.nome || 'Anexo' })} className="rounded-full border px-3 py-2 text-xs font-bold text-[#3157d5]">Abrir {anexo.nome || `anexo ${idx + 1}`}</button>)}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#4B4C9D]">{isGestor ? `${item.entregas || 0} entregas` : 'Ver atividade'}</span>
                <div className="flex gap-2"><button type="button" onClick={() => editar(item)} className="rounded-full border px-3 py-1 text-xs font-bold">Editar</button><button type="button" onClick={() => abrirEntregas(item)} className="rounded-full bg-[#4B4C9D] px-3 py-1 text-xs font-bold text-white">Corrigir</button></div>
              </div>
            </motion.article>
          ))}
        </section>
        {!itens.length && !aberto && (
          <section className="pj-panel activity-empty-state">
            <span className="activity-empty-mark">+</span>
            <div>
              <p className="pj-eyebrow">Primeiro desafio</p>
              <h2>Crie uma experiência de aprendizagem.</h2>
              <p>Combine contexto, arquivos e questões. O PlanejAI organiza as entregas e deixa a correção automática ou manual no mesmo fluxo.</p>
            </div>
            {isGestor && <button type="button" className="pj-button pj-button--primary" onClick={() => setAberto(true)}>Criar primeira atividade</button>}
          </section>
        )}
        {entregas && <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4" onMouseDown={() => setEntregas(null)}><section className="mx-auto my-8 max-w-3xl rounded-3xl bg-white p-6 text-black shadow-2xl" onMouseDown={(e) => e.stopPropagation()}><header className="flex justify-between gap-3"><div><p className="text-xs font-black text-[#4B4C9D]">ENTREGAS</p><h2 className="text-2xl font-black">{entregas.atividade.titulo}</h2></div><button onClick={() => setEntregas(null)} className="text-2xl">×</button></header>{!entregas.itens.length ? <p className="mt-8 rounded-xl bg-slate-50 p-6 text-center">Ainda não há entregas.</p> : <div className="mt-5 grid gap-4">{entregas.itens.map((resposta) => { const formCorrecao = correcoes[resposta.id_resposta] || { nota: resposta.nota ?? '', feedback: resposta.feedback || '' }; return <article key={resposta.id_resposta} className="rounded-2xl border p-4"><div className="flex justify-between"><div><b>{resposta.nome}</b><p className="text-xs opacity-60">{resposta.email}</p></div><span className="text-xs font-bold">{resposta.status}</span></div><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs">{JSON.stringify(resposta.resposta, null, 2)}</pre><div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_auto]"><input type="number" min="0" max="100" value={formCorrecao.nota} onChange={(e) => setCorrecoes({ ...correcoes, [resposta.id_resposta]: { ...formCorrecao, nota: e.target.value } })} placeholder="Nota" className="rounded-lg border p-2" /><input value={formCorrecao.feedback} onChange={(e) => setCorrecoes({ ...correcoes, [resposta.id_resposta]: { ...formCorrecao, feedback: e.target.value } })} placeholder="Feedback ao aluno" className="rounded-lg border p-2" /><button onClick={() => corrigir(resposta)} className="rounded-lg bg-[#3157d5] px-4 py-2 font-bold text-white">Salvar</button></div></article>})}</div>}</section></div>}
        {material && <MaterialViewer material={material} onClose={() => setMaterial(null)} />}
      </div>
    </div>
  )
}

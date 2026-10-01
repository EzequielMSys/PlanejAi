import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import atividadeService from '../services/atividadeService'
import { motion, AnimatePresence } from 'framer-motion'
import MaterialViewer from '../components/MaterialViewer'
import { Button, PageHeader } from '../components/ui/PlanejUI'
import './Atividades.css'

const novaQuestao = () => ({ id: `q-${Date.now()}-${Math.random().toString(16).slice(2)}`, enunciado: '', tipo: 'MULTIPLA_ESCOLHA', opcoes: ['', ''], pares: [{ esquerda: '', direita: '' }, { esquerda: '', direita: '' }], resposta_correta: '', pontos: 1, disciplina: '', dificuldade: 'MEDIA', explicacao: '', rubrica: [] })
const formularioInicial = () => ({ titulo: '', descricao: '', prazo: '', publicarEm: '', permiteReenvio: false, rubrica: [], anexos: [], questoes: [novaQuestao()], atribuicao: 'TODOS', destinatarios: [] })
const TIPOS_QUESTAO = [
  ['MULTIPLA_ESCOLHA', 'Múltipla escolha'], ['CHECKBOX', 'Checklist'], ['DISSERTATIVA', 'Discursiva'],
  ['RESPOSTA_CURTA', 'Resposta curta'], ['ORDENACAO', 'Ordenação'], ['ASSOCIACAO', 'Associação'], ['ARQUIVO', 'Envio de arquivo']
]

function QuestionEditor({ questao, index, total, update, remove, saveToBank }) {
  const setOpcao = (opcaoIndex, valor) => {
    const opcoes = [...(questao.opcoes || [])]
    const anterior = opcoes[opcaoIndex]
    opcoes[opcaoIndex] = valor
    const resposta_correta = Array.isArray(questao.resposta_correta) ? questao.resposta_correta.map((item) => item === anterior ? valor : item) : questao.resposta_correta === anterior ? valor : questao.resposta_correta
    update({ opcoes, resposta_correta })
  }
  const tiposComOpcoes = ['MULTIPLA_ESCOLHA', 'CHECKBOX', 'ORDENACAO'].includes(questao.tipo)

  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="activity-question-editor">
    <header><span>Questão {index + 1}</span><div><button type="button" onClick={saveToBank}>Salvar na biblioteca</button>{total > 1 && <button type="button" className="is-danger" onClick={remove}>Remover</button>}</div></header>
    <div className="activity-question-meta"><select value={questao.tipo} onChange={(event) => update({ tipo: event.target.value, resposta_correta: event.target.value === 'CHECKBOX' ? [] : '' })}>{TIPOS_QUESTAO.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><input value={questao.disciplina || ''} onChange={(event) => update({ disciplina: event.target.value })} placeholder="Disciplina" /><select value={questao.dificuldade || 'MEDIA'} onChange={(event) => update({ dificuldade: event.target.value })}><option value="FACIL">Fácil</option><option value="MEDIA">Média</option><option value="DIFICIL">Difícil</option></select><label>Peso <input type="number" min="0.25" step="0.25" value={questao.pontos || 1} onChange={(event) => update({ pontos: Number(event.target.value) })} /></label></div>
    <textarea value={questao.enunciado} onChange={(event) => update({ enunciado: event.target.value })} placeholder="Escreva o enunciado ou a situação-problema" />

    {tiposComOpcoes && <div className="activity-option-editor">{(questao.opcoes || []).map((opcao, opcaoIndex) => <div key={opcaoIndex}><i>{String.fromCharCode(65 + opcaoIndex)}</i><input value={opcao} onChange={(event) => setOpcao(opcaoIndex, event.target.value)} placeholder={`Opção ${opcaoIndex + 1}`} />{questao.opcoes.length > 2 && <button type="button" onClick={() => update({ opcoes: questao.opcoes.filter((_, itemIndex) => itemIndex !== opcaoIndex) })}>×</button>}</div>)}<button type="button" onClick={() => update({ opcoes: [...(questao.opcoes || []), ''] })}>+ Nova opção</button>{questao.tipo === 'MULTIPLA_ESCOLHA' && <select value={questao.resposta_correta || ''} onChange={(event) => update({ resposta_correta: event.target.value })}><option value="">Selecione o gabarito</option>{questao.opcoes.filter(Boolean).map((opcao, opcaoIndex) => <option key={`${opcao}-${opcaoIndex}`}>{opcao}</option>)}</select>}{questao.tipo === 'CHECKBOX' && <div className="activity-answer-grid">{questao.opcoes.filter(Boolean).map((opcao, opcaoIndex) => <label key={`${opcao}-${opcaoIndex}`}><input type="checkbox" checked={(questao.resposta_correta || []).includes(opcao)} onChange={() => { const atual = questao.resposta_correta || []; update({ resposta_correta: atual.includes(opcao) ? atual.filter((item) => item !== opcao) : [...atual, opcao] }) }} />{opcao}</label>)}</div>}{questao.tipo === 'ORDENACAO' && <small>A ordem cadastrada acima será considerada a sequência correta.</small>}</div>}

    {questao.tipo === 'ASSOCIACAO' && <div className="activity-pairs"><small>Cadastre os pares correspondentes.</small>{(questao.pares || []).map((par, pairIndex) => <div key={pairIndex}><input value={par.esquerda} onChange={(event) => update({ pares: questao.pares.map((item, itemIndex) => itemIndex === pairIndex ? { ...item, esquerda: event.target.value } : item) })} placeholder="Item" /><span>→</span><input value={par.direita} onChange={(event) => update({ pares: questao.pares.map((item, itemIndex) => itemIndex === pairIndex ? { ...item, direita: event.target.value } : item) })} placeholder="Correspondência" /></div>)}<button type="button" onClick={() => update({ pares: [...(questao.pares || []), { esquerda: '', direita: '' }] })}>+ Adicionar par</button></div>}

    {['DISSERTATIVA', 'RESPOSTA_CURTA', 'ARQUIVO'].includes(questao.tipo) && <div className="activity-rubric"><strong>Correção humana</strong><p>{questao.tipo === 'ARQUIVO' ? 'O aluno enviará um arquivo para avaliação.' : 'Defina critérios objetivos para manter consistência entre as correções.'}</p><textarea value={(questao.rubrica || []).join('\n')} onChange={(event) => update({ rubrica: event.target.value.split('\n').filter(Boolean) })} placeholder="Um critério por linha: domínio do conceito, clareza, justificativa…" /></div>}
    <input value={questao.explicacao || ''} onChange={(event) => update({ explicacao: event.target.value })} placeholder="Explicação mostrada após a correção automática (opcional)" />
  </motion.div>
}

function DeliveryAnswers({ atividade, entrega }) {
  return <div className="activity-delivery-answers">{(atividade.questoes || []).map((questao, index) => {
    const valor = entrega.resposta?.[questao.id]
    const detalhe = entrega.correcao_detalhes?.find((item) => String(item.idQuestao) === String(questao.id))
    const texto = valor && typeof valor === 'object' ? (valor.nome || (Array.isArray(valor) ? valor.join(' → ') : Object.entries(valor).map(([a, b]) => `${a}: ${b}`).join(' · '))) : String(valor || 'Sem resposta')
    return <section key={questao.id}><header><span>{index + 1}</span><b>{questao.enunciado}</b>{detalhe && <strong data-correct={detalhe.acertou}>{detalhe.status === 'AGUARDA_CORRECAO' ? 'Manual' : detalhe.acertou ? `+${detalhe.pontos}` : '0 ponto'}</strong>}</header><p>{texto}</p>{questao.rubrica?.length > 0 && <small>Critérios: {questao.rubrica.join(' · ')}</small>}</section>
  })}</div>
}

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
  const [historicoVersoes, setHistoricoVersoes] = useState(null)
  const [banco, setBanco] = useState([])
  const [bancoAberto, setBancoAberto] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState('parado')
  const fileRef = useRef(null)
  const draftIdRef = useRef(null)

  const [form, setForm] = useState(formularioInicial)

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
  useEffect(() => {
    if (!aberto || (!form.titulo.trim() && !form.descricao.trim() && !form.questoes.some((questao) => questao.enunciado?.trim()))) return undefined
    setAutosaveStatus('salvando')
    const timer = window.setTimeout(async () => {
      try {
        const data = await atividadeService.autosalvar(draftIdRef.current || editandoId || 'novo', form)
        const id = data.atividade.id_atividade
        draftIdRef.current = id
        if (!editandoId) setEditandoId(id)
        setItens((atuais) => atuais.some((item) => item.id_atividade === id) ? atuais.map((item) => item.id_atividade === id ? data.atividade : item) : [data.atividade, ...atuais])
        setAutosaveStatus('salvo')
      } catch { setAutosaveStatus('erro') }
    }, 900)
    return () => window.clearTimeout(timer)
  }, [aberto, editandoId, form])

  const carregarBanco = async () => {
    try { setBanco(await atividadeService.bancoQuestoes()) }
    catch { toast.error('Não foi possível carregar o banco de questões.') }
  }

  const alternarBanco = () => {
    setBancoAberto((atual) => !atual)
    if (!banco.length) carregarBanco()
  }

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
      setForm(formularioInicial())
      draftIdRef.current = null
      setAutosaveStatus('parado')
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
    const fonte = item.rascunho || item
    setForm({
      titulo: fonte.titulo || '', descricao: fonte.descricao || '', prazo: fonte.prazo ? String(fonte.prazo).slice(0, 16) : '',
      anexos: fonte.anexos || [], questoes: fonte.questoes?.length ? fonte.questoes : [novaQuestao()],
      atribuicao: fonte.atribuicao || 'TODOS', destinatarios: (fonte.destinatarios || []).map(String),
      publicarEm: (fonte.publicarEm || fonte.publicar_em) ? String(fonte.publicarEm || fonte.publicar_em).slice(0, 16) : '', permiteReenvio: Boolean(fonte.permiteReenvio ?? fonte.permite_reenvio), rubrica: fonte.rubrica || []
    })
    draftIdRef.current = item.id_atividade; setEditandoId(item.id_atividade); setAberto(true); setAutosaveStatus('salvo'); setUploadPreview(null); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const abrirNovo = () => {
    setForm(formularioInicial()); setEditandoId(null); draftIdRef.current = null; setAutosaveStatus('parado'); setAberto(true); setUploadPreview(null)
  }

  const salvarQuestaoNoBanco = async (questao) => {
    try { const salva = await atividadeService.salvarNoBanco(questao); setBanco((atual) => [salva, ...atual]); toast.success('Questão adicionada à biblioteca.') }
    catch (error) { toast.error(error.response?.data?.message || 'Complete a questão antes de salvar na biblioteca.') }
  }

  const usarQuestao = async (item) => {
    const questao = { ...item.dados, id: `q-${Date.now()}-${item.id_questao_banco}` }
    setForm((atual) => ({ ...atual, questoes: [...atual.questoes, questao] }))
    atividadeService.registrarUso(item.id_questao_banco).catch(() => {})
    toast.success('Questão adicionada à atividade.')
  }

  const abrirEntregas = async (item) => {
    try { setEntregas({ atividade: item, itens: await atividadeService.entregas(item.id_atividade) }) }
    catch { toast.error('Não foi possível carregar as entregas.') }
  }

  const abrirVersoes = async (item) => {
    try { setHistoricoVersoes({ atividade: item, itens: await atividadeService.versoes(item.id_atividade) }) }
    catch { toast.error('Não foi possível carregar o histórico de versões.') }
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
    <main className="pj-page activities-page">
      <div className="pj-wrap">
        <PageHeader
          eyebrow="Atividades 2.0"
          title="Crie experiências que ensinam."
          description="Combine questões, arquivos, rubricas e correção automática. Seus rascunhos ficam salvos enquanto você trabalha."
          icon="A+"
          actions={isGestor && <Button variant={aberto ? 'secondary' : 'primary'} onClick={() => aberto ? setAberto(false) : abrirNovo()}>{aberto ? 'Fechar editor' : 'Criar atividade'}</Button>}
        />

        <AnimatePresence>
          {aberto && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-10 space-y-6 rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl dark:bg-[#1E1D3A]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black">{editandoId ? 'Editar atividade' : 'Nova atividade'}</h2>
                <span className={`activity-autosave is-${autosaveStatus}`}>{autosaveStatus === 'salvando' ? 'Salvando alterações…' : autosaveStatus === 'erro' ? 'Falha ao salvar' : autosaveStatus === 'salvo' ? 'Rascunho salvo' : 'Autosave ativo'}</span>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="activity-editor-field"><span>Publicação agendada</span><input type="datetime-local" value={form.publicarEm} onChange={(e) => setForm({ ...form, publicarEm: e.target.value })} /></label>
                <label className="activity-switch"><input type="checkbox" checked={form.permiteReenvio} onChange={(e) => setForm({ ...form, permiteReenvio: e.target.checked })} /><span><b>Permitir reenvio</b><small>O aluno poderá fazer uma nova entrega após a correção.</small></span></label>
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

              <section className="activity-bank-panel">
                <header><div><span>Biblioteca reutilizável</span><h3>Banco de questões</h3></div><Button variant="quiet" onClick={alternarBanco}>{bancoAberto ? 'Ocultar biblioteca' : 'Abrir biblioteca'}</Button></header>
                {bancoAberto && <div className="activity-bank-list">{!banco.length ? <p>Nenhuma questão salva. Use “Salvar na biblioteca” em qualquer questão pronta.</p> : banco.map((item) => <article key={item.id_questao_banco}><small>{item.disciplina || 'Geral'} · {item.dificuldade}</small><strong>{item.enunciado}</strong><span>{TIPOS_QUESTAO.find(([id]) => id === item.tipo)?.[1] || item.tipo} · usada {item.usos || 0}x</span><button type="button" onClick={() => usarQuestao(item)}>Usar nesta atividade +</button></article>)}</div>}
              </section>

              <div className="activity-question-list">
                {form.questoes.map((questao, index) => <QuestionEditor key={questao.id} questao={questao} index={index} total={form.questoes.length} update={(dados) => atualizarQuestao(index, dados)} remove={() => removerQuestao(index)} saveToBank={() => salvarQuestaoNoBanco(questao)} />)}
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
                <span className="text-xs font-bold text-black/50 dark:text-white/50">v{item.versao || 1} · {item.questoes?.length || 0} questões</span>
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
                <div className="flex gap-2"><button type="button" onClick={() => abrirVersoes(item)} className="rounded-full border px-3 py-1 text-xs font-bold">Versões</button><button type="button" onClick={() => editar(item)} className="rounded-full border px-3 py-1 text-xs font-bold">Editar</button><button type="button" onClick={() => abrirEntregas(item)} className="rounded-full bg-[#6D3EC5] px-3 py-1 text-xs font-bold text-white">Corrigir</button></div>
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
        {entregas && <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4" onMouseDown={() => setEntregas(null)}><section className="activity-correction-modal" onMouseDown={(e) => e.stopPropagation()}><header className="flex justify-between gap-3"><div><p className="text-xs font-black text-[#6D3EC5]">CORREÇÃO HÍBRIDA</p><h2 className="text-2xl font-black">{entregas.atividade.titulo}</h2></div><button onClick={() => setEntregas(null)} className="text-2xl">×</button></header>{!entregas.itens.length ? <p className="mt-8 rounded-xl bg-slate-50 p-6 text-center">Ainda não há entregas.</p> : <div className="mt-5 grid gap-4">{entregas.itens.map((resposta) => { const formCorrecao = correcoes[resposta.id_resposta] || { nota: resposta.nota ?? '', feedback: resposta.feedback || '' }; return <article key={resposta.id_resposta} className="activity-delivery"><div className="flex justify-between"><div><b>{resposta.nome}</b><p className="text-xs opacity-60">{resposta.email}</p></div><span className="text-xs font-bold">{resposta.status}</span></div><DeliveryAnswers atividade={entregas.atividade} entrega={resposta} /><div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_auto]"><input type="number" min="0" max="100" value={formCorrecao.nota} onChange={(e) => setCorrecoes({ ...correcoes, [resposta.id_resposta]: { ...formCorrecao, nota: e.target.value } })} placeholder="Nota" /><input value={formCorrecao.feedback} onChange={(e) => setCorrecoes({ ...correcoes, [resposta.id_resposta]: { ...formCorrecao, feedback: e.target.value } })} placeholder="Feedback ao aluno" /><Button onClick={() => corrigir(resposta)}>Liberar correção</Button></div></article>})}</div>}</section></div>}
        {historicoVersoes && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onMouseDown={() => setHistoricoVersoes(null)}><section className="activity-version-modal" onMouseDown={(e) => e.stopPropagation()}><header><div><span>HISTÓRICO SEGURO</span><h2>{historicoVersoes.atividade.titulo}</h2></div><button type="button" onClick={() => setHistoricoVersoes(null)}>×</button></header><div>{historicoVersoes.itens.map((item) => <article key={item.id_versao}><strong>Versão {item.numero_versao}</strong><span>{new Date(item.criado_em).toLocaleString('pt-BR')}</span></article>)}</div></section></div>}
        {material && <MaterialViewer material={material} onClose={() => setMaterial(null)} />}
      </div>
    </main>
  )
}

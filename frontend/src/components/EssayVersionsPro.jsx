import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import aprendizagem from '../services/aprendizagemService'
import './EssayVersionsPro.css'

const words = (text = '') => text.trim().split(/\s+/).filter(Boolean).length

export default function EssayVersionsPro({ redacao }) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState([])
  const [text, setText] = useState(redacao.texto || '')
  const [compareId, setCompareId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setText(redacao.texto || ''); setVersions([]); setCompareId(null); setOpen(false) }, [redacao.id_redacao, redacao.texto])
  async function toggle() {
    const next = !open; setOpen(next)
    if (next) try { setVersions(await aprendizagem.versoesRedacao(redacao.id_redacao)) } catch { toast.error('Não foi possível carregar as versões.') }
  }
  async function save() {
    if (words(text) < 20) return toast.error('A versão precisa ter ao menos 20 palavras.')
    setSaving(true)
    try { setVersions(await aprendizagem.criarVersaoRedacao(redacao.id_redacao, { texto: text, observacao: 'Reescrita pelo estudante' })); toast.success('Nova versão registrada.') }
    catch { toast.error('Não foi possível salvar a versão.') } finally { setSaving(false) }
  }
  const compared = versions.find((item) => String(item.id_versao) === String(compareId))
  const baseline = versions[0]?.texto || redacao.texto || ''
  const delta = useMemo(() => words(text) - words(baseline), [text, baseline])

  return <section className="essay-versions-pro">
    <header><div><span>OFICINA DE REESCRITA</span><h4>Versões, comparação e evolução</h4></div><button type="button" onClick={toggle}>{open ? 'Fechar oficina' : 'Abrir oficina'}</button></header>
    {open && <div className="essay-versions-body">
      <div className={`essay-version-editor ${compared ? 'has-compare' : ''}`}>
        <label><span>Versão em trabalho</span><textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
        {compared && <label><span>Versão {compared.numero_versao} · referência</span><textarea value={compared.texto} readOnly /></label>}
      </div>
      <div className="essay-version-actions"><span><b>{words(text)} palavras</b> · {delta >= 0 ? '+' : ''}{delta} desde a referência</span><div><select value={compareId || ''} onChange={(event) => setCompareId(event.target.value || null)}><option value="">Sem comparação</option>{versions.map((item) => <option value={item.id_versao} key={item.id_versao}>Comparar com versão {item.numero_versao}</option>)}</select><button type="button" disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Registrar versão'}</button></div></div>
      {versions.length > 0 && <div className="essay-version-history"><b>Histórico</b>{versions.map((item) => <button type="button" key={item.id_versao} onClick={() => { setText(item.texto); setCompareId(item.id_versao) }}><span>V{item.numero_versao}</span><strong>{words(item.texto)} palavras</strong><small>{new Date(item.criado_em).toLocaleDateString('pt-BR')}</small></button>)}</div>}
    </div>}
  </section>
}

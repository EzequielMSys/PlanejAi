import useDialogFocus from '../hooks/useDialogFocus'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import conteudoService from '../services/conteudoService'
import './Materiais.css'

function lerMateriais(valor) {
  if (Array.isArray(valor)) return valor
  try { const lista = JSON.parse(valor || '[]'); return Array.isArray(lista) ? lista : [] } catch { return [] }
}

export default function Materiais() {
  const [conteudos, setConteudos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('TODOS')
  const [selecionado, setSelecionado] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const dialogRef=useRef(null),saving=useRef(false)
  useDialogFocus(dialogRef,Boolean(selecionado),()=>setSelecionado(null),salvando)

  useEffect(() => {
    conteudoService.listar().then(dados => setConteudos(Array.isArray(dados) ? dados : [])).catch(() => toast.error('Não foi possível carregar os conteúdos.')).finally(() => setCarregando(false))
  }, [])

  const comMaterial = conteudos.filter(item => Boolean(item.link) || lerMateriais(item.materiais).length > 0).length
  const filtrados = useMemo(() => conteudos.filter(item => {
    const temMaterial = Boolean(item.link) || lerMateriais(item.materiais).length > 0
    return (filtro === 'TODOS' || (filtro === 'COM' ? temMaterial : !temMaterial)) && `${item.titulo || ''} ${item.disciplina || ''} ${item.area || ''}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))
  }), [conteudos, busca, filtro])

  const abrir = conteudo => setSelecionado({ ...conteudo, materiais: lerMateriais(conteudo.materiais) })
  const atualizarMaterial = (indice, campo, valor) => setSelecionado(atual => ({ ...atual, materiais: atual.materiais.map((item, i) => i === indice ? { ...item, [campo]: valor } : item) }))
  const salvar = async event => {
    event.preventDefault()
    if(saving.current)return
    saving.current=true
    setSalvando(true)
    try {
      const atualizado = await conteudoService.atualizar(selecionado.id_conteudo, selecionado)
      setConteudos(atual => atual.map(item => item.id_conteudo === atualizado.id_conteudo ? atualizado : item))
      setSelecionado(null)
      toast.success('Materiais atualizados.')
    } catch (error) { toast.error(error.response?.data?.message || 'Use links completos iniciados por https://') }
    finally { saving.current=false;setSalvando(false) }
  }

  return <main className="materials-page"><div className="materials-wrap">
    <header className="materials-hero"><div><span className="materials-kicker">PLANEJAI · BIBLIOTECA DE MATERIAIS</span><h1>Boas fontes abrem novos caminhos.</h1><p>Enriqueça os conteúdos do cronograma com vídeos, leituras, imagens e links que apoiam cada etapa dos estudos.</p><div className="materials-facts"><span><strong>{conteudos.length}</strong> conteúdos</span><span><strong>{comMaterial}</strong> com recursos</span><span><strong>{conteudos.length - comMaterial}</strong> aguardando material</span></div></div><aside><span>COMECE PELO QUE FALTA</span><p>Escolha um conteúdo e adicione uma fonte confiável para a próxima aula.</p><button type="button" onClick={() => { setFiltro('SEM'); document.getElementById('materials-catalog')?.scrollIntoView({ behavior: 'smooth' }) }}>Ver conteúdos sem material <b aria-hidden="true">↗</b></button></aside></header>

    <section className="materials-catalog" id="materials-catalog" aria-label="Catálogo de conteúdos"><div className="materials-catalog-heading"><div><span className="materials-kicker">ORGANIZE O ACERVO</span><h2>Conteúdos do cronograma</h2><p>Abra um conteúdo para definir o link principal e recursos complementares.</p></div><label>Buscar conteúdo<input type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Título ou disciplina" /></label></div><div className="materials-filters" role="group" aria-label="Filtrar conteúdos">{[['TODOS', 'Todos', conteudos.length], ['SEM', 'Sem material', conteudos.length - comMaterial], ['COM', 'Com material', comMaterial]].map(([id, label, total]) => <button type="button" key={id} aria-pressed={filtro === id} className={filtro === id ? 'is-active' : ''} onClick={() => setFiltro(id)}>{label} <span>{total}</span></button>)}</div>
      {carregando && <p className="materials-message">Carregando conteúdos…</p>}
      {!carregando && !conteudos.length && <div className="materials-message"><strong>O catálogo ainda está vazio.</strong><p>Os conteúdos do cronograma aparecerão aqui quando forem cadastrados.</p></div>}
      {!carregando && conteudos.length > 0 && !filtrados.length && <p className="materials-message">Nenhum conteúdo corresponde à busca e ao filtro escolhidos.</p>}
      <div className="materials-grid">{filtrados.map(item => { const extras = lerMateriais(item.materiais).length; const temMaterial = Boolean(item.link) || extras > 0; return <button type="button" key={item.id_conteudo} className="materials-card" onClick={() => abrir(item)}><span className="materials-card-top"><span>{item.disciplina || item.area || 'Geral'} · {item.nivel || 'Conteúdo'}</span><b aria-hidden="true">↗</b></span><strong>{item.titulo}</strong><span className="materials-card-footer"><span className={temMaterial ? 'is-ready' : 'is-pending'}>{temMaterial ? 'Com material' : 'Precisa de material'}</span><small>{extras} {extras === 1 ? 'recurso extra' : 'recursos extras'}</small></span></button> })}</div>
    </section>

    {selecionado && <div className="materials-dialog-backdrop" onMouseDown={event => { if (!salvando && event.target === event.currentTarget) setSelecionado(null) }}><section ref={dialogRef} tabIndex={-1} className="materials-dialog" role="dialog" aria-modal="true" aria-labelledby="materials-dialog-title"><form onSubmit={salvar}><header><div><span className="materials-kicker">EDITAR FONTES</span><h2 id="materials-dialog-title">{selecionado.titulo}</h2><p>{selecionado.disciplina} · {selecionado.nivel}</p></div><button type="button" disabled={salvando} onClick={() => setSelecionado(null)} aria-label="Fechar edição">×</button></header><fieldset disabled={salvando} className="materials-dialog-body"><legend className="sr-only">Fontes do conteúdo</legend><label>Link principal<input type="url" value={selecionado.link || ''} onChange={event => setSelecionado({ ...selecionado, link: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></label><p className="materials-help">Use o endereço direto do vídeo ou da página, não uma página de resultados.</p><div className="materials-extras-heading"><div><h3>Recursos complementares</h3><p>Adicione leituras e referências para aprofundar o tema.</p></div><span>{selecionado.materiais.length}</span></div>{selecionado.materiais.map((material, indice) => <fieldset className="materials-extra" key={indice}><legend>Recurso {indice + 1}</legend><div><label>Título<input value={material.titulo || ''} onChange={event => atualizarMaterial(indice, 'titulo', event.target.value)} placeholder="Ex.: Guia de revisão" /></label><label>Tipo<select value={material.tipo || 'LINK'} onChange={event => atualizarMaterial(indice, 'tipo', event.target.value)}><option value="VIDEO">Vídeo</option><option value="PDF">PDF</option><option value="IMAGEM">Imagem</option><option value="LINK">Link</option></select></label></div><label>Endereço<input type="url" value={material.url || ''} onChange={event => atualizarMaterial(indice, 'url', event.target.value)} placeholder="https://..." /></label><button type="button" onClick={() => setSelecionado(atual => ({ ...atual, materiais: atual.materiais.filter((_, i) => i !== indice) }))}>Remover recurso</button></fieldset>)}<button className="materials-add" type="button" onClick={() => setSelecionado(atual => ({ ...atual, materiais: [...atual.materiais, { titulo: '', tipo: 'LINK', url: '' }] }))}>+ Adicionar recurso</button></fieldset><footer><button type="button" disabled={salvando} onClick={() => setSelecionado(null)}>Cancelar</button><button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar materiais'}</button></footer></form></section></div>}
  </div></main>
}

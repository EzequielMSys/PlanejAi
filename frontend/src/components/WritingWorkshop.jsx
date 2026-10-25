import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import collaborative from '../services/collaborativeService'
import './WritingWorkshop.css'
import RecoveryState from './RecoveryState'
import RouteLoading from './RouteLoading'
import SaveFeedback from './SaveFeedback'
import {scopedCacheKey} from '../utils/offlineStore'
import useExitWarning from '../hooks/useExitWarning'

const etapas = [
  ['TEMA', 'Tema', 'Delimite o assunto e a pergunta central.'],
  ['TESE', 'Tese', 'Escolha a posição que vai defender.'],
  ['ARGUMENTOS', 'Argumentos', 'Organize duas razões diferentes.'],
  ['REPERTORIO', 'Repertório', 'Use referências que sustentem a análise.'],
  ['INTERVENCAO', 'Intervenção', 'Indique agente, ação, meio e finalidade.'],
  ['RASCUNHO', 'Rascunho', 'Junte as ideias em um texto.'],
  ['REVISAO', 'Revisão', 'Confira clareza, coesão e proposta.'],
]
const inicial = { tema: '', tese: '', argumentoUm: '', argumentoDois: '', repertorio: '', intervencao: '', rascunho: '', etapa: 'TEMA' }

export default function WritingWorkshop() {
  const [projeto, setProjeto] = useState(inicial)
  const [evolucao, setEvolucao] = useState([])
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [saveError, setSaveError] = useState('')
  const storageKey=useRef(scopedCacheKey('writing-workshop-draft:v1')).current
  const [draftOffer,setDraftOffer]=useState(()=>{try{const value=JSON.parse(localStorage.getItem(storageKey));return value && Object.keys(inicial).every(key=>typeof value[key]==='string')?value:null}catch{return null}})
  const [saveStatus,setSaveStatus]=useState('ready')
  const [savedAt,setSavedAt]=useState(null)
  const saving=useRef(false)
  useExitWarning(saveStatus==='unsaved')
  const keep=value=>{
    if(storageKey!==scopedCacheKey('writing-workshop-draft:v1'))return
    try{localStorage.setItem(storageKey,JSON.stringify(value));setSaveStatus('local')}catch{setSaveStatus('unsaved')}
  }
  useEffect(() => {
    if (!aberto || loaded) return
    let active = true
    Promise.all([collaborative.projetos(), collaborative.evolucao()]).then(([projetos, registros]) => {
      if (!active || storageKey!==scopedCacheKey('writing-workshop-draft:v1')) return
      if (projetos?.[0]) setProjeto({ ...inicial, ...projetos[0], idProjeto: projetos[0].id_projeto, argumentoUm: projetos[0].argumento_um || '', argumentoDois: projetos[0].argumento_dois || '' })
      setEvolucao(Array.isArray(registros) ? registros : [])
      setLoaded(true)
    }).catch(() => { if (active) setLoadError(true) })
    return () => { active = false }
  }, [aberto, loaded, retry, storageKey])
  const indice = Math.max(0, etapas.findIndex(([id]) => id === projeto.etapa))
  const [etapa, nome, descricao] = etapas[indice]
  const ultima = evolucao.at(-1)
  const atualizar = (campo, valor) => { if (!saving.current) {const next={...projeto,[campo]:valor};setDraftOffer(null);setProjeto(next);setSaveError('');keep(next)} }
  async function salvar(proximaEtapa = etapa) {
    if(saving.current || storageKey!==scopedCacheKey('writing-workshop-draft:v1'))return
    saving.current=true
    setSalvando(true)
    setSaveStatus('saving')
    setSaveError('')
    try {
      const salvo = await collaborative.salvarProjeto({ ...projeto, etapa: proximaEtapa })
      if(storageKey!==scopedCacheKey('writing-workshop-draft:v1'))return
      if(!salvo?.id_projeto)throw Error('unconfirmed')
      setProjeto(atual => ({ ...atual, ...salvo, idProjeto: salvo.id_projeto, etapa: proximaEtapa }))
      try{localStorage.removeItem(storageKey)}catch{/* A conta já confirmou o envio. */}
      setDraftOffer(null);setSaveStatus('saved');setSavedAt(new Date().toISOString())
      toast.success('Etapa da oficina salva.')
    } catch (error) { if(storageKey===scopedCacheKey('writing-workshop-draft:v1')){keep(projeto);setSaveError(error?.response?.data?.message || 'Não foi possível salvar na conta. Seu projeto continua neste formulário; tente novamente.')} }
    finally { saving.current=false;setSalvando(false) }
  }
  return <section className={`writing-workshop${aberto ? ' is-open' : ''}`} aria-labelledby="writing-workshop-title">
    <div className="writing-workshop-intro"><span className="redacoes-eyebrow">OFICINA DE REDAÇÃO · {String(indice + 1).padStart(2, '0')} / 07</span><h2 id="writing-workshop-title">Construa seu texto, uma etapa de cada vez.</h2><p>{projeto.tema ? `Projeto atual: ${projeto.tema}` : 'Comece pelo tema. A oficina guarda seu projeto para você continuar depois.'}</p><button type="button" onClick={() => setAberto(valor => !valor)} aria-expanded={aberto}>{aberto ? 'Fechar oficina' : 'Abrir oficina'} <span aria-hidden="true">→</span></button></div>
    <div className="writing-workshop-progress" role="img" aria-label={`Etapa ${indice + 1} de 7: ${nome}`}><i style={{ width: `${((indice + 1) / etapas.length) * 100}%` }} /></div>
    {ultima && <p className="writing-workshop-last">Última avaliação: <strong>{ultima.nota}/1000</strong> · use o feedback para orientar esta versão.</p>}
    {aberto && !loaded && (loadError ? <RecoveryState title="Não conseguimos recuperar seu projeto de escrita." onRetry={() => { setLoadError(false); setRetry(value => value + 1) }} /> : <RouteLoading embedded label="Recuperando sua oficina…" />)}
    {aberto && loaded && <div className="writing-workshop-body"><nav aria-label="Etapas da oficina">{etapas.map(([id, rotulo], posicao) => <button type="button" key={id} disabled={salvando} aria-current={etapa === id ? 'step' : undefined} className={etapa === id ? 'is-active' : ''} onClick={() => atualizar('etapa', id)}><span>{String(posicao + 1).padStart(2,'0')}</span>{rotulo}</button>)}</nav><div className="writing-workshop-editor"><span className="redacoes-eyebrow">ETAPA {indice + 1}</span><h3>{nome}</h3><p>{descricao}</p>{draftOffer && <div className="setup-invitation"><p>Há um rascunho da oficina neste aparelho que ainda não foi confirmado na conta.</p><button type="button" onClick={()=>{const next={...draftOffer,idProjeto:projeto.idProjeto};setProjeto(next);setDraftOffer(null);keep(next)}}>Recuperar rascunho da oficina</button><button type="button" onClick={()=>setDraftOffer(null)}>Manter projeto da conta</button></div>}{saveStatus !== 'ready' && <SaveFeedback status={saveError ? 'error' : saveStatus} savedAt={savedAt} message={saveError || (saveStatus === 'local' ? 'Rascunho salvo apenas neste aparelho. Use Salvar esta etapa para confirmar na conta.' : undefined)} onRetry={!salvando ? ()=>saveStatus === 'unsaved' && !saveError ? keep(projeto) : salvar() : undefined} />}
      {etapa === 'TEMA' && <label>Qual é o tema do texto?<input disabled={salvando} value={projeto.tema} onChange={event => atualizar('tema', event.target.value)} placeholder="Ex.: Os desafios da inclusão digital no Brasil" /></label>}
      {etapa === 'TESE' && <label>Que posição você vai defender?<textarea disabled={salvando} value={projeto.tese} onChange={event => atualizar('tese', event.target.value)} placeholder="Escreva a ideia central em uma ou duas frases." /></label>}
      {etapa === 'ARGUMENTOS' && <div className="writing-workshop-fields"><label>Primeiro argumento<textarea disabled={salvando} value={projeto.argumentoUm} onChange={event => atualizar('argumentoUm', event.target.value)} placeholder="Qual é a primeira causa ou consequência?" /></label><label>Segundo argumento<textarea disabled={salvando} value={projeto.argumentoDois} onChange={event => atualizar('argumentoDois', event.target.value)} placeholder="Que outro ângulo amplia a discussão?" /></label></div>}
      {etapa === 'REPERTORIO' && <label>Que referência ajuda a provar seu argumento?<textarea disabled={salvando} value={projeto.repertorio} onChange={event => atualizar('repertorio', event.target.value)} placeholder="Anote a fonte e explique sua relação com o tema." /></label>}
      {etapa === 'INTERVENCAO' && <label>Como a situação pode ser transformada?<textarea disabled={salvando} value={projeto.intervencao} onChange={event => atualizar('intervencao', event.target.value)} placeholder="Agente + ação + meio + finalidade + detalhamento." /></label>}
      {etapa === 'RASCUNHO' && <label>Seu rascunho<textarea disabled={salvando} className="is-long" value={projeto.rascunho} onChange={event => atualizar('rascunho', event.target.value)} placeholder="Escreva aqui sua primeira versão completa." /></label>}
      {etapa === 'REVISAO' && <div className="writing-workshop-checklist"><p>Antes de enviar, releia com três perguntas:</p><ul><li>Minha tese responde ao tema?</li><li>Cada argumento apresenta uma explicação e uma consequência?</li><li>A intervenção respeita os direitos humanos e contém os elementos necessários?</li></ul></div>}
      <div className="writing-workshop-actions"><button type="button" disabled={salvando} onClick={() => salvar()}>{salvando ? 'Salvando…' : 'Salvar esta etapa'}</button>{indice < etapas.length - 1 && <button type="button" disabled={salvando} onClick={() => salvar(etapas[indice + 1][0])}>Salvar e continuar <span aria-hidden="true">→</span></button>}</div>
    </div></div>}
  </section>
}

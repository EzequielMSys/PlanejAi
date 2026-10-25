import { useEffect, useId, useRef, useState } from 'react'
import { createApiClient } from '../services/apiClient'
import { currentUser } from '../utils/offlineStore'
import { downloadTextCopy } from '../utils/downloadTextCopy'
import './EssayIntentReview.css'
const api=createApiClient('/api/redacao')
const choices=[['argumento','Quero fortalecer meu argumento'],['coesao','Melhorar a ligação entre parágrafos'],['repertorio','Usar melhor meu repertório']]
export default function EssayIntentReview({text,selection,onReturn}){
  const uid=useId(),[open,setOpen]=useState(false),[intent,setIntent]=useState('argumento'),[paragraph,setParagraph]=useState(''),[neighbor,setNeighbor]=useState(false),[useSelection,setUseSelection]=useState(true),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const lock=useRef(false),version=useRef(0),mounted=useRef(true)
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
  const paragraphs=text.split(/\n\s*\n|\n/).filter(value=>value.trim())
  const native=selection?.source===text && selection.end>selection.start ? text.slice(selection.start,selection.end) : ''
  const snippet=useSelection && native ? native : paragraph!=='' ? paragraphs.slice(Number(paragraph),Number(paragraph)+(neighbor?2:1)).join('\n\n') : ''
  const valid=snippet.trim().length>=30 && snippet.length<=3000
  // Invalidate an in-flight response synchronously when its source or intention changes.
  const signature=JSON.stringify([text,snippet,intent])
  const previous=useRef(signature)
  if(previous.current!==signature){previous.current=signature;version.current++}
  useEffect(()=>{setResult(null);setError('')},[signature])
  useEffect(()=>{setParagraph('');setNeighbor(false)},[text])
  async function review(){
    if(lock.current || !valid)return
    const owner=currentUser(),requestVersion=version.current;lock.current=true;setBusy(true);setError('');setResult(null)
    try{
      const response=await api.post('/revisar-intencao',{intencao:intent,trecho:snippet},{expectedOwner:owner,timeout:55000})
      if(!mounted.current || owner!==currentUser() || version.current!==requestVersion)return
      const data=response.data
      if(!['observacao','sugestao','motivo','pergunta'].every(key=>typeof data?.[key]==='string'&&data[key].trim()))throw Error('invalid')
      setResult({...data,original:snippet,signature})
    }catch(error){if(mounted.current&&owner===currentUser()&&version.current===requestVersion)setError(error.response?.data?.message || 'A revisão não foi concluída. Seu trecho continua selecionado; tente novamente.')}
    finally{lock.current=false;if(mounted.current)setBusy(false)}
  }
  return <section className="essay-intent" aria-label="Revisão por intenção com a Lumi"><header><div><span className="pj-eyebrow">UMA LEITURA, UMA INTENÇÃO</span><h3>O que você quer melhorar neste trecho?</h3></div><button type="button" aria-expanded={open} aria-controls={`${uid}-panel`} onClick={()=>setOpen(value=>!value)}>{open?'Recolher revisão':'Revisar um trecho com a Lumi'}</button></header>
    <div id={`${uid}-panel`} hidden={!open}>{open&&<>
      <p>Selecione uma parte no editor acima ou escolha um parágrafo aqui. Para trabalhar a ligação entre parágrafos, inclua os dois.</p>
      <fieldset disabled={busy}><legend>Minha intenção de revisão</legend><div className="essay-intent-choices">{choices.map(([key,label])=><label key={key}><input type="radio" name={`${uid}-intent`} value={key} checked={intent===key} onChange={()=>setIntent(key)}/><span>{label}</span></label>)}</div></fieldset>
      <div className="essay-intent-selection"><label htmlFor={`${uid}-paragraph`}>Escolher um parágrafo do meu texto<select id={`${uid}-paragraph`} value={paragraph} disabled={busy} onChange={event=>{setParagraph(event.target.value);setUseSelection(false)}}><option value="">Escolha um parágrafo</option>{paragraphs.map((value,index)=><option key={index} value={index}>{index+1}. {value.trim().slice(0,85)}{value.trim().length>85?'…':''}</option>)}</select></label>{paragraph!==''&&<label className="essay-intent-neighbor"><input type="checkbox" checked={neighbor} disabled={busy||Number(paragraph)>=paragraphs.length-1} onChange={event=>setNeighbor(event.target.checked)}/>Incluir também o próximo parágrafo</label>}{native&&<button type="button" disabled={busy} onClick={()=>setUseSelection(true)}>Usar a seleção feita no editor</button>}</div>
      <div className="essay-intent-source"><h4>Trecho que será enviado</h4>{snippet?<blockquote>{snippet}</blockquote>:<p>Nenhum trecho escolhido. Seu texto completo não é enviado por esta ferramenta.</p>}<small>{snippet.length}/3000 caracteres{snippet&&!valid?' · Escolha entre 30 e 3.000 caracteres.':''}</small></div>
      <p className="essay-intent-disclosure">Ao pedir a revisão, somente este trecho e a intenção são enviados ao provedor de IA da Lumi. O restante da redação, o tema e seu histórico ficam fora da consulta. Até 20 revisões por dia; a sugestão não é salva no histórico.</p>
      <button type="button" className="essay-intent-request" disabled={busy||!valid} onClick={review}>{busy?'A Lumi está lendo este trecho…':'Pedir uma sugestão para este trecho'}</button>
      {error&&<p role="alert" className="essay-intent-error">{error}</p>}
      {busy&&<p role="status">Seu texto continua no editor. Nenhuma mudança será aplicada automaticamente.</p>}
      {result?.signature===signature&&<div className="essay-intent-result" role="status"><span className="pj-eyebrow">UM OLHAR DA LUMI · VOCÊ DECIDE A REESCRITA</span><h4>O que a Lumi percebeu</h4><p>{result.observacao}</p><div className="essay-intent-comparison"><article><h4>Seu trecho original</h4><p>{result.original}</p></article><article><h4>Uma mudança possível</h4><p>{result.sugestao}</p></article></div><h4>Por que isso pode ajudar</h4><p>{result.motivo}</p><h4>Uma pergunta para você</h4><p>{result.pergunta}</p><p className="essay-intent-disclosure">Seu texto foi preservado. A Lumi pode errar; confira referências e reescreva do seu jeito.</p><div className="essay-intent-footer">{onReturn&&<button type="button" onClick={onReturn}>Voltar ao meu texto para reescrever</button>}<button type="button" onClick={()=>downloadTextCopy(`Intenção: ${choices.find(([key])=>key===intent)?.[1]}\n\nMeu trecho\n${result.original}\n\nObservação\n${result.observacao}\n\nSugestão\n${result.sugestao}\n\nPor quê\n${result.motivo}\n\nPergunta\n${result.pergunta}`,'planejai-revisao-por-intencao.txt')}>Baixar esta revisão</button></div></div>}
    </>}</div>
  </section>
}

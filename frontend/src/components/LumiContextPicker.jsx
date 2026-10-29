import {useId,useState} from 'react'
import './LumiContextPicker.css'

export default function LumiContextPicker({items,candidates,onChange,busy,materia,onRemoveSubject}) {
  const uid=useId(),[text,setText]=useState(''),[type,setType]=useState('duvida')
  return <details className="lumi-context-picker">
    <summary>O que a Lumi vai usar <span>{items.length+(materia?1:0)} {items.length+(materia?1:0)===1?'item':'itens'}</span></summary>
    <div><p>A Lumi recebe estes itens e até 12 mensagens desta conversa. Trocar os itens inicia outra conversa.</p>
      {materia && <article><strong>Matéria · {materia}</strong><button type="button" disabled={busy} onClick={onRemoveSubject} aria-label="Retirar matéria do contexto">Retirar</button></article>}
      {items.map(item=><article key={item.id}><div><strong>{item.titulo}</strong><p>{item.texto}</p></div><button type="button" disabled={busy} onClick={()=>onChange(items.filter(value=>value.id!==item.id))} aria-label={`Retirar ${item.titulo} do contexto`}>Retirar</button></article>)}
      {!items.length && !materia && <p className="lumi-context-empty">Sem registros adicionais. Você pode conversar normalmente.</p>}
      <details><summary>Adicionar um registro ou trecho</summary><div className="lumi-context-add">
        {candidates.filter(item=>!items.some(selected=>selected.id===item.id)).map(item=><button type="button" disabled={busy || items.length>=8} key={item.id} onClick={()=>onChange([...items,item])}>Adicionar: {item.titulo}</button>)}
        <label htmlFor={`${uid}-type`}>Tipo de registro<select id={`${uid}-type`} value={type} disabled={busy} onChange={e=>setType(e.target.value)}><option value="duvida">Dúvida</option><option value="anotacao">Anotação</option><option value="redacao">Trecho da redação</option></select></label>
        <label htmlFor={`${uid}-text`}>Trecho que quero compartilhar<textarea id={`${uid}-text`} rows={3} maxLength={1500} value={text} disabled={busy} onChange={e=>setText(e.target.value)} placeholder="Cole ou escreva somente o trecho que a Lumi deve usar."/></label>
        <small>{text.length}/1500 · O texto só entra no contexto ao adicionar e só é enviado ao mandar uma mensagem.</small>
        <button type="button" disabled={busy || !text.trim() || items.length>=8} onClick={()=>{onChange([...items,{id:`custom-${Date.now()}`,tipo:type,titulo:type==='redacao'?'Trecho da redação':type==='anotacao'?'Minha anotação':'Minha dúvida',texto:text.trim()}]);setText('')}}>Adicionar trecho escolhido</button>
      </div></details>
    </div>
  </details>
}

import './StudyReturn.css'
const kinds=[['proximoPasso','lembrete','Próximo passo que deixei'],['explicacao','explicacao','Explicar novamente'],['duvida','duvida','Investigar uma dúvida'],['revisao','revisao','Revisar um assunto']]
export default function StudyReturns({data,status,onRetry,onOpen,onDone,busy}) {
  return <section className="study-returns" aria-labelledby="study-returns-title"><header><span className="pj-eyebrow">DE ONDE VOCÊ PAROU</span><h2 id="study-returns-title">Pendências que têm um caminho.</h2><p>Escolha uma só. Os tempos são sugestões para começar e podem ser ajustados ao seu ritmo.</p></header>
    {status==='loading'?<p role="status">Consultando explicações, dúvidas e revisões…</p>:status==='error'?<div role="alert"><p>Não conseguimos consultar suas retomadas. Seus registros continuam na conta.</p><button type="button" onClick={onRetry}>Consultar retomadas novamente</button></div>:<>
      {!kinds.some(([key])=>data?.[key])?<p>Nenhuma retomada foi encontrada agora. Você pode seguir pelo cronograma.</p>:<div className="study-returns-grid">{kinds.filter(([key])=>data?.[key]).map(([key,tipo,label])=>{const item=data[key];return <article key={key} className="pj-panel"><span>{label}</span><h3>{item.titulo}</h3>{item.texto&&<p className="study-return-reminder">{item.texto}</p>}<p>{item.motivo}</p><small>{item.minutos} min sugeridos</small><button type="button" disabled={busy} onClick={()=>onOpen({...item,tipo})}>Retomar <span className="sr-only">{item.titulo}</span><span aria-hidden="true"> →</span></button>{tipo==='lembrete' && <button type="button" disabled={busy} onClick={()=>onDone(item.id)}>Marcar próximo passo como feito</button>}</article>})}</div>}
    </>}
  </section>
}

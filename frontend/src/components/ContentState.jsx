import './ContentState.css'

export default function ContentState({title,description,children,kind='empty',className='',eyebrow,icon,onAction,actionLabel,busy=false}) {
  return <section className={`content-state ${className}`} data-kind={kind} role={kind==='error'?'alert':undefined} aria-busy={busy||undefined}>
    {icon&&<span className="content-state-icon" aria-hidden="true">{icon}</span>}
    <div className="content-state-copy">{eyebrow&&<span className="content-state-eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description&&<p>{description}</p>}{children}</div>
    {onAction&&<button type="button" disabled={busy} onClick={onAction}>{busy?'Tentando novamente…':actionLabel}</button>}
  </section>
}
